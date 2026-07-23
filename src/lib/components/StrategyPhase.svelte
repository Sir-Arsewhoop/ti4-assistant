<script lang="ts">
  import type { StrategyCard } from '../../content/schema'
  import ExpandableItem from './ExpandableItem.svelte'
  interface Props { cards: StrategyCard[]; selected: number[]; onToggle: (initiative: number) => void }
  let { cards, selected, onToggle }: Props = $props()
</script>

<h2 style="font-size:18px;font-weight:500;">Strategy phase — pick your card</h2>
{#each cards as c (c.initiative)}
  {@const chosen = selected.includes(c.initiative)}
  <div style="margin-bottom:10px;">
    <ExpandableItem
      title={`${c.initiative}. ${c.name}`}
      summary={c.primary}
      detail={`Primary: ${c.primary}\nSecondary: ${c.secondary}`}
    />
    <button
      onclick={() => onToggle(c.initiative)}
      style="margin-top:-4px;padding:8px 14px;border:1px solid var(--border);border-radius:var(--radius);background:{chosen ? 'var(--accent)' : 'var(--surface)'};color:{chosen ? '#fff' : 'var(--text)'};cursor:pointer;"
    >{chosen ? 'Chosen ✓' : 'Select'}</button>
  </div>
{/each}
