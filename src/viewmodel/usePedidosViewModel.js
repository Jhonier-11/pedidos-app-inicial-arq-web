import { useState } from 'react'
import { FachadaPedidos } from '../patterns/FachadaPedidos.js'
import { AdapterPasarelaX } from '../services/pagos/AdapterPasarelaX.js'
import { AdapterPasarelaY } from '../services/pagos/AdapterPasarelaY.js'

const FORM_INICIAL = {
  cliente: '',
  direccion: '',
  itemsText: '',
  total: '',
  pasarela: 'X',
}

/**
 * EJERCICIO 3 — MVVM: ViewModel
 *
 * Concentra el estado y la lógica que antes vivía en OrdersApp.jsx.
 * La Vista (OrdersView) solo consume el contrato que este hook devuelve.
 */
export function usePedidosViewModel() {
  const [pedidos, setPedidos] = useState([])
  const [form, setForm] = useState(FORM_INICIAL)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  function setField(campo, valor) {
    setForm((prev) => ({ ...prev, [campo]: valor }))
  }

  async function enviarPedido(e) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      const adapter = form.pasarela === 'X' ? new AdapterPasarelaX() : new AdapterPasarelaY()
      const facade = new FachadaPedidos(adapter)
      const pedido = {
        cliente: form.cliente,
        direccion: form.direccion,
        items: form.itemsText.split(',').map((s) => s.trim()).filter(Boolean),
        total: Number(form.total),
      }
      await facade.procesarPedido(pedido)
      setPedidos((prev) => [
        { ...pedido, pasarela: form.pasarela, procesadoEn: new Date().toLocaleTimeString() },
        ...prev,
      ])
      setForm(FORM_INICIAL)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return { pedidos, loading, error, form, setField, enviarPedido }
}
