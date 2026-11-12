// Nome: letras (com acento), espaço, apóstrofo, ponto e hífen.
export function mascararNome(valor) {
  return String(valor)
    .replace(/[^\p{L}\s'.-]/gu, '')
    .replace(/\s+/g, ' ')
    .replace(/^\s+/, '')
    .slice(0, 80)
}

// Peso: até 3 dígitos inteiros e 2 decimais. Aceita ponto ou vírgula,
// mas exibe sempre vírgula (padrão pt-BR).
export function mascararPeso(valor) {
  const limpo = String(valor)
    .replace(/[^\d.,]/g, '')
    .replace(/\./g, ',')

  const [parteInteira = '', ...partesDecimais] = limpo.split(',')
  const inteira = parteInteira.replace(/^0+(?=\d)/, '').slice(0, 3)
  const decimal = partesDecimais.join('').slice(0, 2)

  if (!limpo.includes(',')) return inteira
  return `${inteira || '0'},${decimal}`
}

// Altura em cm: só dígitos, no máximo 3 (ex.: 175).
export function mascararAltura(valor) {
  return String(valor).replace(/\D/g, '').slice(0, 3)
}
