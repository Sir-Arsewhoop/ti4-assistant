import type { GameState, Reminder } from '../domain/types'

export function getReminders(state: GameState, opts: { researchableCount?: number } = {}): Reminder[] {
  if (state.phase !== 'action') return []
  const out: Reminder[] = []

  if (state.strategyCardIds.length > 0 && !state.strategyPrimaryUsed) {
    out.push({ id: 'strategy-primary-unused', severity: 'info', text: "You haven't used your strategy card's primary ability yet." })
  }

  if (state.command.tactic === 0) {
    out.push({ id: 'no-tactic-tokens', severity: 'warn', text: 'No tactic tokens left — you cannot take a tactical action. Consider passing.' })
  }

  const exhausted = state.planets.filter((p) => p.exhausted).length
  if (exhausted > 0) {
    out.push({ id: 'exhausted-planets', severity: 'info', text: `${exhausted} planet(s) exhausted; they ready during the Status phase.` })
  }

  out.push({ id: 'fleet-pool', severity: 'info', text: `Fleet pool: ${state.command.fleet} (your non-fighter ship limit per system).` })

  if (state.strategyCardIds.includes(7)) {
    out.push({
      id: 'tech-card',
      severity: 'info',
      text: 'You hold the Technology card: its primary researches one technology (a second costs 6 resources); after you play it, other players may pay 4 resources and a strategy token to research one.',
    })
  }

  const researchable = opts.researchableCount ?? 0
  if (researchable > 0) {
    out.push({
      id: 'researchable',
      severity: 'info',
      text: `${researchable} technolog${researchable === 1 ? 'y is' : 'ies are'} researchable now — use "Research technology".`,
    })
  }

  return out
}
