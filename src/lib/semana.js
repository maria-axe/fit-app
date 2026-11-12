import { DIAS_SEMANA } from '../data/dias.js'
import { paraISO } from './datas.js'

// Semana de segunda a domingo, alinhada com DIAS_SEMANA.
export function diasDaSemanaAtual(referencia = new Date()) {
  const inicio = new Date(referencia)
  const diaSemana = inicio.getDay() // 0 = domingo
  const deslocamento = diaSemana === 0 ? -6 : 1 - diaSemana
  inicio.setDate(inicio.getDate() + deslocamento)
  inicio.setHours(0, 0, 0, 0)

  return DIAS_SEMANA.map((dia, indice) => {
    const data = new Date(inicio)
    data.setDate(inicio.getDate() + indice)
    return { ...dia, iso: paraISO(data) }
  })
}

// Próximo dia de treino a partir de hoje (offset 0 = hoje).
export function proximoDiaTreino(dias, referencia = new Date()) {
  if (dias.length === 0) return null

  const hoje = referencia.getDay()
  for (let offset = 0; offset < 7; offset++) {
    const valor = (hoje + offset) % 7
    if (dias.includes(valor)) {
      const dia = DIAS_SEMANA.find((d) => d.valor === valor)
      return { ...dia, offset }
    }
  }
  return null
}
