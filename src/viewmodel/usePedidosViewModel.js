/**
 * EJERCICIO 3 — MVVM: ViewModel
 *
 * Extrae aquí TODA la lógica que hoy vive en OrdersApp.jsx: el estado
 * del formulario, la lista de pedidos, loading, error, y la función
 * que arma el pedido y llama a FachadaPedidos.
 *
 * Debe devolver un objeto con esta forma (es el "contrato" que
 * OrdersView.jsx va a consumir):
 *
 * {
 *   pedidos,         // array de pedidos ya procesados
 *   loading,         // boolean
 *   error,           // string | null
 *   form: { cliente, direccion, itemsText, total, pasarela },
 *   setField,        // (campo, valor) => void — actualiza un campo del form
 *   enviarPedido,    // (evento) => Promise<void> — comando del submit
 * }
 *
 * La Vista (OrdersView) NO debe importar FachadaPedidos ni los
 * Adapters directamente: solo debe hablar con este hook. Eso es lo
 * que hace que Vista y lógica queden desacopladas (a diferencia de
 * OrdersApp.jsx, donde estaban mezcladas).
 */
export function usePedidosViewModel() {
  // TODO(Ejercicio 3): mover aquí el estado y la lógica de OrdersApp.jsx
  throw new Error('usePedidosViewModel() no implementado todavía')
}
