import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import CoursesPage from './page'

describe('CoursesPage', () => {
  it('renders the hero and category filters', () => {
    render(<CoursesPage />)
    expect(screen.getByText('Catálogo de')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Psicología' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Investigación' })).toBeInTheDocument()
  })

  it('shows the empty state once the (empty) course list has loaded', async () => {
    render(<CoursesPage />)
    expect(await screen.findByText('No se encontraron cursos')).toBeInTheDocument()
  })
})
