# TI4 Planet Catalog ("traits matter") — Design Spec

Design spec — 2026-07-24
Project: TI4 Turn Assistant (`D:\Documents\Claude\Projects\ti4-assistant`)
Follows: faction-breadth cycle (@939f07b). Depends on the `trait` schema field added there.

## Purpose

Make planet traits meaningful by adding a **catalog of all conquerable (non-home)
planets** and letting the player add/remove planets from their tracked state. Today
`BoardEditor` can only toggle a planet exhausted/ready — there is **no way to gain or
remove a planet**, so conquest isn't tracked at all. This cycle fixes that gap and, in
doing so, carries each planet's trait / tech specialty / legendary ability into the
app.

## Scope

**In scope:**
- New content catalog `src/content/planets.ts`: every **non-home** planet from **base +
  Prophecy of Kings**, including **Mecatol Rex** and **legendary** planets (Primor,
  Hope's End, Mallice, …).
- Per planet: id, name, resources, influence, optional trait, optional tech specialty,
  legendary flag, optional authored legendary-ability summary, expansion tag.
- `gainPlanet` / `removePlanet` state actions + reducer logic.
- `Planet` state type gains optional `techSpecialty` (trait already added last cycle).
- BoardEditor: a "gain a planet" search-picker + per-planet remove control.
- ReferenceBrowser: a "Planets" tab (searchable catalog with detail).

**Out of scope (later cycles):**
- Trait-based engine reminders or objective scoring.
- The PoK exploration deck / exploration mechanic.
- Non-legendary planet special text (only legendary planets get an ability summary).
- Home planets in the catalog (they live in faction data and are already in state).
- Wormhole/anomaly/hyperlane tiles, Thunder's Edge / Discordant Stars / Codex planets.

## Sourcing

**AsyncTI4 per-planet JSON** (`github.com/AsyncTI4/TI4_map_generator_bot`,
`src/main/resources/planets/<id>.json`), fetched raw via `Invoke-WebRequest` (proven).
It is authoritative: cross-checking it against our 24 factions' home planets produced
zero res/inf conflicts. Extraction filter for the catalog:

- `source` ∈ { `base`, `pok` }
- `factionHomeworld` == `null` (drops home planets)
- keep planets whose `planetType` is `CULTURAL` / `INDUSTRIAL` / `HAZARDOUS` / `MR`
  (Mecatol), or that have a `legendaryAbilityName`. Drop everything else (empty tiles,
  hyperlanes, wormhole-only).

### Field mapping (AsyncTI4 → catalog)

| AsyncTI4 field | Catalog field | Mapping |
|---|---|---|
| `name` | `name` | verbatim |
| `resources` / `influence` | `resources` / `influence` | verbatim (ints) |
| `planetType` | `trait` | CULTURAL→cultural, INDUSTRIAL→industrial, HAZARDOUS→hazardous; `MR` and anything else → omit (no trait) |
| `techSpecialties[0]` | `techSpecialty` | WARFARE→red, PROPULSION→blue, CYBERNETIC→yellow, BIOTIC→green; null → omit |
| `legendaryAbilityName` != null | `legendary` | `true` / `false` |
| `legendaryAbilityText` | `legendaryAbility` | **authored** concise paraphrase (our words, not verbatim); present only when legendary |
| `source` | `expansion` | base→base, pok→pok |
| slugified `name`/`id` | `id` | stable kebab id, unique across catalog and not colliding with home-planet ids |

Legendary-ability summaries are authored (copyright), consistent with the faction
ability-summary rule.

## Schema & state changes

`src/content/schema.ts`:
- Add `techSpecialty` optional to `planetSchema`:
  `techSpecialty: z.enum(['red','blue','yellow','green']).optional()`
- Add `planetCatalogSchema`:
  ```
  { id, name, resources:int≥0, influence:int≥0,
    trait?: 'cultural'|'industrial'|'hazardous',
    techSpecialty?: 'red'|'blue'|'yellow'|'green',
    legendary: boolean,
    legendaryAbility?: string,
    expansion: 'base'|'pok' }
  ```
  Export `PlanetCatalogEntry` type.

`src/content/index.ts`: parse + expose `content.planets`.

`src/domain/types.ts`:
- `Planet` gains optional `techSpecialty: 'red'|'blue'|'yellow'|'green'`.
- `GameAction` union gains `{ type:'gainPlanet'; planet: Planet }` and
  `{ type:'removePlanet'; planetId: string }`.

`src/state/reducers.ts`:
- `gainPlanet`: append `action.planet` to `state.planets` **iff** no existing planet has
  that id (idempotent); log `Gained <name>`.
- `removePlanet`: filter out the id; log `Removed <name>` (name resolved from current
  state before removal; no-op if absent).
- Reducer stays content-free — the UI builds the `Planet` object from a catalog entry
  (`{ ...catalogFields, exhausted:false }`, dropping catalog-only fields legendary/
  legendaryAbility/expansion).

## UI

`src/lib/components/BoardEditor.svelte` (add `planetCatalog: PlanetCatalogEntry[]` prop):
- "Gain a planet" section: a search input filtering catalog entries **not already owned**
  (by id); clicking one dispatches `gainPlanet` with the built `Planet`.
- Each owned planet row gains a remove (✕) button dispatching `removePlanet`. The
  existing exhaust/ready toggle stays.

`src/lib/components/ReferenceBrowser.svelte` (add `planets: PlanetCatalogEntry[]` prop):
- New `'planet'` tab "Planets". Entry: title = name, summary = `res/inf · trait`,
  detail = trait, tech specialty, and legendary ability when present.

`src/App.svelte` / `src/lib/components/MenuSheet.svelte`: thread `content.planets` into
ReferenceBrowser and BoardEditor (following the existing prop-drilling pattern; no store
logic in components).

## Data flow

Setup unchanged. When the player conquers a planet in the real game, they open the menu →
Edit state → "gain a planet" → pick it; the reducer appends it (with trait/tech
specialty) to `state.planets`, which the dashboard already renders. Autosave/undo work
via the existing log-based mechanism. Fully offline (catalog is bundled data; no runtime
fetch).

## Testing

- **Catalog** (`content.test.ts` or new `planets.test.ts`): parses against schema; ids
  unique and disjoint from home-planet ids; both `base` and `pok` entries present;
  Mecatol Rex present; every `legendary:true` entry has a `legendaryAbility`; traits only
  from the enum.
- **Reducers** (`reducers.test.ts`): `gainPlanet` adds and is idempotent on repeat id;
  `removePlanet` removes and is a no-op for unknown id; both append a log entry.
- **BoardEditor** (`BoardEditor.svelte.test.ts`): picking a catalog planet dispatches
  `gainPlanet`; ✕ dispatches `removePlanet`.
- **ReferenceBrowser** (`ReferenceBrowser.svelte.test.ts`): Planets tab lists catalog and
  filters by search.
- `npm test`, `npm run check` (0/0), `npm run build` green before finishing.

## Risks

- **Catalog size / extraction correctness** — mitigated by scripted extraction from a
  single authoritative source + schema validation + unique-id test. Legendary summaries
  authored (small set).
- **id collisions** with existing home-planet ids (e.g. a catalog planet sharing a name)
  — the uniqueness test covers catalog-internal collisions; home ids are distinct
  (home planets excluded from the catalog), but the extraction will namespace-check
  against the known home-planet id list to be safe.
