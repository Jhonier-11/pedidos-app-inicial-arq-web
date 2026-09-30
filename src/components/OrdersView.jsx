/**
 * EJERCICIO 3 — MVVM: Vista
 *
 * Componente de presentación PURO: solo recibe props y renderiza JSX.
 * No conoce la orquestación de negocio ni las pasarelas de pago —
 * toda esa lógica vive en usePedidosViewModel.
 */
export default function OrdersView({ pedidos, loading, error, form, setField, enviarPedido }) {
  return (
    <section className="orders">
      <form onSubmit={enviarPedido} className="orders-form">
        <h2>Nuevo pedido</h2>
        <label>
          Cliente
          <input value={form.cliente} onChange={(e) => setField('cliente', e.target.value)} required />
        </label>
        <label>
          Dirección
          <input value={form.direccion} onChange={(e) => setField('direccion', e.target.value)} required />
        </label>
        <label>
          Items (separados por coma)
          <input value={form.itemsText} onChange={(e) => setField('itemsText', e.target.value)} required />
        </label>
        <label>
          Total
          <input type="number" value={form.total} onChange={(e) => setField('total', e.target.value)} required />
        </label>
        <label>
          Pasarela de pago
          <select value={form.pasarela} onChange={(e) => setField('pasarela', e.target.value)}>
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
