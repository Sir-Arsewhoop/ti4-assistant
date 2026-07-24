import { describe, it, expect } from 'vitest'
import { getResearchableTechs } from './research'
import { content } from '../content/index'
import { createInitialState } from '../domain/initialState'
import type { FactionStartingInfo, GameState, Planet } from '../domain/types'

const faction: FactionStartingInfo = {
  id: 'sol', name: 'Federation of Sol', combatModifier: 0,
  starting: { tokens: { tactic: 3, fleet: 3, strategy: 2 }, techIds: [], planets: [], commodities: 2, tradeGoods: 0 },
}
const techs = content.technologies
function state(overrides: Partial<GameState> = {}): GameState {
  return { ...createInitialState(faction, { turnOrder: 1, speaker: false }), ...overrides }
}
const ready = (s: GameState) => new Set(getResearchableTechs(s, techs).filter((r) => r.researchable).map((r) => r.techId))
const specialty = (color: Planet['techSpecialty'], exhausted: boolean): Planet =>
  ({ id: 'p', name: 'P', resources: 0, influence: 0, exhausted, techSpecialty: color })

describe('getResearchableTechs', () => {
  it('a no-prerequisite tech is researchable from scratch, a 1-blue tech is not', () => {
    const r = ready(state())
    expect(r.has('dark-energy-tap')).toBe(true)
    expect(r.has('gravity-drive')).toBe(false)
  })

  it('owning a blue tech supplies one blue icon and excludes the owned tech', () => {
    const r = ready(state({ technologyIds: ['antimass-deflectors'] }))
    expect(r.has('gravity-drive')).toBe(true)     // needs 1 blue
    expect(r.has('antimass-deflectors')).toBe(false) // already owned → not a candidate
  })

  it('a two-blue tech needs two owned blue techs', () => {
    expect(ready(state({ technologyIds: ['antimass-deflectors'] })).has('fleet-logistics')).toBe(false)
    expect(ready(state({ technologyIds: ['antimass-deflectors', 'gravity-drive'] })).has('fleet-logistics')).toBe(true)
  })

  it('a readied specialty planet supplies an icon; an exhausted one does not', () => {
    expect(ready(state({ planets: [specialty('blue', false)] })).has('gravity-drive')).toBe(true)
    expect(ready(state({ planets: [specialty('blue', true)] })).has('gravity-drive')).toBe(false)
  })

  it('a unit upgrade needs its mixed prerequisites', () => {
    // fighter-ii needs green + blue
    expect(ready(state({ technologyIds: ['neural-motivator', 'antimass-deflectors'] })).has('fighter-ii')).toBe(true)
    expect(ready(state({ technologyIds: ['neural-motivator'] })).has('fighter-ii')).toBe(false)
  })

  it('owning a unit upgrade supplies no icons (colorless)', () => {
    expect(ready(state({ technologyIds: ['carrier-ii'] })).has('gravity-drive')).toBe(false)
  })
})
