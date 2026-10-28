import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import CourseCard from './CourseCard'

const baseProps = {
  id: 'course-1',
  title: 'Evaluación Clínica Basada en Evidencia',
  description: 'Un programa riguroso de evaluación.',
  short_description: 'Evaluación aplicada.',
  price: 49,
  currency: 'USD',
  category: 'psychology',
  duration_minutes: 120,
}

describe('CourseCard', () => {
  it('renders the title, category and formatted price', () => {
    render(<CourseCard {...baseProps} />)
    expect(screen.getByText(baseProps.title)).toBeInTheDocument()
    expect(screen.getByText('psychology')).toBeInTheDocument()
    expect(screen.getByText('$49.00')).toBeInTheDocument()
  })

  it('opens the detail modal with guest CTAs when the card is clicked', async () => {
    const user = userEvent.setup()
    render(<CourseCard {...baseProps} />)

    await user.click(screen.getByText(baseProps.title))

    // Modal-only content confirms the expansion.
    expect(await screen.findByText('Acceso de por vida')).toBeInTheDocument()
    // Logged-out client → registration CTA.
    expect(
      await screen.findByRole('link', { name: 'Registrarse para Comprar' })
    ).toBeInTheDocument()
  })
})
