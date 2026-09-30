import { useState } from 'react'
import { FachadaPedidos } from './patterns/FachadaPedidos.js'
import { AdapterPasarelaX } from './services/pagos/AdapterPasarelaX.js'
import { AdapterPasarelaY } from './services/pagos/AdapterPasarelaY.js'

// ⚠️ Componente "todo en uno": mezcla estado, lógica de negocio (llamar a
// la Fachada) y presentación (JSX) en un solo lugar. Es el punto de
// partida para el Ejercicio 3 (refactor a MVVM).
//
// Funciona una vez que resuelvas los Ejercicios 1 (Adapter) y 2 (Facade).
export default function OrdersApp() {
  // --- LÓGICA (esto debería vivir en el ViewModel) ---
  const [pedidos, setPedidos] = useState([])
  const [cliente, setCliente] = useState('')
  const [direccion, setDireccion] = useState('')
  const [itemsText, setItemsText] = useState('')
  const [total, setTotal] = useState('')
  const [pasarela, setPasarela] = useState('X')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  async function handleSubmit(e) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      const adapter = pasarela === 'X' ? new AdapterPasarelaX() : new AdapterPasarelaY()
      const facade = new FachadaPedidos(adapter)
      const pedido = {
        cliente,
        direccion,
        items: itemsText.split(',').map((s) => s.trim()).filter(Boolean),
        total: Number(total),
      }
      await facade.procesarPedido(pedido)
      setPedidos((prev) => [
        { ...pedido, pasarela, procesadoEn: new Date().toLocaleTimeString() },
        ...prev,
      ])
      setCliente('')
      setDireccion('')
      setItemsText('')
      setTotal('')
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  // --- VISTA (esto debería vivir en OrdersView) ---
  return (
    <section className="orders">
      <form onSubmit={handleSubmit} className="orders-form">
        <h2>Nuevo pedido</h2>
        <label>
          Cliente
          <input value={cliente} onChange={(e) => setCliente(e.target.value)} required />
        </label>
        <label>
          Dirección
          <input value={direccion} onChange={(e) => setDireccion(e.target.value)} required />
        </label>
        <label>
          Items (separados por coma)
          <input value={itemsText} onChange={(e) => setItemsText(e.target.value)} required />
        </label>
        <label>
          Total
          <input type="number" value={total} onChange={(e) => setTotal(e.target.value)} required />
        </label>
        <label>
          Pasarela de pago
          <select value={pasarela} onChange={(e) => setPasarela(e.target.value)}>
            <option value="X">Pasarela X</option>
            <option value="Y">Pasarela Y</option>
          </select>
        </label>
        <button type="submit" disabled={loading}>
          {loading ? 'Procesando…' : 'Procesar pedido'}
        </button>
        {error && <p className="error">⚠️ {error}</p>}
      </form>

      <div className="orders-list">
        <h2>Pedidos procesados ({pedidos.length})</h2>
        {pedidos.length === 0 && <p className="muted">Aún no hay pedidos.</p>}
        <ul>
          {pedidos.map((p, i) => (
            <li key={i}>
              <strong>{p.cliente}</strong> — {p.items.join(', ')} — ${p.total} — vía{' '}
              {p.pasarela} — {p.procesadoEn}
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}
