import type { Faction } from './schema'

export const factions: Faction[] = [
  {
    id: 'jol-nar',
    name: 'Universities of Jol-Nar',
    combatModifier: -1,
    abilitySummaries: [
      'Fragile: apply -1 to each of your unit\'s combat rolls.',
      'Brilliant: when resolving the Technology strategy card\'s secondary, you may resolve its primary instead.',
      'Analytical: when you research a non-unit-upgrade technology, you may ignore one prerequisite.',
    ],
    starting: {
      tokens: { tactic: 3, fleet: 3, strategy: 2 },
      techIds: ['neural-motivator', 'antimass-deflectors', 'sarween-tools', 'plasma-scoring'],
      planets: [
        { id: 'jol', name: 'Jol', resources: 1, influence: 2, exhausted: false },
        { id: 'nar', name: 'Nar', resources: 2, influence: 3, exhausted: false },
      ],
      commodities: 4,
      tradeGoods: 0,
    },
  },
  {
    id: 'sol',
    name: 'Federation of Sol',
    combatModifier: 0,
    abilitySummaries: [
      'Orbital Drop: ACTION — place up to 2 infantry on a planet you control in your home system.',
      'Versatile: when you gain command tokens from the Leadership secondary, gain 1 extra.',
    ],
    starting: {
      tokens: { tactic: 3, fleet: 3, strategy: 2 },
      techIds: ['neural-motivator', 'antimass-deflectors'],
      planets: [{ id: 'jord', name: 'Jord', resources: 4, influence: 2, exhausted: false }],
      commodities: 4,
      tradeGoods: 0,
    },
  },
  {
    id: 'sardakk-norr',
    name: "Sardakk N'orr",
    combatModifier: 1,
    abilitySummaries: ['Unrelenting: apply +1 to each of your unit\'s combat rolls.'],
    starting: {
      tokens: { tactic: 3, fleet: 3, strategy: 2 },
      techIds: [],
      planets: [
        { id: 'quinarra', name: 'Quinarra', resources: 3, influence: 1, exhausted: false },
        { id: 'tren-lak', name: "Tren'lak", resources: 1, influence: 0, exhausted: false },
      ],
      commodities: 3,
      tradeGoods: 0,
    },
  },
]
