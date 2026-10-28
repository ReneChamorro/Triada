import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import HomePage from './page'

describe('HomePage', () => {
  it('renders the hero with fallback copy when no landing data is loaded', async () => {
    render(<HomePage />)
    expect(
      await screen.findByText(/Docencia basada en evidencia e investigación aplicada/i)
    ).toBeInTheDocument()
    expect(screen.getByText('Educación Científica Aplicada')).toBeInTheDocument()
  })

  it('omits the removed sections (no stat band / 3-step path)', async () => {
    render(<HomePage />)
    // Page rendered (unique hero subtitle).
    expect(
      await screen.findByText(/Docencia basada en evidencia e investigación aplicada/i)
    ).toBeInTheDocument()
    // The social-proof stat band and "Cómo funciona / Tu ruta" path were
    // removed per the design direction (no new sections). Guard against regression.
    expect(screen.queryByText('500+')).not.toBeInTheDocument()
    expect(screen.queryByText('Índice de satisfacción')).not.toBeInTheDocument()
    expect(screen.queryByText('Cómo funciona')).not.toBeInTheDocument()
    expect(screen.queryByText(/Tu ruta/i)).not.toBeInTheDocument()
  })
})
