import Screen from '../../components/Screen'
import Button from '../../components/Button'
import { DIAS_SEMANA } from '../../data/dias'

function DiasForm({ diasSelecionados, onToggleDia, onConfirmar }) {
  const nenhumSelecionado = diasSelecionados.length === 0

  return (
    <Screen
      titulo="Quais dias você quer treinar?"
      subtitulo="Escolha os dias que melhor se encaixam na sua rotina"
    >
      <div className="flex w-full flex-wrap justify-center gap-2">
        {DIAS_SEMANA.map((dia) => {
          const selecionado = diasSelecionados.includes(dia.valor)
          return (
            <button
              key={dia.valor}
              type="button"
              onClick={() => onToggleDia(dia.valor)}
              aria-pressed={selecionado}
              className={`h-12 w-12 rounded-full border text-sm font-medium transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-600 ${
                selecionado
                  ? 'border-violet-600 bg-violet-600 text-white shadow-sm'
                  : 'border-slate-300 bg-white/80 text-slate-700 hover:bg-white'
              }`}
            >
              {dia.nomeCurto}
            </button>
          )
        })}
      </div>

      <p className="text-sm text-slate-500">
        {nenhumSelecionado
          ? 'Selecione pelo menos 1 dia'
          : `${diasSelecionados.length} ${diasSelecionados.length === 1 ? 'dia' : 'dias'} selecionados`}
      </p>

      <Button className="w-full" onClick={onConfirmar} disabled={nenhumSelecionado}>
        Começar
      </Button>
    </Screen>
  )
}

export default DiasForm
