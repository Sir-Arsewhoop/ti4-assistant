# TI4 Faction Breadth — Design Spec

Design spec — 2026-07-24
Project: TI4 Turn Assistant (`D:\Documents\Claude\Projects\ti4-assistant`)
Follows: `2026-07-22-ti4-turn-assistant-design.md` (v1 architecture)

## Purpose

Expand faction content from the 3 seed factions to **all 24 base-game + Prophecy
of Kings (PoK) factions**, at the current data depth (starting state + ability
summaries + display-only setup aids). This unblocks setup/reference for any
faction a player's group actually uses. Faction *mechanical depth* (leaders,
mechs, faction tech, flagship, promissory) is explicitly deferred to a later
cycle.

## Scope

**In scope:**
- All 24 factions: 17 base + 7 PoK.
  - Base (17): The Arborec, The Barony of Letnev, The Clan of Saar, The Embers of
    Muaat, The Emirates of Hacan, The Federation of Sol, The Ghosts of Creuss,
    The L1Z1X Mindnet, The Mentak Coalition, The Naalu Collective, The Nekro
    Virus, Sardakk N'orr, The Universities of Jol-Nar, The Winnu, The Xxcha
    Kingdom, The Yin Brotherhood, The Yssaril Tribes.
  - PoK (7): The Argent Flight, The Empyrean, The Mahact Gene-Sorcerers, The
    Naaz-Rokha Alliance, The Nomad, The Titans of Ul, The Vuil'raith Cabal.
- Per faction: starting command tokens, starting technologies, home planet(s)
  with resources/influence/trait, starting units (display-only), starting
  commodities, starting trade goods, combat modifier, ability summaries,
  expansion tag.
- Any faction-specific **starting** technology not already in `technologies.ts`
  is added there so its id resolves in setup/reference.

**Out of scope (deferred to a later "faction depth" cycle):**
- Leaders (agent/commander/hero) names + abilities + unlock criteria.
- Mechs, faction technologies (non-starting), flagships, promissory notes.
- Thunder's Edge breakthroughs, Discordant Stars factions, Codex factions.
- Any change to the rules engine (`getAvailableActions`/`getReminders`).
- Unit tracking (starting units remain a display-only string list).
- An "enabled content" setup toggle / dropdown grouping (the `expansion` field
  is added to the data now to enable this later, but no UI is built this cycle).

## Sourcing & accuracy

The readily-available community JSON dataset (M3dnar/ti4-faction-reference) has
**verified value errors** (e.g. it lists Jol-Nar planets as Jol 2/0, Nar 3/1 with
a "Spatial Conduit Cylinder" starting tech and a spurious "Propagation" ability —
all wrong). It cannot be trusted as a value source. Therefore:

- **Primary source: the official-community TI4 fandom wiki**, fetched as
  structured wikitext via the MediaWiki API:
  `https://twilight-imperium.fandom.com/api.php?action=parse&page=<TITLE>&prop=wikitext&format=json&formatversion=2&redirects=1`
  (proven working via shell `Invoke-WebRequest`; `redirects=1` resolves the
  "The …" title variants). Each faction page uses a consistent `{{Main Infobox 1}}`
  template exposing: `starting_units`, `starting_technologies`, `starting_planets`
  (as `Name: res/inf`), `commodities`, `expansion`, plus a `== Faction Abilities ==`
  section listing ability names + text.
- **Secondary cross-check:** the M3dnar dataset (already downloaded) for
  `startingUnits` phrasing and planet `trait` (trait is display-only, low stakes).
- **My TI4 knowledge** reconciles the two; where sources disagree, the wiki wins,
  and any residual uncertainty is marked with a `// verify` comment for the user
  to spot-check against the physical faction sheet.
- **Abilities are authored, not copied.** The wiki's ability text is close to
  copyrighted card text; the app authors concise mechanical summaries in its own
  words (consistent with the v1 spec's copyright non-goal). The wiki is used only
  to get the correct ability *names* and understand the mechanic.

### Field derivation rules

- **Command tokens:** constant `{ tactic: 3, fleet: 3, strategy: 2 }` for every
  base + PoK faction (no faction varies the starting split).
- **Trade goods:** constant `0` at start for every faction.
- **Combat modifier:** `0` for all factions **except** Universities of Jol-Nar
  (`-1`, Fragile) and Sardakk N'orr (`+1`, Unrelenting).
- **Tech color mapping** (wiki category → our enum): biotic→`green`,
  propulsion→`blue`, cybernetic→`yellow`, warfare→`red`.
- **Planet trait** (wiki/dataset → our enum, lowercased): `cultural` |
  `industrial` | `hazardous`. Home planets without a printed trait omit the field.

## Schema changes (`src/content/schema.ts`)

Add to `planetSchema`:
- `trait: z.enum(['cultural','industrial','hazardous']).optional()`

Add to `factionSchema`:
- `expansion: z.enum(['base','pok'])`
- `starting.startingUnits: z.array(z.string()).min(1)` — display-only list, e.g.
  `['2 Carriers','1 Space Dock','3 Infantry','1 PDS']`.

`trait` is optional so existing GameState planets (which reuse `planetSchema`) and
export/import remain backward-compatible; `expansion` and `startingUnits` are
required on factions, so the 3 existing seed factions must be backfilled.

No change to `GameState`/`initialState` beyond what already flows: `startingUnits`
is faction content, not game state, so it is **not** copied into `GameState`
(setup/reference reads it from faction content by id). `trait` rides along on
planets copied into state harmlessly.

## Content changes

- `src/content/factions.ts`: grow from 3 → 24 entries; backfill the existing 3
  (Jol-Nar, Sol, Sardakk N'orr) with `expansion`, `startingUnits`, and planet
  `trait`. Existing numeric values for those 3 are wiki-confirmed and must not
  change.
- `src/content/technologies.ts`: add any faction-specific **starting** technology
  referenced by a faction but not already present, each with correct
  `color`/`prerequisites`/authored `summary`/`hasAction`. (Generic starting techs
  like Neural Motivator etc. already exist; Nomad's Sling Relay already exists.)
- `src/content/index.ts`: add a cross-validation step so every faction
  `startingTech` id resolves to a known technology; fail import (throw) otherwise.

## UI

No component changes. `SetupWizard.svelte` already renders every faction passed to
it in a flat `<select>`; the 24 factions appear automatically. `ReferenceBrowser`
already lists factions and will show the new `startingUnits`/`trait` if it renders
them — a follow-up may surface those fields, but that is not required here.

## Testing

`src/content/*.test.ts` (Vitest):
- **Count & split:** `content.factions.length === 24`; exactly 17 `expansion:'base'`
  and 7 `expansion:'pok'`.
- **Schema validity:** all 24 parse against `factionSchema` (zod parse in
  `index.ts` already enforces this at import; an explicit test documents it).
- **Id resolution:** every faction `starting.techIds` entry has a matching
  `technologies` entry (guards the "Spatial Conduit"-type error class).
- **Uniqueness:** faction ids unique; planet ids unique across factions.
- **Regression:** the 3 pre-existing factions keep their exact
  tokens/planets/techIds/commodities values (wiki-confirmed).
- **Invariants:** tokens are `3/3/2` and `tradeGoods` is `0` for all 24; combat
  modifier is nonzero only for Jol-Nar (`-1`) and Sardakk N'orr (`+1`).

`npm test`, `npm run check` (0/0), `npm run build` all green before merge.

## Data flow / persistence / offline

Unchanged from v1. This is a pure content + schema expansion; the engine,
reducers, store, persistence, and PWA layers are untouched. Existing saved games
remain loadable (only additive/optional schema fields).

## Risks

- **Value accuracy** is the main risk; mitigated by wiki-primary sourcing,
  cross-check, invariant tests, and `// verify` flags for user spot-check.
- **24 network fetches** at authoring time (dev-only, scripted); the shipped app
  makes no network calls.
