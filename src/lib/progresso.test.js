import { describe, expect, it } from 'vitest'
import { CIRCUNFERENCIA_ANEL, calcularProgressoAnel } from './progresso.js'

describe('calcularProgressoAnel', () => {
  it('começa vazio quando não há meta', () => {
    expect(calcularProgressoAnel(2, 0)).toEqual({
      progresso: 0,
      dashOffset: CIRCUNFERENCIA_ANEL,
    })
  })

  it('calcula a fração da meta', () => {
    expect(calcularProgressoAnel(2, 4)).toEqual({
      progresso: 0.5,
      dashOffset: CIRCUNFERENCIA_ANEL * 0.5,
    })
  })

  it('fica cheio ao bater a meta', () => {
    expect(calcularProgressoAnel(4, 4)).toEqual({ progresso: 1, dashOffset: 0 })
  })

  it('clampa em 1 quando passa da meta', () => {
    expect(calcularProgressoAnel(5, 4)).toEqual({ progresso: 1, dashOffset: 0 })
  })

  it('mantém o offset entre 0 e a circunferência', () => {
    const { dashOffset } = calcularProgressoAnel(1, 3)
    expect(dashOffset).toBeGreaterThan(0)
    expect(dashOffset).toBeLessThan(CIRCUNFERENCIA_ANEL)
  })
})
