import { Resultado } from './IPago.js'
import { SdkPasarelaX } from './SdkPasarelaX.js'

// EJEMPLO RESUELTO (igual al visto en clase) — úsalo como referencia
// para el Ejercicio 1, que consiste en escribir el adaptador de la
// Pasarela Y en AdapterPasarelaY.js.
//
// Adapta la interfaz de SdkPasarelaX a la interfaz común IPago.
export class AdapterPasarelaX {
  constructor(sdk = new SdkPasarelaX()) {
    this.sdk = sdk
  }

  async procesar(monto) {
    const r = await this.sdk.cobrar({ amount: monto, currency: 'COP' })
    return new Resultado(r.exito, r.idTransaccion)
  }
}
