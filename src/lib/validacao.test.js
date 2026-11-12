import { describe, expect, it } from 'vitest'
import {
  LIMITES_ALTURA,
  LIMITES_PESO,
  validarAltura,
  validarFormulario,
  validarNome,
  validarPeso,
} from './validacao.js'

describe('validarNome', () => {
  it('aceita letras com acento, apóstrofo, ponto e hífen', () => {
    expect(validarNome("José O'Neil-Silva Jr.")).toBeNull()
  })

  it('recusa vazio e só espaços', () => {
    expect(validarNome('')).toBe('Informe seu nome')
    expect(validarNome('   ')).toBe('Informe seu nome')
  })

  it('recusa uma única letra', () => {
    expect(validarNome('M')).toBe('Informe pelo menos 2 letras')
    expect(validarNome(' Ma ')).toBeNull()
  })
})

describe('validarPeso', () => {
  it('aceita os limites da faixa', () => {
    expect(validarPeso(String(LIMITES_PESO.min))).toBeNull()
    expect(validarPeso(String(LIMITES_PESO.max))).toBeNull()
  })

  it('aceita decimal com vírgula', () => {
    expect(validarPeso('70,5')).toBeNull()
  })

  it('recusa fora da faixa', () => {
    expect(validarPeso('19,9')).toMatch(/entre 20 e 300/)
    expect(validarPeso('300,1')).toMatch(/entre 20 e 300/)
  })

  it('recusa vazio, inválido e zero mascarado', () => {
    expect(validarPeso('')).toBe('Informe seu peso')
    expect(validarPeso('abc')).toBe('Informe seu peso')
    expect(validarPeso('0,')).toMatch(/entre 20 e 300/)
  })
})

describe('validarAltura', () => {
  it('aceita os limites da faixa', () => {
    expect(validarAltura(String(LIMITES_ALTURA.min))).toBeNull()
    expect(validarAltura(String(LIMITES_ALTURA.max))).toBeNull()
  })

  it('recusa fora da faixa', () => {
    expect(validarAltura('49')).toMatch(/entre 50 e 250/)
    expect(validarAltura('251')).toMatch(/entre 50 e 250/)
  })

  it('recusa vazio e inválido', () => {
    expect(validarAltura('')).toBe('Informe sua altura')
    expect(validarAltura('abc')).toBe('Informe sua altura')
  })
})

describe('validarFormulario', () => {
  it('retorna objeto vazio quando tudo é válido', () => {
    expect(validarFormulario({ nome: 'Mary', peso: '62,5', altura: '168' })).toEqual({})
  })

  it('acumula um erro por campo inválido', () => {
    const erros = validarFormulario({ nome: '', peso: '1', altura: '999' })

    expect(Object.keys(erros)).toEqual(['nome', 'peso', 'altura'])
    expect(erros.nome).toBe('Informe seu nome')
  })

  it('ignora campos extras', () => {
    expect(validarFormulario({ nome: 'Mary', peso: '70', altura: '170', extra: '' })).toEqual({})
  })
})
