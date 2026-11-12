import { TOTAL_EXERCICIOS, TOTAL_SERIES } from '../../lib/treinoResumo'
import { IconDumbbell, IconMoon } from './icons'

function DiaRow({ dia, selecionado, ehHoje, onToggle }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={selecionado}
      aria-label={`${dia.nome} — ${selecionado ? 'treino' : 'descanso'}`}
      onClick={onToggle}
      className={`flex w-full items-center justify-between gap-3 border-b border-slate-100 px-4 py-3 text-left transition last:border-b-0 ${
        selecionado ? 'bg-violet-50/60' : 'hover:bg-slate-50'
      }`}
    >
      <span className="flex min-w-0 items-center gap-3">
        <span
          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${
            selecionado ? 'bg-violet-100 text-violet-600' : 'bg-slate-100 text-slate-400'
          }`}
        >
          {selecionado ? (
            <IconDumbbell className="h-4 w-4" />
          ) : (
            <IconMoon className="h-4 w-4" />
          )}
        </span>

        <span className="min-w-0">
          <span className="flex items-center gap-2">
            <span
              className={`truncate text-sm font-semibold ${
                ehHoje ? 'text-violet-700' : 'text-slate-800'
              }`}
            >
              {dia.nome}
            </span>
            {ehHoje && (
              <span className="rounded-full bg-violet-600 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-white">
                Hoje
              </span>
            )}
          </span>
          <span className="block truncate text-xs text-slate-500">
            {selecionado
              ? `${TOTAL_EXERCICIOS} exercícios · ${TOTAL_SERIES} séries`
              : 'Recuperação'}
          </span>
        </span>
      </span>

      <span
        className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors ${
          selecionado ? 'bg-violet-600' : 'bg-slate-300'
        }`}
      >
        <span
          className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform ${
            selecionado ? 'translate-x-5' : 'translate-x-0.5'
          }`}
        />
      </span>
    </button>
  )
}

export default DiaRow
