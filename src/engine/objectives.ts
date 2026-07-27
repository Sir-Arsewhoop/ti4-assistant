import type { GameState } from '../domain/types'
import type { Objective } from '../content/schema'

export function getScorablePublicObjectives(state: GameState, objectives: Objective[]): Objective[] {
  const revealed = new Set(state.revealedPublicObjectiveIds)
  const scored = new Set(state.scoredPublicObjectiveIds)
  return objectives.filter((o) => revealed.has(o.id) && !scored.has(o.id))
}
