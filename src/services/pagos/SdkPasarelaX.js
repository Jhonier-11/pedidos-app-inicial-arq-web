// SDK simulado de una pasarela de pago (Pasarela X).
// Interfaz propia: cobrar({ amount, currency })
export class SdkPasarelaX {
  cobrar({ amount, currency }) {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          exito: true,
          idTransaccion: `X-${Date.now()}`,
          montoCobrado: amount,
          moneda: currency,
        })
      }, 400)
    })
  }
}
