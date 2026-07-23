<script lang="ts">
  interface Props {
    title: string
    summary: string
    detail?: string
    open?: boolean
  }
  let { title, summary, detail = '', open = false }: Props = $props()
  let isOpen = $state(open)
</script>

<div style="border:1px solid var(--border);border-radius:var(--radius);background:var(--surface);margin-bottom:8px;">
  <button
    onclick={() => (isOpen = !isOpen)}
    aria-expanded={isOpen}
    style="width:100%;text-align:left;background:none;border:none;padding:12px 14px;display:flex;justify-content:space-between;align-items:center;gap:10px;cursor:pointer;"
  >
    <span>
      <span style="font-weight:500;display:block;">{title}</span>
      <span style="color:var(--text-muted);font-size:14px;">{summary}</span>
    </span>
    <span style="color:var(--text-muted);transform:rotate({isOpen ? 90 : 0}deg);transition:transform .15s;">›</span>
  </button>
  {#if isOpen && detail}
    <div style="padding:0 14px 12px;color:var(--text-muted);font-size:14px;line-height:1.5;white-space:pre-line;">{detail}</div>
  {/if}
</div>
