import { inventario } from '../services/inventario.js'
import { envios } from '../services/envios.js'
import { notificaciones } from '../services/notificaciones.js'

/**
 * EJERCICIO 2 — Facade
 *
 * procesarPedido() debe orquestar, EN ORDEN, estas 4 operaciones:
 *   1. inventario.reservar(pedido.items)
 *   2. this.pago.procesar(pedido.total)      (el IPago inyectado)
 *   3. envios.programar(pedido.direccion)
 *   4. notificaciones.confirmar(pedido.cliente)
 *
 * Si el pago falla (resultado.exito === false), NO debe continuar con
 * envío ni notificación: debe lanzar un Error con un mensaje claro.
 *
 * Referencia: mismo patrón visto en clase, pero aquí "Pagos" es un
 * IPago ya adaptado (Ejercicio 1) en vez de un servicio directo — así
 * la Fachada no sabe (ni le importa) si por debajo está la Pasarela X
 * o la Y.
 */
export class FachadaPedidos {
  constructor(pago) {
    this.pago = pago // instancia de IPago: AdapterPasarelaX o AdapterPasarelaY
  }

  async procesarPedido(pedido) {
    // TODO(Ejercicio 2): implementar la orquestación descrita arriba
    throw new Error('FachadaPedidos.procesarPedido() no implementado todavía')
  }
}
