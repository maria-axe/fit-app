import { useState } from 'react'
import Screen from '../../components/Screen'
import Button from '../../components/Button'
import { DIAS_SEMANA } from '../../data/dias'
import { getDiaAtual, getHojeISO } from '../../lib/datas'
import { calcularIMC, classificarIMC } from '../../lib/imc'
import { paraNumero } from '../../lib/numeros'
import { alternarDia, mesmosDias } from '../../lib/selecaoDias'
import { diasDaSemanaAtual, proximoDiaTreino } from '../../lib/semana'
import { TOTAL_EXERCICIOS, TOTAL_SERIES } from '../../lib/treinoResumo'
import ProgressRing from './ProgressRing'
import WorkoutPreview from './WorkoutPreview'
import DiaRow from './DiaRow'
import { IconCheck, IconDumbbell } from './icons'

function MeuPlano({ usuario, treinosFeitos, aoSalvar, aoVoltar }) {
  const diasSalvos = usuario.diasTreino ?? []
  const [diasSelecionados, setDiasSelecionados] = useState(diasSalvos)
  const [salvo, setSalvo] = useState(false)
  const [confirmandoSaida, setConfirmandoSaida] = useState(false)

  const listaFeitos = Array.isArray(treinosFeitos) ? treinosFeitos : []
  const hojeISO = getHojeISO()
  const diaAtual = getDiaAtual()
  const jaFeitoHoje = listaFeitos.includes(hojeISO)

  const alterado = !mesmosDias(diasSelecionados, diasSalvos)
  const semDias = diasSelecionados.length === 0
  const podeSalvar = alterado && !semDias

  const peso = paraNumero(usuario.peso)
  const altura = paraNumero(usuario.altura)
  const temDadosIMC = peso > 0 && altura > 0
  const imc = temDadosIMC ? calcularIMC(peso, altura) : null
  const classificacao = imc !== null ? classificarIMC(imc) : null

  const semana = diasDaSemanaAtual()
  const feitosNaSemana = semana.filter((dia) => listaFeitos.includes(dia.iso)).length

  const metaSemana = diasSelecionados.length

  let frequenciaLabel = 'Nenhum dia'
  if (metaSemana === 7) frequenciaLabel = 'Todos os dias'
  else if (metaSemana > 0) frequenciaLabel = `${metaSemana}x por semana`

  const proximo = proximoDiaTreino(diasSelecionados)
  let proximoLabel = '—'
  if (proximo) {
    proximoLabel =
      proximo.offset === 0 ? (jaFeitoHoje ? 'Hoje (feito)' : 'Hoje') : proximo.nome
  }

  const temTreinoHoje = diasSelecionados.includes(diaAtual)
  let treinoDetalhe = 'Escolha seus dias'
  if (temTreinoHoje) treinoDetalhe = 'Hoje'
  else if (proximo) treinoDetalhe = `Próximo: ${proximoLabel}`

  function aplicarDias(novosDias) {
    setDiasSelecionados(novosDias)
    setSalvo(false)
    setConfirmandoSaida(false)
  }

  function alternar(dia) {
    setDiasSelecionados((prev) => alternarDia(prev, dia))
    setSalvo(false)
    setConfirmandoSaida(false)
  }

  function selecionarTodos() {
    aplicarDias(DIAS_SEMANA.map((dia) => dia.valor))
  }

  function limparDias() {
    aplicarDias([])
  }

  function salvar() {
    aoSalvar({
      ...usuario,
      diasTreino: diasSelecionados,
      frequencia: diasSelecionados.length,
    })
    setSalvo(true)
    setConfirmandoSaida(false)
  }

  function tentarVoltar() {
    if (alterado) {
      setConfirmandoSaida(true)
      return
    }
    aoVoltar()
  }

  return (
    <Screen titulo="Meu plano" subtitulo="Ajuste sua semana de treinos" alinhamento="topo">
      <section className="relative w-full overflow-hidden rounded-3xl bg-linear-to-br from-violet-600 via-indigo-600 to-blue-600 p-5 text-left text-white shadow-lg shadow-violet-500/20">
        <div className="pointer-events-none absolute -right-10 -top-12 h-36 w-36 rounded-full bg-white/10" />
        <div className="pointer-events-none absolute -bottom-16 left-10 h-32 w-32 rounded-full bg-white/5" />

        <div className="relative flex items-center justify-between gap-4">
          <div className="min-w-0">
            <p className="text-[11px] font-semibold uppercase tracking-widest text-white/70">
              Seu plano
            </p>
            <h2 className="mt-1 truncate text-xl font-bold">{usuario.nome}</h2>
            <p className="mt-0.5 text-sm text-white/80">{frequenciaLabel}</p>

            <p className="mt-3 text-[11px] text-white/70">Próximo treino</p>
            <p className="text-sm font-semibold">{proximoLabel}</p>
          </div>

          <ProgressRing feitos={feitosNaSemana} meta={metaSemana} />
        </div>

        <div className="relative mt-4 flex items-center justify-between border-t border-white/20 pt-3 text-xs">
          <span className="text-white/75">Semana atual</span>
          <span className="font-semibold">
            {feitosNaSemana} {feitosNaSemana === 1 ? 'treino' : 'treinos'}
          </span>
        </div>
      </section>

      <section className="grid w-full grid-cols-2 gap-2">
        <div className="rounded-2xl border border-slate-200 bg-white/80 p-3 text-left shadow-sm backdrop-blur-sm">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">IMC</p>
          <p className="mt-0.5 text-sm font-bold text-slate-900">
            {imc !== null ? imc.toFixed(1) : '—'}
          </p>
          <p
            className={`text-[10px] font-medium ${
              classificacao ? classificacao.cor : 'text-slate-400'
            }`}
          >
            {classificacao ? classificacao.texto : 'Sem dados'}
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white/80 p-3 text-left shadow-sm backdrop-blur-sm">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">
            Por treino
          </p>
          <p className="mt-0.5 text-sm font-bold text-slate-900">{TOTAL_SERIES} séries</p>
          <p className="text-[10px] text-slate-500">{TOTAL_EXERCICIOS} exercícios</p>
        </div>
      </section>

      <section className="w-full rounded-2xl border border-slate-200 bg-white/80 p-4 shadow-sm backdrop-blur-sm">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-slate-700">Semana</h2>
          <span className="text-xs text-slate-500">
            {feitosNaSemana}/{metaSemana || '—'}
          </span>
        </div>

        <div className="flex justify-between gap-1">
          {semana.map((dia) => {
            const feito = listaFeitos.includes(dia.iso)
            const ehHoje = dia.iso === hojeISO
            const planejado = diasSelecionados.includes(dia.valor)
            const situacao = feito
              ? 'treino feito'
              : ehHoje
                ? 'hoje'
                : planejado
                  ? 'treino planejado'
                  : 'sem treino'
            return (
              <div key={dia.iso} className="flex flex-1 flex-col items-center gap-1">
                <span className="text-[10px] text-slate-500">{dia.nomeCurto}</span>
                <span
                  role="img"
                  aria-label={`${dia.nome}: ${situacao}`}
                  className={`flex h-9 w-9 items-center justify-center rounded-xl border text-xs font-semibold ${
                    feito
                      ? 'border-emerald-500 bg-emerald-500 text-white'
                      : ehHoje
                        ? 'border-violet-500 bg-violet-50 text-violet-600'
                        : planejado
                          ? 'border-violet-200 bg-violet-50/70 text-violet-500'
                          : 'border-slate-200 bg-white/60 text-slate-300'
                  }`}
                >
                  {feito ? (
                    <IconCheck className="h-4 w-4" />
                  ) : planejado ? (
                    <IconDumbbell className="h-4 w-4" />
                  ) : ehHoje ? (
                    <span className="h-1.5 w-1.5 rounded-full bg-violet-500" />
                  ) : null}
                </span>
              </div>
            )
          })}
        </div>

        <div className="mt-3 flex flex-wrap gap-x-3 gap-y-1 text-[10px] text-slate-500">
          <span className="flex items-center gap-1">
            <span className="h-2 w-2 rounded-full bg-emerald-500" /> Feito
          </span>
          <span className="flex items-center gap-1">
            <span className="h-2 w-2 rounded-full bg-violet-500" /> Hoje
          </span>
          <span className="flex items-center gap-1">
            <span className="h-2 w-2 rounded-full bg-violet-200" /> Planejado
          </span>
        </div>
      </section>

      <WorkoutPreview temTreinoHoje={temTreinoHoje} treinoDetalhe={treinoDetalhe} />

      <section className="w-full overflow-hidden rounded-2xl border border-slate-200 bg-white/80 shadow-sm backdrop-blur-sm">
        <div className="flex items-center justify-between gap-2 px-4 pt-3 pb-2">
          <p className="text-left text-sm font-semibold text-slate-700">Dias de treino</p>
          <div className="flex gap-1">
            <button
              type="button"
              onClick={selecionarTodos}
              className="rounded-lg px-2 py-1 text-xs font-semibold text-violet-600 transition hover:bg-violet-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-600"
            >
              Todos
            </button>
            <button
              type="button"
              onClick={limparDias}
              className="rounded-lg px-2 py-1 text-xs font-semibold text-slate-500 transition hover:bg-slate-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-400"
            >
              Limpar
            </button>
          </div>
        </div>

        {DIAS_SEMANA.map((dia) => (
          <DiaRow
            key={dia.valor}
            dia={dia}
            selecionado={diasSelecionados.includes(dia.valor)}
            ehHoje={diaAtual === dia.valor}
            onToggle={() => alternar(dia.valor)}
          />
        ))}
      </section>

      <div aria-live="polite" role="status" className="min-h-5 text-sm">
        {semDias ? (
          <span className="text-rose-600">Selecione pelo menos 1 dia</span>
        ) : salvo && !alterado ? (
          <span className="font-medium text-emerald-600">Plano atualizado</span>
        ) : alterado ? (
          <span className="text-slate-500">Alterações não salvas</span>
        ) : null}
      </div>

      {confirmandoSaida ? (
        <div
          role="alertdialog"
          aria-modal="true"
          aria-labelledby="saida-titulo"
          className="w-full rounded-2xl border border-slate-200 bg-white/80 p-4 text-left shadow-sm backdrop-blur-sm"
        >
          <h2 id="saida-titulo" className="font-semibold text-slate-800">
            Descartar alterações?
          </h2>
          <p className="mt-1 text-sm text-slate-600">Você tem mudanças não salvas no plano.</p>
          <div className="mt-3 flex gap-2">
            <Button variante="perigo" className="flex-1" onClick={aoVoltar}>
              Descartar e sair
            </Button>
            <Button
              variante="secundario"
              className="flex-1"
              autoFocus
              onClick={() => setConfirmandoSaida(false)}
            >
              Continuar editando
            </Button>
          </div>
        </div>
      ) : (
        <>
          <Button className="w-full" onClick={salvar} disabled={!podeSalvar}>
            Salvar plano
          </Button>
          <Button variante="secundario" className="w-full" onClick={tentarVoltar}>
            Voltar pra home
          </Button>
        </>
      )}
    </Screen>
  )
}

export default MeuPlano
