function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

/**
 * Reintenta fn() ante fallas, con backoff creciente (esperaMs * 2^intento).
 * Si se agotan los intentos, relanza el último error.
 */
export async function retry(fn, { intentos = 3, esperaMs = 200 } = {}) {
  let ultimoError
  for (let intento = 0; intento < intentos; intento++) {
    try {
      return await fn()
    } catch (err) {
      ultimoError = err
      if (intento < intentos - 1) {
        await delay(esperaMs * 2 ** intento)
      }
    }
  }
  throw ultimoError
}
