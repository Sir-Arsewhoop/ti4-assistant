# TI4 faction technologies — design

Date: 2026-08-04
Cycle: Faction depth, sub-cycle **3a of 3**. Sub-cycles 3b (leaders) and 3c (mechs) are
specified separately.

## Goal

Add every faction's own technologies to the tech tree, so the research flow shipped by the
tech-tree cycle offers a player their faction techs alongside the generic ones — and stops
offering generic unit upgrades their faction sheet replaces.

## Why faction depth is split into three

The original "leaders / mechs / faction-tech" cycle covers roughly 161 content entries and
three unrelated state models. That is twice the objectives cycle, which was itself split. The
decomposition, in build order:

- **3a (this spec)** — faction technologies. A pure extension of proven machinery: no new
  state, since `technologyIds` already holds researched techs.
- **3b** — leaders (83 cards: 28 agents, 26 commanders, 29 heroes). The largest: replaces the
  unused three-boolean `LeaderState` stub with real per-leader unlock / exhaust / purge state.
- **3c** — mechs (26, stats plus deploy abilities). Mostly reference-shaped, since the app
  tracks no unit counts.

## Confirmed decisions

- **One catalog, not two.** Faction techs live in `technologies.ts` beside the generic ones,
  distinguished by an optional `factionId`. A faction tech *is* a technology with an owner: same
  shape, same prerequisite maths, same picker and reference rendering. This differs deliberately
  from the secret-objective cycle, where a standalone schema was right because secrets genuinely
  differ in shape; here nothing differs, so a parallel schema would buy only merge logic at
  every call site.
- **Supersession is modelled.** Thirteen of the fourteen faction unit upgrades replace a generic
  one, and a faction that has the variant cannot research the generic at all. A `replaces` field
  lets the picker drop the superseded generic. Without it the picker would offer a tech the
  player is not allowed to take — precisely the confusion this app exists to prevent.
- **Colourless ability techs are allowed.** Nekro's two Valefar Assimilators are `color: 'none'`
  but are not unit upgrades, so the `unit-upgrade ⟺ color:'none'` invariant relaxes to one-way.
- **The picker groups faction techs separately**; the reference groups them by owning faction.
- **Assistant, not referee.** Filtering governs what is *offered*, exactly as the picker already
  hides owned techs. Any technology can still be added or removed directly in the board editor,
  and every value stays editable and undoable.

## Non-goals

- Leaders and mechs (sub-cycles 3b and 3c).
- The Council Keleres and its two techs: Keleres is a Codex faction, and the 24-faction catalog
  does not include it.
- Modelling the Valefar Assimilator tokens (which technology each has copied). The cards are
  catalogued and their behaviour described; the token state is not tracked.
- Any change to starting technologies — see below.

## 1. Data model

Extend `technologySchema` in `src/content/schema.ts` with two optional fields:

- `factionId: z.string().optional()` — absent means generic. When present it is the id of the
  owning faction, using **our** faction ids.
- `replaces: z.string().optional()` — for a faction unit upgrade, the id of the generic
  technology it supersedes.

**Relax the type invariant.** `src/content/content.test.ts` currently asserts
`type === 'unit-upgrade'` ⟺ `color === 'none'`. Nekro's Valefar Assimilator X and Y are
colourless ability cards, so the reverse direction is false. The test becomes one-way:
`type === 'unit-upgrade'` implies `color === 'none'`.

This also **retires a deferred-polish item**: `CLAUDE.md` carries a note to consider enforcing
that invariant with a Zod `.refine()`. These two cards prove the strict form wrong, so the note
should be dropped rather than acted on.

## 2. Content

`src/content/technologies.ts` grows from 33 entries to **81**: the 33 existing generic
technologies plus **48 faction technologies — exactly 2 for each of the 24 factions**.

**Sourcing.** From AsyncTI4 `data/technologies/pok.json`, taking entries that carry a `faction`
key. Notes on reading that file, all verified:

- It yields 52 such entries. Four belong to Nekro, but two of those are internal placeholders
  (`???\_NULL\_REFERENCE\_???`, `???\_ERROR\_ERROR\_???`) standing in for the assimilator tokens,
  not real technologies. Excluding them leaves 50.
- The remaining two belong to `keleres`, a 25th faction key that is out of scope. That leaves
  the 48 this cycle ships, matching the count of distinct techs referenced by the 24 factions'
  own `factionTech` lists.
- **Five faction ids differ from ours** and must be mapped: `sardakk` → `sardakk-norr`,
  `jolnar` → `jol-nar`, `naaz` → `naaz-rokha`, `ghost` → `creuss` (Ghosts of Creuss), and
  `cabal` → `vuilraith` (Vuil'raith Cabal). The other 19 match exactly.
- Thirteen faction unit upgrades carry a `baseUpgrade` naming the generic they replace; that
  becomes `replaces`. Nomad's Memoria II has no `baseUpgrade` — it upgrades their unique
  flagship — so it takes no `replaces`. Those values are AsyncTI4 aliases (`inf2`, `dd2`, `ws`,
  `cv2`, `dn2`, `ff2`, `sd2`, `cr2`, `pds2`) and must be translated to our kebab-case ids
  (`infantry-ii`, `destroyer-ii`, `war-sun`, `carrier-ii`, `dreadnought-ii`, `fighter-ii`,
  `space-dock-ii`, `cruiser-ii`, `pds-ii`); a test asserts every `replaces` resolves.

**Copyright.** Summaries are authored in our own words; the source `text` field is reference
material and must not be copied through. Forty-eight new summaries make this the largest
copyright surface of any cycle so far, and reviews in the two previous cycles each caught
wording that had drifted toward the printed cards. It gets explicit attention in both
implementation and review: distinct sentence structure and word choice, same mechanical meaning.

**Starting technologies need no change.** No faction begins the game holding a faction
technology — verified across all 24 in AsyncTI4's faction data — so the existing all-generic
`starting.techIds` are already correct.

## 3. Engine

`getResearchableTechs` in `src/engine/research.ts` gains two filters ahead of its existing
prerequisite maths:

- **Ownership** — a technology is a candidate only if `!t.factionId || t.factionId === state.factionId`.
- **Supersession** — a generic technology is dropped if its id appears as the `replaces` value of
  any technology belonging to the player's faction.

Prerequisites are identical between each faction unit upgrade and the generic it replaces (both
carriers need two blue, and so on), so the icon-supply calculation is untouched. Nekro's
colourless techs contribute no icons, which the existing `color !== 'none'` guard already
handles. The module stays pure, with the technologies array still passed in as a parameter.

## 4. Picker

`src/lib/techGroups.ts` gains a Faction group, appended after the existing five, matched by
`t.factionId != null`. Because the engine already filters candidates to the player's own
faction, that group contains their two technologies — placed last so they are easy to find
rather than lost among thirty-odd generics.

Group order and matching live in `TECH_GROUPS`, which `ResearchPicker` and `ReferenceBrowser`
already share, so the picker needs no other change.

## 5. Reference

The tech tab keeps its five generic groups and appends one group per faction, each headed with
the faction's name. Unlike the picker, the reference is not filtered — an opponent's technology
is exactly the thing a player needs to look up mid-game.

Grouping by faction rather than lumping all 48 together is what makes that lookup possible: the
reference search box matches on technology *name* only, so no other layout lets a player find a
given faction's techs at all.

The per-faction groups are derived from the faction list rather than hardcoded, so the roster
stays in one place — and `ReferenceBrowser` already receives `factions` for its Factions tab, so
no new prop is needed. `GroupedEntries` already renders an arbitrary list of groups, so this is a
data change rather than a rendering change.

## 6. Testing

- **Schema** — `factionId` and `replaces` parse and are optional; the relaxed one-way invariant
  holds across the catalog.
- **Content** — 81 technologies total, 48 with a `factionId`, exactly 2 per faction, all 24
  factions covered, no Keleres entry, unique ids; every `factionId` resolves to a real faction
  and every `replaces` to a real generic unit upgrade.
- **Engine** — a player is offered their own faction techs and never another faction's; a
  superseded generic is not offered to a faction holding its variant but *is* offered to a
  faction without one; a faction unit upgrade obeys the same prerequisites as the generic it
  replaces; Valefar Assimilators contribute no prerequisite icons.
- **Picker** — the Faction group renders for a player with faction techs available.
- **Reference** — per-faction groups render, and the pre-existing generic tech-tab groups still
  render unchanged.

## Boundaries preserved

`domain/` stays pure types. `engine/` stays pure with content injected as parameters. Content
lives only in `src/content/`. Store, engine, and persistence wiring stays only in `App.svelte`.
Components stay presentational. No new state, and no persistence migration — this cycle adds
content and filtering, not game state.
