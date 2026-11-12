import { exercicios } from '../data/exercicios.js'

export const TOTAL_EXERCICIOS = exercicios.length
export const TOTAL_SERIES = exercicios.reduce((total, exercicio) => total + exercicio.series, 0)
export const GRUPOS = [...new Set(exercicios.map((exercicio) => exercicio.grupoMuscular))]
