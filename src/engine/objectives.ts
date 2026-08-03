import type { GameState } from '../domain/types'
import type { Objective, SecretObjective } from '../content/schema'

export function getScorablePublicObjectives(state: GameState, objectives: Objective[]): Objective[] {
  const revealed = new Set(state.revealedPublicObjectiveIds)
  const scored = new Set(state.scoredPublicObjectiveIds)
  return objectives.filter((o) => revealed.has(o.id) && !scored.has(o.id))
}

export function getHeldSecretObjectives(
  state: GameState,
  secrets: SecretObjective[],
): { objective: SecretObjective; scorableNow: boolean }[] {
  const heldUnscored = new Set(state.secretObjectives.filter((s) => !s.scored).map((s) => s.id))
  return secrets
    .filter((o) => heldUnscored.has(o.id))
    .map((objective) => ({ objective, scorableNow: objective.phase === state.phase }))
}
