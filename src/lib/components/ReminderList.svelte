<script lang="ts">
  import type { Reminder } from '../../domain/types'
  interface Props { reminders: Reminder[] }
  let { reminders }: Props = $props()
</script>

{#if reminders.length}
  <ul style="list-style:none;padding:0;margin:12px 0 0;display:flex;flex-direction:column;gap:6px;">
    {#each reminders as r (r.id)}
      <li style="font-size:14px;display:flex;gap:8px;color:{r.severity === 'warn' ? 'var(--warn)' : 'var(--text-muted)'};">
        <span aria-hidden="true">{r.severity === 'warn' ? '⚠' : 'ℹ'}</span>
        <span>{r.text}</span>
      </li>
    {/each}
  </ul>
{/if}
