import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Hero } from './Hero'

describe('Hero', () => {
  it('renders the name and the thesis line', () => {
    render(<Hero />)
    expect(screen.getByText('Aahil')).toBeInTheDocument()
    expect(screen.getByText('Shaikh')).toBeInTheDocument()
    expect(screen.getByText(/parts of agents nobody’s solved yet/)).toBeInTheDocument()
  })

  it('renders the meta line', () => {
    render(<Hero />)
    expect(screen.getByText(/Sophomore at Texas A&M/)).toBeInTheDocument()
  })
})
