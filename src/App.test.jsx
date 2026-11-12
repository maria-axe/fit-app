import { MemoryRouter } from 'react-router'
import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import App from './App'

const USUARIO = {
  nome: 'Ana',
  peso: '70',
  altura: '170',
  frequencia: 3,
  diasTreino: [1, 3, 5],
}

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

describe('rotas', () => {
  it('renderiza o onboarding quando não há usuário', () => {
    renderizarApp('/onboarding')

    expect(
      screen.getByRole('heading', { name: /vamos te conhecer/i })
    ).toBeInTheDocument()
    expect(screen.getByLabelText('Nome')).toBeInTheDocument()
  })

  it('redireciona /onboarding para a home quando já há usuário', async () => {
    autenticar()
    renderizarApp('/onboarding')

    expect(
      await screen.findByRole('heading', { name: /olá, ana/i })
    ).toBeInTheDocument()
  })

  it('redireciona / para o onboarding sem usuário', async () => {
    renderizarApp('/')

    expect(
      await screen.findByRole('heading', { name: /vamos te conhecer/i })
    ).toBeInTheDocument()
  })

  it('redireciona /plano para o onboarding sem usuário', async () => {
    renderizarApp('/plano')

    expect(
      await screen.findByRole('heading', { name: /vamos te conhecer/i })
    ).toBeInTheDocument()
  })

  it('redireciona /treino para o onboarding sem usuário', async () => {
    renderizarApp('/treino')

    expect(
      await screen.findByRole('heading', { name: /vamos te conhecer/i })
    ).toBeInTheDocument()
  })

  it('redireciona rota desconhecida para a home com usuário', async () => {
    autenticar()
    renderizarApp('/rota-que-nao-existe')

    expect(
      await screen.findByRole('heading', { name: /olá, ana/i })
    ).toBeInTheDocument()
  })

  it('redireciona rota desconhecida para o onboarding sem usuário', async () => {
    renderizarApp('/rota-que-nao-existe')

    expect(
      await screen.findByRole('heading', { name: /vamos te conhecer/i })
    ).toBeInTheDocument()
  })
})
