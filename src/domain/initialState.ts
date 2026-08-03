import type { FactionStartingInfo, GameState } from './types'

export function createInitialState(
  faction: FactionStartingInfo,
  opts: { turnOrder: number; speaker: boolean },
): GameState {
  return {
    round: 1,
    phase: 'setup',
    factionId: faction.id,
    turnOrder: opts.turnOrder,
    speaker: opts.speaker,
    command: { ...faction.starting.tokens },
    strategyCardIds: [],
    strategyPrimaryUsed: false,
    planets: faction.starting.planets.map((p) => ({ ...p })),
    technologyIds: [...faction.starting.techIds],
    tradeGoods: faction.starting.tradeGoods,
    commodities: faction.starting.commodities,
    scoredPublicObjectiveIds: [],
    revealedPublicObjectiveIds: [],
    scoredPublicThisRound: false,
    scoredSecretThisRound: false,
    secretObjectives: [],
    victoryPoints: 0,
    leaders: { agentUnlocked: false, commanderUnlocked: false, heroUnlocked: false },
    actionCardCount: 0,
    passed: false,
    custodiansTaken: false,
    log: [],
  }
}
