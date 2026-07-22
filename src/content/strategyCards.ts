import type { StrategyCard } from './schema'

export const strategyCards: StrategyCard[] = [
  { initiative: 1, name: 'Leadership', primary: 'Gain 3 command tokens, then buy more by spending influence (1 token per 3 influence).', secondary: 'Spend influence to gain command tokens (1 per 3 influence).' },
  { initiative: 2, name: 'Diplomacy', primary: 'Choose a system; each other player places a command token there (they cannot activate it). Ready 2 of your planets.', secondary: 'Spend a token to ready 2 planets.' },
  { initiative: 3, name: 'Politics', primary: 'Draw and choose the new speaker, draw 2 action cards, and reorder the agenda deck top/bottom.', secondary: 'Spend a token to draw 2 action cards.' },
  { initiative: 4, name: 'Construction', primary: 'Place a structure (space dock or PDS) on a planet you control, plus a second one.', secondary: 'Spend a token to place 1 structure.' },
  { initiative: 5, name: 'Trade', primary: 'Gain 3 trade goods, replenish your commodities, and let chosen players replenish theirs.', secondary: 'Spend a token to replenish commodities.' },
  { initiative: 6, name: 'Warfare', primary: 'Remove one of your command tokens from the board and redistribute your tokens.', secondary: 'Spend a token to produce units at a space dock in your home system.' },
  { initiative: 7, name: 'Technology', primary: 'Research 1 technology; research a 2nd by paying 6 resources.', secondary: 'Spend a token and 4 resources to research 1 technology.' },
  { initiative: 8, name: 'Imperial', primary: 'Score 1 public objective you qualify for (if any), and gain 1 victory point if you control Mecatol Rex; draw a secret objective.', secondary: 'Spend a token to draw a secret objective.' },
]
