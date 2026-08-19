import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Contact } from './Contact'

describe('Contact', () => {
  it('renders the pitch copy and all contact links', () => {
    render(<Contact />)
    expect(screen.getByText(/Say something/)).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'aahils2019@gmail.com' })).toHaveAttribute('href', 'mailto:aahils2019@gmail.com')
    expect(screen.getByRole('link', { name: 'GitHub' })).toHaveAttribute('href', 'https://github.com/The007Programmer')
    expect(screen.getByRole('link', { name: 'Résumé (PDF)' })).toHaveAttribute('href', '/assets/aahil-shaikh-resume.pdf')
  })

  it('renders a form posting to formsubmit.co', () => {
    const { container } = render(<Contact />)
    // A <form> with no accessible name isn't exposed under role "form" by
    // Testing Library's role queries, so query the DOM directly rather
    // than through getByRole.
    const form = container.querySelector('form')
    expect(form).not.toBeNull()
    expect(form).toHaveAttribute('action', 'https://formsubmit.co/aahils2019@gmail.com')
    expect(form).toHaveAttribute('method', 'POST')
  })
})
