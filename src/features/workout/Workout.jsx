import { useEffect, useReducer, useRef } from 'react'
import { exercicios } from '../../data/exercicios'
import { ESTADO_INICIAL, treinoReducer } from './treinoReducer'
import Exercicio from './Exercicio'
import Descanso from './Descanso'
import TreinoFinalizado from './TreinoFinalizado'

function Workout({
  estadoInicial = ESTADO_INICIAL,
  aoAtualizarProgresso,
  aoConcluirTreino,
  aoVoltar,
}) {
  const [estado, dispatch] = useReducer(treinoReducer, estadoInicial)

  // Ref com o estado mais recente para persistir sem depender do tempoDescanso.
  const estadoRef = useRef(estado)
  useEffect(() => {
    estadoRef.current = estado
  }, [estado])

  useEffect(() => {
    if (estado.status !== 'descansando') return

    const id = setInterval(() => dispatch({ type: 'TICK' }), 1000)
    return () => clearInterval(id)
  }, [estado.status])

  // Persiste só em transições relevantes (não a cada tick do descanso).
  useEffect(() => {
    const atual = estadoRef.current
    if (atual.status === 'finalizado') return
    aoAtualizarProgresso(atual)
  }, [estado.status, estado.indiceExercicio, estado.serieAtual, aoAtualizarProgresso])

  // Conclusão registrada automaticamente, mesmo se fechar a aba nesta tela.
  useEffect(() => {
    if (estado.status !== 'finalizado') return
    aoConcluirTreino()
  }, [estado.status, aoConcluirTreino])

  function sairParaHome() {
    // Salva o tempo restante exato antes de sair no meio do treino.
    aoAtualizarProgresso(estado)
    aoVoltar()
  }

  if (estado.status === 'finalizado') {
    return <TreinoFinalizado aoVoltar={aoVoltar} />
  }

  if (estado.status === 'descansando') {
    return (
      <Descanso
        tempoDescanso={estado.tempoDescanso}
        aoPular={() => dispatch({ type: 'PULAR_DESCANSO' })}
        aoVoltar={sairParaHome}
      />
    )
  }

  return (
    <Exercicio
      exercicio={exercicios[estado.indiceExercicio]}
      serieAtual={estado.serieAtual}
      aoMarcarSerie={() => dispatch({ type: 'MARCAR_SERIE', exercicios })}
      aoVoltar={sairParaHome}
    />
  )
}

export default Workout
