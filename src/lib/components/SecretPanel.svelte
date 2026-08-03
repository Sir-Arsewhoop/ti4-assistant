<script lang="ts">
  import type { SecretObjective } from '../../content/schema'
  import ExpandableItem from './ExpandableItem.svelte'

  interface Props {
    secrets: SecretObjective[]
    held: { objective: SecretObjective; scorableNow: boolean }[]
    scoredIds: string[]
    onDraw: (id: string, name: string) => void
    onScore: (id: string, name: string) => void
    onDiscard: (id: string) => void
  }
  let { secrets, held, scoredIds, onDraw, onScore, onDiscard }: Props = $props()

  let drawQuery = $state('')
  const unavailable = $derived(new Set<string>([...held.map((h) => h.objective.id), ...scoredIds]))
  const drawMatches = $derived(
    secrets
      .filter((o) => !unavailable.has(o.id) && o.name.toLowerCase().includes(drawQuery.toLowerCase()))
      .slice(0, 8),
  )
  function draw(o: SecretObjective) {
    onDraw(o.id, o.name)
    drawQuery = ''
  }
  const scored = $derived(secrets.filter((o) => scoredIds.includes(o.id)))
</script>

<h3 style="font-size:16px;font-weight:500;margin-top:16px;">Secret objectives</h3>
<ExpandableItem
  title="Your secrets"
  summary="Secrets you hold, and which can be scored in this phase."
  detail="Each secret is worth 1 victory point and is scored in its own phase. Highlighted ones match the current phase; the rest are shown greyed so you can see your whole hand. You normally hold at most 3 unscored secrets."
/>

{#each held as h (h.objective.id)}
  <div style="display:flex;align-items:center;gap:6px;margin:4px 0;">
    <button
      onclick={() => onScore(h.objective.id, h.objective.name)}
      aria-label={`score ${h.objective.name}`}
      style="flex:1;text-align:left;padding:8px 12px;border:1px solid {h.scorableNow ? 'var(--accent)' : 'var(--border)'};border-radius:var(--radius);background:{h.scorableNow ? 'var(--surface-2)' : 'var(--surface)'};color:{h.scorableNow ? 'var(--text)' : 'var(--text-muted)'};cursor:pointer;"
    >
      <span style="font-weight:{h.scorableNow ? 500 : 400};">Score: {h.objective.name}</span>
      <span style="font-size:12px;color:var(--text-muted);"> · {h.objective.phase} · {h.objective.summary}</span>
    </button>
    <button onclick={() => onDiscard(h.objective.id)} aria-label={`discard ${h.objective.name}`} style="padding:6px 10px;border:1px solid var(--border);border-radius:var(--radius);background:var(--surface);cursor:pointer;">✕</button>
  </div>
{/each}
{#if held.length === 0}<p style="color:var(--text-muted);font-size:14px;">No secrets in hand — draw the one you were dealt below.</p>{/if}

<input placeholder="Draw a secret objective…" bind:value={drawQuery} style="width:100%;padding:8px;margin-top:8px;border:1px solid var(--border);border-radius:var(--radius);background:var(--surface);color:var(--text);" />
{#each drawMatches as o (o.id)}
  <button onclick={() => draw(o)} aria-label={`draw ${o.name}`} style="display:block;width:100%;text-align:left;margin:4px 0;padding:6px 10px;border:1px solid var(--border);border-radius:var(--radius);background:var(--surface);cursor:pointer;">+ {o.name} ({o.phase})</button>
{/each}

{#if scored.length > 0}
  <h4 style="font-weight:500;margin-top:12px;">Scored</h4>
  {#each scored as o (o.id)}
    <p style="color:var(--text-muted);font-size:14px;margin:2px 0;">✓ {o.name} (+1)</p>
  {/each}
{/if}
