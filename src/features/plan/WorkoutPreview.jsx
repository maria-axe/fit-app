import { exercicios } from '../../data/exercicios'
import { GRUPOS, TOTAL_EXERCICIOS, TOTAL_SERIES } from '../../lib/treinoResumo'
import { IconDumbbell } from './icons'

function WorkoutPreview({ temTreinoHoje, treinoDetalhe }) {
  return (
    <section className="w-full rounded-2xl border border-slate-200 bg-white/80 p-4 text-left shadow-sm backdrop-blur-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-violet-600">
            Treino do dia
          </p>
          <h2 className="mt-0.5 text-base font-bold text-slate-900">
            {temTreinoHoje ? 'Hoje tem treino' : 'Seu treino'}
          </h2>
          <p className="text-xs text-slate-500">
            {treinoDetalhe} · {TOTAL_EXERCICIOS} exercícios · {TOTAL_SERIES} séries
          </p>
        </div>
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-linear-to-br from-violet-600 to-blue-600 text-white shadow-sm">
          <IconDumbbell className="h-5 w-5" />
        </span>
      </div>

      <ul className="mt-3 divide-y divide-slate-100">
        {exercicios.map((exercicio, indice) => (
          <li key={exercicio.id} className="flex items-center gap-3 py-2 first:pt-1 last:pb-1">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-violet-50 text-[10px] font-bold text-violet-600">
              {indice + 1}
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm font-medium text-slate-800">
                {exercicio.nome}
              </span>
              <span className="block text-[11px] text-slate-500">{exercicio.grupoMuscular}</span>
            </span>
            <span className="shrink-0 rounded-lg bg-slate-100 px-2 py-1 text-[11px] font-semibold text-slate-600">
              {exercicio.series} × {exercicio.repeticoes}
            </span>
          </li>
        ))}
      </ul>

      <div className="mt-2 flex flex-wrap gap-1.5">
        {GRUPOS.map((grupo) => (
          <span
            key={grupo}
            className="rounded-full bg-violet-50 px-2 py-0.5 text-[10px] font-medium text-violet-600"
          >
            {grupo}
          </span>
        ))}
      </div>
    </section>
  )
}

export default WorkoutPreview
