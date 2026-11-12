import Screen from '../../components/Screen'
import Button from '../../components/Button'

function TreinoFinalizado({ aoVoltar }) {
  return (
    <Screen titulo="Treino finalizado! 🎉" subtitulo="Parabéns, você concluiu seu treino.">
      <section className="w-full rounded-2xl border border-slate-200 bg-white/80 p-6 text-center shadow-sm backdrop-blur-sm">
        <p className="text-sm text-slate-600">Seu treino já foi registrado automaticamente.</p>
      </section>

      <Button className="w-full" onClick={aoVoltar}>
        Voltar pra home
      </Button>
    </Screen>
  )
}

export default TreinoFinalizado
