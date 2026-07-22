import { z } from 'zod'
import { factionSchema, objectiveSchema, strategyCardSchema, technologySchema, type Faction } from './schema'
import { strategyCards } from './strategyCards'
import { technologies } from './technologies'
import { factions } from './factions'
import { objectives } from './objectives'

export const content = {
  strategyCards: z.array(strategyCardSchema).parse(strategyCards),
  technologies: z.array(technologySchema).parse(technologies),
  factions: z.array(factionSchema).parse(factions),
  objectives: z.array(objectiveSchema).parse(objectives),
}

export function getFaction(id: string): Faction | undefined {
  return content.factions.find((f) => f.id === id)
}

export type { Faction, Technology, StrategyCard, Objective } from './schema'
