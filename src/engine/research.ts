import type { GameState } from '../domain/types'
import type { Technology } from '../content/schema'

type Color = 'blue' | 'green' | 'yellow' | 'red'
const COLORS: Color[] = ['blue', 'green', 'yellow', 'red']

export function getResearchableTechs(
  state: GameState,
  technologies: Technology[],
): { techId: string; researchable: boolean }[] {
  const owned = new Set(state.technologyIds)

  const supply: Record<Color, number> = { blue: 0, green: 0, yellow: 0, red: 0 }
  for (const t of technologies) {
    if (owned.has(t.id) && t.color !== 'none') supply[t.color]++
  }
  for (const p of state.planets) {
    if (p.techSpecialty && !p.exhausted) supply[p.techSpecialty]++
  }

  // A faction may only research its own faction techs, and its faction sheet
  // replaces some generic unit upgrades outright — those are not researchable at all.
  const mine = technologies.filter((t) => !t.factionId || t.factionId === state.factionId)
  const superseded = new Set(
    mine.filter((t) => t.factionId && t.replaces).map((t) => t.replaces as string),
  )

  return mine
    .filter((t) => !owned.has(t.id) && !superseded.has(t.id))
    .map((t) => {
      const need: Record<Color, number> = { blue: 0, green: 0, yellow: 0, red: 0 }
      for (const c of t.prerequisites) need[c]++
      const researchable = COLORS.every((c) => supply[c] >= need[c])
      return { techId: t.id, researchable }
    })
}
