import { paraNumero } from './numeros.js'

export const LIMITES_PESO = { min: 20, max: 300 }
export const LIMITES_ALTURA = { min: 50, max: 250 }

function foraDoIntervalo(numero, { min, max }) {
  return numero < min || numero > max
}

export function validarNome(valor) {
  const nome = String(valor ?? '').trim()
  if (nome.length === 0) return 'Informe seu nome'
  if (nome.length < 2) return 'Informe pelo menos 2 letras'
  return null
}

export function validarPeso(valor) {
  const peso = paraNumero(valor)
  if (Number.isNaN(peso)) return 'Informe seu peso'
  if (foraDoIntervalo(peso, LIMITES_PESO)) {
    return `Peso deve estar entre ${LIMITES_PESO.min} e ${LIMITES_PESO.max} kg`
  }
  return null
}

export function validarAltura(valor) {
  const altura = paraNumero(valor)
  if (Number.isNaN(altura)) return 'Informe sua altura'
  if (foraDoIntervalo(altura, LIMITES_ALTURA)) {
    return `Altura deve estar entre ${LIMITES_ALTURA.min} e ${LIMITES_ALTURA.max} cm`
  }
  return null
}

export const VALIDADORES = {
  nome: validarNome,
  peso: validarPeso,
  altura: validarAltura,
}

export function validarFormulario(form) {
  const erros = {}
  for (const campo of Object.keys(VALIDADORES)) {
    const erro = VALIDADORES[campo](form[campo])
    if (erro) erros[campo] = erro
  }
  return erros
}
