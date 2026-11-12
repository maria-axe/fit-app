import { describe, expect, it } from 'vitest'
import { alternarDia, mesmosDias } from './selecaoDias.js'

describe('alternarDia', () => {
  it('adiciona mantendo a ordem crescente', () => {
    expect(alternarDia([1, 3], 2)).toEqual([1, 2, 3])
    expect(alternarDia([5, 1], 3)).toEqual([1, 3, 5])
  })

  it('remove um dia já selecionado', () => {
    expect(alternarDia([1, 3], 3)).toEqual([1])
  })

  it('não muta o array original', () => {
    const dias = [3, 1]
    alternarDia(dias, 2)
    expect(dias).toEqual([3, 1])
  })

  it('volta ao estado anterior ao alternar duas vezes', () => {
    const original = [2, 5]
    const comDia = alternarDia(original, 1)
    expect(alternarDia(comDia, 1)).toEqual(original)
  })
})

describe('mesmosDias', () => {
  it('compara como conjunto (ordem não importa)', () => {
    expect(mesmosDias([1, 2, 3], [3, 1, 2])).toBe(true)
  })

  it('retorna false para tamanhos diferentes', () => {
    expect(mesmosDias([1, 2], [1, 2, 3])).toBe(false)
    expect(mesmosDias([1, 1], [1])).toBe(false)
  })

  it('retorna false para valores diferentes', () => {
    expect(mesmosDias([1, 2], [1, 3])).toBe(false)
  })

  it('trata dois vazios como iguais', () => {
    expect(mesmosDias([], [])).toBe(true)
  })
})
