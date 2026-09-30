// Contrato común que deben cumplir todos los adaptadores de pago.
// (JavaScript no tiene interfaces reales: esto documenta el contrato
// y provee la clase de resultado compartida.)

export class Resultado {
  constructor(exito, idTransaccion) {
    this.exito = exito
    this.idTransaccion = idTransaccion
  }
}

/**
 * @typedef {Object} IPago
 * @property {(monto: number) => Promise<Resultado>} procesar
 */
