import type { AvailableAction, GameState } from '../domain/types'

export function getAvailableActions(
  state: GameState,
  opts: { componentActionSources?: { id: string; summary: string }[] } = {},
): AvailableAction[] {
  if (state.phase !== 'action' || state.passed) return []
  const actions: AvailableAction[] = []

  if (state.strategyCardIds.length > 0 && !state.strategyPrimaryUsed) {
    actions.push({
      type: 'strategicAction',
      label: 'Strategic action',
      explanation:
        'Resolve the primary ability of your strategy card. You may do this once per round. After it, other players may pay to use the secondary.',
    })
  }

  if (state.command.tactic >= 1) {
    actions.push({
      type: 'tacticalAction',
      label: 'Tactical action',
      explanation:
        'Spend one command token from your tactic pool to activate a system: move ships, resolve combat, then produce or improve. Your main way to expand.',
    })
  }

  for (const src of opts.componentActionSources ?? []) {
    actions.push({
      type: 'componentAction',
      label: 'Component action',
      explanation: src.summary,
      sourceId: src.id,
    })
  }

  if (state.strategyPrimaryUsed) {
    actions.push({
      type: 'pass',
      label: 'Pass',
      explanation:
        'Stop taking turns for the rest of this action phase. Allowed only after you have taken your strategic action. You can still resolve others\' secondaries.',
    })
  }

  return actions
}
