# TI4 full generic tech tree — design

Date: 2026-07-24
Cycle: #1 of the reordered "next cycles" list (tech tree first).

## Goal

Complete the generic (non-faction) technology tree for base + Prophecy of Kings, and make
the assistant tech-aware: tell the player which technologies they can research right now,
and let them research one through a proper logged, undoable action. Faction technologies are
explicitly **out of scope** — they belong to the later "leaders / mechs / faction-tech"
cycle.

This is scope **C**: catalog completeness **+** research-awareness **+** a research action.

## Confirmed decisions

- **Scope: C.** Catalog + "researchable now" awareness + a modeled research action.
- **Prereq depth: medium.** "Researchable now" counts icons from owned colored technologies
  **plus** readied tech-specialty planets the player controls. Skip abilities (AI Development
  Algorithm's ignore-1, faction effects) are surfaced as reminder text, not auto-computed.
- **Gating: loose.** The research action is available on the player's action-phase turn
  regardless of source. It opens a picker; nothing is hard-gated to the Technology strategy
  card, because research also comes from the secondary, action cards, and technologies.
- **Effect: grant + log only.** Researching adds the technology and appends a log entry.
  Payment (exhausting planets for resources, spending a strategy token) stays manual and is
  nudged by a reminder. The app has no resources pool; resources live on planets and are
  spent by exhausting them, so auto-payment would fight the existing model.

These follow the project's stated philosophy: **assistant, not referee** — every value stays
user-editable and undoable, nothing is enforced.

## Non-goals

- Faction technologies (deferred to the faction-depth cycle).
- Enforcing prerequisites, resource payment, or the once-per-round research limit.
- Modeling other players' Technology-card plays to auto-detect secondary windows.
- Auto-computing skip abilities (AI Development Algorithm, Nekro, etc.).

## 1. Data model

Extend `technologySchema` in `src/content/schema.ts` and the `Technology` type:

- Add `type: z.enum(['ability', 'unit-upgrade'])`.
- Add `expansion: z.enum(['base', 'pok'])`.

Rules:

- **Ability techs**: `color` in `{blue, green, yellow, red}`, `type: 'ability'`.
- **Unit upgrades**: `color: 'none'`, `type: 'unit-upgrade'`. The `type` field is what the
  `develop-weaponry` objective ("own 2 unit-upgrade technologies") keys off — today nothing
  marks unit upgrades, so that objective is undetectable. Fixing this closes the gap.
- A technology **provides** its own `color` as one prerequisite icon; `'none'` provides no
  icon. No extra field is needed for provision — the `color` field carries it.
- `prerequisites` (already present) is the multiset of colored icons required. Unit upgrades
  keep colored prerequisites.

A validation test enforces the invariant: `type === 'unit-upgrade'` iff `color === 'none'`.

## 2. Content

Complete `src/content/technologies.ts` from the current 17 generic technologies to the full
generic base + PoK set (roughly 30–33: four colors × ~6 tiers 0–3, plus the generic unit
upgrades). Populate `type` and `expansion` on every entry and resolve the three existing
`// verify prereq` TODO comments with sourced values. The exact catalog size is **determined
by sourcing, not guessed here** — the completeness test's expected count is locked to the
sourced set once it is compiled.

**Sourcing (accuracy matters).** Per `CLAUDE.md`: primary source is the TI4 fandom wiki via
its MediaWiki API; AsyncTI4 is authoritative for structured values. Values are **not** taken
from memory. The M3dnar dataset is not trusted for numbers.

## 3. Engine — researchable-now logic

New pure module `src/engine/research.ts`:

```
getResearchableTechs(state, technologies) -> { techId: string; researchable: boolean }[]
```

- Considers only **unowned** technologies (owned ones are filtered out or marked).
- **Supply** = a per-color count built from:
  - each owned technology's `color` (excluding `'none'`), one icon each; and
  - each planet the player controls with `techSpecialty` set **and** `exhausted === false`,
    one icon of that color each.
- A technology is `researchable` iff, for every color, `required[color] <= supply[color]`
  (multiset subset).
- Pure, no Svelte, no content imports beyond the `Technology` type; the technologies array is
  passed in as data. Directly unit-testable.

## 4. Action + reducer

- New `GameAction` variant: `{ type: 'researchTechnology'; techId: string; name: string }`.
  The `name` is carried in the action so the reducer can write a readable log line without
  importing content — mirroring the existing `gainPlanet` pattern.
- Reducer (`applyAction`): if `techId` is already in `technologyIds`, return state unchanged
  (idempotent). Otherwise append it and log `Researched <name>`.
- New `AvailableAction` type value `'research'`. `getAvailableActions` pushes a single
  "Research technology" entry whenever `phase === 'action' && !passed` (loose gate). This
  entry is a **trigger**: taking it opens the picker in `App.svelte` rather than dispatching
  immediately.

## 5. Reminders

`getReminders` gains action-phase reminders. It follows the `getAvailableActions` precedent of
accepting injected data via an **optional** options argument, so the technologies array (or a
precomputed researchable count) is passed in from `App.svelte` and the engine stays free of
content imports. The argument stays optional and backward-compatible: existing callers/tests
that omit it keep today's behavior, and the researchable-count reminder simply does not fire
when no count is supplied.

- If the player holds the Technology strategy card (initiative 7 in `strategyCardIds`):
  an info reminder describing, in our own words, that the primary lets them research (first
  free, second costs 6 resources) and that after playing it others may use the secondary
  (4 resources + a strategy token). Card text is never reproduced verbatim.
- An info reminder: "N technolog(y/ies) researchable now" where N comes from
  `getResearchableTechs`, pointing the player at the research action.

## 6. UI

- New presentational component `src/lib/components/ResearchPicker.svelte`:
  - Props: `technologies`, `ownedIds`, `researchableIds`, `onResearch(techId, name)`,
    `onClose`.
  - Lists unowned technologies grouped by color, with a unit-upgrades group.
  - Researchable technologies are highlighted; non-researchable ones are greyed with a short
    missing-prerequisite note **but remain clickable** — assistant, not referee.
  - Selecting one calls `onResearch` and closes.
- `App.svelte` (the only place store/engine/persistence wiring lives): computes the
  researchable set via `research.ts`, passes the count into `getReminders`, and opens the
  `ResearchPicker` when the `'research'` action is taken, dispatching `researchTechnology` on
  selection.
- `ActionPanel.svelte`: add a `'research'` entry to its `SUMMARIES` map.
- `ReferenceBrowser.svelte` tech tab: group technologies by color plus a unit-upgrade section,
  order within a group by tier (prerequisite count), and show the expansion tag.

## 7. Testing

- **Schema**: `type`/`expansion` parse; the `unit-upgrade` ⟺ `color: 'none'` invariant holds
  across the catalog.
- **Content**: catalog completeness (expected generic count), every faction-referenced tech id
  still resolves, no duplicate ids.
- **`research.ts`**: prerequisite math — owned-tech color counting, readied vs exhausted
  specialty planets, multiset subset at tiers 2–3, unit upgrades with mixed prerequisites.
- **Reducer**: `researchTechnology` adds the tech, is idempotent on a re-research, and logs.
- **Engine**: `getReminders` emits the Technology-card and researchable-count reminders under
  the right conditions; `getAvailableActions` emits `'research'` only in the action phase when
  not passed.
- **UI**: `ResearchPicker` renders grouped, highlights researchable, and calls `onResearch`;
  non-researchable entries are still clickable. `ReferenceBrowser` grouping renders.

## Boundaries preserved

`domain/` stays pure types. `engine/` stays pure (`research.ts`, `actions.ts`, `reminders.ts`)
with the technologies array injected as data. `state/reducers.ts` stays a pure logging reducer.
Content lives only in `src/content/`. Store/engine/persistence wiring stays only in
`App.svelte`. Components stay presentational.
