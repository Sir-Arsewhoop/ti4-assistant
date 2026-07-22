// src/App.test.ts
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/svelte'
import App from './App.svelte'

describe('App vertical slice', () => {
  it('renders the faction and the strategic-action option', async () => {
    render(App)
    expect(screen.getByText('Universities of Jol-Nar')).toBeTruthy()
    // Jol-Nar holds strategy card 7 and has not used the primary, so strategic action is offered.
    expect(screen.getByRole('button', { name: 'Strategic action' })).toBeTruthy()
  })
})
