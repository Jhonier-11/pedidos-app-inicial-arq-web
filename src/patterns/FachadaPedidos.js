import { inventario } from '../services/inventario.js'
import { envios } from '../services/envios.js'
import { notificaciones } from '../services/notificaciones.js'

/**
 * EJERCICIO 2 — Facade
 *
 * procesarPedido() orquesta, EN ORDEN:
 *   1. inventario.reservar(pedido.items)
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
    await inventario.reservar(pedido.items)

    const resultado = await this.pago.procesar(pedido.total)
    if (!resultado.exito) {
      throw new Error('El pago fue rechazado, no se procesará el pedido')
    }

    await envios.programar(pedido.direccion)
    await notificaciones.confirmar(pedido.cliente)
  }
}
