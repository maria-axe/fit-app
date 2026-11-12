import Screen from '../../components/Screen'
import Button from '../../components/Button'
import { calcularIMC, classificarIMC, getExplicacaoIMC } from '../../lib/imc'

function ResultadoIMC({ form, onContinuar }) {
  const imc = calcularIMC(form.peso, form.altura)
  const classificacao = classificarIMC(imc)
  const explicacao = getExplicacaoIMC(imc)

  return (
    <Screen
      titulo="Seu ponto de partida"
      subtitulo="Esse é só um ponto de referência, não um diagnóstico"
    >
      <section className="flex w-full flex-col items-center gap-2 rounded-2xl border border-slate-200 bg-white/80 p-6 text-center shadow-sm backdrop-blur-sm">
        <p className="text-sm text-slate-500">Seu IMC</p>
        <p className="text-4xl font-bold text-slate-900">{imc.toFixed(1)}</p>
        <p className={`text-lg font-semibold ${classificacao.cor}`}>{classificacao.texto}</p>
        <p className="mt-2 text-sm leading-relaxed text-slate-600">{explicacao}</p>
        <p className="mt-2 text-xs text-slate-400">
          Peso: {form.peso}kg | Altura: {form.altura}cm
        </p>
      </section>

      <Button className="w-full" onClick={onContinuar}>
        Escolher meus dias de treino
      </Button>
    </Screen>
  )
}

export default ResultadoIMC
