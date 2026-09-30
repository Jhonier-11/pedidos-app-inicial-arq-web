import OrdersApp from './OrdersApp.jsx'

// EJERCICIO 3: cuando termines el refactor a MVVM, reemplaza el import
// de arriba y el <OrdersApp /> de abajo por:
//
//   import OrdersView from './components/OrdersView.jsx'
//   import { usePedidosViewModel } from './viewmodel/usePedidosViewModel.js'
//   ...
//   <OrdersView {...usePedidosViewModel()} />

export default function App() {
  return (
    <div className="app-shell">
      <header>
        <h1>🏬 Gestión de Pedidos</h1>
        <p className="subtitle">
          Actividad práctica · Patrones estructurales, Adapter y Facade
        </p>
      </header>
      <OrdersApp />
    </div>
  )
}
