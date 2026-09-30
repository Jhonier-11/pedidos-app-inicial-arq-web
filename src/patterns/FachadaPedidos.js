import { inventario } from '../services/inventario.js'
import { envios } from '../services/envios.js'
import { notificaciones } from '../services/notificaciones.js'
import { CircuitBreaker } from './CircuitBreaker.js'
import { retry } from './retry.js'

// Instancia única a nivel de módulo: FachadaPedidos se instancia una vez
// por pedido (ver ViewModel), pero el Circuit Breaker debe conservar su
// estado (errores acumulados, tiempos de apertura) entre pedidos. Al
// vivir en el ámbito del módulo (que ES Modules cachea), sobrevive a
// cada `new FachadaPedidos(...)`.
const breakerInventario = new CircuitBreaker({ umbralErrores: 2, tiempoEsperaMs: 5000 })

/** Estado actual del Circuit Breaker de inventario ('CERRADO' | 'ABIERTO' | 'SEMI_ABIERTO'). */
export function estadoInventario() {
  return breakerInventario.estado
}

/**
 * EJERCICIO 2 — Facade
 *
 * procesarPedido() orquesta, EN ORDEN:
 *   1. inventario.reservar(pedido.items) — protegido con retry + Circuit Breaker
 *   2. this.pago.procesar(pedido.total)  (el IPago inyectado)
 *   3. envios.programar(pedido.direccion)
 *   4. notificaciones.confirmar(pedido.cliente)
 *
 * Si el pago falla (resultado.exito === false), NO continúa con envío
 * ni notificación: lanza un Error con un mensaje claro.
 *
 * La Fachada no sabe (ni le importa) si por debajo está la Pasarela X
 * o la Y: solo conoce el contrato IPago.
 */
export class FachadaPedidos {
  constructor(pago) {
    this.pago = pago // instancia de IPago: AdapterPasarelaX o AdapterPasarelaY
  }

  async procesarPedido(pedido) {
    await retry(() => breakerInventario.ejecutar(() => inventario.reservar(pedido.items)), {
      intentos: 3,
      esperaMs: 200,
    })

    const resultado = await this.pago.procesar(pedido.total)
    if (!resultado.exito) {
      throw new Error('El pago fue rechazado, no se procesará el pedido')
    }

    await envios.programar(pedido.direccion)
    await notificaciones.confirmar(pedido.cliente)
  }
}
