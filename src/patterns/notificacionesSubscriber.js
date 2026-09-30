import { notificaciones } from '../services/notificaciones.js'
import { emisorPedidos, EVENTO_PEDIDO_ENVIADO } from './eventosPedidos.js'

let registrado = false

/**
 * Suscriptor independiente: escucha EVENTO_PEDIDO_ENVIADO y llama a
 * notificaciones.confirmar(). La Fachada no lo conoce; se registra una
 * sola vez al arrancar la app (ver main.jsx).
 */
export function registrarNotificacionesSubscriber() {
  if (registrado) return
  registrado = true
  emisorPedidos.addEventListener(EVENTO_PEDIDO_ENVIADO, (evento) => {
    notificaciones.confirmar(evento.detail.cliente)
  })
}
