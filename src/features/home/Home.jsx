import Screen from '../../components/Screen'
import Button from '../../components/Button'
import { getDiaAtual, getHojeISO } from '../../lib/datas'

function Home({
  usuario,
  treinosFeitos,
  temProgresso,
  aoIniciarTreino,
  aoRecomecarTreino,
  aoAbrirPlano,
}) {
  const diasTreino = usuario.diasTreino ?? []
  const temTreino = diasTreino.includes(getDiaAtual())
  const listaFeitos = Array.isArray(treinosFeitos) ? treinosFeitos : []
  const jaFeitoHoje = listaFeitos.includes(getHojeISO())

  const frequenciaLabel =
    diasTreino.length === 7 ? 'Todos os dias' : `${diasTreino.length}x por semana`

  return (
    <Screen titulo={`Olá, ${usuario.nome}!`} subtitulo={frequenciaLabel}>
      <section className="w-full space-y-3 rounded-2xl border border-slate-200 bg-white/80 p-5 text-center shadow-sm backdrop-blur-sm">
        {temProgresso && (
          <>
            <p className="text-lg font-medium text-violet-600">Você tem um treino em andamento</p>
            <p className="text-sm text-slate-600">Continue de onde parou</p>
            <Button className="w-full" onClick={aoIniciarTreino}>
              Continuar treino
            </Button>
            <Button variante="contorno" className="w-full" onClick={aoRecomecarTreino}>
              Começar do zero
            </Button>
          </>
        )}

        {!temProgresso && temTreino && jaFeitoHoje && (
          <>
            <p className="text-lg font-medium text-emerald-600">
              Você já fez seu treino hoje! 💪
            </p>
            <p className="text-sm text-slate-600">Parabéns pela constância</p>
          </>
        )}

        {!temProgresso && temTreino && !jaFeitoHoje && (
          <>
            <p className="text-lg font-medium text-emerald-600">Hoje tem treino!</p>
            <p className="text-sm text-slate-600">Bora colocar em prática</p>
            <Button className="w-full" onClick={aoIniciarTreino}>
              Iniciar treino do dia
            </Button>
          </>
        )}

        {!temProgresso && !temTreino && (
          <>
            <p className="text-lg font-medium text-slate-700">Hoje é dia de descanso 😌</p>
            <p className="text-sm text-slate-600">
              Aproveite pra descansar e recarregar as energias.
            </p>
            <Button variante="secundario" className="w-full" onClick={aoIniciarTreino}>
              Treinar mesmo assim
            </Button>
          </>
        )}
      </section>

      <Button variante="contorno" className="w-full" onClick={aoAbrirPlano}>
        Meu plano
      </Button>
    </Screen>
  )
}

export default Home
