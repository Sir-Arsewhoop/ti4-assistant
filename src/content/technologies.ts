import type { Technology } from './schema'

export const technologies: Technology[] = [
  { id: 'neural-motivator', name: 'Neural Motivator', color: 'green', prerequisites: [], summary: 'Draw 2 action cards in the Status phase instead of 1.', hasAction: false },
  { id: 'antimass-deflectors', name: 'Antimass Deflectors', color: 'blue', prerequisites: [], summary: 'Ships may move through asteroid fields; -1 to enemy space cannon vs you.', hasAction: false },
  { id: 'sarween-tools', name: 'Sarween Tools', color: 'yellow', prerequisites: [], summary: 'Add 1 resource whenever you resolve production at a unit.', hasAction: false },
  { id: 'plasma-scoring', name: 'Plasma Scoring', color: 'red', prerequisites: [], summary: 'Add 1 die to one bombardment or space cannon roll.', hasAction: false },
  { id: 'fleet-logistics', name: 'Fleet Logistics', color: 'blue', prerequisites: ['blue', 'blue'], summary: 'Take 2 actions during each of your action-phase turns instead of 1.', hasAction: false },
  { id: 'sling-relay', name: 'Sling Relay', color: 'blue', prerequisites: ['blue'], summary: 'ACTION: Produce 1 ship at a space dock you control.', hasAction: true },
]
