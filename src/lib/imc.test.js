import { describe, expect, it } from 'vitest'
import { calcularIMC, classificarIMC, getExplicacaoIMC } from './imc.js'

describe('calcularIMC', () => {
  it('calcula com altura em cm e peso com vírgula', () => {
    expect(calcularIMC('62,5', '168')).toBeCloseTo(22.14, 2)
  })

  it('aceita altura em metros ou centímetros', () => {
    expect(calcularIMC(70, '1.75')).toBeCloseTo(calcularIMC(70, '175'), 10)
  })

  it('retorna NaN para dados ausentes ou inválidos', () => {
    expect(calcularIMC('', '175')).toBeNaN()
    expect(calcularIMC('70', '')).toBeNaN()
    expect(calcularIMC('abc', '175')).toBeNaN()
  })
})

describe('classificarIMC', () => {
  it.each([
    [18.4, 'Abaixo do peso'],
    [18.5, 'Peso normal'],
    [24.9, 'Peso normal'],
    [25, 'Sobrepeso'],
    [29.9, 'Sobrepeso'],
    [30, 'Obesidade'],
  ])('IMC %s => %s', (imc, texto) => {
    expect(classificarIMC(imc).texto).toBe(texto)
  })

  it('retorna uma classe de cor por faixa', () => {
    expect(classificarIMC(17).cor).toMatch(/^text-/)
    expect(classificarIMC(22).cor).toMatch(/^text-/)
    expect(classificarIMC(27).cor).toMatch(/^text-/)
    expect(classificarIMC(32).cor).toMatch(/^text-/)
  })
})

describe('getExplicacaoIMC', () => {
  it.each([
    [17, /abaixo do peso/i],
    [22, /faixa considerada normal/i],
    [27, /sobrepeso/i],
    [32, /obesidade/i],
  ])('IMC %s retorna a explicação da faixa', (imc, trecho) => {
    expect(getExplicacaoIMC(imc)).toMatch(trecho)
  })
})
