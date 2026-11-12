import Screen from '../../components/Screen'
import Button from '../../components/Button'

const INPUT_BASE =
  'w-full rounded-xl border bg-white/80 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2'
const INPUT_NORMAL = 'border-slate-300 focus:border-violet-500 focus:ring-violet-200'
const INPUT_INVALIDO = 'border-rose-400 focus:border-rose-500 focus:ring-rose-200'

function classesEntrada(erro) {
  return `${INPUT_BASE} ${erro ? INPUT_INVALIDO : INPUT_NORMAL}`
}

function MensagemErro({ id, children }) {
  if (!children) return null
  return (
    <p id={id} role="alert" className="mt-1 text-xs font-medium text-rose-600">
      {children}
    </p>
  )
}

function DadosForm({ form, erros = {}, onChange, onSubmit }) {
  const erroNome = erros.nome
  const erroPeso = erros.peso
  const erroAltura = erros.altura

  return (
    <Screen
      titulo="Vamos te conhecer"
      subtitulo="Preencha seus dados para personalizar seu treino"
    >
      <form onSubmit={onSubmit} noValidate className="w-full space-y-4 text-left">
        <div>
          <label htmlFor="nome" className="mb-1 block text-sm font-medium text-slate-700">
            Nome
          </label>
          <input
            id="nome"
            type="text"
            name="nome"
            value={form.nome}
            onChange={onChange}
            placeholder="Digite seu nome"
            autoComplete="name"
            maxLength={80}
            required
            aria-invalid={Boolean(erroNome)}
            aria-describedby={erroNome ? 'nome-erro' : undefined}
            className={classesEntrada(erroNome)}
          />
          <MensagemErro id="nome-erro">{erroNome}</MensagemErro>
        </div>

        <div>
          <label htmlFor="peso" className="mb-1 block text-sm font-medium text-slate-700">
            Peso (kg)
          </label>
          <input
            id="peso"
            type="text"
            inputMode="decimal"
            name="peso"
            value={form.peso}
            onChange={onChange}
            placeholder="Ex: 70,5"
            autoComplete="off"
            maxLength={6}
            required
            aria-invalid={Boolean(erroPeso)}
            aria-describedby={erroPeso ? 'peso-dica peso-erro' : 'peso-dica'}
            className={classesEntrada(erroPeso)}
          />
          <p id="peso-dica" className="mt-1 text-xs text-slate-500">
            Use vírgula para decimais
          </p>
          <MensagemErro id="peso-erro">{erroPeso}</MensagemErro>
        </div>

        <div>
          <label htmlFor="altura" className="mb-1 block text-sm font-medium text-slate-700">
            Altura (cm)
          </label>
          <input
            id="altura"
            type="text"
            inputMode="numeric"
            name="altura"
            value={form.altura}
            onChange={onChange}
            placeholder="Ex: 175"
            autoComplete="off"
            maxLength={3}
            required
            aria-invalid={Boolean(erroAltura)}
            aria-describedby={erroAltura ? 'altura-erro' : undefined}
            className={classesEntrada(erroAltura)}
          />
          <MensagemErro id="altura-erro">{erroAltura}</MensagemErro>
        </div>

        <Button type="submit" className="w-full">
          Continuar
        </Button>
      </form>
    </Screen>
  )
}

export default DadosForm
