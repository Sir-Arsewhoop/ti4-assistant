import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/svelte'
import SetupWizard from './SetupWizard.svelte'
import type { Faction } from '../../content/schema'

const factions: Faction[] = [
  { id: 'jol-nar', name: 'Universities of Jol-Nar', combatModifier: -1, abilitySummaries: ['x'], starting: { tokens: { tactic: 3, fleet: 3, strategy: 2 }, techIds: [], planets: [], commodities: 4, tradeGoods: 0 } },
  { id: 'sol', name: 'Federation of Sol', combatModifier: 0, abilitySummaries: ['x'], starting: { tokens: { tactic: 3, fleet: 3, strategy: 2 }, techIds: [], planets: [], commodities: 4, tradeGoods: 0 } },
]

describe('SetupWizard', () => {
  it('completes with the selected faction and defaults', async () => {
    const onComplete = vi.fn()
    render(SetupWizard, { props: { factions, onComplete } })
    await fireEvent.click(screen.getByRole('button', { name: /Start game/ }))
    expect(onComplete).toHaveBeenCalledTimes(1)
    const cfg = onComplete.mock.calls[0][0]
    expect(cfg.factionId).toBe('jol-nar')
    expect(cfg.playerCount).toBeGreaterThanOrEqual(3)
    expect(typeof cfg.speaker).toBe('boolean')
  })
})
