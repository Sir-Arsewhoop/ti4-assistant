<script lang="ts">
  import ExpandableItem from './ExpandableItem.svelte'

  type Entry = { id: string; title: string; summary: string; detail: string }
  interface Props { groups: { key: string; label: string; entries: Entry[] }[] }
  let { groups }: Props = $props()
</script>

{#each groups as g (g.key)}
  <h4 style="font-weight:500;margin-top:12px;">{g.label}</h4>
  {#each g.entries as e (e.id)}
    <ExpandableItem title={e.title} summary={e.summary} detail={e.detail} />
  {/each}
{/each}
{#if groups.length === 0}<p style="color:var(--text-muted);font-size:14px;">No matches.</p>{/if}
