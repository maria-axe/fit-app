# Fit App — Diário de estudo React

Projeto de estudo: app de treino (onboarding com IMC, escolha de dias, treino guiado por séries com descanso, plano semanal).

Stack: React 19, Vite 8, Tailwind CSS 4, Oxlint.
Persistência: `localStorage` (sem backend).

---

## 1. Diagnóstico antes do refactor

`src/App.jsx` tinha **499 linhas**, **11 `useState`** e todas as telas no mesmo componente:

- onboarding (3 etapas) + home + meu plano + treino (exercício/descanso/finalizado)
- helpers de IMC e exercícios declarados dentro do componente
- `localStorage` lido **durante o render** da home
- timer de descanso com `tempoDescanso` nas dependências do `useEffect`
- dados e regras de negócio misturados com JSX
- `src/App.css` era CSS morto do template do Vite

---

## 2. Estrutura nova

```
src/
├── App.jsx                     # shell: estado persistido + navegação entre telas
├── components/
│   ├── Screen.jsx              # frame de página: header + main, mobile-first
│   └── Button.jsx              # botão com variantes visuais
├── data/
│   ├── dias.js                 # DIAS_SEMANA (valor, nome, nomeCurto)
│   └── exercicios.js           # lista fixa de exercícios
├── hooks/
│   └── useLocalStorage.js      # leitura/escrita reativa no localStorage
├── lib/
│   ├── datas.js                # getDiaAtual(), paraISO(), getHojeISO()
│   ├── imc.js                  # calcularIMC, classificarIMC, getExplicacaoIMC
│   ├── selecaoDias.js          # alternarDia(), mesmosDias()
│   └── semana.js               # diasDaSemanaAtual(), proximoDiaTreino()
└── features/
    ├── onboarding/
    │   ├── Onboarding.jsx      # dono do estado do formulário (etapa, form, dias)
    │   ├── DadosForm.jsx       # etapa 1 (controlada)
    │   ├── ResultadoIMC.jsx    # etapa 2 (derivada)
    │   └── DiasForm.jsx        # etapa 3 (controlada)
    ├── home/Home.jsx
    ├── plan/MeuPlano.jsx       # resumo + histórico da semana + edição dos dias
    └── workout/
        ├── Workout.jsx         # orquestra reducer + timer + persistência
        ├── treinoReducer.js    # máquina de estados do treino (puro)
        ├── Exercicio.jsx
        ├── Descanso.jsx
        └── TreinoFinalizado.jsx
```

Organização por **feature**, não por tipo de arquivo. Cada pasta tem o que muda junto.

> Atualizações posteriores: `features/plan` ganhou `ProgressRing`, `WorkoutPreview`, `DiaRow` e `icons` (Rodada 10); `lib` ganhou `mascaras`, `numeros`, `validacao`, `progresso` e `treinoResumo`; o `App` passou a usar React Router no lugar de `tela` (Rodada 11 — ver §14).

---

## 3. Conceitos aplicados (o que estudar)

### 3.1 Custom hook — `useLocalStorage`

Antes: `localStorage.getItem`/`setItem` espalhados e uma leitura no render (impura).

```js
function lerInicial(key, initialValue) {
  try {
    const raw = localStorage.getItem(key)
    if (raw !== null) return JSON.parse(raw)
  } catch { /* JSON inválido */ }
  return typeof initialValue === 'function' ? initialValue() : initialValue
}

export function useLocalStorage(key, initialValue) {
  const [value, setValue] = useState(() => lerInicial(key, initialValue))

  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(value))
    } catch { /* quota/security */ }
  }, [key, value])

  return [value, setValue]
}
```

Aprendizados:
- **inicializador preguiçoso**: `useState(() => ...)` roda só no primeiro render.
- manter `localStorage` fora do corpo do render mantém o render **puro**.
- `useEffect` sincroniza o estado com o mundo externo (localStorage) — esse é o papel dele.
- `setValue` é o próprio setter do `useState`, então aceita updater funcional: `set(prev => ...)`.

### 3.2 Lifting state up

O `App` virou dono do estado que **duas ou mais telas compartilham**:

```jsx
const [usuario, setUsuario] = useLocalStorage('fitapp_user', null)
const [treinosFeitos, setTreinosFeitos] = useLocalStorage('fitapp_treinos_feitos', [])
const [treinoEmAndamento, setTreinoEmAndamento] = useLocalStorage('fitapp_treino_em_andamento', null)
const [tela, setTela] = useState('home')
```

- `usuario` decide se mostra onboarding ou o app.
- `treinosFeitos` é atualizado no workout e lido na home **sem reler o storage**.
- `treinoEmAndamento` permite **retomar** um treino interrompido.
- telas recebem callbacks (`aoIniciarTreino`, `aoAbrirPlano`, `aoVoltar`), não sabem navegar sozinhas.

> Nota: `tela` foi **substituído por rotas** na Rodada 11 (§14). O resto do estado continua no `App`; só a navegação saiu do `useState`.

### 3.3 Estado derivado vs. estado armazenado

Na home, nada de guardar `temTreino`/`jaFeitoHoje` em `useState`:

```js
const diasTreino = usuario.diasTreino ?? []
const temTreino = diasTreino.includes(getDiaAtual())
const jaFeitoHoje = listaFeitos.includes(getHojeISO())
```

Regra: **se dá pra calcular a partir de props/estado, não crie estado**. Assim não há duas fontes de verdade para sincronizar.

O progresso também é validado por data na renderização, sem efeito extra:

```js
const progressoValido =
  treinoEmAndamento?.dia === getHojeISO() ? treinoEmAndamento.estado : null
```

### 3.4 Formulário controlado

`Onboarding` é dono de `form` e `diasSelecionados`; os steps são "burros".

```js
function handleChange(event) {
  const { name, value } = event.target
  setForm((prev) => ({ ...prev, [name]: value })) // campo dinâmico
}
```

- `[name]: value` reutiliza um handler para vários inputs.
- `onSubmit` sempre com `event.preventDefault()`.
- botão desabilitado + estilo condicional quando `diasSelecionados.length === 0`.

### 3.5 `useReducer` — máquina de estados do treino

Antes: `indiceExercicio`, `serieAtual`, `emDescanso`, `tempoDescanso` eram 4 `useState` que precisavam mudar juntos.

```js
export const ESTADO_INICIAL = {
  indiceExercicio: 0,
  serieAtual: 1,
  status: 'exercitando', // exercitando | descansando | finalizado
  tempoDescanso: 0,
}
```

Ações: `MARCAR_SERIE`, `TICK`, `PULAR_DESCANSO`.

```js
case 'MARCAR_SERIE': {
  const exercicio = acao.exercicios[estado.indiceExercicio]

  if (estado.serieAtual < exercicio.series) {
    return {
      ...estado,
      serieAtual: estado.serieAtual + 1,
      status: 'descansando',
      tempoDescanso: exercicio.descansoSegundos,
    }
  }

  const proximoIndice = estado.indiceExercicio + 1
  if (proximoIndice >= acao.exercicios.length) {
    return { ...estado, status: 'finalizado', tempoDescanso: 0 }
  }

  return { ...estado, indiceExercicio: proximoIndice, serieAtual: 1, status: 'exercitando' }
}
```

Aprendizados:
- reducer é **função pura**: `(estado, acao) => novoEstado`, sem efeitos colaterais.
- os exercícios entram pela ação (`acao.exercicios`), então dá para testar o reducer isolado.
- `status` elimina estados impossíveis (ex.: "descansando e finalizado ao mesmo tempo").
- o componente só decide **o que renderizar** a partir de `status`.
- o argumento inicial do `useReducer` só é usado **no mount**; por isso desmontar/remontar o `Workout` é o que permite retomar de um estado salvo.

### 3.6 Timer: corrigindo dependência do `useEffect`

Antes (recriava o interval a cada segundo):

```js
useEffect(() => {
  const timer = setInterval(() => setTempoDescanso(prev => prev - 1), 1000)
  return () => clearInterval(timer)
}, [emDescanso, tempoDescanso])
```

Depois (o efeito depende só do que liga/desliga o timer):

```js
useEffect(() => {
  if (estado.status !== 'descansando') return
  const id = setInterval(() => dispatch({ type: 'TICK' }), 1000)
  return () => clearInterval(id)
}, [estado.status])
```

Aprendizados:
- a **função de cleanup** impede interval vazando.
- não coloque no array de dependências valores que mudam a cada tick; dependa do **gatilho**.
- o reducer recebe `TICK` e decide quando voltar a `exercitando`.

---

## 4. Bugs / problemas corrigidos no refactor

| Antes | Depois |
|---|---|
| `localStorage` lido no render da home | `useLocalStorage` no `App`; home recebe props |
| Interval recriado a cada segundo | efeito depende só de `estado.status` |
| 4 estados do treino podiam divergir | 1 estado via reducer |
| `usuario.diasTreino` sem guarda | `usuario.diasTreino ?? []` |
| dados/helpers dentro do componente | `src/data` e `src/lib` |
| `App.css` morto do template | removido; Tailwind em `index.css` |
| `lang="en"` / título template | `lang="pt-BR"` / `Fit App` |

Comportamento de UI preservado de propósito (mesmas classes, mesmos fluxos).

---

## 5. Rodada 2 — conclusão automática + progresso persistido

Problema: o treino só era registrado ao clicar em "Voltar pra home" na tela de finalizado, e sair no meio perdia tudo.

### 5.1 Registro automático ao concluir

`Workout` observa a transição para `finalizado`:

```js
useEffect(() => {
  if (estado.status !== 'finalizado') return
  aoConcluirTreino()
}, [estado.status, aoConcluirTreino])
```

`App` concentra a regra (idempotente):

```js
const registrarTreino = useCallback(() => {
  const hoje = getHojeISO()
  setTreinosFeitos((anteriores) => {
    const lista = Array.isArray(anteriores) ? anteriores : []
    return lista.includes(hoje) ? lista : [...lista, hoje]
  })
}, [setTreinosFeitos])

const concluirTreino = useCallback(() => {
  registrarTreino()
  setTreinoEmAndamento(null)
}, [registrarTreino, setTreinoEmAndamento])
```

- **idempotência**: rodar duas vezes não duplica o dia. Importante porque o React StrictMode executa efeitos duas vezes em dev.
- `useCallback` mantém a identidade estável, evitando que o efeito reexecute a cada render do `App`.
- a tela de finalizado agora só **navega**; não é mais responsável por salvar.

### 5.2 Persistir progresso sem escrever a cada segundo

Salvar `tempoDescanso` a cada `TICK` geraria ~40 escritas síncronas no `localStorage` por descanso. Solução: persistir em **transições** e ler o estado atual por `ref`.

```js
const estadoRef = useRef(estado)
useEffect(() => {
  estadoRef.current = estado
}, [estado])

useEffect(() => {
  const atual = estadoRef.current
  if (atual.status === 'finalizado') return
  aoAtualizarProgresso(atual)
}, [estado.status, estado.indiceExercicio, estado.serieAtual, aoAtualizarProgresso])
```

- as dependências só mudam em transições (marcar série, pular descanso, trocar exercício).
- o `ref` evita incluir `estado` inteiro nas deps (e o warning `exhaustive-deps`).
- o cleanup continua salvando o tempo restante exato quando o usuário sai pelo botão:

```js
function sairParaHome() {
  aoAtualizarProgresso(estado)
  aoVoltar()
}
```

### 5.3 Retomada na home

`App` valida o progresso pelo dia e a home oferece continuar:

```js
const progressoValido =
  treinoEmAndamento?.dia === getHojeISO() ? treinoEmAndamento.estado : null
```

```jsx
<Workout estadoInicial={progressoValido ?? ESTADO_INICIAL} ... />
```

Botões na home:
- **Continuar treino** → monta o `Workout` com o estado salvo.
- **Começar do zero** → limpa o progresso e monta do `ESTADO_INICIAL`.

### 5.4 Bug de fuso horário corrigido

`new Date().toISOString().slice(0, 10)` usa **UTC**. No Brasil (UTC-3), após ~21h retorna a data de amanhã, quebrando "treino de hoje" e a validação do progresso. Agora:

```js
export function getHojeISO() {
  const agora = new Date()
  const ano = agora.getFullYear()
  const mes = String(agora.getMonth() + 1).padStart(2, '0')
  const dia = String(agora.getDate()).padStart(2, '0')
  return `${ano}-${mes}-${dia}`
}
```

Assim `getHojeISO()` fica consistente com `getDiaAtual()` (ambos locais).

### 5.5 Comportamento novo

| Situação | Antes | Depois |
|---|---|---|
| Concluir e fechar a aba | registro perdido | registrado automaticamente |
| Sair no meio | progresso perdido | salvo; "Continuar treino" na home |
| Sair pelo botão no descanso | perdia | salva tempo restante exato |
| Fechar a aba no descanso | perdia | retoma com o descanso cheio |
| Voltar em outro dia | — | progresso descartado |
| Descanso rodando | — | sem escrita por segundo no storage |

Limitações conhecidas:
- progresso é por **dia** (array de datas), não por sessão;
- fechar a aba abruptamente no descanso reinicia aquele descanso;
- `useLocalStorage` não sincroniza entre abas (evento `storage` ainda não tratado).

---

## 6. Rodada 3 — Meu plano editável

Antes a tela só listava os dias salvos. Agora ela edita a semana.

### 6.1 Rascunho local + salvar explícito

- `usuario` continua sendo a **fonte persistida** (`App` + `useLocalStorage`).
- `MeuPlano` guarda um **rascunho** em `useState`, inicializado com os dias salvos.
- `alterado` e `podeSalvar` são **derivados**, não armazenados.
- salvar faz merge no usuário e delega para `setUsuario`.

```jsx
const diasSalvos = usuario.diasTreino ?? []
const [diasSelecionados, setDiasSelecionados] = useState(diasSalvos)
const [salvo, setSalvo] = useState(false)

const alterado = !mesmosDias(diasSelecionados, diasSalvos)
const semDias = diasSelecionados.length === 0
const podeSalvar = alterado && !semDias

function alternar(dia) {
  setDiasSelecionados((prev) => alternarDia(prev, dia))
  setSalvo(false) // feedback não pode continuar "verdadeiro" após editar
}

function salvar() {
  aoSalvar({
    ...usuario,
    diasTreino: diasSelecionados,
    frequencia: diasSelecionados.length,
  })
  setSalvo(true)
}
```

Aprendizados:
- separar **estado persistido** (App) de **estado de edição** (rascunho local) — padrão "draft state".
- `useState(diasSalvos)` usa o valor inicial **só no mount**; por isso o rascunho não é sobrescrito a cada render do `App`.
- `salvo` é resetado no toggle para o feedback não mentir.
- o botão desabilita por regra de negócio (`semDias`) **e** por não haver mudança (`!alterado`).

### 6.2 Regras puras reutilizadas (Onboarding + MeuPlano)

`alternarDia` e `mesmosDias` foram extraídos para `src/lib/selecaoDias.js`. O Onboarding passou a usar a mesma função: uma regra, dois lugares.

```js
export function alternarDia(dias, dia) {
  return dias.includes(dia)
    ? dias.filter((d) => d !== dia)
    : [...dias, dia].sort((a, b) => a - b)
}

export function mesmosDias(a, b) {
  if (a.length !== b.length) return false
  const conjuntoB = new Set(b)
  return a.every((dia) => conjuntoB.has(dia))
}
```

- `mesmosDias` compara como **conjunto** (ordem não importa).
- funções puras são triviais de testar (verificado no node: toggle, remoção, igualdade).

### 6.3 Acessibilidade do toggle

- cada linha virou `<button type="button">` com `aria-pressed`.
- o `✓` é decorativo; o estado real é exposto por `aria-pressed` e pelo texto "Treino/Descanso".
- `type="button"` evita submit acidental caso a lista entre num form no futuro.

### 6.4 Comportamento novo

| Situação | Antes | Depois |
|---|---|---|
| Trocar dias | impossível | toque alterna o rascunho |
| Salvar | — | persiste via `setUsuario` |
| Nenhum dia | — | bloqueado com aviso |
| Sem mudanças | — | botão desabilitado |
| Salvar | — | feedback "Plano atualizado" |
| Editar após salvar | — | feedback some |

### 6.5 Refinamento visual e de estado

**Resumo no topo** — nome, IMC/classificação, frequência e próximo treino:

```js
const imc = temDadosIMC ? calcularIMC(peso, altura) : null
const proximo = proximoDiaTreino(diasSelecionados)
const proximoLabel = proximo
  ? proximo.offset === 0
    ? jaFeitoHoje ? 'Hoje (feito)' : 'Hoje'
    : proximo.nome
  : '—'
```

- tudo derivado do **rascunho** (`diasSelecionados`), então o resumo reage ao toggle antes de salvar;
- IMC tem guarda (`peso > 0 && altura > 0`) para dados legados.

**Histórico da semana** — `diasDaSemanaAtual()` gera segunda→domingo com ISO local e cruza com `treinosFeitos`:

```js
const semana = diasDaSemanaAtual()
const feitosNaSemana = semana.filter((d) => listaFeitos.includes(d.iso)).length
```

- a semana começa na segunda, alinhada com `DIAS_SEMANA`;
- `paraISO(data)` foi extraído de `getHojeISO` para reaproveitar a formatação **local**;
- comparamos strings ISO (evita `new Date(iso)` interpretar UTC).

**Confirmação de saída com rascunho sujo** — sem `window.confirm`, usando estado:

```js
function tentarVoltar() {
  if (alterado) {
    setConfirmandoSaida(true)
    return
  }
  aoVoltar()
}
```

- `role="alertdialog"`, `aria-modal`, `aria-labelledby`;
- `autoFocus` no botão seguro ("Continuar editando");
- o diálogo **substitui** os botões de salvar/voltar, garantindo que apareça no fluxo visível;
- limitação: não há focus trap nem fechar com Escape.

**Feedback acessível** — região `aria-live="polite"` sempre montada:

```jsx
<div aria-live="polite" role="status">
  {semDias ? 'Selecione pelo menos 1 dia'
    : salvo && !alterado ? 'Plano atualizado'
    : alterado ? 'Alterações não salvas' : null}
</div>
```

- a região existe desde o mount; só o conteúdo muda, que é o que o leitor de tela anuncia.

### 6.6 Ponto de parada (próxima sessão)

Feito nesta rodada: resumo, histórico, próximo treino, confirmação de saída e `aria-live`.

Ainda em aberto na tela:
- extrair `DiaRow`/`ListaDias` para compartilhar com o onboarding;
- focus trap/Escape no alertdialog e foco visível customizado;
- mostrar sequência (streak) e os últimos treinos.

Fora da tela: routing, treino gerado pelo perfil e testes.

---

## 7. Rodada 4 — layout com Tailwind

Pausa da lógica para trabalhar composição de componentes e consistência visual.

### 7.1 Decisões de design

- **mobile-first**: coluna centrada, `max-w-md mx-auto`, `px-4 py-8`; `sm:` só para respiro;
- **claro e minimalista**: azul como acento, superfícies brancas, texto em cinza;
- **4 papéis de cor**: acento (`blue`), superfície (`white`/`gray-200`), texto (`gray-800`/`gray-600`), feedback (`green`/`red`);
- `min-h-dvh` em vez de `min-h-screen`: respeita a barra do navegador mobile.

### 7.2 `Screen` — frame único

Antes cada tela repetia `min-h-screen flex flex-col items-center justify-center gap-4 p-4`.
Agora o frame vive em um só lugar:

```jsx
function Screen({ titulo, subtitulo, alinhamento = 'centro', children }) {
  const alinhamentoVertical = alinhamento === 'topo' ? 'justify-start' : 'justify-center'

  return (
    <div className="min-h-dvh bg-gray-50 text-gray-900">
      <main
        className={`mx-auto flex min-h-dvh w-full max-w-md flex-col gap-4 px-4 py-8 sm:px-6 sm:py-10 ${alinhamentoVertical}`}
      >
        {(titulo || subtitulo) && (
          <header className="text-center">
            {titulo && <h1 className="text-2xl font-bold tracking-tight">{titulo}</h1>}
            {subtitulo && <p className="mt-1 text-sm text-gray-600">{subtitulo}</p>}
          </header>
        )}
        {children}
      </main>
    </div>
  )
}
```

Aprendizados:
- **composição com `children`**: o frame não sabe o que renderiza dentro;
- `alinhamento="topo"` no MeuPlano evita o `justify-center` esmagar telas longas;
- `gap-4` no `main` faz o espaçamento vertical entre seções sem `mb-*` espalhado;
- header recebe `titulo`/`subtitulo`, então as telas só declaram o conteúdo.

### 7.3 `Button` — variantes sem repetição

Repetição de `px-6 py-2 rounded-lg ...` já era real (9 telas). Aí a abstração se justifica.

```jsx
const BASE =
  'inline-flex items-center justify-center gap-2 rounded-lg px-6 py-2.5 text-sm font-medium transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 disabled:cursor-not-allowed disabled:bg-gray-300 disabled:text-gray-500'

const VARIANTES = {
  primario: 'bg-blue-600 text-white hover:bg-blue-700 focus-visible:outline-blue-600',
  secundario: 'bg-gray-200 text-gray-800 hover:bg-gray-300 focus-visible:outline-gray-500',
  contorno: 'border border-gray-300 bg-white text-gray-700 hover:bg-gray-100 focus-visible:outline-gray-400',
  perigo: 'bg-red-600 text-white hover:bg-red-700 focus-visible:outline-red-600',
  sucesso: 'bg-green-600 text-white hover:bg-green-700 focus-visible:outline-green-600',
}

function Button({ variante = 'primario', className = '', type = 'button', ...props }) {
  return <button type={type} className={`${BASE} ${VARIANTES[variante]} ${className}`} {...props} />
}
```

Aprendizados:
- `type="button"` como padrão evita submit acidental; `DadosForm` passa `type="submit"` explícito;
- `disabled:` no `BASE` vence a cor da variante por especificidade — não precisa de `className` condicional;
- `className` extra permite `w-full`/`flex-1` sem criar props novas;
- composição de classes com template string é o padrão sem `clsx`/`tailwind-merge` (suficiente aqui);
- **abstração só depois da repetição**: `Card` não foi extraído porque as variações eram pequenas.

### 7.4 Conceitos de Tailwind usados

| Conceito | Onde |
|---|---|
| escala de espaçamento (`p-4`, `gap-3`, `space-y-3`) | todas as telas |
| `flex` e `grid` (`grid-cols-2`) | frame e resumo |
| responsivo (`sm:px-6`) | `Screen` |
| `hover:`, `focus-visible:`, `disabled:`, `last:` | botões e lista |
| `min-h-dvh` | `Screen` |
| `tabular-nums` | cronômetro do descanso |
| `truncate` | nome do aluno |

### 7.5 Antes/depois

| Antes | Depois |
|---|---|
| frame duplicado em 9 telas | `Screen` único |
| 5 estilos de botão copiados | `Button` com 5 variantes |
| `justify-center` cortando MeuPlano | `alinhamento="topo"` |
| `min-h-screen` | `min-h-dvh` |
| inputs com classes soltas | `INPUT_CLASSES` reutilizado no form |
| feedback sem foco visível | `focus-visible` padronizado |

### 7.6 Limitações / próximo passo

- sem dark mode (fica como exercício com `@theme` + `dark:`);
- sem header/nav global (depende de routing);
- `Screen` não tem `footer`; se aparecer, adicionar prop `rodape`;
- `Button` não cobre `<a>`; quando entrar router, criar `ButtonLink` ou usar `as`.

---

## 8. Rodada 5 — tema roxo/azul com degradê

Direção: **roxo→azul como acento**, fundo claro com degradê suave, cards translúcidos e botão primário em gradiente. A ideia é "moderno" sem sacrificar contraste.

### 8.1 Paleta final

| Papel | Classes |
|---|---|
| acento principal | `violet-600` / hover `violet-700` |
| acento secundário | `blue-600` (fim do gradiente) |
| fundo da página | `from-violet-50 via-white to-blue-50` |
| superfície | `bg-white/80` + `backdrop-blur-sm` |
| borda | `border-slate-200` |
| texto | `slate-900` / `slate-600` / `slate-500` |
| sucesso | `emerald-600` |
| perigo | `rose-600` |
| alerta | `amber-600` / `orange-500` |

Tudo centralizado em `Screen` e `Button`; as telas só herdaram as classes.

### 8.2 Gradiente no Tailwind v4

```jsx
<div className="bg-linear-to-b from-violet-50 via-white to-blue-50">
<button className="bg-linear-to-r from-violet-600 to-blue-600 hover:from-violet-700 hover:to-blue-700">
<h1 className="bg-linear-to-r from-violet-600 to-blue-600 bg-clip-text text-transparent">
```

- v4 usa `bg-linear-to-*` (o antigo `bg-gradient-to-*` foi renomeado);
- `from-*`, `via-*`, `to-*` definem as paradas;
- **texto com gradiente** = `bg-clip-text` + `text-transparent` (usado no título e no cronômetro).

### 8.3 Pegadinha: gradiente é `background-image`

`disabled:bg-slate-300` sozinho **não remove** o gradiente, porque o gradiente é `background-image` e a cor é `background-color`. Precisa dos dois:

```js
const BASE =
  '... disabled:bg-none disabled:bg-slate-300 disabled:text-slate-500 disabled:shadow-none'
```

Isso explica por que o botão desabilitado não fica com o gradiente por baixo.

### 8.4 Legibilidade

- texto pequeno sempre em `slate-600`/`slate-500`, nunca em `violet-400`;
- acentos fortes (`violet-600`, `emerald-600`, `rose-600`) só para títulos curtos e status;
- cards `bg-white/80` mantêm contraste sobre o degradê;
- `backdrop-blur-sm` é cosmético: se performar mal em aparelho antigo, remover não quebra nada.

### 8.5 Antes/depois

| Antes | Depois |
|---|---|
| `gray-50` de fundo | degradê `violet-50 → white → blue-50` |
| azul sólido | gradiente `violet-600 → blue-600` |
| `rounded-lg` | `rounded-xl`/`rounded-2xl` |
| `bg-white` opaco | `bg-white/80` + `backdrop-blur-sm` |
| `green-600`/`red-600` | `emerald-600`/`rose-600` |
| título texto puro | título com gradiente (`bg-clip-text`) |

### 8.6 Limitação e próximo passo

A paleta ainda está espalhada em utilities (`violet-*`, `slate-*`) pelas telas. Quando entrar **dark mode** ou a vontade de trocar de tema, o próximo passo é mover isso para tokens no `@theme` do Tailwind v4 e usar nomes semânticos (`bg-brand-600`). Por enquanto, `Screen` e `Button` concentram o que mais importa.

---

## 9. Rodada 6 — fundo em camadas + MeuPlano como dashboard

### 9.1 Fundo: mesh gradient fixo

O primeiro gradiente era claro demais. Medição em screenshot real: topo esquerdo `rgb(228,221,255)`, centro `rgb(255,255,255)`. Na prática lia como branco. A versão atual usa 5 radiais + 1 linear:

```js
const FUNDO = [
  'radial-gradient(ellipse 80% 60% at 10% -10%, rgba(139,92,246,0.34), transparent 60%)',
  'radial-gradient(ellipse 70% 55% at 95% 10%, rgba(59,130,246,0.30), transparent 60%)',
  'radial-gradient(ellipse 50% 50% at 0% 50%, rgba(139,92,246,0.14), transparent 60%)',
  'radial-gradient(ellipse 50% 50% at 100% 50%, rgba(59,130,246,0.14), transparent 60%)',
  'radial-gradient(ellipse 70% 55% at 50% 110%, rgba(168,85,247,0.18), transparent 65%)',
  'linear-gradient(180deg, #f5f3ff 0%, #ffffff 45%, #eff6ff 100%)',
].join(', ')
```

```jsx
<div className="relative isolate min-h-dvh text-slate-900">
  <div
    aria-hidden="true"
    className="pointer-events-none fixed inset-0 -z-10 overflow-hidden bg-violet-50"
    style={{ backgroundImage: FUNDO }}
  >
    <div style={{ backgroundImage: 'radial-gradient(#4f46e5 1px, transparent 1px)', backgroundSize: '24px 24px' }} className="absolute inset-0 opacity-[0.035]" />
  </div>

  <main>...</main>
</div>
```

Depois da mudança, os pixels ficaram: topo esquerdo `rgb(221,209,253)`, meio esquerdo `rgb(239,232,254)`, meio direito `rgb(226,237,253)`, rodapé `rgb(230,226,254)`. O centro continua quase branco para não brigar com o texto.

Pontos importantes:

- **`fixed`** faz o fundo ficar parado enquanto o conteúdo rola. `absolute` faria o degradê esticar junto com a página.
- **`isolate` + `-z-10`** criam um stacking context: o fundo fica atrás do conteúdo, mas ainda acima do fundo branco do `<body>`.
- **`overflow-hidden` na camada do fundo**, não no root, para cortar o padrão sem interferir no scroll.
- **`aria-hidden` + `pointer-events-none`**: decoração não entra na árvore de acessibilidade e não bloqueia cliques.
- **Várias camadas em `style` inline** porque a utility arbitrária com 6 gradientes ficaria ilegível. Aqui o CSS puro comunica melhor.
- **Performance:** radiais são mais baratas que `blur-3xl`; os blobs desfocados foram removidos.
- **Diagnóstico visual:** dá para medir cor de pixel com Chrome headless + ImageMagick (`magick shot.png -format "%[pixel:p{5,5}]" info:`) em vez de confiar só no "parece branco".

### 9.2 MeuPlano: de formulário para dashboard

A tela virou um painel de treino:

1. **Hero em gradiente** com nome, frequência, próximo treino e anel de progresso.
2. **Dois cards de métricas**: IMC/classificação e séries por treino.
3. **Semana** com estados feito/hoje/planejado.
4. **Preview do treino**: exercícios, grupo muscular, séries × repetições.
5. **Dias editáveis** com switch, ícones e ações rápidas "Todos"/"Limpar".
6. Feedback com `aria-live` e confirmação de saída preservados.

### 9.3 Anel de progresso com SVG

```js
const raio = 26
const circunferencia = 2 * Math.PI * raio
const progresso = meta > 0 ? Math.min(feitos / meta, 1) : 0
const dashOffset = circunferencia * (1 - progresso)
```

```jsx
<svg viewBox="0 0 64 64" className="-rotate-90">
  <circle r={raio} strokeDasharray={circunferencia} strokeDashoffset={dashOffset} />
</svg>
```

- `strokeDasharray` = tamanho total do traço;
- `strokeDashoffset` = quanto do traço fica "escondido";
- `Math.min(..., 1)` evita passar de 100% quando `feitos > meta`;
- `-rotate-90` começa o arco no topo;
- `transition-[stroke-dashoffset] duration-500` anima a mudança quando você alterna os dias.

O anel usa o **rascunho** (`diasSelecionados`), não o plano salvo. Isso dá feedback imediato: marcar mais um dia muda a meta na hora. O salvamento continua explícito no botão.

### 9.4 Switch acessível

A linha inteira é um `<button>` com semântica de interruptor:

```jsx
<button role="switch" aria-checked={selecionado} aria-label={`${dia.nome} — treino`}>
```

- `role="switch"` + `aria-checked` descreve melhor um toggle liga/desliga do que `aria-pressed`;
- o visual é um trilho (`w-11`) com um botão (`w-5`) deslocado por `translate-x-0.5`/`translate-x-5`;
- `aria-label` garante nome curto e previsível para o leitor de tela.

### 9.5 Dados derivados e constantes

No topo do módulo (fora do componente), porque não dependem de estado:

```js
const TOTAL_SERIES = exercicios.reduce((total, ex) => total + ex.series, 0)
const GRUPOS = [...new Set(exercicios.map((ex) => ex.grupoMuscular))]
```

- `reduce` soma as séries de todos os exercícios (12);
- `Set` remove grupos musculares repetidos;
- como `exercicios` é estático, isso roda **uma vez** por carregamento do módulo, não a cada render.

### 9.6 Detalhes de interação

- **"Todos" / "Limpar"** chamam `aplicarDias`, que também limpa o estado `salvo` e fecha a confirmação.
- O hero reflete o rascunho: frequência, próximo treino e anel mudam ao alternar.
- O preview do treino muda entre "Hoje tem treino" e "Seu treino" conforme o dia atual está selecionado.
- A semana mostra três estados visuais: feito (verde/check), hoje (roxo), planejado (roxo claro/dumbbell).
- Ícones são SVG inline com `stroke="currentColor"` e `aria-hidden="true"`; sem dependência nova.

### 9.7 Limitação

`MeuPlano.jsx` passou de ~230 para ~450 linhas. É o próximo alvo de refactor:

- `ProgressRing` (SVG + matemática);
- `WorkoutPreview` (lista de exercícios + tags);
- `DiaRow` (switch + ícone + metadados).

Extrair só depois de a interação estar estável, para não misturar mudança de comportamento com mudança de estrutura.

---

## 10. Rodada 7 — máscaras de formulário

### 10.1 Por que não `type="number"`

- Em vários navegadores/locales, `type="number"` rejeita vírgula (`70,5`), aceita `e`, `+`, `-` e mostra spinner.
- Com conteúdo inválido, `.value` pode virar string vazia — você perde o que o usuário digitou.
- Para máscara e teclado móvel, o padrão é `type="text"` + `inputMode="decimal"`/`"numeric"`.

### 10.2 Funções puras em `src/lib/mascaras.js`

```js
export function mascararPeso(valor) {
  const limpo = String(valor).replace(/[^\d.,]/g, '').replace(/\./g, ',')
  const [parteInteira = '', ...partesDecimais] = limpo.split(',')
  const inteira = parteInteira.replace(/^0+(?=\d)/, '').slice(0, 3)
  const decimal = partesDecimais.join('').slice(0, 2)
  if (!limpo.includes(',')) return inteira
  return `${inteira || '0'},${decimal}`
}

export function mascararAltura(valor) {
  return String(valor).replace(/\D/g, '').slice(0, 3)
}

export function mascararNome(valor) {
  return String(valor)
    .replace(/[^\p{L}\s'.-]/gu, '')
    .replace(/\s+/g, ' ')
    .replace(/^\s+/, '')
    .slice(0, 80)
}
```

- **peso:** até 3 inteiros + 2 decimais, ponto convertido para vírgula, zeros à esquerda removidos, vírgula no fim permitida enquanto digita.
- **altura:** só dígitos, 3 no máximo. Colar `1,75` ou `175cm` vira `175`.
- **nome:** `\p{L}` aceita letras com acento; remove dígitos, colapsa espaços e corta 80.
- `\p{L}` exige a flag `u`; é Unicode property escape, não regex “mágica”.

### 10.3 Onde a máscara roda

`Onboarding` é o dono do estado e aplica a máscara por `name`:

```js
const MASCARAS = { nome: mascararNome, peso: mascararPeso, altura: mascararAltura }

function handleChange(event) {
  const { name, value } = event.target
  const mascarar = MASCARAS[name]
  setForm((prev) => ({ ...prev, [name]: mascarar ? mascarar(value) : value }))
}
```

`DadosForm` só declara o que é do input: `inputMode`, `maxLength`, `autoComplete` e placeholder.

### 10.4 O bug da vírgula no cálculo

`Number('70,5')` retorna `NaN`. Por isso a máscara sozinha não resolvia: o IMC quebrava.

Criado `src/lib/numeros.js`:

```js
export function paraNumero(valor) {
  if (typeof valor === 'number') return Number.isFinite(valor) ? valor : NaN
  const texto = String(valor ?? '').trim().replace(',', '.')
  if (texto === '') return NaN
  const numero = Number(texto)
  return Number.isFinite(numero) ? numero : NaN
}
```

Usado em `calcularIMC` e em `MeuPlano` (que fazia `Number(usuario.peso)`).

### 10.5 Casos testados

| Entrada | Saída |
|---|---|
| `70` | `70` |
| `70.5` | `70,5` |
| `0012,345` | `12,34` |
| `,5` | `0,5` |
| `70,` | `70,` |
| `abc` | vazio |
| altura `1,75` / `175cm` | `175` |
| altura `12a34` | `123` |
| IMC `62,5` + `168` | `22.1` |

Nome: `"  Mary   Jane 2 O'Neil-Silva  "` → `"Mary Jane O'Neil-Silva "`; o `trim()` final acontece no submit (`salvarPlano`), não a cada tecla — se trimasse no `onChange`, digitar espaço entre palavras quebraria.

### 10.6 Limitação

Máscara **não é validação de faixa**: `999` e `1` ainda passam. O próximo passo é validar `20–300 kg` e `50–250 cm` com mensagens inline. Edições no meio do texto também podem mover o cursor; máscaras complexas (CPF, telefone) precisam preservar `selectionStart`/`selectionEnd`.

---

## 11. Rodada 8 — validação de faixas com mensagens inline

A máscara da rodada 7 limitava o **formato**, não o **valor**: peso `1` e altura `999` passavam e o IMC saía absurdo. Agora há validação de faixa antes de avançar do onboarding.

### 11.1 Por que `required` do HTML não bastava

- `required` só rejeita vazio; `"1"` é válido para o navegador.
- O balão nativo do navegador não segue o layout e não dá mensagem por campo.
- Por isso o form usa `noValidate` e o **submit é controlado por nós**; `required` fica só como semântica.

### 11.2 Validadores puros em `src/lib/validacao.js`

```js
export const LIMITES_PESO = { min: 20, max: 300 }
export const LIMITES_ALTURA = { min: 50, max: 250 }

export function validarPeso(valor) {
  const peso = paraNumero(valor)
  if (Number.isNaN(peso)) return 'Informe seu peso'
  if (peso < LIMITES_PESO.min || peso > LIMITES_PESO.max) {
    return `Peso deve estar entre ${LIMITES_PESO.min} e ${LIMITES_PESO.max} kg`
  }
  return null
}

export const VALIDADORES = { nome: validarNome, peso: validarPeso, altura: validarAltura }

export function validarFormulario(form) {
  const erros = {}
  for (const campo of Object.keys(VALIDADORES)) {
    const erro = VALIDADORES[campo](form[campo])
    if (erro) erros[campo] = erro
  }
  return erros
}
```

- retorna `null` quando válido — não precisa de `{ valido, mensagem }`;
- reaproveita `paraNumero`, então `"70,5"` continua funcionando;
- `validarFormulario` concentra a regra de "quais campos existem", evitando lista duplicada no componente;
- testável isolado (entra na rodada de Vitest).

### 11.3 Quando validar

- **no submit**: retorna todos os erros de uma vez, sem avançar de etapa:

```js
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
```

- **no `onChange`, só depois que o campo já tem erro**: revalida aquele campo para o aviso sumir assim que corrigir. Sem isso, validar a cada tecla mostraria "Peso deve estar entre 20 e 300 kg" enquanto ainda se digita `7` → `70`.

```js
setErros((prev) => {
  if (!prev[name]) return prev
  const erro = VALIDADORES[name](novoValor)
  if (erro) return { ...prev, [name]: erro }
  const proximos = { ...prev }
  delete proximos[name]
  return proximos
})
```

Detalhe: a revalidação usa o **valor já mascarado** (`novoValor`), não o `form` antigo — estado do React é assíncrono.

### 11.4 Mensagem inline acessível

`DadosForm` recebe `erros` e cada input ganha:

- `aria-invalid={Boolean(erro)}` — estado inválido exposto à tecnologia assistiva;
- `aria-describedby` apontando para a mensagem (e para a dica de vírgula, quando existe);
- `<p role="alert">` — o leitor de tela anuncia quando a mensagem aparece;
- borda muda por uma função (`classesEntrada(erro)`), em vez de concatenar condicional em cada input.

```jsx
<input aria-invalid={Boolean(erroPeso)} aria-describedby={erroPeso ? 'peso-dica peso-erro' : 'peso-dica'} />
<p id="peso-dica">Use vírgula para decimais</p>
{erroPeso && <p id="peso-erro" role="alert">{erroPeso}</p>}
```

O `role="alert"` fica na mensagem e não na região da dica, para não anunciar texto estático.

### 11.5 Casos verificados

| Entrada | Resultado |
|---|---|
| peso `70,5` | válido |
| peso `19` / `301` | "Peso deve estar entre 20 e 300 kg" |
| peso `` (vazio) | "Informe seu peso" |
| altura `175` | válido |
| altura `49` / `251` | "Altura deve estar entre 50 e 250 cm" |
| altura `` (vazio) | "Informe sua altura" |
| nome `"  "` | "Informe seu nome" |
| nome `"M"` | "Informe pelo menos 2 letras" |

`peso "0,"` (máscara de `,`) vira `0` e cai na faixa, não em "vazio". Comportamento proposital: a máscara normaliza, a validação de faixa rejeita.

### 11.6 Limitação

- limites fixos no código; não variam por idade, sexo ou objetivo;
- `MeuPlano` ainda calcula IMC de **dados legados** salvos antes da validação (a guarda só checa `> 0`);
- mensagens em português hardcoded; i18n fica para quando houver mais de um idioma;
- validação roda só no onboarding; se surgir edição de peso/altura no plano, os mesmos validadores precisam ser reusados lá.

---

## 12. Rodada 9 — testes com Vitest

### 12.1 Setup

- **Vitest 5** (peer de Vite ^8) como devDependency.
- `vitest.config.js` separado do `vite.config.js`: os testes são de funções puras, então não precisam dos plugins React/Tailwind e rodam em `environment: 'node'`.
- `include: ['src/**/*.test.js']` mantém a busca restrita ao código.
- scripts: `npm test` (`vitest run`) e `npm run test:watch` (`vitest`).
- testes **co-localizados** (`validacao.test.js` ao lado de `validacao.js`): importam por caminho relativo e são fáceis de achar.

### 12.2 O que está coberto (80 testes em 7 arquivos)

| Arquivo | Foco |
|---|---|
| `validacao.test.js` | limites 20/300 kg e 50/250 cm, vírgula, vazio, `NaN`, nome, `validarFormulario` |
| `mascaras.test.js` | tabela de entradas/saídas de peso, altura e nome (inclui `0012,345`, `1,75`, `"  Mary..."`) |
| `imc.test.js` | altura em cm e metros, vírgula, `NaN`, fronteiras 18.5 / 25 / 30, textos por faixa |
| `selecaoDias.test.js` | adicionar/remover mantendo ordenação, imutabilidade, comparação como conjunto |
| `semana.test.js` | segunda→domingo, domingo como fim da semana, virada de semana, `offset` 0 |
| `treinoReducer.test.js` | transições, ação desconhecida, `TICK`, `PULAR_DESCANSO`, pureza e treino real completo |
| `progresso.test.js` | anel: meta 0, fração da meta, cheio, clamp acima da meta, offset dentro da circunferência |

### 12.3 Padrões de teste usados

- `it.each` para tabelas de casos (máscaras e faixas de IMC) — menos repetição, falha nomeia a entrada.
- `toBe` para **identidade**: prova que ações inválidas devolvem o mesmo objeto (`treinoReducer` não recria estado à toa).
- `toEqual` para estado novo e `structuredClone` no teste de pureza.
- `toMatchObject` quando só um subconjunto do estado importa.
- `toBeCloseTo` para float (`calcularIMC`).
- Datas **locais** (`new Date(2026, 10, 5)`) em vez de string ISO, para o teste não depender do fuso da máquina.
- Fixtures próprios no reducer (`EXERCICIOS` com 2 exercícios) isolam a regra; um teste de integração usa `data/exercicios.js` e confere as 12 séries até `finalizado`.

### 12.4 O que os testes fixaram

- Ações inválidas e `TICK` fora do descanso devolvem **a mesma referência**.
- Limites do IMC são inclusivos na faixa de cima: `18.5` normal, `25` sobrepeso, `30` obesidade.
- `mesmosDias([1,1],[1])` é `false` por diferença de tamanho (documenta o comportamento atual).
- `calcularIMC` retorna `NaN` (não `0`) para entrada inválida — o `MeuPlano` já se protege com `temDadosIMC`.

### 12.5 Limitação

- só funções puras; **nenhum teste de componente/DOM** (exigiria `jsdom` + Testing Library);
- sem cobertura configurada (`@vitest/coverage-v8`);
- sem CI rodando `lint + test + build`.

---

## 13. Rodada 10 — extrair componentes do MeuPlano

Refactor **sem mudança de comportamento**: mesmas classes, mesmos textos, mesmos fluxos. A diferença é só de responsabilidade.

### 13.1 Ponto de partida

`MeuPlano.jsx` tinha 481 linhas e misturava quatro coisas:

1. **regras/derivações** (draft, `alterado`, `semDias`, IMC, semana, próximo treino);
2. **matemática do anel SVG** (`raio`, `circunferencia`, `dashOffset`);
3. **markup do preview do treino** (lista + tags de grupo muscular);
4. **markup de cada linha de dia** (switch + ícones + metadados).

O critério foi o mesmo das rodadas anteriores: extrair **depois** que a interação estabilizou e com as regras puras já testadas (rodada 9), para não misturar mudança de estrutura com mudança de comportamento.

### 13.2 Estrutura depois

| Arquivo | Linhas | Papel |
|---|---:|---|
| `features/plan/MeuPlano.jsx` | 294 | dono do estado, regras e composição da tela |
| `features/plan/ProgressRing.jsx` | 43 | anel SVG (view) |
| `features/plan/WorkoutPreview.jsx` | 58 | lista de exercícios + tags |
| `features/plan/DiaRow.jsx` | 67 | linha de dia (switch controlado) |
| `features/plan/icons.jsx` | 50 | SVGs compartilhados (dumbbell, moon, check) |
| `lib/progresso.js` | 11 | matemática pura do anel |
| `lib/treinoResumo.js` | 5 | constantes derivadas de `exercicios` |

`MeuPlano` caiu de 481 para 294 linhas e ficou só com o que muda junto: estado, regras e layout.

### 13.3 `progresso.js` — matemática fora do componente

```js
export const RAIO_ANEL = 26
export const CIRCUNFERENCIA_ANEL = 2 * Math.PI * RAIO_ANEL

export function calcularProgressoAnel(feitos, meta) {
  const progresso = meta > 0 ? Math.min(feitos / meta, 1) : 0
  return {
    progresso,
    dashOffset: CIRCUNFERENCIA_ANEL * (1 - progresso),
  }
}
```

- saiu do corpo do componente: agora é **função pura**, testável sem React;
- o `Math.min(..., 1)` impede passar de 100%;
- `meta > 0` evita divisão por zero (usuário sem dias);
- `RAIO_ANEL`/`CIRCUNFERENCIA_ANEL` são constantes de módulo, calculadas uma vez;
- ganhou `progresso.test.js` (meta 0, metade, cheio, acima da meta), subindo para **80 testes**.

### 13.4 `ProgressRing` — componente de apresentação

```jsx
function ProgressRing({ feitos, meta }) {
  const { dashOffset } = calcularProgressoAnel(feitos, meta)
  // svg + dois <circle> + números
}
```

- recebe **dados**, não estado: `feitos` e `meta`;
- não sabe de onde vêm os números (semana, rascunho, plano salvo);
- `aria-hidden="true"` no SVG: os números visíveis já carregam a informação;
- as cores (`text-white`, `text-white/20`) continuam específicas do hero. Extrair cedo demais para "genérico" criaria props que ninguém usa.

**Lição:** componente de apresentação pode importar utilidade pura, mas não deve importar estado global nem chamar `setState`.

### 13.5 `treinoResumo.js` — derivar uma vez, não em cada componente

Antes, `TOTAL_SERIES` e `GRUPOS` viviam no topo de `MeuPlano`. Ao extrair `WorkoutPreview` e `DiaRow`, os dois também precisariam desses números. Em vez de duplicar `reduce`/`Set` (ou passar por props em três níveis), centralizei:

```js
import { exercicios } from '../data/exercicios.js'

export const TOTAL_EXERCICIOS = exercicios.length
export const TOTAL_SERIES = exercicios.reduce((total, ex) => total + ex.series, 0)
export const GRUPOS = [...new Set(exercicios.map((ex) => ex.grupoMuscular))]
```

- como `exercicios` é estático, o cálculo roda **uma vez por carregamento do módulo**;
- `WorkoutPreview` importa `exercicios` (para a lista) e as constantes;
- `DiaRow` importa só as constantes;
- `MeuPlano` importa as constantes para o card de métricas.

**Lição:** dado derivado de constante estática não precisa de estado nem de prop drilling — um módulo resolve. O que **não** fazer: recalcular `reduce` dentro do render de cada componente.

### 13.6 `WorkoutPreview` — flags em vez de estado

```jsx
<WorkoutPreview temTreinoHoje={temTreinoHoje} treinoDetalhe={treinoDetalhe} />
```

- recebe apenas o que muda a exibição: `temTreinoHoje` (título) e `treinoDetalhe` (subtítulo);
- a lista, os números e as tags são responsabilidade interna do componente;
- o pai não passa `diasSelecionados`, `usuario` nem `semana` — **menos acoplamento**.

**Lição:** passe o mínimo necessário. Se o filho consegue derivar/importar, não passe pelo pai.

### 13.7 `DiaRow` — componente controlado

```jsx
<DiaRow
  dia={dia}
  selecionado={diasSelecionados.includes(dia.valor)}
  ehHoje={diaAtual === dia.valor}
  onToggle={() => alternar(dia.valor)}
/>
```

- não guarda estado: `selecionado` vem do rascunho do pai;
- não decide regra: só chama `onToggle`;
- mantém `role="switch"` + `aria-checked` (a semântica acompanha o componente extraído);
- `DiaRow` pode ser reutilizado no onboarding quando a lista de dias for unificada (pendência antiga do LEARN).

**Lição:** "componente controlado" = o pai é a fonte da verdade; o filho só renderiza e emite eventos.

### 13.8 O que ficou no `MeuPlano` (de propósito)

- estado de edição (`diasSelecionados`, `salvo`, `confirmandoSaida`);
- regras derivadas (`alterado`, `semDias`, `podeSalvar`);
- histórico da semana e próximo treino;
- ações (`alternar`, `aplicarDias`, `salvar`, `tentarVoltar`);
- composição das seções (hero, métricas, semana, preview, dias, feedback, diálogo).

**Lição:** extrair componente não é "quebrar em pedaços"; é mover o que tem **uma responsabilidade própria**. Regra de negócio continua no dono do estado.

### 13.9 Verificação

- `npm test`: 7 arquivos, **80 testes** passando (inclui `progresso.test.js`);
- `npm run lint` e `npm run build` passando;
- comportamento preservado: mesmos textos/classes e mesmos fluxos de rascunho/salvar/voltar.

### 13.10 Limitação

- `ProgressRing` não é genérico (cores fixas para o hero); generalizar só quando houver segundo uso;
- `WorkoutPreview` importa `data/exercicios` diretamente — aceitável para feature, mas não é um componente "puro de props";
- sem testes de renderização/DOM desses componentes (entra com jsdom + Testing Library).

---

## 14. Rodada 11 — routing com React Router

### 14.1 Problema

Até aqui a tela atual era uma string em memória:

```js
const [tela, setTela] = useState('home') // 'home' | 'meu-plano' | 'treino'
```

Consequências: a URL ficava sempre em `/`, F5 voltava para a home, o botão voltar não sabia que a tela mudou, não existia deep link. A URL não era fonte de verdade de nada.

### 14.2 Versão e pacote

- instalado **`react-router` 7.18.5**;
- o `latest` do npm era **8.5.1**, mas o `engines` do v8 exige **Node >= 22.22** e o ambiente está em **22.19** → o npm resolveu a linha 7 (`version-7`);
- na v7 o pacote unificado é `react-router`; não é preciso instalar `react-router-dom`;
- imports: `BrowserRouter`, `Routes`, `Route`, `Navigate`, `Outlet`, `useNavigate` — todos vêm de `react-router`.

`BrowserRouter` fica no `main.jsx`, envolvendo o `App`:

```jsx
createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>,
)
```

**Lição:** o router precisa estar acima de qualquer componente que use hooks de rota (`useNavigate`, `useLocation`). Por isso ele envolve o `App`, não fica dentro.

### 14.3 Mapa de rotas

| URL | Tela | Condição |
|---|---|---|
| `/onboarding` | `Onboarding` | se já tem usuário, redireciona para `/` |
| `/` | `Home` | protegida |
| `/plano` | `MeuPlano` | protegida |
| `/treino` | `Workout` | protegida |
| `*` | redirect | `/` se logado, `/onboarding` se não |

```jsx
<Routes>
  <Route path="/onboarding" element={usuario ? <Navigate to="/" replace /> : <Onboarding ... />} />

  <Route element={<LayoutProtegido usuario={usuario} />}>
    <Route path="/" element={<Home ... />} />
    <Route path="/plano" element={<MeuPlano ... />} />
    <Route path="/treino" element={<Workout ... />} />
  </Route>

  <Route path="*" element={<Navigate to={usuario ? '/' : '/onboarding'} replace />} />
</Routes>
```

O primeiro `Route` **não tem `path`**: é uma *layout route*. Ela renderiza o `LayoutProtegido` e, se liberar, o filho aparece no lugar do `<Outlet />`.

### 14.4 Guard com `Outlet` + `Navigate`

```jsx
function LayoutProtegido({ usuario }) {
  if (!usuario) return <Navigate to="/onboarding" replace />
  return <Outlet />
}
```

- `Outlet` é o "buraco" onde a rota filha é renderizada;
- `Navigate` é redirecionamento **declarativo** (não imperativo);
- `replace` troca a entrada atual do histórico em vez de empilhar — evita que o botão voltar caia de novo na rota bloqueada.

Quem conclui o onboarding chama `setUsuario`. O `App` re-renderiza, a rota `/onboarding` passa a ver `usuario` e devolve `<Navigate to="/" replace />`. Não foi preciso chamar `navigate` no callback.

**Lição:** com router, muita navegação vira consequência de estado + URL, não uma chamada imperativa.

### 14.5 Navegação por código

```jsx
const navigate = useNavigate()

<Home
  aoIniciarTreino={() => navigate('/treino')}
  aoAbrirPlano={() => navigate('/plano')}
  ...
/>
```

- as telas continuam "burras": recebem callbacks (`aoIniciarTreino`, `aoAbrirPlano`, `aoVoltar`);
- o que mudou é **para onde** o callback leva: antes era `setTela('treino')`, agora é `navigate('/treino')`;
- `recomecarTreino` faz as duas coisas: limpa o progresso e navega.

Alternativa futura: usar `<Link>`/`<NavLink>` para navegação clicável de verdade (aí sim vale um `ButtonLink`).

### 14.6 O que **não** foi para a URL

| Dado | Onde fica | Por quê |
|---|---|---|
| `usuario` | `localStorage` | dado persistido, não é navegação |
| `treinosFeitos` | `localStorage` | histórico |
| `treinoEmAndamento` | `localStorage` | retomada |
| rascunho de dias | `useState` no `MeuPlano` | estado transitório de edição |
| timer/descanso | `useReducer` no `Workout` | estado de execução |

**Lição:** a URL diz **qual tela** você está vendo; não é um depósito de estado interno. Colocar rascunho/timer na URL criaria URLs longas e frágeis.

### 14.7 SPA fallback

Teste com `npm run build && npm run preview -- --port 4174`:

| Caminho | HTTP | Conteúdo |
|---|---|---|
| `/` | 200 | `index.html` |
| `/plano` | 200 | `index.html` |
| `/treino` | 200 | `index.html` |
| `/onboarding` | 200 | `index.html` |
| `/qualquer-coisa` | 200 | `index.html` |

O `vite preview` já devolve o `index.html` para caminhos desconhecidos. **Em deploy real** (nginx, Apache, CDN) é preciso configurar o rewrite para `index.html`; senão F5 em `/plano` dá 404 no servidor.

### 14.8 Nuances e limitações

- **Histórico:** "Voltar pra home" usa `navigate('/')`, que empilha uma entrada. O back do navegador volta para `/plano` ou `/treino`. Se a intenção for "sair da tela", `navigate('/', { replace: true })` evita essa entrada extra.
- **Back no meio do treino:** sair pelo botão chama `sairParaHome`, que salva o tempo exato do descanso. O back do navegador desmonta o `Workout` sem isso — cai na limitação já conhecida de fechar a aba no descanso (retoma com o descanso cheio).
- **Refresh em `/treino`:** com progresso salvo do dia, retoma; sem progresso, começa do `ESTADO_INICIAL`. Depois de finalizar, dar F5 em `/treino` inicia um treino novo.
- **Bundle:** o JS de produção foi de ~249 kB para ~289 kB (gzip ~77 → ~90 kB) por causa do router; sem code splitting por rota ainda.
- **Sem teste de rotas:** na Rodada 11 os guards/redirects ainda não tinham teste automatizado; isso foi resolvido na Rodada 12 (§15).

### 14.9 Verificação

- `npm test`: 7 arquivos, 80 testes passando (regras puras continuam intactas);
- `npm run lint` e `npm run build` passando;
- `preview` devolvendo 200 + `index.html` para `/`, `/plano`, `/treino`, `/onboarding` e caminho desconhecido.

---

## 15. Rodada 12 — testes de rota com Testing Library

### 15.1 Problema

Os guards de rota da Rodada 11 estavam verificados só manualmente. Uma mudança em `LayoutProtegido`, na ordem das rotas ou no fallback `*` poderia quebrar os redirects sem o `npm test` acusar.

Objetivo: renderizar o `App` de verdade em um router de teste e verificar **para onde cada URL leva**, com e sem usuário.

### 15.2 Setup

```bash
npm install -D jsdom @testing-library/react @testing-library/dom @testing-library/jest-dom
```

Versões instaladas: `jsdom` 29, `@testing-library/react` 16, `@testing-library/dom` 10, `@testing-library/jest-dom` 7.

`vitest.config.js`:

```js
export default defineConfig({
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.js'],
    include: ['src/**/*.test.{js,jsx}'],
  },
})
```

`src/test/setup.js`:

```js
import '@testing-library/jest-dom/vitest'
import { cleanup } from '@testing-library/react'
import { afterEach } from 'vitest'

afterEach(() => {
  cleanup()
  localStorage.clear()
})
```

Por que cada peça:

- **`environment: 'jsdom'`** cria `document`, `window` e `localStorage` no Node. Sem isso, `render` não tem onde montar o DOM.
- **`setupFiles`** roda antes de cada arquivo de teste. `@testing-library/jest-dom/vitest` adiciona matchers como `toBeInTheDocument`.
- **`cleanup()`** desmonta a árvore React entre testes; sem isso um teste veria o DOM do anterior.
- **`localStorage.clear()`** evita que o usuário semeado em um teste vaze para o próximo.
- **`include` com `{js,jsx}`**: o padrão antigo (`*.test.js`) não pegaria `App.test.jsx`.

Alternativa ao jsdom global: colocar `// @vitest-environment jsdom` no topo de cada arquivo que precisa de DOM. Aqui o global foi mais simples — os testes de funções puras continuam passando iguais.

### 15.3 Renderizando o `App` com `MemoryRouter`

```jsx
function renderizarApp(rota) {
  return render(
    <MemoryRouter initialEntries={[rota]}>
      <App />
    </MemoryRouter>
  )
}

function autenticar() {
  localStorage.setItem('fitapp_user', JSON.stringify(USUARIO))
}
```

- **`MemoryRouter`** guarda o histórico em memória e aceita `initialEntries`; ele **não** altera a URL do navegador. É o equivalente de teste ao `BrowserRouter`.
- O `App` é renderizado dentro do router porque usa `useNavigate` e contém `<Routes>`.
- **Semear o `localStorage` antes do `render`** é essencial: `useLocalStorage` lê o valor inicial de forma síncrona dentro do `useState(() => ...)`. Se o `setItem` vier depois, a home já montou sem usuário.
- O jsdom fornece `localStorage`, então não é preciso mockar o hook.

### 15.4 Redirect é assíncrono

`<Navigate>` dispara a navegação em um efeito, não durante o primeiro render. Por isso a asserção usa `findBy...`, que espera o elemento aparecer:

```js
expect(
  await screen.findByRole('heading', { name: /vamos te conhecer/i })
).toBeInTheDocument()
```

`getBy...` síncrono falharia porque o redirect ainda não aconteceu. `findBy...` é `getBy...` + `waitFor` por baixo.

### 15.5 Casos cobertos (`src/App.test.jsx`)

| Entrada | Usuário? | Resultado esperado |
|---|---|---|
| `/onboarding` | não | formulário "Vamos te conhecer" + input `Nome` |
| `/onboarding` | sim | redireciona para `/` → "Olá, Ana!" |
| `/` | não | redireciona para `/onboarding` |
| `/plano` | não | redireciona para `/onboarding` |
| `/treino` | não | redireciona para `/onboarding` |
| `/rota-que-nao-existe` | sim | redireciona para `/` |
| `/rota-que-nao-existe` | não | redireciona para `/onboarding` |

As asserções usam o heading (`getByRole('heading', ...)`) em vez de texto solto: é o que um leitor de tela anuncia e é menos frágil a mudanças de estilo.

### 15.6 Resultado

- **87 testes em 8 arquivos** (80 anteriores + 7 de rota), passando em ~1,9 s;
- `npm run lint` e `npm run build` passando;
- build de produção inalterado: testes não entram no bundle.

### 15.7 Limitação

- cobre **render + redirect**, não interações (clicar em "Salvar plano", concluir treino, preencher onboarding);
- sem cobertura (`@vitest/coverage-v8`) e sem CI;
- o ambiente jsdom agora vale para todos os testes; se o custo crescer, separar por arquivo com `@vitest-environment node`.

---

## 16. Problemas conhecidos (próximos estudos)

1. **Treino fixo.** `data/exercicios.js` é sempre o mesmo, independente dos dias/frequência/IMC. → gerar plano a partir do perfil.
2. **Histórico ainda cru.** Rotas já têm teste, mas o back no meio do treino não salva o tempo exato. → decidir `replace` no "voltar" e tratar `popstate`.
3. **Dados legados fora da faixa.** `MeuPlano` ainda calcula IMC de usuários salvos antes da validação (a guarda só checa `> 0`). → saneamento/migração ao carregar.
4. **Testes de interação ausentes.** Há render/redirect, mas não cliques/fluxos; sem cobertura/CI. → testar `MeuPlano`/`Workout` com `userEvent` e adicionar `@vitest/coverage-v8`.
5. **`useLocalStorage` não sincroniza entre abas/instâncias** do hook. → ouvir evento `storage`.
6. **Registro é por dia, não por sessão.** → guardar histórico com data/hora, séries e duração.
7. **Alertdialog do plano sem focus trap/Escape.** → fechar com Esc e prender o foco.
8. **Sem dark mode.** → tokens com `@theme` + variante `dark:` no Tailwind v4.
9. **Paleta hardcoded em utilities.** → migrar `violet`/`slate` para tokens semânticos no `@theme` quando houver mais de um tema.
10. **Fluxos de interação sem teste.** Render/redirect já são testados, mas salvar plano, preencher onboarding e concluir treino ainda dependem de verificação manual. → `userEvent` + Testing Library.

---

## 17. Como verificar

```bash
npm run dev        # http://localhost:5173
npm run lint       # oxlint
npm test           # vitest run (87 testes)
npm run test:watch # vitest em watch
npx vitest run src/App.test.jsx # só os testes de rota
npm run build      # build de produção
```

Estado atual: `lint`, `test` e `build` passando.

Checagem manual no `npm run dev` (complementar aos testes):

- o fundo fica parado ao rolar (camada `fixed`);
- alternar os dias atualiza frequência, próximo treino e anel na hora;
- "Todos"/"Limpar" mexem no rascunho e não salvam sozinhos;
- cada linha é um `role="switch"` com `aria-checked`;
- o botão "Salvar plano" só habilita com mudança real e pelo menos 1 dia;
- no onboarding, peso `19`/`301` e altura `49`/`251` bloqueiam o avanço com mensagem inline;
- o erro some assim que o valor entra na faixa, sem precisar reenviar;
- `/` sem usuário redireciona para `/onboarding`;
- `/plano` e `/treino` continuam na mesma tela após F5;
- URL desconhecida cai em `/` (logado) ou `/onboarding` (sem usuário);
- back/forward do navegador alternam as telas sem reload.

Sanidade do reducer (12 séries → finalizado):

```bash
node --input-type=module -e "
import { treinoReducer, ESTADO_INICIAL } from './src/features/workout/treinoReducer.js'
import { exercicios } from './src/data/exercicios.js'
let s = ESTADO_INICIAL
let marcadas = 0
for (let i = 0; i < 5000 && s.status !== 'finalizado'; i++) {
  if (s.status === 'exercitando') {
    s = treinoReducer(s, { type: 'MARCAR_SERIE', exercicios }); marcadas++
  } else {
    s = treinoReducer(s, { type: 'TICK' })
  }
}
console.log(marcadas, s.status) // 12 finalizado
"
```

Sanidade da semana e do próximo treino:

```bash
node --input-type=module -e "
import { diasDaSemanaAtual, proximoDiaTreino } from './src/lib/semana.js'
const ref = new Date(2026, 10, 5) // quinta 05/11/2026
console.log(diasDaSemanaAtual(ref).map(d => d.nomeCurto).join(',')) // Seg,...,Dom
console.log(proximoDiaTreino([1, 3, 5], ref).nome) // Sexta
"
```

Sanidade das máscaras e do IMC com vírgula:

```bash
node --input-type=module -e "
import { mascararPeso, mascararAltura } from './src/lib/mascaras.js'
import { calcularIMC } from './src/lib/imc.js'
console.log(mascararPeso('70.5'), mascararPeso('0012,345')) // 70,5 12,34
console.log(mascararAltura('1,75')) // 175
console.log(calcularIMC('62,5', '168').toFixed(1)) // 22.1
"
```

Sanidade da validação de faixas:

```bash
node --input-type=module -e "
import { validarPeso, validarAltura, validarFormulario } from './src/lib/validacao.js'
console.log(validarPeso('70,5'), validarPeso('19'), validarPeso('301')) // null <msg> <msg>
console.log(validarAltura('175'), validarAltura('49'), validarAltura('251')) // null <msg> <msg>
console.log(validarFormulario({ nome: 'Mary', peso: '62,5', altura: '168' })) // {}
"
```

---

## 18. Checklist de estudo

- [x] Separar componentes por feature
- [x] Custom hook (`useLocalStorage`)
- [x] Lifting state up
- [x] Estado derivado
- [x] Formulário controlado (input dinâmico por `name`)
- [x] `useReducer` para estado complexo
- [x] `useEffect` + cleanup de `setInterval`
- [x] `useCallback` e estabilidade de dependências
- [x] Persistir progresso e retomar treino
- [x] Registro automático (idempotente)
- [x] `useRef` para "latest value" sem recriar efeito
- [x] Editar dias do plano (draft state + salvar explícito)
- [x] Extrair regra pura compartilhada (`selecaoDias`)
- [x] Toggle acessível com `aria-pressed`
- [x] Resumo com IMC, frequência e próximo treino
- [x] Histórico semanal a partir de `treinosFeitos`
- [x] Confirmação de saída com rascunho sujo
- [x] Feedback acessível com `aria-live`
- [x] Shell de página reutilizável (`Screen`)
- [x] Botões com variantes (`Button`)
- [x] Mobile-first com `min-h-dvh`
- [x] Estados de foco (`focus-visible`) e disabled
- [x] Tema com gradiente (`bg-linear-*`, `bg-clip-text`)
- [x] Entender por que `disabled` precisa de `bg-none` com gradiente
- [x] Fundo em camadas (`fixed`, `isolate`, `-z-10`)
- [x] Mesh gradient com múltiplas camadas (`radial-gradient`)
- [x] Anel de progresso com SVG (`strokeDasharray`/`strokeDashoffset`)
- [x] `role="switch"` + `aria-checked`
- [x] Ações rápidas no plano (Todos/Limpar)
- [x] Máscaras de input (nome, peso, altura)
- [x] Normalizar vírgula para cálculo (`paraNumero`)
- [x] Validar faixas de peso/altura com mensagens inline
- [x] `aria-invalid` + `aria-describedby` + `role="alert"` nas mensagens
- [ ] Sanitizar dados legados fora da faixa no `MeuPlano`
- [x] Extrair `ProgressRing`, `WorkoutPreview` e `DiaRow`
- [x] Extrair matemática do anel para função pura testável (`progresso`)
- [ ] Focus trap/Escape no alertdialog
- [ ] Dark mode com `@theme` + `dark:`
- [x] Routing com `react-router` (`BrowserRouter`/`Routes`/`Navigate`/`Outlet`)
- [x] Guard de rota com layout route + `Navigate replace`
- [x] URL como fonte da verdade da navegação
- [ ] `Link`/`NavLink` + `ButtonLink`
- [x] Testes de rota com `MemoryRouter`
- [x] Testes com Vitest (funções puras)
- [x] Testes de componente (jsdom + Testing Library)
- [x] Seed de `localStorage` antes do render
- [x] Redirect assíncrono com `findBy...`
- [ ] Testes de interação (`userEvent`)
- [ ] Cobertura (`@vitest/coverage-v8`) e CI
- [ ] Gerar treino a partir do perfil
