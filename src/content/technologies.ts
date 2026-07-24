import type { Technology } from './schema'

export const technologies: Technology[] = [
  // ── Propulsion (blue) ──
  { id: 'antimass-deflectors', name: 'Antimass Deflectors', color: 'blue', type: 'ability', expansion: 'base', prerequisites: [], summary: 'Ships may move through asteroid fields; -1 to enemy space cannon vs you.', hasAction: false },
  { id: 'dark-energy-tap', name: 'Dark Energy Tap', color: 'blue', type: 'ability', expansion: 'pok', prerequisites: [], summary: 'After a tactical action in a system with a frontier token and your ships, explore it; your ships may also retreat into empty adjacent systems.', hasAction: false },
  { id: 'gravity-drive', name: 'Gravity Drive', color: 'blue', type: 'ability', expansion: 'base', prerequisites: ['blue'], summary: 'After you activate a system, add +1 to the move value of one of your ships this action.', hasAction: false },
  { id: 'sling-relay', name: 'Sling Relay', color: 'blue', type: 'ability', expansion: 'pok', prerequisites: ['blue'], summary: 'ACTION: Produce 1 ship at a space dock you control.', hasAction: true },
  { id: 'fleet-logistics', name: 'Fleet Logistics', color: 'blue', type: 'ability', expansion: 'base', prerequisites: ['blue', 'blue'], summary: 'Take 2 actions during each of your action-phase turns instead of 1.', hasAction: false },
  { id: 'light-wave-deflector', name: 'Light/Wave Deflector', color: 'blue', type: 'ability', expansion: 'base', prerequisites: ['blue', 'blue', 'blue'], summary: 'Your ships may move through systems that contain other players\' ships.', hasAction: false },

  // ── Biotic (green) ──
  { id: 'neural-motivator', name: 'Neural Motivator', color: 'green', type: 'ability', expansion: 'base', prerequisites: [], summary: 'Draw 2 action cards in the Status phase instead of 1.', hasAction: false },
  { id: 'psychoarchaeology', name: 'Psychoarchaeology', color: 'green', type: 'ability', expansion: 'pok', prerequisites: [], summary: 'Use planets\' tech specialties without exhausting them; during the action phase exhaust specialty planets for 1 trade good each.', hasAction: false },
  { id: 'dacxive-animators', name: 'Dacxive Animators', color: 'green', type: 'ability', expansion: 'base', prerequisites: ['green'], summary: 'After you win a ground combat, place 1 free infantry on that planet.', hasAction: false },
  { id: 'bio-stims', name: 'Bio-Stims', color: 'green', type: 'ability', expansion: 'pok', prerequisites: ['green'], summary: 'Exhaust at end of your turn to ready one of your planets with a tech specialty, or one of your other technologies.', hasAction: false },
  { id: 'hyper-metabolism', name: 'Hyper Metabolism', color: 'green', type: 'ability', expansion: 'base', prerequisites: ['green', 'green'], summary: 'Gain 3 command tokens during the Status phase instead of 2.', hasAction: false },
  { id: 'x-89-bacterial-weapon', name: 'X-89 Bacterial Weapon', color: 'green', type: 'ability', expansion: 'base', prerequisites: ['green', 'green', 'green'], summary: 'ACTION: Exhaust and choose a planet in a system with your bombardment ships to destroy all infantry on it.', hasAction: true },

  // ── Cybernetic (yellow) ──
  { id: 'sarween-tools', name: 'Sarween Tools', color: 'yellow', type: 'ability', expansion: 'base', prerequisites: [], summary: 'Add 1 resource whenever you resolve production at a unit.', hasAction: false },
  { id: 'scanlink-drone-network', name: 'Scanlink Drone Network', color: 'yellow', type: 'ability', expansion: 'pok', prerequisites: [], summary: 'When you activate a system, explore a planet there that contains your units.', hasAction: false },
  { id: 'graviton-laser-system', name: 'Graviton Laser System', color: 'yellow', type: 'ability', expansion: 'base', prerequisites: ['yellow'], summary: 'Exhaust before your units fire Space Cannon; those hits must be assigned to non-fighter ships.', hasAction: false },
  { id: 'predictive-intelligence', name: 'Predictive Intelligence', color: 'yellow', type: 'ability', expansion: 'pok', prerequisites: ['yellow'], summary: 'Exhaust at end of turn to redistribute your command tokens; or cast 3 extra votes in the agenda phase.', hasAction: false },
  { id: 'transit-diodes', name: 'Transit Diodes', color: 'yellow', type: 'ability', expansion: 'base', prerequisites: ['yellow', 'yellow'], summary: 'Exhaust at the start of your action-phase turn to move up to 4 of your ground forces to any planets you control.', hasAction: false },
  { id: 'integrated-economy', name: 'Integrated Economy', color: 'yellow', type: 'ability', expansion: 'base', prerequisites: ['yellow', 'yellow', 'yellow'], summary: 'After you gain control of a planet, immediately produce units there with combined cost up to its resource value.', hasAction: false },

  // ── Warfare (red) ──
  { id: 'plasma-scoring', name: 'Plasma Scoring', color: 'red', type: 'ability', expansion: 'base', prerequisites: [], summary: 'Add 1 die to one bombardment or space cannon roll.', hasAction: false },
  { id: 'ai-development-algorithm', name: 'AI Development Algorithm', color: 'red', type: 'ability', expansion: 'pok', prerequisites: [], summary: 'Exhaust to ignore 1 prerequisite when researching a unit upgrade, or to reduce produced-unit cost by your number of unit upgrades.', hasAction: false },
  { id: 'magen-defense-grid', name: 'Magen Defense Grid', color: 'red', type: 'ability', expansion: 'base', prerequisites: ['red'], summary: 'At the start of ground combat on a planet with your structure, deal 1 hit to enemy ground forces; when a system with your structure is activated, add 1 free infantry there.', hasAction: false },
  { id: 'self-assembly-routines', name: 'Self Assembly Routines', color: 'red', type: 'ability', expansion: 'pok', prerequisites: ['red'], summary: 'After your units use Production, exhaust to place a free mech on a planet you control there; gain 1 trade good when one of your mechs is destroyed.', hasAction: false },
  { id: 'duranium-armor', name: 'Duranium Armor', color: 'red', type: 'ability', expansion: 'base', prerequisites: ['red', 'red'], summary: 'Each combat round, after assigning hits, repair 1 of your damaged units that did not use Sustain Damage that round.', hasAction: false },
  { id: 'assault-cannon', name: 'Assault Cannon', color: 'red', type: 'ability', expansion: 'base', prerequisites: ['red', 'red', 'red'], summary: 'At the start of space combat where you have 3+ non-fighter ships, your opponent must destroy 1 of their non-fighter ships.', hasAction: false },

  // ── Unit upgrades (colorless) ──
  { id: 'infantry-ii', name: 'Infantry II', color: 'none', type: 'unit-upgrade', expansion: 'base', prerequisites: ['green', 'green'], summary: 'Upgraded Infantry — Combat 7; when destroyed, roll a die and on 6+ it returns to your home system next turn.', hasAction: false },
  { id: 'fighter-ii', name: 'Fighter II', color: 'none', type: 'unit-upgrade', expansion: 'base', prerequisites: ['green', 'blue'], summary: 'Upgraded Fighter — Move 2 and may move on its own; excess fighters count against your fleet pool.', hasAction: false },
  { id: 'space-dock-ii', name: 'Space Dock II', color: 'none', type: 'unit-upgrade', expansion: 'base', prerequisites: ['yellow', 'yellow'], summary: 'Upgraded Space Dock — Production equals planet resources + 4; up to 3 fighters here ignore capacity.', hasAction: false },
  { id: 'pds-ii', name: 'PDS II', color: 'none', type: 'unit-upgrade', expansion: 'base', prerequisites: ['red', 'yellow'], summary: 'Upgraded PDS — Space Cannon 5 and may fire into adjacent systems.', hasAction: false },
  { id: 'carrier-ii', name: 'Carrier II', color: 'none', type: 'unit-upgrade', expansion: 'base', prerequisites: ['blue', 'blue'], summary: 'Upgraded Carrier — Move 2 (up from 1), capacity 6.', hasAction: false },
  { id: 'destroyer-ii', name: 'Destroyer II', color: 'none', type: 'unit-upgrade', expansion: 'base', prerequisites: ['red', 'red'], summary: 'Upgraded Destroyer — Combat 8, Anti-Fighter Barrage 6 (x3).', hasAction: false },
  { id: 'cruiser-ii', name: 'Cruiser II', color: 'none', type: 'unit-upgrade', expansion: 'base', prerequisites: ['green', 'yellow', 'red'], summary: 'Upgraded Cruiser — Move 3, Combat 6, capacity 1.', hasAction: false },
  { id: 'dreadnought-ii', name: 'Dreadnought II', color: 'none', type: 'unit-upgrade', expansion: 'base', prerequisites: ['blue', 'blue', 'yellow'], summary: 'Upgraded Dreadnought — Move 2, capacity 1, Sustain Damage; cannot be destroyed by Direct Hit.', hasAction: false },
  { id: 'war-sun', name: 'War Sun', color: 'none', type: 'unit-upgrade', expansion: 'base', prerequisites: ['red', 'red', 'red', 'yellow'], summary: 'Unlocks War Suns — Combat 3 (x3), Sustain Damage, Bombardment; enemy units in its system lose Planetary Shield.', hasAction: false },
]
