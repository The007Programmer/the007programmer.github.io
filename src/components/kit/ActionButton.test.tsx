import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { ActionButton } from './ActionButton'

describe('ActionButton', () => {
  it('renders its label and fires onClick', () => {
    const onClick = vi.fn()
    render(<ActionButton onClick={onClick}>Send message</ActionButton>)
    fireEvent.click(screen.getByRole('button', { name: 'Send message' }))
    expect(onClick).toHaveBeenCalledOnce()
  })

  it('renders as type="submit" when specified', () => {
    render(<ActionButton type="submit">Send message</ActionButton>)
    expect(screen.getByRole('button', { name: 'Send message' })).toHaveAttribute('type', 'submit')
  })
})
