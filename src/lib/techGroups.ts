import type { Technology } from '../content/schema'

export const TECH_GROUPS: { key: string; label: string; match: (t: Technology) => boolean }[] = [
  { key: 'blue', label: 'Propulsion (blue)', match: (t) => !t.factionId && t.type === 'ability' && t.color === 'blue' },
  { key: 'green', label: 'Biotic (green)', match: (t) => !t.factionId && t.type === 'ability' && t.color === 'green' },
  { key: 'yellow', label: 'Cybernetic (yellow)', match: (t) => !t.factionId && t.type === 'ability' && t.color === 'yellow' },
  { key: 'red', label: 'Warfare (red)', match: (t) => !t.factionId && t.type === 'ability' && t.color === 'red' },
  { key: 'unit', label: 'Unit Upgrades', match: (t) => !t.factionId && t.type === 'unit-upgrade' },
  { key: 'faction', label: 'Faction', match: (t) => t.factionId != null },
]
