import { z } from 'zod'
import { factionSchema, objectiveSchema, strategyCardSchema, technologySchema, planetCatalogSchema, type Faction } from './schema'
import { strategyCards } from './strategyCards'
import { technologies } from './technologies'
import { factions } from './factions'
import { publicObjectives } from './publicObjectives'
import { planets } from './planets'

export const content = {
  strategyCards: z.array(strategyCardSchema).parse(strategyCards),
  technologies: z.array(technologySchema).parse(technologies),
  factions: z.array(factionSchema).parse(factions),
  publicObjectives: z.array(objectiveSchema).parse(publicObjectives),
  planets: z.array(planetCatalogSchema).parse(planets),
}

export function getFaction(id: string): Faction | undefined {
  return content.factions.find((f) => f.id === id)
}

export type { Faction, Technology, StrategyCard, Objective, PlanetCatalogEntry } from './schema'
