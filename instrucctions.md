# Sustentación — Actividad de Arquitectura de Aplicaciones Web (Parte 1)

*Guion de sustentación oral. Léase como una exposición, no como documentación técnica seca.*

---

## Apertura

Buenas tardes, profesor. Lo que voy a presentar es el resultado de la actividad de patrones
de diseño aplicados a una aplicación real de gestión de pedidos: React en el frontend, una
capa de servicios simulados por detrás, y sobre eso, cuatro preocupaciones que quiero que
quede claro que entendí y no solo copié: **integración con sistemas externos que no controlo**,
**orquestación de un flujo de negocio**, **separación entre lo que se ve y lo que piensa**, y
**qué hago cuando algo de eso falla**. Voy a explicar cada una mostrando el problema concreto
que resolvía, no solo el patrón de libro.

## 1. El problema del Adapter — `src/services/pagos/AdapterPasarelaY.js`

Aquí el punto de partida es incómodo a propósito: tengo dos SDKs de pasarelas de pago, y no se
parecen en nada. `SdkPasarelaX` expone `cobrar({ amount, currency })` y trabaja en la unidad
monetaria completa. `SdkPasarelaY` expone `charge(amountCents, opts)`, trabaja en centavos, y
además **puede rechazar la promesa** si el monto es inválido. Si mi Fachada tuviera que conocer
esas dos formas distintas, cada vez que cambiara de pasarela tendría que tocar la lógica de
negocio. Eso es exactamente lo que el Adapter evita.

Lo que hice fue escribir `AdapterPasarelaY.procesar(monto)` para que hable el mismo idioma que
`AdapterPasarelaX.procesar(monto)`: recibe un monto, y siempre devuelve un `Resultado(exito,
idTransaccion)`, sin importar qué tan distinto sea el SDK por debajo. Concretamente:

- Convierto el monto a centavos antes de llamar a `charge`.
- Envuelvo la llamada en `try/catch`, porque `charge` puede rechazar la promesa (por ejemplo con
  un monto menor o igual a cero) y **eso no puede tumbar la aplicación**.
- Si falla, devuelvo `Resultado(false, null)`. Si funciona, devuelvo `Resultado(true, r.txId)`.

La prueba de que esto funciona no es teórica: lo ejecuté con un monto de `0` a través de
Pasarela Y, y el resultado fue un rechazo limpio, con un mensaje de error en la interfaz, sin
ninguna excepción sin capturar. Ese es el contrato cumpliéndose.

## 2. El problema de la Fachada — `src/patterns/FachadaPedidos.js`

Procesar un pedido no es una operación, son cuatro: reservar inventario, cobrar, programar el
envío, y notificar. Si esa secuencia estuviera escrita directamente en el componente de React,
cualquier cambio en el orden, o cualquier necesidad de cortar el flujo a mitad de camino, me
obligaría a tocar la interfaz de usuario. La Fachada existe para que ese conocimiento —el orden,
las reglas de cuándo detenerse— viva en un solo lugar, separado de cómo se ve la aplicación.

La regla de negocio importante acá es: **si el pago falla, no se programa envío ni se notifica
a nadie**. Por eso `procesarPedido()` revisa `resultado.exito` inmediatamente después de llamar
al `IPago` inyectado, y si es `false`, lanza un `Error` y corta ahí mismo. Y noten algo
deliberado: la Fachada recibe un `pago` en el constructor, un objeto que cumple el contrato
`IPago` — **no sabe, ni le importa, si por debajo es la Pasarela X o la Y**. Ese es el punto
exacto donde el Adapter y la Fachada se conectan: gracias a que ambas pasarelas hablan el mismo
idioma después de adaptarse, la Fachada puede tratarlas de forma idéntica.

## 3. El problema de MVVM — `usePedidosViewModel.js` + `OrdersView.jsx`

El punto de partida, `OrdersApp.jsx`, mezclaba tres responsabilidades en un solo archivo:
estado (`useState`), lógica de negocio (armar el pedido, instanciar la Fachada y el Adapter), y
presentación (el JSX del formulario y la lista). El problema práctico de eso es que no puedo
probar la lógica sin renderizar la interfaz, y no puedo cambiar la interfaz sin arriesgarme a
romper la lógica.

Lo que hice fue partir ese archivo en dos, con una frontera muy estricta:

- **`usePedidosViewModel.js`** concentra todo el estado y el comando `enviarPedido`, que arma el
  pedido, instancia el Adapter correcto según la pasarela elegida, construye la Fachada, y la
  invoca. Devuelve **exactamente** el contrato pedido:
  `{ pedidos, loading, error, form, setField, enviarPedido }`.
- **`OrdersView.jsx`** es presentación pura. No tiene `useState`, no tiene `useEffect`, y no
  importa ni la Fachada ni los Adapters — lo verifiqué literalmente con
  `grep -rn "useState\|useEffect\|FachadaPedidos\|Adapter" src/components/OrdersView.jsx`, y no
  hay ni una coincidencia.

Esto es lo que me permite, más adelante, agregar resiliencia sin tocar un solo píxel de la
vista: el ViewModel simplemente expone un dato más, y la vista solo lo pinta.

## 4. El problema de la resiliencia — `retry.js` + `CircuitBreaker.js`

Acá cambia el enfoque: ya no se trata de qué tan bien está organizado el código, sino de qué
pasa cuando un servicio del que dependo —en este caso `inventario.reservar()`— **falla de forma
intermitente**, como pasa en el mundo real con cualquier servicio de red. Lo hice fallar ~30%
de las veces a propósito, para poder demostrar el comportamiento, no solo describirlo.

Construí dos piezas independientes:

- **`retry(fn, { intentos, esperaMs })`**: reintenta con backoff creciente
  (`esperaMs * 2^intento`). Absorbe fallos aislados sin que el usuario note nada.
- **`CircuitBreaker`**: una máquina de tres estados. En `CERRADO` las llamadas pasan y se cuentan
  los errores. Si se supera el umbral, pasa a `ABIERTO` y ahí **deja de llamar al servicio por
  completo** — falla al instante, sin gastar los ~300 ms de la llamada simulada. Pasado un
  tiempo de espera, entra en `SEMI_ABIERTO` y permite exactamente una llamada de prueba: si
  funciona, vuelve a `CERRADO`; si falla, vuelve a `ABIERTO`.

La decisión de diseño que quiero destacar, porque es la que más me costó pensar: **el orden de
anidamiento importa**. Envolví el breaker con retry, no al revés —
`retry(() => breaker.ejecutar(() => inventario.reservar(...)))`— para que cada intento crudo
cuente individualmente hacia el umbral del breaker. Si lo hubiera hecho al revés, los reintentos
absorberían los fallos aislados antes de que el breaker los viera, y el circuito casi nunca se
abriría con una tasa de fallo del 30%.

Y sobre la instancia: el breaker vive en el **ámbito del módulo** de `FachadaPedidos.js`, no
dentro de la clase. ¿Por qué? Porque cada envío de pedido crea una `FachadaPedidos` nueva —eso
lo decide el ViewModel—, pero el estado del breaker (errores acumulados, desde cuándo está
abierto) tiene que sobrevivir entre pedidos. Si lo hubiera puesto como propiedad de instancia,
cada pedido habría empezado con un breaker nuevo y el patrón simplemente no funcionaría.

Esto no me quedé en la teoría: corrí 150 pedidos reales, seguidos, contra la lógica real de la
Fachada, y el circuito se abrió naturalmente en el pedido número 11 —coherente con la
probabilidad esperada dado el umbral de 2 fallos consecutivos y una tasa de fallo del 30%—.
También construí `scripts/demo-circuit-breaker.mjs`, que fuerza la secuencia completa de forma
determinística y la imprime paso a paso: `CERRADO → ABIERTO → (fail-fast) → SEMI_ABIERTO →
CERRADO`.

Y en la interfaz: el ViewModel expone un campo adicional, `circuitoInventario`, que la Vista
solo pinta como un aviso amarillo cuando vale `'ABIERTO'`. No rompí el contrato original del
ViewModel —los seis campos siguen ahí—, lo extendí.

## 5. El problema del acoplamiento — eventos en vez de llamada directa

Antes de esta parte, la Fachada importaba `notificaciones.js` directamente y la llamaba al
final del flujo. Funcionalmente estaba bien, pero acoplaba la Fachada a una implementación
concreta de notificaciones: si mañana quiero cambiar el canal, o agregar un segundo suscriptor
—analítica, por ejemplo—, tendría que volver a tocar el archivo que orquesta todo el negocio.

Lo que hice fue introducir un canal de eventos de dominio, `eventosPedidos.js`, con un
`EventTarget` nativo y una constante `EVENTO_PEDIDO_ENVIADO`. La Fachada, después de programar
el envío, **dispara el evento y ya no sabe nada más**: no importa `notificaciones.js` en
absoluto, lo verifiqué con `grep -rn "notificaciones" src/patterns/FachadaPedidos.js`, sin
coincidencias. Quien reacciona al evento es `notificacionesSubscriber.js`, un suscriptor
completamente independiente, registrado una única vez en `main.jsx`, a nivel de módulo —fuera
del árbol de React—, para que `React.StrictMode` no lo registre dos veces en desarrollo.

## Preguntas de reflexión

**¿Por qué el evento reduce el acoplamiento?** Porque antes la Fachada dependía de la forma
exacta de `notificaciones.js` —su nombre, su firma, su existencia—. Ahora solo conoce un evento
de dominio. Puedo quitar el suscriptor, agregar otro, o cambiar cómo se notifica, sin tocar
`FachadaPedidos.js`.

**¿Qué diferencia observé entre CERRADO y ABIERTO?** En `CERRADO`, cada pedido paga el costo
completo de la llamada —~300 ms— aunque falle, y el retry lo intenta absorber. En `ABIERTO`, el
pedido falla al instante, sin ejecutar ni un solo intento contra el servicio: eso es fail-fast,
y lo vi literalmente en el log del script de demostración.

**¿API Gateway o BFF?** Si web y móvil necesitan formas distintas de los mismos datos, la
respuesta es **BFF**: uno por cliente, cada uno agregando y dando forma a los datos según lo que
ese cliente específico necesita. Un API Gateway genérico sigue siendo útil como punto de entrada
único, pero no resuelve por sí solo el problema de formas de datos distintas por cliente.

## Cierre

En resumen: Adapter resuelve la incompatibilidad entre SDKs sin que la Fachada lo note; Facade
concentra la orquestación del negocio en un solo lugar con una regla de corte clara; MVVM separa
la lógica de la presentación de forma verificable, no solo declarativa; retry y Circuit Breaker
protegen a la aplicación de un servicio inestable sin que el usuario final sufra la latencia
completa de cada fallo; y el canal de eventos desacopla la Fachada de sus efectos secundarios.
Cada decisión de diseño que tomé —dónde vive el breaker, en qué orden se anida con el retry, qué
campo expone el ViewModel— tiene una razón concreta, no es un patrón puesto por poner. Con gusto
respondo cualquier pregunta puntual sobre alguna de estas decisiones.
