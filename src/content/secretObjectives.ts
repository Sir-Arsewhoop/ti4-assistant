import type { SecretObjective } from './schema'

export const secretObjectives: SecretObjective[] = [
  // ── Status window · base (15) ──
  { id: 'adapt-new-strategies', name: 'Adapt New Strategies', points: 1, phase: 'status', expansion: 'base', summary: 'Hold 2 of your faction\'s own techs (Valefar Assimilator copies do not count).' },
  { id: 'become-the-gatekeeper', name: 'Become the Gatekeeper', points: 1, phase: 'status', expansion: 'base', summary: 'Keep ships at both an alpha and a beta wormhole system.' },
  { id: 'control-the-region', name: 'Control the Region', points: 1, phase: 'status', expansion: 'base', summary: 'Have ships spread across 6 systems.' },
  { id: 'cut-supply-lines', name: 'Cut Supply Lines', points: 1, phase: 'status', expansion: 'base', summary: 'Park a ship in a system holding a rival\'s space dock.' },
  { id: 'establish-a-perimeter', name: 'Establish a Perimeter', points: 1, phase: 'status', expansion: 'base', summary: 'Field 4 PDS on the board.' },
  { id: 'forge-an-alliance', name: 'Forge an Alliance', points: 1, phase: 'status', expansion: 'base', summary: 'Hold 4 cultural planets.' },
  { id: 'form-a-spy-network', name: 'Form a Spy Network', points: 1, phase: 'status', expansion: 'base', summary: 'Throw away 5 action cards.' },
  { id: 'fuel-the-war-machine', name: 'Fuel the War Machine', points: 1, phase: 'status', expansion: 'base', summary: 'Field 3 space docks on the board.' },
  { id: 'gather-a-mighty-fleet', name: 'Gather a Mighty Fleet', points: 1, phase: 'status', expansion: 'base', summary: 'Field 5 dreadnoughts on the board.' },
  { id: 'learn-the-secrets-of-the-cosmos', name: 'Learn the Secrets of the Cosmos', points: 1, phase: 'status', expansion: 'base', summary: 'Keep ships in 3 systems that each sit next to an anomaly.' },
  { id: 'master-the-laws-of-physics', name: 'Master the Laws of Physics', points: 1, phase: 'status', expansion: 'base', summary: 'Hold 4 techs sharing one color.' },
  { id: 'mine-rare-metals', name: 'Mine Rare Metals', points: 1, phase: 'status', expansion: 'base', summary: 'Hold 4 hazardous planets.' },
  { id: 'monopolize-production', name: 'Monopolize Production', points: 1, phase: 'status', expansion: 'base', summary: 'Hold 4 industrial planets.' },
  { id: 'occupy-the-seat-of-the-empire', name: 'Occupy the Seat of the Empire', points: 1, phase: 'status', expansion: 'base', summary: 'Hold Mecatol Rex with 3 or more of your ships in its system.' },
  { id: 'threaten-enemies', name: 'Threaten Enemies', points: 1, phase: 'status', expansion: 'base', summary: 'Park a ship next door to a rival\'s home system.' },

  // ── Status window · PoK (11) ──
  { id: 'defy-space-and-time', name: 'Defy Space and Time', points: 1, phase: 'status', expansion: 'pok', summary: 'Station units in the wormhole nexus.' },
  { id: 'destroy-heretical-works', name: 'Destroy Heretical Works', points: 1, phase: 'status', expansion: 'pok', summary: 'Purge any 2 of your relic fragments.' },
  { id: 'establish-hegemony', name: 'Establish Hegemony', points: 1, phase: 'status', expansion: 'pok', summary: 'Hold planets totalling 12 or more influence.' },
  { id: 'foster-cohesion', name: 'Foster Cohesion', points: 1, phase: 'status', expansion: 'pok', summary: 'Share a border with every other player.' },
  { id: 'hoard-raw-materials', name: 'Hoard Raw Materials', points: 1, phase: 'status', expansion: 'pok', summary: 'Hold planets totalling 12 or more resources.' },
  { id: 'mechanize-the-military', name: 'Mechanize the Military', points: 1, phase: 'status', expansion: 'pok', summary: 'Post a mech on each of 4 different planets.' },
  { id: 'occupy-the-fringe', name: 'Occupy the Fringe', points: 1, phase: 'status', expansion: 'pok', summary: 'Amass 9 or more ground forces on a planet with no space dock of yours.' },
  { id: 'produce-en-masse', name: 'Produce en Masse', points: 1, phase: 'status', expansion: 'pok', summary: 'Concentrate 8 or more total Production in one system.' },
  { id: 'seize-an-icon', name: 'Seize an Icon', points: 1, phase: 'status', expansion: 'pok', summary: 'Hold a legendary planet.' },
  { id: 'stake-your-claim', name: 'Stake Your Claim', points: 1, phase: 'status', expansion: 'pok', summary: 'Hold a planet that shares its system with a rival\'s.' },
  { id: 'strengthen-bonds', name: 'Strengthen Bonds', points: 1, phase: 'status', expansion: 'pok', summary: 'Keep a rival\'s promissory note in your play area.' },

  // ── Action window · base (5) ──
  { id: 'destroy-their-greatest-ship', name: 'Destroy Their Greatest Ship', points: 1, phase: 'action', expansion: 'base', summary: 'Kill a rival\'s flagship or war sun.' },
  { id: 'make-an-example-of-their-world', name: 'Make an Example of Their World', points: 1, phase: 'action', expansion: 'base', summary: 'Wipe out a planet\'s last defenders during bombardment.' },
  { id: 'spark-a-rebellion', name: 'Spark a Rebellion', points: 1, phase: 'action', expansion: 'base', summary: 'Beat the victory-point leader in combat.' },
  { id: 'turn-their-fleets-to-dust', name: 'Turn Their Fleets to Dust', points: 1, phase: 'action', expansion: 'base', summary: 'Finish off a rival\'s last non-fighter ship with space cannon fire.' },
  { id: 'unveil-flagship', name: 'Unveil Flagship', points: 1, phase: 'action', expansion: 'base', summary: 'Win a space battle alongside your flagship — and it must survive.' },

  // ── Action window · PoK (7) ──
  { id: 'become-a-martyr', name: 'Become a Martyr', points: 1, phase: 'action', expansion: 'pok', summary: 'Lose a home-system planet.' },
  { id: 'betray-a-friend', name: 'Betray a Friend', points: 1, phase: 'action', expansion: 'pok', summary: 'Beat someone whose promissory note you were holding when the turn began.' },
  { id: 'brave-the-void', name: 'Brave the Void', points: 1, phase: 'action', expansion: 'pok', summary: 'Win a fight inside an anomaly.' },
  { id: 'darken-the-skies', name: 'Darken the Skies', points: 1, phase: 'action', expansion: 'pok', summary: 'Win a fight in a rival\'s home system.' },
  { id: 'demonstrate-your-power', name: 'Demonstrate Your Power', points: 1, phase: 'action', expansion: 'pok', summary: 'End a space battle still holding 3 or more non-fighter ships there.' },
  { id: 'fight-with-precision', name: 'Fight with Precision', points: 1, phase: 'action', expansion: 'pok', summary: 'Clear out a rival\'s last fighters with anti-fighter barrage.' },
  { id: 'prove-endurance', name: 'Prove Endurance', points: 1, phase: 'action', expansion: 'pok', summary: 'Outlast the table — pass last this round.' },

  // ── Agenda window · PoK (2) ──
  { id: 'dictate-policy', name: 'Dictate Policy', points: 1, phase: 'agenda', expansion: 'pok', summary: 'Have 3 or more laws standing in play.' },
  { id: 'drive-the-debate', name: 'Drive the Debate', points: 1, phase: 'agenda', expansion: 'pok', summary: 'Get elected by an agenda, or have one of your planets chosen.' },
]
