export const ESTADO_INICIAL = {
  indiceExercicio: 0,
  serieAtual: 1,
  status: 'exercitando',
  tempoDescanso: 0,
}

export function treinoReducer(estado, acao) {
  switch (acao.type) {
    case 'MARCAR_SERIE': {
      const exercicio = acao.exercicios[estado.indiceExercicio]
      if (!exercicio) return estado

      if (estado.serieAtual < exercicio.series) {
        return {
          ...estado,
          serieAtual: estado.serieAtual + 1,
          status: 'descansando',
          tempoDescanso: exercicio.descansoSegundos,
        }
      }

      const proximoIndice = estado.indiceExercicio + 1
      if (proximoIndice >= acao.exercicios.length) {
        return { ...estado, status: 'finalizado', tempoDescanso: 0 }
      }

      return {
        ...estado,
        indiceExercicio: proximoIndice,
        serieAtual: 1,
        status: 'exercitando',
        tempoDescanso: 0,
      }
    }

    case 'TICK': {
      if (estado.status !== 'descansando') return estado
      if (estado.tempoDescanso <= 1) {
        return { ...estado, status: 'exercitando', tempoDescanso: 0 }
      }
      return { ...estado, tempoDescanso: estado.tempoDescanso - 1 }
    }

    case 'PULAR_DESCANSO':
      return { ...estado, status: 'exercitando', tempoDescanso: 0 }

    default:
      return estado
  }
}
