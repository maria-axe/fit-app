import Screen from '../../components/Screen'
import Button from '../../components/Button'

function Exercicio({ exercicio, serieAtual, aoMarcarSerie, aoVoltar }) {
  return (
    <Screen titulo="Modo Treino">
      <section className="w-full rounded-2xl border border-slate-200 bg-white/80 p-6 text-center shadow-sm backdrop-blur-sm">
        <h2 className="text-xl font-bold text-slate-900">{exercicio.nome}</h2>
        <p className="mt-1 text-slate-600">{exercicio.grupoMuscular}</p>
        <p className="mt-4 font-medium text-slate-800">{exercicio.repeticoes} repetições</p>
        <p className="mt-2 text-sm text-slate-700">
          Série {serieAtual} de {exercicio.series}
        </p>
        <p className="mt-2 text-sm text-slate-500">
          Descanso: {exercicio.descansoSegundos}s
        </p>
      </section>

      <Button variante="sucesso" className="w-full" onClick={aoMarcarSerie}>
        Marcar série como feita
      </Button>
      <Button variante="secundario" className="w-full" onClick={aoVoltar}>
        Voltar pra home
      </Button>
    </Screen>
  )
}

export default Exercicio
