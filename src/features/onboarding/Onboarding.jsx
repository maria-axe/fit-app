import { useState } from 'react'
import { alternarDia } from '../../lib/selecaoDias'
import { mascararAltura, mascararNome, mascararPeso } from '../../lib/mascaras'
import { VALIDADORES, validarFormulario } from '../../lib/validacao'
import DadosForm from './DadosForm'
import ResultadoIMC from './ResultadoIMC'
import DiasForm from './DiasForm'

const FORM_INICIAL = { nome: '', peso: '', altura: '' }

const MASCARAS = {
  nome: mascararNome,
  peso: mascararPeso,
  altura: mascararAltura,
}

function Onboarding({ aoConcluir }) {
  const [etapa, setEtapa] = useState(1)
  const [form, setForm] = useState(FORM_INICIAL)
  const [erros, setErros] = useState({})
  const [diasSelecionados, setDiasSelecionados] = useState([])

  function handleChange(event) {
    const { name, value } = event.target
    const mascarar = MASCARAS[name]
    const novoValor = mascarar ? mascarar(value) : value
    setForm((prev) => ({ ...prev, [name]: novoValor }))

    // Depois do primeiro erro, revalida o campo a cada tecla para o aviso sumir assim que corrigir.
    setErros((prev) => {
      if (!prev[name]) return prev
      const validar = VALIDADORES[name]
      const erro = validar ? validar(novoValor) : null
      if (erro) return { ...prev, [name]: erro }
      const proximos = { ...prev }
      delete proximos[name]
      return proximos
    })
  }

  function handleSubmit(event) {
    event.preventDefault()
    const novosErros = validarFormulario(form)
    if (Object.keys(novosErros).length > 0) {
      setErros(novosErros)
      return
    }
    setErros({})
    setEtapa(2)
  }

  function toggleDia(dia) {
    setDiasSelecionados((prev) => alternarDia(prev, dia))
  }

  function salvarPlano() {
    aoConcluir({
      ...form,
      nome: form.nome.trim(),
      frequencia: diasSelecionados.length,
      diasTreino: diasSelecionados,
    })
  }

  if (etapa === 1) {
    return (
      <DadosForm form={form} erros={erros} onChange={handleChange} onSubmit={handleSubmit} />
    )
  }

  if (etapa === 2) {
    return <ResultadoIMC form={form} onContinuar={() => setEtapa(3)} />
  }

  return (
    <DiasForm
      diasSelecionados={diasSelecionados}
      onToggleDia={toggleDia}
      onConfirmar={salvarPlano}
    />
  )
}

export default Onboarding
