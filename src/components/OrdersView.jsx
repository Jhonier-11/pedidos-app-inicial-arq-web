/**
 * EJERCICIO 3 — MVVM: Vista
 *
 * Componente de presentación PURO: solo recibe props y renderiza JSX.
 * No debe tener useState, useEffect, ni conocer FachadaPedidos ni los
 * Adapters — toda esa lógica vive en usePedidosViewModel.
 *
 * Props esperadas (mismo contrato que devuelve el hook):
 *   { pedidos, loading, error, form, setField, enviarPedido }
 */
export default function OrdersView({ pedidos, loading, error, form, setField, enviarPedido }) {
  // TODO(Ejercicio 3): mover aquí el JSX de OrdersApp.jsx, reemplazando
  // el estado local (useState) por las props recibidas del ViewModel.
  return <p>TODO: implementar OrdersView usando las props del ViewModel</p>
}
