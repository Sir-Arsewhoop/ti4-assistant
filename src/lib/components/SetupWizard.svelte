<script lang="ts">
  import { untrack } from 'svelte'
  import type { Faction } from '../../content/schema'
  import type { SetupConfig } from '../ui-types'
  interface Props { factions: Faction[]; onComplete: (cfg: SetupConfig) => void }
  let { factions, onComplete }: Props = $props()

  let factionId = $state(untrack(() => factions[0]?.id ?? ''))
  let playerCount = $state(6)
  let turnOrder = $state(1)
  let speaker = $state(false)

  const seats = $derived(Array.from({ length: playerCount }, (_, i) => i + 1))

  function start() {
    onComplete({ factionId, playerCount, turnOrder: Math.min(turnOrder, playerCount), speaker })
  }
</script>

<div style="padding:16px;max-width:480px;margin:0 auto;display:flex;flex-direction:column;gap:14px;">
  <h1 style="font-size:22px;font-weight:500;">New game</h1>

  <label style="display:flex;flex-direction:column;gap:4px;">Faction
    <select bind:value={factionId}>
      {#each factions as f (f.id)}<option value={f.id}>{f.name}</option>{/each}
    </select>
  </label>

  <label style="display:flex;flex-direction:column;gap:4px;">Players
    <select bind:value={playerCount}>
      {#each [3, 4, 5, 6, 7, 8] as n (n)}<option value={n}>{n}</option>{/each}
    </select>
  </label>

  <label style="display:flex;flex-direction:column;gap:4px;">Your seat (turn order)
    <select bind:value={turnOrder}>
      {#each seats as s (s)}<option value={s}>{s}</option>{/each}
    </select>
  </label>

  <label style="display:flex;gap:8px;align-items:center;">
    <input type="checkbox" bind:checked={speaker} /> I am the speaker
  </label>

  <button onclick={start} style="padding:12px;border:none;border-radius:var(--radius);background:var(--accent);color:#fff;font-weight:500;cursor:pointer;">Start game</button>
</div>
