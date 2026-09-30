// Demostración rápida (Node) de la secuencia de estados del Circuit
// Breaker: CERRADO -> ABIERTO -> SEMI-ABIERTO -> CERRADO.
// Ejecutar con: node scripts/demo-circuit-breaker.mjs
import { CircuitBreaker } from '../src/patterns/CircuitBreaker.js'

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

async function llamar(breaker, falla, etiqueta) {
  try {
    await breaker.ejecutar(async () => {
      console.log(`  (durante la llamada -> estado = ${breaker.estado})`)
      if (falla) throw new Error('falla simulada')
      return 'ok'
    })
    console.log(`${etiqueta}: OK -> estado breaker = ${breaker.estado}`)
  } catch (err) {
    console.log(`${etiqueta}: FALLA (${err.message}) -> estado breaker = ${breaker.estado}`)
  }
}

async function main() {
  const breaker = new CircuitBreaker({ umbralErrores: 2, tiempoEsperaMs: 500 })

  console.log('--- Estado inicial:', breaker.estado, '---')

  console.log('\n1) Dos fallos consecutivos -> debe abrirse el circuito')
  await llamar(breaker, true, 'llamada 1 (falla)')
  await llamar(breaker, true, 'llamada 2 (falla)')

  console.log('\n2) Con el circuito ABIERTO, la llamada falla rápido sin invocar el servicio')
  await llamar(breaker, false, 'llamada 3 (serviría, pero el circuito está abierto)')

  console.log(`\n3) Esperando tiempoEsperaMs (${breaker.tiempoEsperaMs} ms) para pasar a SEMI-ABIERTO...`)
  await delay(breaker.tiempoEsperaMs + 50)

  console.log('\n4) Llamada de prueba exitosa en SEMI-ABIERTO -> vuelve a CERRADO')
  await llamar(breaker, false, 'llamada de prueba (éxito)')

  console.log('\n--- Estado final:', breaker.estado, '---')
}

main()
