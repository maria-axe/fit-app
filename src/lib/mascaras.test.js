import { describe, expect, it } from 'vitest'
import { mascararAltura, mascararNome, mascararPeso } from './mascaras.js'

describe('mascararPeso', () => {
  it.each([
    ['70', '70'],
    ['70.5', '70,5'],
    ['0012,345', '12,34'],
    [',5', '0,5'],
    ['70,', '70,'],
    ['abc', ''],
    ['1234', '123'],
    ['999,99', '999,99'],
    ['12.34.56', '12,34'],
    [',999', '0,99'],
    ['000', '0'],
    ['000,5', '0,5'],
  ])('mascararPeso(%j) => %j', (entrada, saida) => {
    expect(mascararPeso(entrada)).toBe(saida)
  })
})

describe('mascararAltura', () => {
  it.each([
    ['175', '175'],
    ['1,75', '175'],
    ['175cm', '175'],
    ['12a34', '123'],
    ['1234', '123'],
    ['', ''],
    ['  ', ''],
  ])('mascararAltura(%j) => %j', (entrada, saida) => {
    expect(mascararAltura(entrada)).toBe(saida)
  })
})

describe('mascararNome', () => {
  it('remove dígitos, colapsa espaços e tira espaço à esquerda', () => {
    expect(mascararNome("  Mary   Jane 2 O'Neil-Silva  ")).toBe("Mary Jane O'Neil-Silva ")
  })

  it('preserva acentos e pontuação permitida', () => {
    expect(mascararNome('José D. Ávila-Neto')).toBe('José D. Ávila-Neto')
  })

  it('corta em 80 caracteres', () => {
    expect(mascararNome('a'.repeat(100))).toHaveLength(80)
  })
})
