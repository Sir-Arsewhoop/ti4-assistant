import type { GameAction, GameState, LogEntry, Phase } from '../domain/types'

const NEXT_PHASE: Record<Phase, Phase> = {
  setup: 'strategy',
  strategy: 'action',
  action: 'status',
  status: 'strategy',
  agenda: 'strategy',
}

function log(state: GameState, summary: string): LogEntry[] {
  return [...state.log, { seq: state.log.length + 1, summary }]
}

export function applyAction(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case 'strategicAction':
      return { ...state, strategyPrimaryUsed: true, log: log(state, 'Took strategic action') }

    case 'tacticalAction':
      return {
        ...state,
        command: { ...state.command, tactic: Math.max(0, state.command.tactic - 1) },
        log: log(state, 'Took tactical action (spent 1 tactic token)'),
      }

    case 'componentAction':
      return { ...state, log: log(state, `Component action: ${action.summary}`) }

    case 'pass':
      return { ...state, passed: true, log: log(state, 'Passed for the rest of the action phase') }

    case 'gainTradeGoods':
      return { ...state, tradeGoods: state.tradeGoods + action.amount, log: log(state, `Gained ${action.amount} trade good(s)`) }

    case 'exhaustPlanet':
      return {
        ...state,
        planets: state.planets.map((p) => (p.id === action.planetId ? { ...p, exhausted: true } : p)),
        log: log(state, `Exhausted planet ${action.planetId}`),
      }

    case 'scorePublicObjective': {
      if (state.scoredPublicObjectiveIds.includes(action.objectiveId)) return state
      return {
        ...state,
        scoredPublicObjectiveIds: [...state.scoredPublicObjectiveIds, action.objectiveId],
        victoryPoints: state.victoryPoints + action.points,
        scoredPublicThisRound: true,
        log: log(state, `Scored objective ${action.objectiveId} (+${action.points} VP)`),
      }
    }

    case 'revealPublicObjective': {
      if (state.revealedPublicObjectiveIds.includes(action.objectiveId)) return state
      return {
        ...state,
        revealedPublicObjectiveIds: [...state.revealedPublicObjectiveIds, action.objectiveId],
        log: log(state, `Revealed ${action.name}`),
      }
    }

    case 'drawSecretObjective': {
      if (state.secretObjectives.some((s) => s.id === action.objectiveId)) return state
      return {
        ...state,
        secretObjectives: [...state.secretObjectives, { id: action.objectiveId, scored: false }],
        log: log(state, `Drew ${action.name}`),
      }
    }

    case 'scoreSecretObjective': {
      // Only a held, unscored secret can be scored: an unknown id would otherwise
      // mint victory points, and a re-score would double them.
      const held = state.secretObjectives.find((s) => s.id === action.objectiveId)
      if (!held || held.scored) return state
      return {
        ...state,
        secretObjectives: state.secretObjectives.map((s) => (s.id === action.objectiveId ? { ...s, scored: true } : s)),
        victoryPoints: state.victoryPoints + 1,
        scoredSecretThisRound: state.phase === 'status' ? true : state.scoredSecretThisRound,
        log: log(state, `Scored ${action.name} (+1 VP)`),
      }
    }

    case 'advancePhase': {
      const next: Phase =
        state.phase === 'status'
          ? state.custodiansTaken
            ? 'agenda'
            : 'strategy'
          : NEXT_PHASE[state.phase]
      const enteringNewRound = next === 'strategy' && state.phase !== 'setup'
      return {
        ...state,
        phase: next,
        round: state.round + (enteringNewRound ? 1 : 0),
        strategyPrimaryUsed: next === 'strategy' ? false : state.strategyPrimaryUsed,
        passed: next === 'strategy' ? false : state.passed,
        scoredPublicThisRound: enteringNewRound ? false : state.scoredPublicThisRound,
        scoredSecretThisRound: enteringNewRound ? false : state.scoredSecretThisRound,
        log: log(state, `Advanced to ${next} phase`),
      }
    }

    case 'gainPlanet': {
      if (state.planets.some((p) => p.id === action.planet.id)) return state
      return { ...state, planets: [...state.planets, action.planet], log: log(state, `Gained ${action.planet.name}`) }
    }

    case 'removePlanet': {
      const target = state.planets.find((p) => p.id === action.planetId)
      if (!target) return state
      return { ...state, planets: state.planets.filter((p) => p.id !== action.planetId), log: log(state, `Removed ${target.name}`) }
    }

    case 'researchTechnology': {
      if (state.technologyIds.includes(action.techId)) return state
      return { ...state, technologyIds: [...state.technologyIds, action.techId], log: log(state, `Researched ${action.name}`) }
    }

    case 'editState':
      return { ...state, ...action.patch }

    default:
      return state
  }
}
