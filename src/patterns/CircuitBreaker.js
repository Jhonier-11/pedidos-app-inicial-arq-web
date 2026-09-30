export const ESTADOS = {
  CERRADO: 'CERRADO',
  ABIERTO: 'ABIERTO',
  SEMI_ABIERTO: 'SEMI_ABIERTO',
}

/**
 * Circuit Breaker configurable: corta las llamadas a un servicio inestable
 * en vez de dejar que cada intento pague el costo completo de un fallo.
 *
 * - CERRADO: las llamadas pasan; se cuentan los errores consecutivos.
 * - ABIERTO: fail-fast, no se llama al servicio hasta que pase tiempoEsperaMs.
 * - SEMI_ABIERTO: se permite UNA llamada de prueba; éxito -> CERRADO,
 *   fallo -> ABIERTO de nuevo.
 */
export class CircuitBreaker {
  constructor({ umbralErrores = 3, tiempoEsperaMs = 5000 } = {}) {
    this.umbralErrores = umbralErrores
    this.tiempoEsperaMs = tiempoEsperaMs
    this.estado = ESTADOS.CERRADO
    this.errores = 0
    this.abiertoDesde = null
  }

  async ejecutar(fn) {
    if (this.estado === ESTADOS.ABIERTO) {
      if (Date.now() - this.abiertoDesde >= this.tiempoEsperaMs) {
        this.estado = ESTADOS.SEMI_ABIERTO
      } else {
        throw new Error('Circuito abierto: servicio no disponible temporalmente')
      }
    }

    try {
      const resultado = await fn()
      this._onExito()
      return resultado
    } catch (err) {
      this._onFallo()
      throw err
    }
  }

  _onExito() {
    this.errores = 0
    this.estado = ESTADOS.CERRADO
    this.abiertoDesde = null
  }

  _onFallo() {
    if (this.estado === ESTADOS.SEMI_ABIERTO) {
      this._abrir()
      return
    }
    this.errores += 1
    if (this.errores >= this.umbralErrores) {
      this._abrir()
    }
  }

  _abrir() {
    this.estado = ESTADOS.ABIERTO
    this.abiertoDesde = Date.now()
  }

  get estaAbierto() {
    return this.estado === ESTADOS.ABIERTO
  }
}
