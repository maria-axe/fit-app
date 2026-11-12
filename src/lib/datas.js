export function getDiaAtual() {
  return new Date().getDay()
}

// Data local (não UTC): toISOString() pode retornar "amanhã" à noite no Brasil (UTC-3).
export function paraISO(data) {
  const ano = data.getFullYear()
  const mes = String(data.getMonth() + 1).padStart(2, '0')
  const dia = String(data.getDate()).padStart(2, '0')
  return `${ano}-${mes}-${dia}`
}

export function getHojeISO() {
  return paraISO(new Date())
}
