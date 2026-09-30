import OrdersView from './components/OrdersView.jsx'
import { usePedidosViewModel } from './viewmodel/usePedidosViewModel.js'

export default function App() {
  return (
    <div className="app-shell">
      <header>
        <h1>🏬 Gestión de Pedidos</h1>
        <p className="subtitle">
          Actividad práctica · Patrones estructurales, Adapter y Facade
        </p>
      </header>
      <OrdersView {...usePedidosViewModel()} />
    </div>
  )
}
