/**
 * Canal de eventos de dominio para pedidos. Permite que la Fachada
 * anuncie "pedido enviado" sin conocer quién reacciona a eso (por
 * ejemplo, el suscriptor de notificaciones): desacopla al emisor de
 * sus consumidores.
 */
export const EVENTO_PEDIDO_ENVIADO = 'pedido:enviado'
export const emisorPedidos = new EventTarget()
