# Gestión de Pedidos — Actividad práctica

Proyecto en React + Vite para la actividad de **Arquitectura de Aplicaciones
Web: Patrones de diseño, Parte 1** (patrones estructurales, resiliencia y
comunicación por eventos).

## Cómo ejecutar

```bash
npm install
npm run dev
```

Abre la URL que muestra la terminal (por defecto `http://localhost:5173`).

Para el build de producción: `npm run build`.

## Qué se implementó

### Parte 1 — Actividad en clase

- **Ejercicio 1 (Adapter)** — `src/services/pagos/AdapterPasarelaY.js`: adapta
  `SdkPasarelaY.charge(centavos, opts)` al contrato `IPago`. Convierte el
  monto a centavos, envuelve la llamada en try/catch y siempre devuelve un
  `Resultado(exito, idTransaccion)` — nunca el objeto crudo del SDK, y nunca
  deja que un rechazo de la promesa rompa la app.
- **Ejercicio 2 (Facade)** — `src/patterns/FachadaPedidos.js`: orquesta
  inventario → pago → envío → notificación (esta última ahora vía evento,
  ver Parte 2B). Si el pago falla (`resultado.exito === false`) lanza un
  Error y corta el flujo antes de programar envío o notificar.
- **Ejercicio 3 (MVVM)** — `src/viewmodel/usePedidosViewModel.js` (estado +
  lógica) y `src/components/OrdersView.jsx` (solo JSX). `src/App.jsx` usa
  `<OrdersView {...usePedidosViewModel()} />`. Se eliminó `src/OrdersApp.jsx`
  (el componente monolítico original).

### Parte 2A — Resiliencia

- `src/services/inventario.js`: `reservar()` ahora falla ~3 de cada 10 veces
  (`Math.random() < 0.3`) con `Error('Inventario no disponible')`.
- `src/patterns/retry.js`: `retry(fn, { intentos, esperaMs })` reintenta con
  backoff creciente (`esperaMs * 2^intento`).
- `src/patterns/CircuitBreaker.js`: máquina de 3 estados (`CERRADO`,
  `ABIERTO`, `SEMI_ABIERTO`), configurable (`umbralErrores`,
  `tiempoEsperaMs`) y con `estado` público.
- `src/patterns/FachadaPedidos.js`: envuelve `inventario.reservar` con
  `retry(() => breakerInventario.ejecutar(() => inventario.reservar(...)))`.
  El breaker es una **instancia única a nivel de módulo** (no una nueva por
  pedido): como `FachadaPedidos` se instancia una vez por envío en el
  ViewModel, el breaker vive fuera de la clase, en el ámbito del módulo, que
  ES Modules cachea entre instanciaciones. Se eligió la Fachada (no el
  ViewModel) porque es quien ya conoce y llama a `inventario`, y así el
  ViewModel no necesita saber nada de retry/circuit breaker: solo lee
  `estadoInventario()`.
- El ViewModel expone `circuitoInventario` (además del contrato original) y
  `OrdersView` solo lo pinta como un aviso amarillo cuando vale `'ABIERTO'`.

**Cómo probar el Circuit Breaker:** el umbral está en 2 fallos de inventario
consecutivos y la espera en 5 segundos. Con inventario fallando ~30% de las
veces, y usando cualquier pasarela, envía pedidos seguidos (normalmente entre
5 y 15 alcanzan a mostrar el efecto, por el azar) y observa:

1. **CERRADO** (normal): la mayoría de los pedidos se procesan bien; `retry`
   absorbe fallos aislados de inventario sin que el usuario note nada.
2. **ABIERTO**: cuando dos intentos de inventario fallan seguidos, el
   circuito se abre y aparece "⚠️ Inventario no disponible, intenta más
   tarde" — los siguientes envíos fallan **de inmediato** (fail-fast, sin
   esperar los ~300 ms de la llamada simulada ni gastar los 3 reintentos).
3. **SEMI-ABIERTO → CERRADO**: espera 5 segundos y envía otro pedido; esa
   llamada es la "prueba": si tiene éxito, el circuito vuelve a `CERRADO` y
   el aviso desaparece; si falla, vuelve a `ABIERTO` y hay que esperar otros
   5 segundos.

### Parte 2B — Comunicación por eventos

- `src/patterns/eventosPedidos.js`: `EventTarget` (`emisorPedidos`) + el
  nombre del evento `EVENTO_PEDIDO_ENVIADO`.
- `src/patterns/FachadaPedidos.js`: tras programar el envío, dispara
  `emisorPedidos.dispatchEvent(new CustomEvent(EVENTO_PEDIDO_ENVIADO, ...))`
  en vez de llamar a `notificaciones.confirmar()` directamente. La Fachada
  **no importa** `notificaciones.js` (verificado con grep, ver abajo).
- `src/patterns/notificacionesSubscriber.js`: suscriptor independiente que
  escucha el evento y llama a `notificaciones.confirmar()`.
- `src/main.jsx`: registra el suscriptor una sola vez, a nivel de módulo
  (fuera del árbol de React), por lo que `React.StrictMode` no lo duplica.
  Además `registrarNotificacionesSubscriber()` tiene una guarda interna
  (`registrado`) por si se llamara más de una vez.

## Reflexión

**¿Por qué disparar un evento en vez de llamar directamente a
`notificaciones.confirmar()` reduce el acoplamiento entre la Fachada y las
notificaciones?**
Antes, `FachadaPedidos` importaba `notificaciones.js` y dependía de su forma
exacta (nombre de función, firma, módulo). Ahora la Fachada solo conoce un
evento de dominio (`pedido:enviado`); no sabe si hay cero, uno o varios
suscriptores, ni qué hacen. Eso es acoplamiento reducido: se puede cambiar,
quitar o agregar el sistema de notificaciones (o sumar un suscriptor de
analítica, por ejemplo) sin tocar `FachadaPedidos.js` en absoluto.

**Al probar la app varias veces seguidas con inventario fallando, ¿qué
diferencia hay entre el comportamiento en estado CERRADO y ABIERTO del
Circuit Breaker?**
En `CERRADO`, cada pedido efectivamente llama a `inventario.reservar` (y a
veces varias veces, por el retry): se paga el costo completo de la latencia
simulada (~300 ms por intento) aunque falle, y solo se nota un fallo cuando
el retry se agota. En `ABIERTO`, en cambio, el pedido falla **al instante**
con el mensaje "Circuito abierto: servicio no disponible temporalmente" (y
la UI muestra el aviso amarillo) sin ejecutar ni un solo intento contra
`inventario`: el Circuit Breaker corta la llamada de raíz (fail-fast) en vez
de dejar que cada pedido repita el mismo fallo lento.

**Si la app se expusiera a una web y a una app móvil con necesidades de
datos distintas, ¿API Gateway o BFF?**
Un **BFF** (Backend For Frontend) por cada cliente: web y móvil normalmente
necesitan distintas formas de los mismos datos (la web puede querer el
detalle completo del pedido, el móvil una versión resumida para ahorrar
datos/batería), y un BFF permite adaptar y agregar información específica
para cada uno. Un **API Gateway** genérico (un único punto de entrada que
enruta/autentica/limita tráfico hacia los mismos servicios) sigue siendo
útil por delante de los BFFs, pero no resuelve por sí solo la necesidad de
formas de datos distintas por cliente.

## Verificación

- `npm install && npm run build` — sin errores.
- `npm run dev` — arranca sin errores.
- Probado con Pasarela X, Pasarela Y con monto válido, y Pasarela Y con
  monto `0` (el pago se rechaza con `Resultado(false, null)` y la Fachada
  detiene el flujo sin romper la app).
- `grep -rn "useState\|useEffect\|FachadaPedidos\|Adapter" src/components/OrdersView.jsx`
  → sin coincidencias.
- `grep -rn "notificaciones" src/patterns/FachadaPedidos.js` → sin
  coincidencias.
- `node scripts/demo-circuit-breaker.mjs` demuestra la secuencia completa
  `CERRADO → ABIERTO → SEMI_ABIERTO → CERRADO` del Circuit Breaker de forma
  determinística (sin depender del azar de `inventario.js`).
