import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import Footer from './Footer'

describe('Footer', () => {
  it('renders the section column titles', () => {
    render(<Footer />)
    expect(screen.getByText('Cursos')).toBeInTheDocument()
    expect(screen.getByText('Empresa')).toBeInTheDocument()
    expect(screen.getByText('Legal')).toBeInTheDocument()
  })

  it('links to the legal pages', () => {
    render(<Footer />)
    const privacy = screen.getAllByRole('link', { name: 'Política de Privacidad' })
    const terms = screen.getAllByRole('link', { name: 'Términos y Condiciones' })
    expect(privacy.some((a) => a.getAttribute('href') === '/privacidad')).toBe(true)
    expect(terms.some((a) => a.getAttribute('href') === '/terminos')).toBe(true)
  })
})
