<script lang="ts">
  import type { AvailableAction } from '../../domain/types'
  import ExpandableItem from './ExpandableItem.svelte'
  interface Props { actions: AvailableAction[]; onAct: (a: AvailableAction) => void }
  let { actions, onAct }: Props = $props()

  const SUMMARIES: Record<string, string> = {
    strategicAction: 'Resolve your strategy card\'s primary ability.',
    tacticalAction: 'Activate a system to move, fight, then produce.',
    componentAction: 'Play an "Action:" ability from a card, tech, or leader.',
    research: 'Add a technology; researchable ones are highlighted.',
    pass: 'Stop taking turns for the rest of this action phase.',
  }
</script>

{#if actions.length === 0}
  <p style="color:var(--text-muted);font-size:14px;">No options — advance the phase.</p>
{:else}
  {#each actions as a (a.type + (a.sourceId ?? '') + a.label)}
    <div style="margin-bottom:10px;">
      <ExpandableItem title={a.label} summary={SUMMARIES[a.type] ?? ''} detail={a.explanation} />
      <button
        onclick={() => onAct(a)}
        style="margin-top:-4px;padding:8px 14px;border:1px solid var(--accent);border-radius:var(--radius);background:var(--accent);color:#fff;cursor:pointer;"
      >Take: {a.label}</button>
    </div>
  {/each}
{/if}
