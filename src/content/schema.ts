import { z } from 'zod'

export const commandPoolsSchema = z.object({
  tactic: z.number().int().min(0),
  fleet: z.number().int().min(0),
  strategy: z.number().int().min(0),
})

export const planetSchema = z.object({
  id: z.string(),
  name: z.string(),
  resources: z.number().int().min(0),
  influence: z.number().int().min(0),
  exhausted: z.boolean(),
  trait: z.enum(['cultural', 'industrial', 'hazardous']).optional(),
  techSpecialty: z.enum(['red', 'blue', 'yellow', 'green']).optional(),
})

export const strategyCardSchema = z.object({
  initiative: z.number().int().min(1).max(8),
  name: z.string(),
  primary: z.string(),   // mechanical summary, our words
  secondary: z.string(),
})
export type StrategyCard = z.infer<typeof strategyCardSchema>

export const technologySchema = z.object({
  id: z.string(),
  name: z.string(),
  color: z.enum(['blue', 'green', 'yellow', 'red', 'none']),
  type: z.enum(['ability', 'unit-upgrade']),
  expansion: z.enum(['base', 'pok']),
  prerequisites: z.array(z.enum(['blue', 'green', 'yellow', 'red'])),
  summary: z.string(),
  hasAction: z.boolean().default(false),
})
export type Technology = z.infer<typeof technologySchema>

export const factionSchema = z.object({
  id: z.string(),
  name: z.string(),
  expansion: z.enum(['base', 'pok']),
  combatModifier: z.number().int(),
  abilitySummaries: z.array(z.string()).min(1),
  starting: z.object({
    tokens: commandPoolsSchema,
    techIds: z.array(z.string()),
    planets: z.array(planetSchema),
    startingUnits: z.array(z.string()).min(1),
    commodities: z.number().int().min(0),
    tradeGoods: z.number().int().min(0),
  }),
})
export type Faction = z.infer<typeof factionSchema>

export const objectiveSchema = z
  .object({
    id: z.string(),
    name: z.string(),
    points: z.number().int().min(1).max(2),
    stage: z.enum(['I', 'II']),
    expansion: z.enum(['base', 'pok']),
    phase: z.enum(['status', 'action', 'agenda']),
    summary: z.string(),
  })
  .refine((o) => o.points === (o.stage === 'I' ? 1 : 2), {
    message: 'Stage I objectives are worth 1 point and Stage II objectives 2',
    path: ['points'],
  })
export type Objective = z.infer<typeof objectiveSchema>

export const secretObjectiveSchema = z.object({
  id: z.string(),
  name: z.string(),
  points: z.literal(1),
  phase: z.enum(['status', 'action', 'agenda']),
  expansion: z.enum(['base', 'pok']),
  summary: z.string(),
})
export type SecretObjective = z.infer<typeof secretObjectiveSchema>

export const planetCatalogSchema = z.object({
  id: z.string(),
  name: z.string(),
  resources: z.number().int().min(0),
  influence: z.number().int().min(0),
  trait: z.enum(['cultural', 'industrial', 'hazardous']).optional(),
  techSpecialty: z.enum(['red', 'blue', 'yellow', 'green']).optional(),
  legendary: z.boolean(),
  legendaryAbility: z.string().optional(),
  expansion: z.enum(['base', 'pok']),
})
export type PlanetCatalogEntry = z.infer<typeof planetCatalogSchema>
