import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { ProjectCard } from './ProjectCard'

describe('ProjectCard', () => {
  it('renders the title, stamp, description, and tags', () => {
    render(
      <ProjectCard
        title="SAGE"
        stamp="Aug – Dec 2025 · TwelveLabs"
        desc="A full-stack tool for comparing video assets."
        tags={['Embeddings', 'Similarity search']}
      />
    )
    expect(screen.getByText('SAGE')).toBeInTheDocument()
    expect(screen.getByText('Aug – Dec 2025 · TwelveLabs')).toBeInTheDocument()
    expect(screen.getByText(/full-stack tool/)).toBeInTheDocument()
    expect(screen.getByText('Embeddings')).toBeInTheDocument()
  })

  it('renders an external link when one is provided', () => {
    render(
      <ProjectCard
        title="SAGE"
        stamp="Aug – Dec 2025"
        desc="desc"
        tags={[]}
        link={{ href: 'https://www.twelvelabs.io/blog/sage', label: 'I wrote the writeup' }}
      />
    )
    const anchor = screen.getByRole('link', { name: /I wrote the writeup/ })
    expect(anchor).toHaveAttribute('href', 'https://www.twelvelabs.io/blog/sage')
  })
})
