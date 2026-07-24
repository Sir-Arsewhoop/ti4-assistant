<script lang="ts">
  import type { GameState, GameAction, Planet } from '../../domain/types'
  import type { Technology, PlanetCatalogEntry } from '../../content/schema'

  interface Props { state: GameState; technologies: Technology[]; planetCatalog?: PlanetCatalogEntry[]; onAction: (a: GameAction) => void }
  let { state: gameState, technologies, planetCatalog = [], onAction }: Props = $props()

  function setNum(field: 'victoryPoints' | 'tradeGoods' | 'commodities', delta: number) {
    onAction({ type: 'editState', patch: { [field]: Math.max(0, gameState[field] + delta) } })
  }
  function setPool(pool: 'tactic' | 'fleet' | 'strategy', delta: number) {
    onAction({ type: 'editState', patch: { command: { ...gameState.command, [pool]: Math.max(0, gameState.command[pool] + delta) } } })
  }
  function togglePlanet(id: string) {
    onAction({ type: 'editState', patch: { planets: gameState.planets.map((p) => (p.id === id ? { ...p, exhausted: !p.exhausted } : p)) } })
  }
  function toggleTech(id: string) {
    const owned = gameState.technologyIds.includes(id)
    onAction({ type: 'editState', patch: { technologyIds: owned ? gameState.technologyIds.filter((t) => t !== id) : [...gameState.technologyIds, id] } })
  }

  let planetQuery = $state('')
  const ownedIds = $derived(new Set(gameState.planets.map((p) => p.id)))
  const catalogMatches = $derived(
    planetCatalog
      .filter((c) => !ownedIds.has(c.id) && c.name.toLowerCase().includes(planetQuery.toLowerCase()))
      .slice(0, 8),
  )
  function gain(c: PlanetCatalogEntry) {
    const planet: Planet = { id: c.id, name: c.name, resources: c.resources, influence: c.influence, exhausted: false, trait: c.trait, techSpecialty: c.techSpecialty }
    onAction({ type: 'gainPlanet', planet })
    planetQuery = ''
  }
  function removePlanet(id: string) {
    onAction({ type: 'removePlanet', planetId: id })
  }

  const numeric: { field: 'victoryPoints' | 'tradeGoods' | 'commodities'; label: string }[] = [
    { field: 'victoryPoints', label: 'victory points' },
    { field: 'tradeGoods', label: 'trade goods' },
    { field: 'commodities', label: 'commodities' },
  ]
</script>

<h3 style="font-size:16px;font-weight:500;">Edit your state</h3>
<p style="color:var(--text-muted);font-size:13px;">The app guides; it never locks you in. Fix anything here.</p>

{#each numeric as n (n.field)}
  <div style="display:flex;align-items:center;gap:8px;margin:4px 0;">
    <span style="width:110px;">{n.label}</span>
    <button onclick={() => setNum(n.field, -1)} aria-label={`decrease ${n.label}`} style="width:32px;">-</button>
    <span style="width:24px;text-align:center;">{gameState[n.field]}</span>
    <button onclick={() => setNum(n.field, 1)} aria-label={`increase ${n.label}`} style="width:32px;">+</button>
  </div>
{/each}

{#each (['tactic', 'fleet', 'strategy'] as const) as pool (pool)}
  <div style="display:flex;align-items:center;gap:8px;margin:4px 0;">
    <span style="width:110px;text-transform:capitalize;">{pool} pool</span>
    <button onclick={() => setPool(pool, -1)} aria-label={`decrease ${pool}`} style="width:32px;">-</button>
    <span style="width:24px;text-align:center;">{gameState.command[pool]}</span>
    <button onclick={() => setPool(pool, 1)} aria-label={`increase ${pool}`} style="width:32px;">+</button>
  </div>
{/each}

<h4 style="font-weight:500;margin-top:12px;">Planets</h4>
{#each gameState.planets as p (p.id)}
  <div style="display:flex;align-items:center;gap:6px;margin:4px 0;">
    <button onclick={() => togglePlanet(p.id)} aria-label={`toggle ${p.name}`} style="flex:1;text-align:left;padding:6px 10px;border:1px solid var(--border);border-radius:var(--radius);background:var(--surface);cursor:pointer;">{p.name}: {p.exhausted ? 'exhausted' : 'ready'}</button>
    <button onclick={() => removePlanet(p.id)} aria-label={`remove ${p.name}`} style="padding:6px 10px;border:1px solid var(--border);border-radius:var(--radius);background:var(--surface);cursor:pointer;">✕</button>
  </div>
{/each}

<input placeholder="Gain a planet…" bind:value={planetQuery} style="width:100%;padding:8px;margin-top:6px;border:1px solid var(--border);border-radius:var(--radius);background:var(--surface);color:var(--text);" />
{#each catalogMatches as c (c.id)}
  <button onclick={() => gain(c)} aria-label={`add ${c.name}`} style="display:block;width:100%;text-align:left;margin:4px 0;padding:6px 10px;border:1px solid var(--border);border-radius:var(--radius);background:var(--surface);cursor:pointer;">+ {c.name} ({c.resources}/{c.influence}{c.trait ? ` · ${c.trait}` : ''})</button>
{/each}

<h4 style="font-weight:500;margin-top:12px;">Technologies</h4>
{#each technologies as t (t.id)}
  {@const owned = gameState.technologyIds.includes(t.id)}
  <button onclick={() => toggleTech(t.id)} aria-label={`${owned ? 'remove' : 'add'} ${t.name}`} style="display:block;margin:4px 0;padding:6px 10px;border:1px solid var(--border);border-radius:var(--radius);background:{owned ? 'var(--surface-2)' : 'var(--surface)'};cursor:pointer;">{owned ? '✓ ' : '+ '}{t.name}</button>
{/each}
