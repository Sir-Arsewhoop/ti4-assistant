export type Phase = 'setup' | 'strategy' | 'action' | 'status' | 'agenda'

export type CommandPools = { tactic: number; fleet: number; strategy: number }

export type Planet = {
  id: string
  name: string
  resources: number
  influence: number
  exhausted: boolean
  trait?: 'cultural' | 'industrial' | 'hazardous'
  techSpecialty?: 'red' | 'blue' | 'yellow' | 'green'
}

export type SecretObjective = { id: string; scored: boolean }

export type LeaderState = {
  agentUnlocked: boolean
  commanderUnlocked: boolean
  heroUnlocked: boolean
}

export type LogEntry = { seq: number; summary: string }

export type GameState = {
  round: number
  phase: Phase
  factionId: string
  turnOrder: number
  speaker: boolean
  command: CommandPools
  strategyCardIds: number[]
  strategyPrimaryUsed: boolean
  planets: Planet[]
  technologyIds: string[]
  tradeGoods: number
  commodities: number
  scoredPublicObjectiveIds: string[]
  secretObjectives: SecretObjective[]
  victoryPoints: number
  leaders: LeaderState
  actionCardCount: number
  passed: boolean
  custodiansTaken: boolean
  log: LogEntry[]
}

export type FactionStartingInfo = {
  id: string
  name: string
  combatModifier: number
  starting: {
    tokens: CommandPools
    techIds: string[]
    planets: Planet[]
    commodities: number
    tradeGoods: number
  }
}

export type GameAction =
  | { type: 'strategicAction' }
  | { type: 'tacticalAction' }
  | { type: 'componentAction'; sourceId: string; summary: string }
  | { type: 'pass' }
  | { type: 'advancePhase' }
  | { type: 'gainTradeGoods'; amount: number }
  | { type: 'exhaustPlanet'; planetId: string }
  | { type: 'scorePublicObjective'; objectiveId: string; points: number }
  | { type: 'gainPlanet'; planet: Planet }
  | { type: 'removePlanet'; planetId: string }
  | { type: 'researchTechnology'; techId: string; name: string }
  | { type: 'editState'; patch: Partial<GameState> }

export type AvailableAction = {
  type: 'strategicAction' | 'tacticalAction' | 'componentAction' | 'research' | 'pass'
  label: string
  explanation: string
  sourceId?: string
}

export type Reminder = { id: string; severity: 'info' | 'warn'; text: string }
