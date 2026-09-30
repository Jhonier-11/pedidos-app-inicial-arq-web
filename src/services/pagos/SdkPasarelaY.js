// SDK simulado de una segunda pasarela de pago (Pasarela Y).
// Interfaz DISTINTA a la de Pasarela X: charge(amountCents, opts) y
// trabaja en CENTAVOS en vez de en la unidad monetaria completa.
export class SdkPasarelaY {
  charge(amountCents, opts = {}) {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        if (amountCents <= 0) {
          reject(new Error('amountCents debe ser mayor a 0'))
          return
        }
        resolve({
          ok: true,
          txId: `Y-${Math.random().toString(36).slice(2, 10)}`,
          chargedCents: amountCents,
          currency: opts.currency ?? 'COP',
        })
      }, 400)
    })
  }
}
