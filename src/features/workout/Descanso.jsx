import Screen from '../../components/Screen'
import Button from '../../components/Button'

function Descanso({ tempoDescanso, aoPular, aoVoltar }) {
  return (
    <Screen titulo="Descansando...">
      <section className="w-full rounded-2xl border border-slate-200 bg-white/80 p-6 text-center shadow-sm backdrop-blur-sm">
        <p className="bg-linear-to-r from-violet-600 to-blue-600 bg-clip-text text-6xl font-bold tabular-nums text-transparent">
          {tempoDescanso}s
        </p>
        <p className="mt-2 text-sm text-slate-600">Próxima série em instantes</p>
      </section>

      <Button className="w-full" onClick={aoPular}>
        Pular descanso
      </Button>
      <Button variante="secundario" className="w-full" onClick={aoVoltar}>
        Voltar pra home
      </Button>
    </Screen>
  )
}

export default Descanso
