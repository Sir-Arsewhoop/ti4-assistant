import type { GameState, Reminder } from '../domain/types'

type Opts = {
  researchableCount?: number
  scorablePublicCount?: number
  stageTwoScorable?: boolean
  scorableSecretCount?: number
  heldSecretCount?: number
}

// Shared by every phase that has a secret window: the count of secrets you could
// score right now, and the hand-limit nudge.
function secretReminders(opts: Opts): Reminder[] {
  const out: Reminder[] = []

  const scorable = opts.scorableSecretCount ?? 0
  if (scorable > 0) {
    out.push({
      id: 'scorable-secrets',
      severity: 'info',
      text: `${scorable} held secret${scorable === 1 ? '' : 's'} can be scored in this phase.`,
    })
  }

  if ((opts.heldSecretCount ?? 0) >= 3) {
    out.push({ id: 'secret-hand-full', severity: 'info', text: 'You are holding 3 unscored secrets — the usual limit. Score one before drawing more.' })
  }

  return out
}

function actionReminders(state: GameState, opts: Opts): Reminder[] {
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

  if (state.strategyCardIds.includes(8)) {
    out.push({
      id: 'imperial-card',
      severity: 'info',
      text: 'You hold the Imperial card: its primary scores a public objective you qualify for and gives a victory point for holding Mecatol Rex, and it draws you a secret; others may spend a token to draw one too.',
    })
  }

  out.push(...secretReminders(opts))
  out.push({ id: 'action-secret-window', severity: 'info', text: 'Action-phase secrets are scored in their own moment — at most one objective during or after each combat.' })

  return out
}

function statusReminders(state: GameState, opts: Opts): Reminder[] {
  const out: Reminder[] = []

  const scorable = opts.scorablePublicCount ?? 0
  if (scorable > 0) {
    out.push({
      id: 'scorable-publics',
      severity: 'info',
      text: `${scorable} revealed public objective${scorable === 1 ? '' : 's'} you haven't scored yet.`,
    })
  }

  if (state.scoredPublicThisRound) {
    out.push({ id: 'public-window-used', severity: 'info', text: 'You already scored a public objective this round.' })
  }

  if (opts.stageTwoScorable) {
    out.push({ id: 'stage-two-available', severity: 'info', text: 'A Stage II objective is available — those are worth 2 victory points.' })
  }

  out.push(...secretReminders(opts))

  if (state.scoredSecretThisRound) {
    out.push({ id: 'secret-window-used', severity: 'info', text: 'You already scored a secret objective this round.' })
  }

  out.push({ id: 'vp-progress', severity: 'info', text: `${state.victoryPoints} of 10 victory points.` })

  return out
}

function agendaReminders(state: GameState, opts: Opts): Reminder[] {
  const out: Reminder[] = [...secretReminders(opts)]

  out.push({ id: 'agenda-secret-window', severity: 'info', text: 'Agenda-phase secrets are scored as each agenda resolves — at most one objective per timing window.' })
  out.push({ id: 'vp-progress', severity: 'info', text: `${state.victoryPoints} of 10 victory points.` })

  return out
}

export function getReminders(state: GameState, opts: Opts = {}): Reminder[] {
  if (state.phase === 'action') return actionReminders(state, opts)
  if (state.phase === 'status') return statusReminders(state, opts)
  if (state.phase === 'agenda') return agendaReminders(state, opts)
  return []
}
