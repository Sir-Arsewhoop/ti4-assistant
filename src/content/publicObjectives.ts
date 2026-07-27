import type { Objective } from './schema'

export const publicObjectives: Objective[] = [
  // ── Stage I · base ──
  { id: 'corner-the-market', name: 'Corner the Market', points: 1, stage: 'I', expansion: 'base', phase: 'status', summary: 'Hold 4 planets that all share one trait.' },
  { id: 'develop-weaponry', name: 'Develop Weaponry', points: 1, stage: 'I', expansion: 'base', phase: 'status', summary: 'Have researched any 2 unit upgrades.' },
  { id: 'diversify-research', name: 'Diversify Research', points: 1, stage: 'I', expansion: 'base', phase: 'status', summary: 'Hold a pair of techs in each of 2 different colors.' },
  { id: 'erect-a-monument', name: 'Erect a Monument', points: 1, stage: 'I', expansion: 'base', phase: 'status', summary: 'Pay out 8 resources.' },
  { id: 'expand-borders', name: 'Expand Borders', points: 1, stage: 'I', expansion: 'base', phase: 'status', summary: 'Hold 6 planets located outside home systems.' },
  { id: 'found-research-outposts', name: 'Found Research Outposts', points: 1, stage: 'I', expansion: 'base', phase: 'status', summary: 'Hold 3 planets bearing tech specialties.' },
  { id: 'intimidate-council', name: 'Intimidate Council', points: 1, stage: 'I', expansion: 'base', phase: 'status', summary: 'Keep ships in 2 separate systems next to Mecatol Rex.' },
  { id: 'lead-from-the-front', name: 'Lead From the Front', points: 1, stage: 'I', expansion: 'base', phase: 'status', summary: 'Use up 3 command tokens drawn from tactic, strategy, or both.' },
  { id: 'negotiate-trade-routes', name: 'Negotiate Trade Routes', points: 1, stage: 'I', expansion: 'base', phase: 'status', summary: 'Pay out 5 trade goods.' },
  { id: 'sway-the-council', name: 'Sway the Council', points: 1, stage: 'I', expansion: 'base', phase: 'status', summary: 'Pay out 8 influence.' },

  // ── Stage I · PoK ──
  { id: 'amass-wealth', name: 'Amass Wealth', points: 1, stage: 'I', expansion: 'pok', phase: 'status', summary: 'Pay 3 each of influence, resources, and trade goods.' },
  { id: 'build-defenses', name: 'Build Defenses', points: 1, stage: 'I', expansion: 'pok', phase: 'status', summary: 'Own at least 4 structures.' },
  { id: 'discover-lost-outposts', name: 'Discover Lost Outposts', points: 1, stage: 'I', expansion: 'pok', phase: 'status', summary: 'Hold 2 planets carrying attachment cards.' },
  { id: 'engineer-a-marvel', name: 'Engineer a Marvel', points: 1, stage: 'I', expansion: 'pok', phase: 'status', summary: 'Get your flagship, or a war sun, onto the board.' },
  { id: 'explore-deep-space', name: 'Explore Deep Space', points: 1, stage: 'I', expansion: 'pok', phase: 'status', summary: 'Station units across 3 planetless systems.' },
  { id: 'improve-infrastructure', name: 'Improve Infrastructure', points: 1, stage: 'I', expansion: 'pok', phase: 'status', summary: 'Build on 3 planets away from your home system.' },
  { id: 'make-history', name: 'Make History', points: 1, stage: 'I', expansion: 'pok', phase: 'status', summary: 'Station units in 2 systems holding an anomaly, a legendary planet, or Mecatol Rex.' },
  { id: 'populate-the-outer-rim', name: 'Populate the Outer Rim', points: 1, stage: 'I', expansion: 'pok', phase: 'status', summary: 'Station units in 3 board-edge systems that are not your home.' },
  { id: 'push-boundaries', name: 'Push Boundaries', points: 1, stage: 'I', expansion: 'pok', phase: 'status', summary: 'Out-planet 2 of your neighbors — hold more than each of them.' },
  { id: 'raise-a-fleet', name: 'Raise a Fleet', points: 1, stage: 'I', expansion: 'pok', phase: 'status', summary: 'Mass 5 or more non-fighter ships together in one system.' },

  // ── Stage II · base ──
  { id: 'centralize-galactic-trade', name: 'Centralize Galactic Trade', points: 2, stage: 'II', expansion: 'base', phase: 'status', summary: 'Pay out 10 trade goods.' },
  { id: 'conquer-the-weak', name: 'Conquer the Weak', points: 2, stage: 'II', expansion: 'base', phase: 'status', summary: 'Hold a planet inside someone else\'s home system.' },
  { id: 'form-galactic-brain-trust', name: 'Form Galactic Brain Trust', points: 2, stage: 'II', expansion: 'base', phase: 'status', summary: 'Hold 5 planets bearing tech specialties.' },
  { id: 'found-a-golden-age', name: 'Found a Golden Age', points: 2, stage: 'II', expansion: 'base', phase: 'status', summary: 'Pay out 16 resources.' },
  { id: 'galvanize-the-people', name: 'Galvanize the People', points: 2, stage: 'II', expansion: 'base', phase: 'status', summary: 'Use up 6 command tokens drawn from tactic, strategy, or both.' },
  { id: 'manipulate-galactic-law', name: 'Manipulate Galactic Law', points: 2, stage: 'II', expansion: 'base', phase: 'status', summary: 'Pay out 16 influence.' },
  { id: 'master-the-sciences', name: 'Master the Sciences', points: 2, stage: 'II', expansion: 'base', phase: 'status', summary: 'Hold a pair of techs in each of all 4 colors.' },
  { id: 'revolutionize-warfare', name: 'Revolutionize Warfare', points: 2, stage: 'II', expansion: 'base', phase: 'status', summary: 'Have researched any 3 unit upgrades.' },
  { id: 'subdue-the-galaxy', name: 'Subdue the Galaxy', points: 2, stage: 'II', expansion: 'base', phase: 'status', summary: 'Hold 11 planets located outside home systems.' },
  { id: 'unify-the-colonies', name: 'Unify the Colonies', points: 2, stage: 'II', expansion: 'base', phase: 'status', summary: 'Hold 6 planets that all share one trait.' },

  // ── Stage II · PoK ──
  { id: 'achieve-supremacy', name: 'Achieve Supremacy', points: 2, stage: 'II', expansion: 'pok', phase: 'status', summary: 'Park your flagship or a war sun in Mecatol Rex\'s system or a rival\'s home system.' },
  { id: 'become-a-legend', name: 'Become a Legend', points: 2, stage: 'II', expansion: 'pok', phase: 'status', summary: 'Station units in 4 systems holding an anomaly, a legendary planet, or Mecatol Rex.' },
  { id: 'command-an-armada', name: 'Command an Armada', points: 2, stage: 'II', expansion: 'pok', phase: 'status', summary: 'Mass 8 or more non-fighter ships together in one system.' },
  { id: 'construct-massive-cities', name: 'Construct Massive Cities', points: 2, stage: 'II', expansion: 'pok', phase: 'status', summary: 'Own at least 7 structures.' },
  { id: 'control-the-borderlands', name: 'Control the Borderlands', points: 2, stage: 'II', expansion: 'pok', phase: 'status', summary: 'Station units in 5 board-edge systems that are not your home.' },
  { id: 'hold-vast-reserves', name: 'Hold Vast Reserves', points: 2, stage: 'II', expansion: 'pok', phase: 'status', summary: 'Pay 6 each of influence, resources, and trade goods.' },
  { id: 'patrol-vast-territories', name: 'Patrol Vast Territories', points: 2, stage: 'II', expansion: 'pok', phase: 'status', summary: 'Station units across 5 planetless systems.' },
  { id: 'protect-the-border', name: 'Protect the Border', points: 2, stage: 'II', expansion: 'pok', phase: 'status', summary: 'Build on 5 planets away from your home system.' },
  { id: 'reclaim-ancient-monuments', name: 'Reclaim Ancient Monuments', points: 2, stage: 'II', expansion: 'pok', phase: 'status', summary: 'Hold 3 planets carrying attachment cards.' },
  { id: 'rule-distant-lands', name: 'Rule Distant Lands', points: 2, stage: 'II', expansion: 'pok', phase: 'status', summary: 'Hold 2 planets, each in or beside a different rival\'s home system.' },
]
