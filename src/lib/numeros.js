// Converte "70,5" (pt-BR) ou "70.5" para número.
// Retorna NaN para vazio/inválido, em vez de 0 silencioso.
export function paraNumero(valor) {
  if (typeof valor === 'number') {
    return Number.isFinite(valor) ? valor : NaN
  }

  const texto = String(valor ?? '')
    .trim()
    .replace(',', '.')

  if (texto === '') return NaN

  const numero = Number(texto)
  return Number.isFinite(numero) ? numero : NaN
}
