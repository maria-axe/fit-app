import { describe, expect, it } from 'vitest'
import { diasDaSemanaAtual, proximoDiaTreino } from './semana.js'

// Datas construídas no fuso local: getDay/paraISO usam os mesmos componentes.
const quinta = new Date(2026, 10, 5) // 05/11/2026
const domingo = new Date(2026, 10, 8) // 08/11/2026

describe('diasDaSemanaAtual', () => {
  it('gera segunda a domingo com ISO local', () => {
    const semana = diasDaSemanaAtual(quinta)

    expect(semana).toHaveLength(7)
    expect(semana.map((dia) => dia.nomeCurto)).toEqual([
      'Seg',
      'Ter',
      'Qua',
      'Qui',
      'Sex',
      'Sáb',
      'Dom',
    ])
    expect(semana.map((dia) => dia.valor)).toEqual([1, 2, 3, 4, 5, 6, 0])
    expect(semana[0].iso).toBe('2026-11-02')
    expect(semana[6].iso).toBe('2026-11-08')
  })

  it('trata domingo como fim da semana, não começo', () => {
    const semana = diasDaSemanaAtual(domingo)

    expect(semana[0].iso).toBe('2026-11-02')
    expect(semana[6].iso).toBe('2026-11-08')
  })

  it('não muta a data de referência', () => {
    const referencia = new Date(2026, 10, 5)
    diasDaSemanaAtual(referencia)
    expect(referencia.getDate()).toBe(5)
    expect(referencia.getMonth()).toBe(10)
  })
})

describe('proximoDiaTreino', () => {
  it('retorna hoje com offset 0 quando hoje é dia de treino', () => {
    expect(proximoDiaTreino([4], quinta)).toMatchObject({ nome: 'Quinta', offset: 0 })
  })

  it('retorna o próximo dia da semana', () => {
    expect(proximoDiaTreino([1, 3, 5], quinta)).toMatchObject({ nome: 'Sexta', offset: 1 })
  })

  it('dá a volta na semana', () => {
    // Sábado -> próxima segunda
    const sabado = new Date(2026, 10, 7)
    expect(proximoDiaTreino([1], sabado)).toMatchObject({ nome: 'Segunda', offset: 2 })
  })

  it('retorna null sem dias selecionados', () => {
    expect(proximoDiaTreino([], quinta)).toBeNull()
  })
})
