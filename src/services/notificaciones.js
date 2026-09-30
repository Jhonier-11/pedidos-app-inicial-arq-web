function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

export const notificaciones = {
  async confirmar(cliente) {
    await delay(200)
    console.log(`📧 Notificación enviada a ${cliente}`)
    return { enviada: true, cliente }
  },
}
