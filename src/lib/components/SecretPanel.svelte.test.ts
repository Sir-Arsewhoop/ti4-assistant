import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/svelte'
import SecretPanel from './SecretPanel.svelte'
import type { SecretObjective } from '../../content/schema'

const S = (o: Partial<SecretObjective> & { id: string; name: string }): SecretObjective =>
  ({ points: 1, phase: 'status', expansion: 'base', summary: 's', ...o })

const secrets: SecretObjective[] = [
  S({ id: 'a', name: 'Seize an Icon', phase: 'status' }),
  S({ id: 'b', name: 'Brave the Void', phase: 'action' }),
  S({ id: 'c', name: 'Dictate Policy', phase: 'agenda' }),
]
const held = [
  { objective: secrets[0], scorableNow: true },
  { objective: secrets[1], scorableNow: false },
]

function props(overrides: Record<string, unknown> = {}) {
  return { secrets, held, scoredIds: [] as string[], onDraw: vi.fn(), onScore: vi.fn(), onDiscard: vi.fn(), ...overrides }
}

describe('SecretPanel', () => {
  it('lists the held hand with phase tags', () => {
    render(SecretPanel, { props: props() })
    expect(screen.getByRole('button', { name: /score Seize an Icon/i })).toBeTruthy()
    expect(screen.getByRole('button', { name: /score Brave the Void/i })).toBeTruthy()
    expect(screen.getByText(/action/i)).toBeTruthy()
  })

  it('scores a held secret', async () => {
    const p = props()
    render(SecretPanel, { props: p })
    await fireEvent.click(screen.getByRole('button', { name: /score Seize an Icon/i }))
    expect(p.onScore).toHaveBeenCalledWith('a', 'Seize an Icon')
  })

  it('keeps an out-of-phase secret clickable (assistant, not referee)', async () => {
    const p = props()
    render(SecretPanel, { props: p })
    await fireEvent.click(screen.getByRole('button', { name: /score Brave the Void/i }))
    expect(p.onScore).toHaveBeenCalledWith('b', 'Brave the Void')
  })

  it('discards a held secret', async () => {
    const p = props()
    render(SecretPanel, { props: p })
    await fireEvent.click(screen.getByRole('button', { name: /discard Seize an Icon/i }))
    expect(p.onDiscard).toHaveBeenCalledWith('a')
  })

  // Narrower `held` here (only 'a') so that 'b' is genuinely drawable: the picker
  // must exclude held and scored ids, and the default fixture holds both a and b.
  it('draws an unheld secret through the picker, excluding held and scored ones', async () => {
    const p = props({ held: [{ objective: secrets[0], scorableNow: true }], scoredIds: ['c'] })
    render(SecretPanel, { props: p })
    expect(screen.queryByRole('button', { name: /draw Seize an Icon/i })).toBeNull() // held
    expect(screen.queryByRole('button', { name: /draw Dictate Policy/i })).toBeNull() // scored
    await fireEvent.click(screen.getByRole('button', { name: /draw Brave the Void/i }))
    expect(p.onDraw).toHaveBeenCalledWith('b', 'Brave the Void')
  })
})
