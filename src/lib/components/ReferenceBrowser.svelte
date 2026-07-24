<script lang="ts">
  import type { Faction, Technology, StrategyCard, Objective } from '../../content/schema'
  import ExpandableItem from './ExpandableItem.svelte'

  interface Props { factions: Faction[]; technologies: Technology[]; strategyCards: StrategyCard[]; objectives: Objective[] }
  let { factions, technologies, strategyCards, objectives }: Props = $props()

  type Kind = 'faction' | 'tech' | 'strategy' | 'objective'
  type Entry = { id: string; title: string; summary: string; detail: string }

  let kind = $state<Kind>('faction')
  let q = $state('')

  const all = $derived<Entry[]>(
    kind === 'faction'
      ? factions.map((f) => {
          const techName = (id: string) => technologies.find((t) => t.id === id)?.name ?? id
          const planets = f.starting.planets.map((pl) => `${pl.name} (${pl.resources}/${pl.influence})`).join(', ') || 'none'
          const techs = f.starting.techIds.map(techName).join(', ') || 'none'
          const setup = `Home planets: ${planets}\nStarting tech: ${techs}\nStarting units: ${f.starting.startingUnits.join(', ')}`
          return { id: f.id, title: f.name, summary: f.abilitySummaries[0] ?? '', detail: `${f.abilitySummaries.join('\n')}\n\n${setup}` }
        })
      : kind === 'tech'
        ? technologies.map((t) => ({ id: t.id, title: t.name, summary: t.summary, detail: `${t.color} · prereqs: ${t.prerequisites.join(', ') || 'none'}\n${t.summary}` }))
        : kind === 'strategy'
          ? strategyCards.map((c) => ({ id: String(c.initiative), title: `${c.initiative}. ${c.name}`, summary: c.primary, detail: `Primary: ${c.primary}\nSecondary: ${c.secondary}` }))
          : objectives.map((o) => ({ id: o.id, title: o.name, summary: o.summary, detail: `${o.points} VP · ${o.phase}\n${o.summary}` })),
  )
  const entries = $derived(all.filter((e) => e.title.toLowerCase().includes(q.toLowerCase())))

  const tabs: { k: Kind; label: string }[] = [
    { k: 'faction', label: 'Factions' },
    { k: 'tech', label: 'Tech' },
    { k: 'strategy', label: 'Strategy' },
    { k: 'objective', label: 'Objectives' },
  ]
</script>

<div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:8px;">
  {#each tabs as t (t.k)}
    <button onclick={() => (kind = t.k)} style="padding:6px 10px;border:1px solid var(--border);border-radius:var(--radius);background:{kind === t.k ? 'var(--accent)' : 'var(--surface)'};color:{kind === t.k ? '#fff' : 'var(--text)'};cursor:pointer;">{t.label}</button>
  {/each}
</div>
<input placeholder="Search" bind:value={q} style="width:100%;padding:8px;margin-bottom:8px;border:1px solid var(--border);border-radius:var(--radius);background:var(--surface);color:var(--text);" />
{#each entries as e (kind + e.id)}
  <ExpandableItem title={e.title} summary={e.summary} detail={e.detail} />
{/each}
{#if entries.length === 0}<p style="color:var(--text-muted);font-size:14px;">No matches.</p>{/if}
