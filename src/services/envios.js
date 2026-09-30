function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

export const envios = {
  async programar(direccion) {
    await delay(300)
    const fecha = new Date()
    fecha.setDate(fecha.getDate() + 2)
    return { programado: true, direccion, fechaEstimada: fecha.toLocaleDateString() }
  },
}
