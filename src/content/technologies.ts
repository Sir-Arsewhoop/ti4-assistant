import type { Technology } from './schema'

export const technologies: Technology[] = [
  // ── Propulsion (blue) ──
  { id: 'antimass-deflectors', name: 'Antimass Deflectors', color: 'blue', type: 'ability', expansion: 'base', prerequisites: [], summary: 'Ships may move through asteroid fields; -1 to enemy space cannon vs you.', hasAction: false },
  { id: 'dark-energy-tap', name: 'Dark Energy Tap', color: 'blue', type: 'ability', expansion: 'pok', prerequisites: [], summary: 'After a tactical action in a system with a frontier token and your ships, explore it; your ships may also retreat into empty adjacent systems.', hasAction: false },
  { id: 'gravity-drive', name: 'Gravity Drive', color: 'blue', type: 'ability', expansion: 'base', prerequisites: ['blue'], summary: 'After you activate a system, add +1 to the move value of one of your ships this action.', hasAction: false },
  { id: 'sling-relay', name: 'Sling Relay', color: 'blue', type: 'ability', expansion: 'pok', prerequisites: ['blue'], summary: 'ACTION: Produce 1 ship at a space dock you control.', hasAction: true },
  { id: 'fleet-logistics', name: 'Fleet Logistics', color: 'blue', type: 'ability', expansion: 'base', prerequisites: ['blue', 'blue'], summary: 'Take 2 actions during each of your action-phase turns instead of 1.', hasAction: false },
  { id: 'light-wave-deflector', name: 'Light/Wave Deflector', color: 'blue', type: 'ability', expansion: 'base', prerequisites: ['blue', 'blue', 'blue'], summary: 'Enemy ships no longer block you — your ships may fly through systems that others occupy.', hasAction: false },

  // ── Biotic (green) ──
  { id: 'neural-motivator', name: 'Neural Motivator', color: 'green', type: 'ability', expansion: 'base', prerequisites: [], summary: 'Draw 2 action cards in the Status phase instead of 1.', hasAction: false },
  { id: 'psychoarchaeology', name: 'Psychoarchaeology', color: 'green', type: 'ability', expansion: 'pok', prerequisites: [], summary: 'Use planets\' tech specialties without exhausting them; during the action phase exhaust specialty planets for 1 trade good each.', hasAction: false },
  { id: 'dacxive-animators', name: 'Dacxive Animators', color: 'green', type: 'ability', expansion: 'base', prerequisites: ['green'], summary: 'After you win a ground combat, place 1 free infantry on that planet.', hasAction: false },
  { id: 'bio-stims', name: 'Bio-Stims', color: 'green', type: 'ability', expansion: 'pok', prerequisites: ['green'], summary: 'Exhaust at end of your turn to ready one of your planets with a tech specialty, or one of your other technologies.', hasAction: false },
  { id: 'hyper-metabolism', name: 'Hyper Metabolism', color: 'green', type: 'ability', expansion: 'base', prerequisites: ['green', 'green'], summary: 'Your Status-phase command-token gain rises from 2 to 3.', hasAction: false },
  { id: 'x-89-bacterial-weapon', name: 'X-89 Bacterial Weapon', color: 'green', type: 'ability', expansion: 'base', prerequisites: ['green', 'green', 'green'], summary: 'ACTION: Exhaust and choose a planet in a system with your bombardment ships to destroy all infantry on it.', hasAction: true },

  // ── Cybernetic (yellow) ──
  { id: 'sarween-tools', name: 'Sarween Tools', color: 'yellow', type: 'ability', expansion: 'base', prerequisites: [], summary: 'Add 1 resource whenever you resolve production at a unit.', hasAction: false },
  { id: 'scanlink-drone-network', name: 'Scanlink Drone Network', color: 'yellow', type: 'ability', expansion: 'pok', prerequisites: [], summary: 'When you activate a system, explore a planet there that contains your units.', hasAction: false },
  { id: 'graviton-laser-system', name: 'Graviton Laser System', color: 'yellow', type: 'ability', expansion: 'base', prerequisites: ['yellow'], summary: 'Exhaust before your units fire Space Cannon; those hits must be assigned to non-fighter ships.', hasAction: false },
  { id: 'predictive-intelligence', name: 'Predictive Intelligence', color: 'yellow', type: 'ability', expansion: 'pok', prerequisites: ['yellow'], summary: 'Exhaust at end of turn to redistribute your command tokens; or cast 3 extra votes in the agenda phase.', hasAction: false },
  { id: 'transit-diodes', name: 'Transit Diodes', color: 'yellow', type: 'ability', expansion: 'base', prerequisites: ['yellow', 'yellow'], summary: 'Exhaust as your action-phase turn begins to redeploy as many as 4 ground forces among planets you hold.', hasAction: false },
  { id: 'integrated-economy', name: 'Integrated Economy', color: 'yellow', type: 'ability', expansion: 'base', prerequisites: ['yellow', 'yellow', 'yellow'], summary: 'Take control of a planet and you may at once build units on it, spending up to its resource value in combined cost.', hasAction: false },

  // ── Warfare (red) ──
  { id: 'plasma-scoring', name: 'Plasma Scoring', color: 'red', type: 'ability', expansion: 'base', prerequisites: [], summary: 'Add 1 die to one bombardment or space cannon roll.', hasAction: false },
  { id: 'ai-development-algorithm', name: 'AI Development Algorithm', color: 'red', type: 'ability', expansion: 'pok', prerequisites: [], summary: 'Exhaust to ignore 1 prerequisite when researching a unit upgrade, or to reduce produced-unit cost by your number of unit upgrades.', hasAction: false },
  { id: 'magen-defense-grid', name: 'Magen Defense Grid', color: 'red', type: 'ability', expansion: 'base', prerequisites: ['red'], summary: 'At the start of ground combat on a planet with your structure, deal 1 hit to enemy ground forces; when a system with your structure is activated, add 1 free infantry there.', hasAction: false },
  { id: 'self-assembly-routines', name: 'Self Assembly Routines', color: 'red', type: 'ability', expansion: 'pok', prerequisites: ['red'], summary: 'After your units use Production, exhaust to place a free mech on a planet you control there; gain 1 trade good when one of your mechs is destroyed.', hasAction: false },
  { id: 'duranium-armor', name: 'Duranium Armor', color: 'red', type: 'ability', expansion: 'base', prerequisites: ['red', 'red'], summary: 'Once hits are assigned in a combat round, mend one of your hurt units — provided it didn\'t sustain damage that same round.', hasAction: false },
  { id: 'assault-cannon', name: 'Assault Cannon', color: 'red', type: 'ability', expansion: 'base', prerequisites: ['red', 'red', 'red'], summary: 'Bring 3 or more non-fighter ships to a space battle and the enemy loses one non-fighter ship before it starts.', hasAction: false },

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

  // ══ Faction technologies (48: 2 per faction) ══

  // ── Arborec ──
  { id: 'letani-warrior-ii', name: 'Letani Warrior II', color: 'none', type: 'unit-upgrade', expansion: 'base', prerequisites: ['green', 'green'], summary: 'Upgraded Letani Warrior — Combat 7, and it carries Production 2; when killed, a 6-or-better roll brings it home to redeploy next turn.', hasAction: false, factionId: 'arborec', replaces: 'infantry-ii' },
  { id: 'bioplasmosis', name: 'Bioplasmosis', color: 'green', type: 'ability', expansion: 'base', prerequisites: ['green', 'green'], summary: 'End of the status phase: lift any number of your infantry and redeploy them among planets you hold in the same or neighbouring systems.', hasAction: false, factionId: 'arborec' },

  // ── Argent Flight ──
  { id: 'strike-wing-alpha-ii', name: 'Strike Wing Alpha II', color: 'none', type: 'unit-upgrade', expansion: 'pok', prerequisites: ['red', 'red'], summary: 'Upgraded Strike Wing Alpha — Combat 7, capacity 1, Anti-Fighter Barrage 6 (x3); barrage rolls of 9 or 10 also kill an enemy infantry floating in the active system.', hasAction: false, factionId: 'argent', replaces: 'destroyer-ii' },
  { id: 'aerie-hololattice', name: 'Aerie Hololattice', color: 'yellow', type: 'ability', expansion: 'pok', prerequisites: ['yellow'], summary: 'Enemy ships cannot pass through systems where you have structures, and each planet holding one produces as though it were a unit with Production 1.', hasAction: false, factionId: 'argent' },

  // ── Ghosts of Creuss ──
  { id: 'wormhole-generator', name: 'Wormhole Generator', color: 'blue', type: 'ability', expansion: 'base', prerequisites: ['blue', 'blue'], summary: 'ACTION: Exhaust to drop or relocate your Creuss wormhole token — onto a system where you hold a planet, or any non-home system clear of rival ships.', hasAction: true, factionId: 'creuss' },
  { id: 'dimensional-splicer', name: 'Dimensional Splicer', color: 'red', type: 'ability', expansion: 'base', prerequisites: ['red'], summary: 'When a space battle opens at a wormhole where you have ships, score one free hit against your opponent\'s ships.', hasAction: false, factionId: 'creuss' },

  // ── Empyrean ──
  { id: 'aetherstream', name: 'Aetherstream', color: 'blue', type: 'ability', expansion: 'pok', prerequisites: ['blue', 'blue'], summary: 'When you or a neighbour activates next to an anomaly, every one of that player\'s ships may move 1 further this action.', hasAction: false, factionId: 'empyrean' },
  { id: 'voidwatch', name: 'Voidwatch', color: 'green', type: 'ability', expansion: 'pok', prerequisites: ['green'], summary: 'Anyone moving ships into a system where you have units must hand you a promissory note from their hand if they hold one.', hasAction: false, factionId: 'empyrean' },

  // ── Emirates of Hacan ──
  { id: 'quantum-datahub-node', name: 'Quantum Datahub Node', color: 'yellow', type: 'ability', expansion: 'base', prerequisites: ['yellow', 'yellow', 'yellow'], summary: 'Closing the strategy phase, pay a strategy token and 3 trade goods to a rival to swap one of your strategy cards for one of theirs.', hasAction: false, factionId: 'hacan' },
  { id: 'production-biomes', name: 'Production Biomes', color: 'green', type: 'ability', expansion: 'base', prerequisites: ['green', 'green'], summary: 'ACTION: Exhaust and spend a strategy token for 4 trade goods, handing 2 to a rival of your choice.', hasAction: true, factionId: 'hacan' },

  // ── Universities of Jol-Nar ──
  { id: 'spatial-conduit-cylinders', name: 'Spatial Conduit Cylinders', color: 'blue', type: 'ability', expansion: 'base', prerequisites: ['blue', 'blue'], summary: 'Exhaust after activating a system where you have units: for that activation it counts as neighbouring every other system holding your units.', hasAction: false, factionId: 'jol-nar' },
  { id: 'e-res-siphons', name: 'E-Res Siphons', color: 'yellow', type: 'ability', expansion: 'base', prerequisites: ['yellow', 'yellow'], summary: 'Every time a rival activates a system where your ships sit, collect 4 trade goods.', hasAction: false, factionId: 'jol-nar' },

  // ── L1Z1X Mindnet ──
  { id: 'super-dreadnought-ii', name: 'Super Dreadnought II', color: 'none', type: 'unit-upgrade', expansion: 'base', prerequisites: ['blue', 'blue', 'yellow'], summary: 'Upgraded Super Dreadnought — Combat 4, capacity 2, Sustain Damage and Bombardment 4; Direct Hit cannot touch it.', hasAction: false, factionId: 'l1z1x', replaces: 'dreadnought-ii' },
  { id: 'inheritance-systems', name: 'Inheritance Systems', color: 'yellow', type: 'ability', expansion: 'base', prerequisites: ['yellow', 'yellow'], summary: 'Exhaust plus 2 resources while researching to waive that technology\'s prerequisites entirely.', hasAction: false, factionId: 'l1z1x' },

  // ── Barony of Letnev ──
  { id: 'l4-disruptors', name: 'L4 Disruptors', color: 'yellow', type: 'ability', expansion: 'base', prerequisites: ['yellow'], summary: 'While you invade, no Space Cannon may fire on your units.', hasAction: false, factionId: 'letnev' },
  { id: 'non-euclidean-shielding', name: 'Non-Euclidean Shielding', color: 'red', type: 'ability', expansion: 'base', prerequisites: ['red', 'red'], summary: 'Each of your Sustain Damage uses soaks 2 hits rather than 1.', hasAction: false, factionId: 'letnev' },

  // ── Mahact Gene-Sorcerers ──
  { id: 'crimson-legionnaire-ii', name: 'Crimson Legionnaire II', color: 'none', type: 'unit-upgrade', expansion: 'pok', prerequisites: ['green', 'green'], summary: 'Upgraded Crimson Legionnaire — Combat 7; each death pays you a commodity (or turns one you hold into a trade good) and the trooper redeploys home next turn.', hasAction: false, factionId: 'mahact', replaces: 'infantry-ii' },
  { id: 'genetic-recombination', name: 'Genetic Recombination', color: 'green', type: 'ability', expansion: 'pok', prerequisites: ['green'], summary: 'Exhaust before someone votes: they either put at least one vote where you say, or give up a token from their fleet pool.', hasAction: false, factionId: 'mahact' },

  // ── Mentak Coalition ──
  { id: 'mirror-computing', name: 'Mirror Computing', color: 'yellow', type: 'ability', expansion: 'base', prerequisites: ['yellow', 'yellow', 'yellow'], summary: 'Your trade goods spend at double rate — 2 resources or influence apiece.', hasAction: false, factionId: 'mentak' },
  { id: 'salvage-operations', name: 'Salvage Operations', color: 'yellow', type: 'ability', expansion: 'base', prerequisites: ['yellow', 'yellow'], summary: 'Win or lose a space battle and you pocket a trade good; on a win you may also rebuild one ship type that died there, on the spot.', hasAction: false, factionId: 'mentak' },

  // ── Embers of Muaat ──
  { id: 'prototype-war-sun-ii', name: 'Prototype War Sun II', color: 'none', type: 'unit-upgrade', expansion: 'base', prerequisites: ['red', 'red', 'red', 'yellow'], summary: 'Upgraded Prototype War Sun — cheaper at cost 10 and faster at move 3, Combat 3 (x3), Sustain Damage and Bombardment; enemies in its system lose Planetary Shield.', hasAction: false, factionId: 'muaat', replaces: 'war-sun' },
  { id: 'magmus-reactor', name: 'Magmus Reactor', color: 'red', type: 'ability', expansion: 'base', prerequisites: ['red', 'red'], summary: 'Supernovas stop being walls — your ships may enter them. Produce in a system that holds a war sun or borders a supernova and you collect a trade good.', hasAction: false, factionId: 'muaat' },

  // ── Naalu Collective ──
  { id: 'hybrid-crystal-fighter-ii', name: 'Hybrid Crystal Fighter II', color: 'none', type: 'unit-upgrade', expansion: 'base', prerequisites: ['green', 'blue'], summary: 'Upgraded Hybrid Crystal Fighter — Combat 7, moves on its own, and overflow fighters weigh only half a ship against your fleet pool.', hasAction: false, factionId: 'naalu', replaces: 'fighter-ii' },
  { id: 'neuroglaive', name: 'Neuroglaive', color: 'green', type: 'ability', expansion: 'base', prerequisites: ['green', 'green', 'green'], summary: 'Any rival activating into your ships loses a token from their fleet pool.', hasAction: false, factionId: 'naalu' },

  // ── Naaz-Rokha Alliance ──
  { id: 'pre-fab-arcologies', name: 'Pre-Fab Arcologies', color: 'green', type: 'ability', expansion: 'pok', prerequisites: ['green', 'green', 'green'], summary: 'Exploring a planet leaves it readied.', hasAction: false, factionId: 'naaz-rokha' },
  { id: 'supercharge', name: 'Supercharge', color: 'red', type: 'ability', expansion: 'pok', prerequisites: ['red'], summary: 'Exhaust as a combat round opens for +1 on every combat roll you make that round.', hasAction: false, factionId: 'naaz-rokha' },

  // ── Nekro Virus ──
  { id: 'valefar-assimilator-x', name: 'Valefar Assimilator X', color: 'none', type: 'ability', expansion: 'base', prerequisites: [], summary: 'Instead of taking a rival\'s technology outright, park your X token on one of their faction techs; this card then behaves as that tech while the token sits there. One token per technology.', hasAction: false, factionId: 'nekro' },
  { id: 'valefar-assimilator-y', name: 'Valefar Assimilator Y', color: 'none', type: 'ability', expansion: 'base', prerequisites: [], summary: 'Instead of taking a rival\'s technology outright, park your Y token on one of their faction techs; this card then behaves as that tech while the token sits there. One token per technology.', hasAction: false, factionId: 'nekro' },

  // ── Nomad ──
  { id: 'memoria-ii', name: 'Memoria II', color: 'none', type: 'unit-upgrade', expansion: 'pok', prerequisites: ['green', 'blue', 'yellow'], summary: 'Upgraded Memoria — Combat 5 (x2), capacity 6, Sustain Damage and Anti-Fighter Barrage; it counts as neighbouring any system holding one of your mechs.', hasAction: false, factionId: 'nomad' },
  { id: 'temporal-command-suite', name: 'Temporal Command Suite', color: 'yellow', type: 'ability', expansion: 'pok', prerequisites: ['yellow'], summary: 'When any agent exhausts, exhaust this to stand it back up — and if it was a rival\'s, you may trade with them off the back of it.', hasAction: false, factionId: 'nomad' },

  // ── Clan of Saar ──
  { id: 'chaos-mapping', name: 'Chaos Mapping', color: 'blue', type: 'ability', expansion: 'base', prerequisites: ['blue'], summary: 'Asteroid fields holding your ships are off-limits to rivals, and each of your action-phase turns you may produce 1 unit where you have Production, paying its cost as normal.', hasAction: false, factionId: 'saar' },
  { id: 'floating-factory-ii', name: 'Floating Factory II', color: 'none', type: 'unit-upgrade', expansion: 'base', prerequisites: ['yellow', 'yellow'], summary: 'Upgraded Floating Factory — Production 7, move 2, capacity 5; it sits in space rather than on a planet and manoeuvres like a ship, but a blockade destroys it.', hasAction: false, factionId: 'saar', replaces: 'space-dock-ii' },

  // ── Sardakk N'orr ──
  { id: 'exotrireme-ii', name: 'Exotrireme II', color: 'none', type: 'unit-upgrade', expansion: 'base', prerequisites: ['blue', 'blue', 'yellow'], summary: 'Upgraded Exotrireme — Bombardment 4 (x2), Sustain Damage, immune to Direct Hit, and after any space-combat round you may scuttle it to take up to 2 enemy ships down with it.', hasAction: false, factionId: 'sardakk-norr', replaces: 'dreadnought-ii' },
  { id: 'valkyrie-particle-weave', name: 'Valkyrie Particle Weave', color: 'red', type: 'ability', expansion: 'base', prerequisites: ['red', 'red'], summary: 'In ground combat, any round where your opponent lands a hit hands you one extra hit.', hasAction: false, factionId: 'sardakk-norr' },

  // ── Federation of Sol ──
  { id: 'advanced-carrier-ii', name: 'Advanced Carrier II', color: 'none', type: 'unit-upgrade', expansion: 'base', prerequisites: ['blue', 'blue'], summary: 'Upgraded Advanced Carrier — capacity 8, move 2, and it gains Sustain Damage.', hasAction: false, factionId: 'sol', replaces: 'carrier-ii' },
  { id: 'spec-ops-ii', name: 'Spec Ops II', color: 'none', type: 'unit-upgrade', expansion: 'base', prerequisites: ['green', 'green'], summary: 'Upgraded Spec Ops — Combat 6, and a 5-or-better roll after death sends the trooper home to redeploy next turn.', hasAction: false, factionId: 'sol', replaces: 'infantry-ii' },

  // ── Titans of Ul ──
  { id: 'saturn-engine-ii', name: 'Saturn Engine II', color: 'none', type: 'unit-upgrade', expansion: 'pok', prerequisites: ['green', 'yellow', 'red'], summary: 'Upgraded Saturn Engine — move 3, capacity 2, with Sustain Damage.', hasAction: false, factionId: 'titans', replaces: 'cruiser-ii' },
  { id: 'hel-titan-ii', name: 'Hel-Titan II', color: 'none', type: 'unit-upgrade', expansion: 'pok', prerequisites: ['yellow', 'red'], summary: 'Upgraded Hel-Titan — Space Cannon 5, Combat 6, Sustain Damage and Production 1; it counts as both structure and ground force, never travels, and can shoot into adjacent systems.', hasAction: false, factionId: 'titans', replaces: 'pds-ii' },

  // ── Vuil'raith Cabal ──
  { id: 'dimensional-tear-ii', name: 'Dimensional Tear II', color: 'none', type: 'unit-upgrade', expansion: 'pok', prerequisites: ['yellow', 'yellow'], summary: 'Upgraded Dimensional Tear — Production 7; its system becomes a gravity rift your own ships ignore, and up to 12 fighters there escape capacity limits.', hasAction: false, factionId: 'vuilraith', replaces: 'space-dock-ii' },
  { id: 'vortex', name: 'Vortex', color: 'red', type: 'ability', expansion: 'pok', prerequisites: ['red'], summary: 'ACTION: Exhaust to reach out from one of your space docks and seize a matching unit from a neighbouring rival\'s reinforcements.', hasAction: true, factionId: 'vuilraith' },

  // ── Winnu ──
  { id: 'lazax-gate-folding', name: 'Lazax Gate Folding', color: 'blue', type: 'ability', expansion: 'base', prerequisites: ['blue', 'blue'], summary: 'While Mecatol Rex is not yours, your tactical actions treat its system as carrying both wormhole types. ACTION: once it is yours, exhaust to drop an infantry there.', hasAction: true, factionId: 'winnu' },
  { id: 'hegemonic-trade-policy', name: 'Hegemonic Trade Policy', color: 'yellow', type: 'ability', expansion: 'base', prerequisites: ['yellow', 'yellow'], summary: 'Exhaust as you produce to flip one of your planets\' resource and influence figures for that build.', hasAction: false, factionId: 'winnu' },

  // ── Xxcha Kingdom ──
  { id: 'instinct-training', name: 'Instinct Training', color: 'green', type: 'ability', expansion: 'base', prerequisites: ['green'], summary: 'Exhaust plus a strategy token to kill a rival\'s action card as it is played.', hasAction: false, factionId: 'xxcha' },
  { id: 'nullification-field', name: 'Nullification Field', color: 'yellow', type: 'ability', expansion: 'base', prerequisites: ['yellow', 'yellow'], summary: 'When a rival activates into your ships, exhaust and spend a strategy token to end their turn on the spot.', hasAction: false, factionId: 'xxcha' },

  // ── Yin Brotherhood ──
  { id: 'yin-spinner', name: 'Yin Spinner', color: 'green', type: 'ability', expansion: 'base', prerequisites: ['green', 'green'], summary: 'Whenever your units produce, plant 1 free infantry on a planet you hold in that same system.', hasAction: false, factionId: 'yin' },
  { id: 'impulse-core', name: 'Impulse Core', color: 'yellow', type: 'ability', expansion: 'base', prerequisites: ['yellow', 'yellow'], summary: 'Opening a space battle, scuttle one of your cruisers or destroyers to land a hit that must fall on a non-fighter ship where possible.', hasAction: false, factionId: 'yin' },

  // ── Yssaril Tribes ──
  { id: 'mageon-implants', name: 'Mageon Implants', color: 'green', type: 'ability', expansion: 'base', prerequisites: ['green', 'green', 'green'], summary: 'ACTION: Exhaust to riffle through a rival\'s action cards and help yourself to one.', hasAction: true, factionId: 'yssaril' },
  { id: 'transparasteel-plating', name: 'Transparasteel Plating', color: 'green', type: 'ability', expansion: 'base', prerequisites: ['green'], summary: 'Once a player has passed, your action-phase turns lock them out of playing action cards.', hasAction: false, factionId: 'yssaril' },
]
