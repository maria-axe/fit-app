import { useCallback } from 'react'
import { Navigate, Outlet, Route, Routes, useNavigate } from 'react-router'
import { useLocalStorage } from './hooks/useLocalStorage'
import { getHojeISO } from './lib/datas'
import { ESTADO_INICIAL } from './features/workout/treinoReducer'
import Onboarding from './features/onboarding/Onboarding'
import Home from './features/home/Home'
import MeuPlano from './features/plan/MeuPlano'
import Workout from './features/workout/Workout'

// Layout das rotas que exigem usuário. Sem usuário, manda para o onboarding.
function LayoutProtegido({ usuario }) {
  if (!usuario) return <Navigate to="/onboarding" replace />
  return <Outlet />
}

function App() {
  const [usuario, setUsuario] = useLocalStorage('fitapp_user', null)
  const [treinosFeitos, setTreinosFeitos] = useLocalStorage('fitapp_treinos_feitos', [])
  const [treinoEmAndamento, setTreinoEmAndamento] = useLocalStorage(
    'fitapp_treino_em_andamento',
    null
  )
  const navigate = useNavigate()

  // Progresso de outro dia é descartado (não faz sentido retomar ontem).
  const progressoValido =
    treinoEmAndamento?.dia === getHojeISO() ? treinoEmAndamento.estado : null

  const registrarTreino = useCallback(() => {
    const hoje = getHojeISO()
    setTreinosFeitos((anteriores) => {
      const lista = Array.isArray(anteriores) ? anteriores : []
      return lista.includes(hoje) ? lista : [...lista, hoje]
    })
  }, [setTreinosFeitos])

  const atualizarProgresso = useCallback(
    (estado) => {
      setTreinoEmAndamento({ dia: getHojeISO(), estado })
    },
    [setTreinoEmAndamento]
  )

  const concluirTreino = useCallback(() => {
    registrarTreino()
    setTreinoEmAndamento(null)
  }, [registrarTreino, setTreinoEmAndamento])

  const recomecarTreino = useCallback(() => {
    setTreinoEmAndamento(null)
    navigate('/treino')
  }, [setTreinoEmAndamento, navigate])

  return (
    <Routes>
      <Route
        path="/onboarding"
        element={usuario ? <Navigate to="/" replace /> : <Onboarding aoConcluir={setUsuario} />}
      />

      <Route element={<LayoutProtegido usuario={usuario} />}>
        <Route
          path="/"
          element={
            <Home
              usuario={usuario}
              treinosFeitos={treinosFeitos}
              temProgresso={Boolean(progressoValido)}
              aoIniciarTreino={() => navigate('/treino')}
              aoRecomecarTreino={recomecarTreino}
              aoAbrirPlano={() => navigate('/plano')}
            />
          }
        />
        <Route
          path="/plano"
          element={
            <MeuPlano
              usuario={usuario}
              treinosFeitos={treinosFeitos}
              aoSalvar={setUsuario}
              aoVoltar={() => navigate('/')}
            />
          }
        />
        <Route
          path="/treino"
          element={
            <Workout
              estadoInicial={progressoValido ?? ESTADO_INICIAL}
              aoAtualizarProgresso={atualizarProgresso}
              aoConcluirTreino={concluirTreino}
              aoVoltar={() => navigate('/')}
            />
          }
        />
      </Route>

      <Route path="*" element={<Navigate to={usuario ? '/' : '/onboarding'} replace />} />
    </Routes>
  )
}

export default App
