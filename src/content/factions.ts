import type { Faction } from './schema'

const tokens = { tactic: 3, fleet: 3, strategy: 2 }
const p = (id: string, name: string, resources: number, influence: number): Faction['starting']['planets'][number] =>
  ({ id, name, resources, influence, exhausted: false })

export const factions: Faction[] = [
  // ---------- Base game (17) ----------
  {
    id: 'arborec', name: 'Arborec', expansion: 'base', combatModifier: 0,
    abilitySummaries: [
      "Mitosis: your space docks can't build infantry, but each Status phase you place 1 free infantry on a planet you control.",
    ],
    starting: {
      tokens, techIds: ['magen-defense-grid'],
      planets: [p('nestphar', 'Nestphar', 3, 2)],
      startingUnits: ['1 Carrier', '1 Cruiser', '2 Fighters', '4 Infantry', '1 Space Dock', '1 PDS'],
      commodities: 3, tradeGoods: 0,
    },
  },
  {
    id: 'letnev', name: 'Barony of Letnev', expansion: 'base', combatModifier: 0,
    abilitySummaries: [
      'Munitions Reserves: at the start of any combat round you may spend 2 trade goods to reroll any of your dice.',
      'Armada: your non-fighter ship limit per system is 2 higher than your fleet-pool token count.',
    ],
    starting: {
      tokens, techIds: ['antimass-deflectors', 'plasma-scoring'],
      planets: [p('arc-prime', 'Arc Prime', 4, 0), p('wren-terra', 'Wren Terra', 2, 1)],
      startingUnits: ['1 Dreadnought', '1 Carrier', '1 Destroyer', '1 Fighter', '3 Infantry', '1 Space Dock'],
      commodities: 2, tradeGoods: 0,
    },
  },
  {
    id: 'saar', name: 'Clan of Saar', expansion: 'base', combatModifier: 0,
    abilitySummaries: [
      'Scavenge: gain 1 trade good each time you gain control of a planet.',
      'Nomadic: you can score objectives even without controlling the planets in your home system.',
    ],
    starting: {
      tokens, techIds: ['antimass-deflectors'],
      planets: [p('lisis-ii', 'Lisis II', 1, 0), p('ragh', 'Ragh', 2, 1)],
      startingUnits: ['2 Carriers', '1 Cruiser', '2 Fighters', '4 Infantry', '1 Space Dock'],
      commodities: 3, tradeGoods: 0,
    },
  },
  {
    id: 'muaat', name: 'Embers of Muaat', expansion: 'base', combatModifier: 0,
    abilitySummaries: [
      'Star Forge (ACTION): spend 1 strategy token to place 2 fighters or 1 destroyer in a system with one of your war suns.',
      'Gashlai Physiology: your ships can move through supernovas.',
    ],
    starting: {
      tokens, techIds: ['plasma-scoring'],
      planets: [p('muaat', 'Muaat', 4, 1)],
      startingUnits: ['1 War Sun', '2 Fighters', '4 Infantry', '1 Space Dock'],
      commodities: 4, tradeGoods: 0,
    },
  },
  {
    id: 'hacan', name: 'Emirates of Hacan', expansion: 'base', combatModifier: 0,
    abilitySummaries: [
      "Masters of Trade: you don't spend a command token for the Trade strategy card's secondary.",
      "Guild Ships: you may make transactions with players who aren't your neighbors.",
      'Arbiters: you may include action cards in your transactions.',
    ],
    starting: {
      tokens, techIds: ['antimass-deflectors', 'sarween-tools'],
      planets: [p('arretze', 'Arretze', 2, 0), p('hercant', 'Hercant', 1, 1), p('kamdorn', 'Kamdorn', 0, 1)],
      startingUnits: ['2 Carriers', '1 Cruiser', '2 Fighters', '4 Infantry', '1 Space Dock'],
      commodities: 6, tradeGoods: 0,
    },
  },
  {
    id: 'sol', name: 'Federation of Sol', expansion: 'base', combatModifier: 0,
    abilitySummaries: [
      'Orbital Drop (ACTION): spend 1 strategy token to place 2 infantry on a planet you control.',
      'Versatile: when you gain command tokens during the Status phase, gain 1 extra.',
    ],
    starting: {
      tokens, techIds: ['neural-motivator', 'antimass-deflectors'],
      planets: [p('jord', 'Jord', 4, 2)],
      startingUnits: ['2 Carriers', '1 Destroyer', '3 Fighters', '5 Infantry', '1 Space Dock'],
      commodities: 4, tradeGoods: 0,
    },
  },
  {
    id: 'creuss', name: 'Ghosts of Creuss', expansion: 'base', combatModifier: 0,
    abilitySummaries: [
      'Quantum Entanglement: all systems with an alpha or beta wormhole are adjacent to each other for you.',
      'Slipstream: +1 movement to each of your ships that starts in your home system or a wormhole system.',
      'Creuss Gate: your home system starts in your play area; the Creuss Gate tile stands in for it on the board.',
    ],
    starting: {
      tokens, techIds: ['gravity-drive'],
      planets: [p('creuss', 'Creuss', 4, 2)],
      startingUnits: ['1 Carrier', '2 Destroyers', '2 Fighters', '4 Infantry', '1 Space Dock'],
      commodities: 4, tradeGoods: 0,
    },
  },
  {
    id: 'l1z1x', name: 'L1Z1X Mindnet', expansion: 'base', combatModifier: 0,
    abilitySummaries: [
      'Assimilate: when you take a planet, its PDS and space docks become yours instead of being destroyed.',
      "Harrow: after each ground-combat round, your ships in the active system bombard the enemy's ground forces.",
    ],
    starting: {
      tokens, techIds: ['neural-motivator', 'plasma-scoring'],
      planets: [p('l1z1x-home', '[0.0.0]', 5, 0)], // [0.0.0] 5/0 confirmed via wiki + AsyncTI4
      startingUnits: ['1 Dreadnought', '1 Carrier', '3 Fighters', '5 Infantry', '1 Space Dock', '1 PDS'],
      commodities: 2, tradeGoods: 0,
    },
  },
  {
    id: 'mentak', name: 'Mentak Coalition', expansion: 'base', combatModifier: 0,
    abilitySummaries: [
      'Ambush: at the start of space combat, roll for up to 2 of your cruisers/destroyers to score pre-combat hits.',
      'Pillage: when a neighbor with 3+ trade goods gains goods or trades, you may take 1 of their trade goods or commodities.',
    ],
    starting: {
      tokens, techIds: ['sarween-tools', 'plasma-scoring'],
      planets: [p('moll-primus', 'Moll Primus', 4, 1)],
      startingUnits: ['1 Carrier', '2 Cruisers', '3 Fighters', '4 Infantry', '1 Space Dock', '1 PDS'],
      commodities: 2, tradeGoods: 0,
    },
  },
  {
    id: 'naalu', name: 'Naalu Collective', expansion: 'base', combatModifier: 0,
    abilitySummaries: [
      "Telepathic: you're always first in initiative (the Naalu '0' token) regardless of your strategy card.",
      'Foresight: when a player moves into a system with your ships, you may dodge your ships to an adjacent empty system.',
    ],
    starting: {
      tokens, techIds: ['neural-motivator', 'sarween-tools'],
      planets: [p('maaluuk', 'Maaluuk', 0, 2), p('druaa', 'Druaa', 3, 1)],
      startingUnits: ['1 Carrier', '1 Cruiser', '1 Destroyer', '3 Fighters', '4 Infantry', '1 Space Dock', '1 PDS'],
      commodities: 3, tradeGoods: 0,
    },
  },
  {
    id: 'nekro', name: 'Nekro Virus', expansion: 'base', combatModifier: 0,
    abilitySummaries: [
      "Galactic Threat: you can't vote; once per agenda you may predict the outcome to steal a technology if right.",
      "Technological Singularity: once per combat, when you destroy an enemy unit you may take one of that player's techs.",
      "Propagation: you can't research; each research you'd do gives you 3 command tokens instead.",
    ],
    starting: {
      tokens, techIds: ['dacxive-animators', 'valefar-assimilator-x', 'valefar-assimilator-y'],
      planets: [p('mordai-ii', 'Mordai II', 4, 0)],
      startingUnits: ['1 Dreadnought', '1 Carrier', '1 Cruiser', '2 Fighters', '2 Infantry', '1 Space Dock'],
      commodities: 3, tradeGoods: 0,
    },
  },
  {
    id: 'sardakk-norr', name: "Sardakk N'orr", expansion: 'base', combatModifier: 1,
    abilitySummaries: ["Unrelenting: apply +1 to each of your unit's combat rolls."],
    starting: {
      tokens, techIds: [],
      planets: [p('quinarra', 'Quinarra', 3, 1), p('tren-lak', "Tren'lak", 1, 0)],
      startingUnits: ['2 Carriers', '1 Cruiser', '5 Infantry', '1 Space Dock', '1 PDS'],
      commodities: 3, tradeGoods: 0,
    },
  },
  {
    id: 'jol-nar', name: 'Universities of Jol-Nar', expansion: 'base', combatModifier: -1,
    abilitySummaries: [
      "Fragile: apply -1 to each of your unit's combat rolls.",
      "Brilliant: when resolving the Technology strategy card's secondary, you may resolve its primary instead.",
      'Analytical: when you research a non-unit-upgrade technology, you may ignore one prerequisite.',
    ],
    starting: {
      tokens, techIds: ['neural-motivator', 'antimass-deflectors', 'sarween-tools', 'plasma-scoring'],
      planets: [p('jol', 'Jol', 1, 2), p('nar', 'Nar', 2, 3)],
      startingUnits: ['1 Dreadnought', '2 Carriers', '1 Fighter', '2 Infantry', '1 Space Dock', '2 PDS'],
      commodities: 4, tradeGoods: 0,
    },
  },
  {
    id: 'winnu', name: 'Winnu', expansion: 'base', combatModifier: 0,
    abilitySummaries: [
      "Blood Ties: you don't spend influence to remove the custodians token from Mecatol Rex.",
      'Reclamation: after a tactical action where you take Mecatol Rex, place 1 free PDS and 1 space dock there.',
    ],
    starting: {
      tokens, techIds: [],
      planets: [p('winnu', 'Winnu', 3, 4)],
      startingUnits: ['1 Carrier', '1 Cruiser', '2 Fighters', '2 Infantry', '1 Space Dock', '1 PDS'],
      commodities: 3, tradeGoods: 0,
    },
  },
  {
    id: 'xxcha', name: 'Xxcha Kingdom', expansion: 'base', combatModifier: 0,
    abilitySummaries: [
      'Peace Accords: after resolving Diplomacy (primary or secondary), you may claim an empty planet adjacent to one you control.',
      'Quash: spend 1 strategy token when an agenda is revealed to discard it and reveal a new one.',
    ],
    starting: {
      tokens, techIds: ['graviton-laser-system'],
      planets: [p('archon-ren', 'Archon Ren', 2, 3), p('archon-tau', 'Archon Tau', 1, 1)],
      startingUnits: ['1 Carrier', '2 Cruisers', '3 Fighters', '4 Infantry', '1 Space Dock', '1 PDS'],
      commodities: 4, tradeGoods: 0,
    },
  },
  {
    id: 'yin', name: 'Yin Brotherhood', expansion: 'base', combatModifier: 0,
    abilitySummaries: [
      'Indoctrination: at the start of ground combat, spend 2 influence to convert 1 enemy infantry into yours.',
      'Devotion: after each space-combat round, destroy one of your cruisers/destroyers to score 1 hit on the enemy.',
    ],
    starting: {
      tokens, techIds: ['sarween-tools'],
      planets: [p('darien', 'Darien', 4, 4)],
      startingUnits: ['2 Carriers', '1 Destroyer', '4 Fighters', '4 Infantry', '1 Space Dock'],
      commodities: 2, tradeGoods: 0,
    },
  },
  {
    id: 'yssaril', name: 'Yssaril Tribes', expansion: 'base', combatModifier: 0,
    abilitySummaries: [
      'Stall Tactics (ACTION): discard an action card from your hand (a do-nothing action to keep turns going).',
      'Scheming: when you draw action cards, draw 1 extra, then discard 1 card from your hand.',
      'Crafty: you have no hand-size limit on action cards.',
    ],
    starting: {
      tokens, techIds: ['neural-motivator'],
      planets: [p('retillion', 'Retillion', 2, 3), p('shalloq', 'Shalloq', 1, 2)],
      startingUnits: ['2 Carriers', '1 Cruiser', '2 Fighters', '5 Infantry', '1 Space Dock', '1 PDS'],
      commodities: 3, tradeGoods: 0,
    },
  },
  // ---------- Prophecy of Kings (7) ----------
  {
    id: 'argent', name: 'Argent Flight', expansion: 'pok', combatModifier: 0,
    abilitySummaries: [
      'Zeal: you always vote first, and cast 1 extra vote per player in the game.',
      'Raid Formation: excess Anti-Fighter Barrage hits damage enemy ships that have Sustain Damage.',
    ],
    starting: {
      tokens, techIds: ['neural-motivator', 'sarween-tools', 'plasma-scoring'],
      planets: [p('valk', 'Valk', 2, 0), p('avar', 'Avar', 1, 1), p('ylir', 'Ylir', 0, 2)],
      startingUnits: ['1 Carrier', '2 Destroyers', '2 Fighters', '5 Infantry', '1 Space Dock', '1 PDS'],
      commodities: 3, tradeGoods: 0,
    },
  },
  {
    id: 'empyrean', name: 'Empyrean', expansion: 'pok', combatModifier: 0,
    abilitySummaries: [
      "Voidborn: nebulae don't slow your ships' movement.",
      'Aetherpassage: after a player activates a system, you may let them move through systems containing your ships.',
      'Dark Whispers: you start with 2 faction promissory notes instead of 1.',
    ],
    starting: {
      tokens, techIds: ['dark-energy-tap'],
      planets: [p('the-dark', 'The Dark', 3, 4)],
      startingUnits: ['2 Carriers', '1 Destroyer', '2 Fighters', '4 Infantry', '1 Space Dock'],
      commodities: 4, tradeGoods: 0,
    },
  },
  {
    id: 'mahact', name: 'Mahact Gene-Sorcerers', expansion: 'pok', combatModifier: 0,
    abilitySummaries: [
      'Edict: when you win combat, take an enemy command token into your fleet pool (raising your fleet limit).',
      "Imperia: while you hold another player's command token in your fleet pool, you may use their unlocked commander.",
      "Hubris: you purge your Alliance promissory at setup and can't receive others' Alliance notes.",
    ],
    starting: {
      tokens, techIds: ['bio-stims', 'predictive-intelligence'],
      planets: [p('ixth', 'Ixth', 3, 5)],
      startingUnits: ['1 Dreadnought', '1 Carrier', '1 Cruiser', '2 Fighters', '3 Infantry', '1 Space Dock'],
      commodities: 3, tradeGoods: 0,
    },
  },
  {
    id: 'naaz-rokha', name: 'Naaz-Rokha Alliance', expansion: 'pok', combatModifier: 0,
    abilitySummaries: [
      'Distant Suns: when you explore a planet with your mech, draw an extra explore card and pick one.',
      'Fabrication (ACTION): purge 2 matching relic fragments for a relic, or 1 fragment for a command token.',
    ],
    starting: {
      tokens, techIds: ['psychoarchaeology', 'ai-development-algorithm'],
      planets: [p('naazir', 'Naazir', 2, 1), p('rokha', 'Rokha', 1, 2)],
      startingUnits: ['2 Carriers', '1 Destroyer', '2 Fighters', '1 Mech', '3 Infantry', '1 Space Dock'],
      commodities: 3, tradeGoods: 0,
    },
  },
  {
    id: 'nomad', name: 'Nomad', expansion: 'pok', combatModifier: 0,
    abilitySummaries: [
      'The Company: you start with 3 agents (2 extra Nomad agents).',
      'Future Sight: gain 1 trade good whenever an agenda outcome you voted or predicted resolves.',
    ],
    starting: {
      tokens, techIds: ['sling-relay'],
      planets: [p('arcturus', 'Arcturus', 4, 4)],
      startingUnits: ['1 Flagship', '1 Carrier', '1 Destroyer', '3 Fighters', '4 Infantry', '1 Space Dock'],
      commodities: 4, tradeGoods: 0,
    },
  },
  {
    id: 'titans', name: 'Titans of Ul', expansion: 'pok', combatModifier: 0,
    abilitySummaries: [
      'Terragenesis: after exploring a planet with no sleeper token, place or move a sleeper token onto it.',
      'Awaken: when you activate a system with your sleeper tokens, turn each into a free PDS.',
      'Coalescence: units your flagship or Awaken drop alongside enemies must fight that turn.',
    ],
    starting: {
      tokens, techIds: ['antimass-deflectors', 'scanlink-drone-network'],
      planets: [p('elysium', 'Elysium', 4, 1)],
      startingUnits: ['1 Dreadnought', '2 Cruisers', '2 Fighters', '3 Infantry', '1 Space Dock'],
      commodities: 2, tradeGoods: 0,
    },
  },
  {
    id: 'vuilraith', name: "Vuil'raith Cabal", expansion: 'pok', combatModifier: 0,
    abilitySummaries: [
      "Devour: capture the enemy's non-structure units you destroy in combat.",
      'Amalgamation: when producing a unit, return a captured unit of that type to build it for free.',
      'Riftmeld: when researching a unit upgrade, return a captured unit of that type to ignore its prerequisites.',
    ],
    starting: {
      tokens, techIds: ['self-assembly-routines'],
      planets: [p('acheron', 'Acheron', 4, 0)],
      startingUnits: ['1 Dreadnought', '1 Carrier', '1 Cruiser', '3 Fighters', '3 Infantry', '1 Space Dock'],
      commodities: 2, tradeGoods: 0,
    },
  },
]
