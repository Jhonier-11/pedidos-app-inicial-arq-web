function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

export const inventario = {
  async reservar(items) {
    await delay(300)
    return { reservado: true, items }
  },
}
