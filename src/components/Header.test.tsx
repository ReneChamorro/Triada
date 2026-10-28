import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import Header from './Header'

describe('Header', () => {
  it('renders the primary navigation links', () => {
    render(<Header currentPage="home" />)
    expect(screen.getByRole('link', { name: 'Inicio' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Cursos' })).toBeInTheDocument()
  })

  it('shows guest auth CTAs once the logged-out session resolves', async () => {
    render(<Header currentPage="home" />)
    // Auth state loads in an effect; the mocked client returns no user.
    expect(await screen.findByRole('link', { name: 'Registrarse' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Iniciar Sesion' })).toBeInTheDocument()
  })
})
