import type { Technology } from './schema'

export const technologies: Technology[] = [
  { id: 'neural-motivator', name: 'Neural Motivator', color: 'green', prerequisites: [], summary: 'Draw 2 action cards in the Status phase instead of 1.', hasAction: false },
  { id: 'antimass-deflectors', name: 'Antimass Deflectors', color: 'blue', prerequisites: [], summary: 'Ships may move through asteroid fields; -1 to enemy space cannon vs you.', hasAction: false },
  { id: 'sarween-tools', name: 'Sarween Tools', color: 'yellow', prerequisites: [], summary: 'Add 1 resource whenever you resolve production at a unit.', hasAction: false },
  { id: 'plasma-scoring', name: 'Plasma Scoring', color: 'red', prerequisites: [], summary: 'Add 1 die to one bombardment or space cannon roll.', hasAction: false },
  { id: 'fleet-logistics', name: 'Fleet Logistics', color: 'blue', prerequisites: ['blue', 'blue'], summary: 'Take 2 actions during each of your action-phase turns instead of 1.', hasAction: false },
  { id: 'sling-relay', name: 'Sling Relay', color: 'blue', prerequisites: ['blue'], summary: 'ACTION: Produce 1 ship at a space dock you control.', hasAction: true },
  { id: 'magen-defense-grid', name: 'Magen Defense Grid', color: 'red', prerequisites: ['red'], summary: 'At the start of ground combat on a planet with your structure, deal 1 hit to enemy ground forces; when a system with your structure is activated, add 1 free infantry there.', hasAction: false }, // verify prereq
  { id: 'gravity-drive', name: 'Gravity Drive', color: 'blue', prerequisites: ['blue'], summary: 'After you activate a system, add +1 to the move value of one of your ships this action.', hasAction: false },
  { id: 'dacxive-animators', name: 'Dacxive Animators', color: 'green', prerequisites: ['green'], summary: 'After you win a ground combat, place 1 free infantry on that planet.', hasAction: false },
  { id: 'graviton-laser-system', name: 'Graviton Laser System', color: 'yellow', prerequisites: ['yellow'], summary: 'Exhaust before your units fire Space Cannon; those hits must be assigned to non-fighter ships.', hasAction: false },
  { id: 'dark-energy-tap', name: 'Dark Energy Tap', color: 'blue', prerequisites: [], summary: 'After a tactical action in a system with a frontier token and your ships, explore it; your ships may also retreat into empty adjacent systems.', hasAction: false },
  { id: 'bio-stims', name: 'Bio-Stims', color: 'green', prerequisites: ['green'], summary: 'Exhaust at end of your turn to ready one of your planets with a tech specialty, or one of your other technologies.', hasAction: false },
  { id: 'predictive-intelligence', name: 'Predictive Intelligence', color: 'yellow', prerequisites: ['yellow'], summary: 'Exhaust at end of turn to redistribute your command tokens; or cast 3 extra votes in the agenda phase.', hasAction: false },
  { id: 'psychoarchaeology', name: 'Psychoarchaeology', color: 'green', prerequisites: [], summary: 'Use planets\' tech specialties without exhausting them; during the action phase exhaust specialty planets for 1 trade good each.', hasAction: false },
  { id: 'ai-development-algorithm', name: 'AI Development Algorithm', color: 'red', prerequisites: [], summary: 'Exhaust to ignore 1 prerequisite when researching a unit upgrade, or to reduce produced-unit cost by your number of unit upgrades.', hasAction: false },
  { id: 'scanlink-drone-network', name: 'Scanlink Drone Network', color: 'yellow', prerequisites: [], summary: 'When you activate a system, explore a planet there that contains your units.', hasAction: false }, // verify prereq
  { id: 'self-assembly-routines', name: 'Self Assembly Routines', color: 'red', prerequisites: [], summary: 'After your units use Production, exhaust to place a free mech on a planet you control there; gain 1 trade good when one of your mechs is destroyed.', hasAction: false }, // verify prereq
]
