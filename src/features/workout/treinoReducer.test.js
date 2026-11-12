import { describe, expect, it } from 'vitest'
import { exercicios } from '../../data/exercicios.js'
import { ESTADO_INICIAL, treinoReducer } from './treinoReducer.js'

const EXERCICIOS = [
  { id: 1, nome: 'A', series: 2, descansoSegundos: 30 },
  { id: 2, nome: 'B', series: 1, descansoSegundos: 45 },
]

function estadoInicial(overrides = {}) {
  return { ...ESTADO_INICIAL, ...overrides }
}

describe('treinoReducer', () => {
  it('ignora ação desconhecida e devolve o mesmo estado', () => {
    const estado = estadoInicial()
    expect(treinoReducer(estado, { type: 'NAO_EXISTE' })).toBe(estado)
  })

  it('ignora MARCAR_SERIE quando o exercício não existe', () => {
    const estado = estadoInicial({ indiceExercicio: 9 })
    expect(treinoReducer(estado, { type: 'MARCAR_SERIE', exercicios: EXERCICIOS })).toBe(estado)
  })

  it('vai para descanso ao marcar série que não é a última', () => {
    const estado = treinoReducer(estadoInicial(), {
      type: 'MARCAR_SERIE',
      exercicios: EXERCICIOS,
    })

    expect(estado).toEqual({
      indiceExercicio: 0,
      serieAtual: 2,
      status: 'descansando',
      tempoDescanso: 30,
    })
  })

  it('avança de exercício ao marcar a última série', () => {
    const estado = treinoReducer(estadoInicial({ serieAtual: 2 }), {
      type: 'MARCAR_SERIE',
      exercicios: EXERCICIOS,
    })

    expect(estado).toEqual({
      indiceExercicio: 1,
      serieAtual: 1,
      status: 'exercitando',
      tempoDescanso: 0,
    })
  })

  it('finaliza ao marcar a última série do último exercício', () => {
    const estado = treinoReducer(estadoInicial({ indiceExercicio: 1, serieAtual: 1 }), {
      type: 'MARCAR_SERIE',
      exercicios: EXERCICIOS,
    })

    expect(estado).toEqual({
      indiceExercicio: 1,
      serieAtual: 1,
      status: 'finalizado',
      tempoDescanso: 0,
    })
  })

  it('não muta o estado recebido', () => {
    const estado = estadoInicial()
    const copia = structuredClone(estado)

    treinoReducer(estado, { type: 'MARCAR_SERIE', exercicios: EXERCICIOS })

    expect(estado).toEqual(copia)
  })

  it('decrementa o descanso a cada TICK', () => {
    const estado = treinoReducer(
      estadoInicial({ status: 'descansando', tempoDescanso: 5 }),
      { type: 'TICK' }
    )

    expect(estado).toMatchObject({ status: 'descansando', tempoDescanso: 4 })
  })

  it('volta a exercitar quando o descanso chega a 1', () => {
    const estado = treinoReducer(
      estadoInicial({ status: 'descansando', tempoDescanso: 1 }),
      { type: 'TICK' }
    )

    expect(estado).toMatchObject({ status: 'exercitando', tempoDescanso: 0 })
  })

  it('ignora TICK fora do descanso', () => {
    const estado = estadoInicial()
    expect(treinoReducer(estado, { type: 'TICK' })).toBe(estado)
  })

  it('pula o descanso', () => {
    const estado = treinoReducer(
      estadoInicial({ status: 'descansando', tempoDescanso: 20 }),
      { type: 'PULAR_DESCANSO' }
    )

    expect(estado).toMatchObject({ status: 'exercitando', tempoDescanso: 0 })
  })

  it('conclui o treino real após todas as séries', () => {
    const totalSeries = exercicios.reduce((total, exercicio) => total + exercicio.series, 0)
    let estado = estadoInicial()
    let marcadas = 0

    for (let i = 0; i < 5000 && estado.status !== 'finalizado'; i++) {
      if (estado.status === 'exercitando') {
        estado = treinoReducer(estado, { type: 'MARCAR_SERIE', exercicios })
        marcadas++
      } else {
        estado = treinoReducer(estado, { type: 'TICK' })
      }
    }

    expect(estado.status).toBe('finalizado')
    expect(marcadas).toBe(totalSeries)
  })
})
