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
  prerequisites: z.array(z.enum(['blue', 'green', 'yellow', 'red'])),
  summary: z.string(),
  hasAction: z.boolean().default(false),
})
export type Technology = z.infer<typeof technologySchema>

export const factionSchema = z.object({
  id: z.string(),
  name: z.string(),
  combatModifier: z.number().int(),
  abilitySummaries: z.array(z.string()).min(1),
  starting: z.object({
    tokens: commandPoolsSchema,
    techIds: z.array(z.string()),
    planets: z.array(planetSchema),
    commodities: z.number().int().min(0),
    tradeGoods: z.number().int().min(0),
  }),
})
export type Faction = z.infer<typeof factionSchema>

export const objectiveSchema = z.object({
  id: z.string(),
  name: z.string(),
  points: z.number().int().min(1).max(2),
  phase: z.enum(['status', 'action', 'agenda']),
  summary: z.string(),
})
export type Objective = z.infer<typeof objectiveSchema>
