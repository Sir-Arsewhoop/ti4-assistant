<script lang="ts">
  import type { Faction, Technology, StrategyCard, Objective, PlanetCatalogEntry } from '../../content/schema'
  import ExpandableItem from './ExpandableItem.svelte'

  interface Props { factions: Faction[]; technologies: Technology[]; strategyCards: StrategyCard[]; publicObjectives: Objective[]; planets: PlanetCatalogEntry[] }
  let { factions, technologies, strategyCards, publicObjectives, planets }: Props = $props()

  type Kind = 'faction' | 'tech' | 'strategy' | 'objective' | 'planet'
  type Entry = { id: string; title: string; summary: string; detail: string }

  let kind = $state<Kind>('faction')
  let q = $state('')

  const all = $derived<Entry[]>(
    kind === 'faction'
      ? factions.map((f) => {
          const techName = (id: string) => technologies.find((t) => t.id === id)?.name ?? id
          const homePlanets = f.starting.planets.map((pl) => `${pl.name} (${pl.resources}/${pl.influence})`).join(', ') || 'none'
          const techs = f.starting.techIds.map(techName).join(', ') || 'none'
          const setup = `Home planets: ${homePlanets}\nStarting tech: ${techs}\nStarting units: ${f.starting.startingUnits.join(', ')}`
          return { id: f.id, title: f.name, summary: f.abilitySummaries[0] ?? '', detail: `${f.abilitySummaries.join('\n')}\n\n${setup}` }
        })
      : kind === 'tech'
        ? []
        : kind === 'strategy'
          ? strategyCards.map((c) => ({ id: String(c.initiative), title: `${c.initiative}. ${c.name}`, summary: c.primary, detail: `Primary: ${c.primary}\nSecondary: ${c.secondary}` }))
          : kind === 'objective'
            ? []
            : planets.map((pl) => ({
                id: pl.id,
                title: pl.name,
                summary: `${pl.resources}/${pl.influence}${pl.trait ? ` · ${pl.trait}` : ''}`,
                detail: [
                  `${pl.resources} resources / ${pl.influence} influence`,
                  pl.trait ? `Trait: ${pl.trait}` : 'No trait',
                  pl.techSpecialty ? `Tech specialty: ${pl.techSpecialty}` : null,
                  pl.legendary && pl.legendaryAbility ? `Legendary: ${pl.legendaryAbility}` : null,
                ]
                  .filter(Boolean)
                  .join('\n'),
              })),
  )
  const entries = $derived(all.filter((e) => e.title.toLowerCase().includes(q.toLowerCase())))

  const TECH_GROUPS: { key: string; label: string; match: (t: Technology) => boolean }[] = [
    { key: 'blue', label: 'Propulsion (blue)', match: (t) => t.type === 'ability' && t.color === 'blue' },
    { key: 'green', label: 'Biotic (green)', match: (t) => t.type === 'ability' && t.color === 'green' },
    { key: 'yellow', label: 'Cybernetic (yellow)', match: (t) => t.type === 'ability' && t.color === 'yellow' },
    { key: 'red', label: 'Warfare (red)', match: (t) => t.type === 'ability' && t.color === 'red' },
    { key: 'unit', label: 'Unit Upgrades', match: (t) => t.type === 'unit-upgrade' },
  ]
  const techGroups = $derived(
    TECH_GROUPS.map((g) => ({
      key: g.key,
      label: g.label,
      entries: technologies
        .filter((t) => g.match(t) && t.name.toLowerCase().includes(q.toLowerCase()))
        .sort((a, b) => a.prerequisites.length - b.prerequisites.length)
        .map((t) => ({
          id: t.id,
          title: t.name,
          summary: t.summary,
          detail: `${t.type === 'unit-upgrade' ? 'Unit upgrade' : t.color} · ${t.expansion.toUpperCase()} · prereqs: ${t.prerequisites.join(', ') || 'none'}\n${t.summary}`,
        })),
    })).filter((g) => g.entries.length > 0),
  )

  const objectiveGroups = $derived(
    (['I', 'II'] as const)
      .map((stage) => ({
        key: stage,
        label: `Stage ${stage}`,
        entries: publicObjectives
          .filter((o) => o.stage === stage && o.name.toLowerCase().includes(q.toLowerCase()))
          .map((o) => ({
            id: o.id,
            title: o.name,
            summary: o.summary,
            detail: `${o.points} VP · Stage ${o.stage} · ${o.expansion.toUpperCase()}\n${o.summary}`,
          })),
      }))
      .filter((g) => g.entries.length > 0),
  )

  const tabs: { k: Kind; label: string }[] = [
    { k: 'faction', label: 'Factions' },
    { k: 'tech', label: 'Tech' },
    { k: 'strategy', label: 'Strategy' },
    { k: 'objective', label: 'Objectives' },
    { k: 'planet', label: 'Planets' },
  ]
</script>

<div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:8px;">
  {#each tabs as t (t.k)}
    <button onclick={() => (kind = t.k)} style="padding:6px 10px;border:1px solid var(--border);border-radius:var(--radius);background:{kind === t.k ? 'var(--accent)' : 'var(--surface)'};color:{kind === t.k ? '#fff' : 'var(--text)'};cursor:pointer;">{t.label}</button>
  {/each}
</div>
<input placeholder="Search" bind:value={q} style="width:100%;padding:8px;margin-bottom:8px;border:1px solid var(--border);border-radius:var(--radius);background:var(--surface);color:var(--text);" />
{#if kind === 'objective'}
  {#each objectiveGroups as g (g.key)}
    <h4 style="font-weight:500;margin-top:12px;">{g.label}</h4>
    {#each g.entries as e (e.id)}
      <ExpandableItem title={e.title} summary={e.summary} detail={e.detail} />
    {/each}
  {/each}
  {#if objectiveGroups.length === 0}<p style="color:var(--text-muted);font-size:14px;">No matches.</p>{/if}
{:else if kind === 'tech'}
  {#each techGroups as g (g.key)}
    <h4 style="font-weight:500;margin-top:12px;">{g.label}</h4>
    {#each g.entries as e (e.id)}
      <ExpandableItem title={e.title} summary={e.summary} detail={e.detail} />
    {/each}
  {/each}
  {#if techGroups.length === 0}<p style="color:var(--text-muted);font-size:14px;">No matches.</p>{/if}
{:else}
  {#each entries as e (kind + e.id)}
    <ExpandableItem title={e.title} summary={e.summary} detail={e.detail} />
  {/each}
  {#if entries.length === 0}<p style="color:var(--text-muted);font-size:14px;">No matches.</p>{/if}
{/if}
