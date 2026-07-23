<script lang="ts">
  import type { GameState, GameAction } from '../../domain/types'
  import type { Technology } from '../../content/schema'

  interface Props { state: GameState; technologies: Technology[]; onAction: (a: GameAction) => void }
  let { state, technologies, onAction }: Props = $props()

  function setNum(field: 'victoryPoints' | 'tradeGoods' | 'commodities', delta: number) {
    onAction({ type: 'editState', patch: { [field]: Math.max(0, state[field] + delta) } })
  }
  function setPool(pool: 'tactic' | 'fleet' | 'strategy', delta: number) {
    onAction({ type: 'editState', patch: { command: { ...state.command, [pool]: Math.max(0, state.command[pool] + delta) } } })
  }
  function togglePlanet(id: string) {
    onAction({ type: 'editState', patch: { planets: state.planets.map((p) => (p.id === id ? { ...p, exhausted: !p.exhausted } : p)) } })
  }
  function toggleTech(id: string) {
    const owned = state.technologyIds.includes(id)
    onAction({ type: 'editState', patch: { technologyIds: owned ? state.technologyIds.filter((t) => t !== id) : [...state.technologyIds, id] } })
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
    <span style="width:24px;text-align:center;">{state[n.field]}</span>
    <button onclick={() => setNum(n.field, 1)} aria-label={`increase ${n.label}`} style="width:32px;">+</button>
  </div>
{/each}

{#each (['tactic', 'fleet', 'strategy'] as const) as pool (pool)}
  <div style="display:flex;align-items:center;gap:8px;margin:4px 0;">
    <span style="width:110px;text-transform:capitalize;">{pool} pool</span>
    <button onclick={() => setPool(pool, -1)} aria-label={`decrease ${pool}`} style="width:32px;">-</button>
    <span style="width:24px;text-align:center;">{state.command[pool]}</span>
    <button onclick={() => setPool(pool, 1)} aria-label={`increase ${pool}`} style="width:32px;">+</button>
  </div>
{/each}

<h4 style="font-weight:500;margin-top:12px;">Planets</h4>
{#each state.planets as p (p.id)}
  <button onclick={() => togglePlanet(p.id)} aria-label={`toggle ${p.name}`} style="display:block;margin:4px 0;padding:6px 10px;border:1px solid var(--border);border-radius:var(--radius);background:var(--surface);cursor:pointer;">{p.name}: {p.exhausted ? 'exhausted' : 'ready'}</button>
{/each}

<h4 style="font-weight:500;margin-top:12px;">Technologies</h4>
{#each technologies as t (t.id)}
  {@const owned = state.technologyIds.includes(t.id)}
  <button onclick={() => toggleTech(t.id)} aria-label={`${owned ? 'remove' : 'add'} ${t.name}`} style="display:block;margin:4px 0;padding:6px 10px;border:1px solid var(--border);border-radius:var(--radius);background:{owned ? 'var(--surface-2)' : 'var(--surface)'};cursor:pointer;">{owned ? '✓ ' : '+ '}{t.name}</button>
{/each}
