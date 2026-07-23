<script lang="ts">
  interface Props { onNewGame: () => void; onExport: () => void; onImport: (file: File) => void }
  let { onNewGame, onExport, onImport }: Props = $props()

  let confirming = $state(false)

  function handleFile(e: Event) {
    const input = e.currentTarget as HTMLInputElement
    const file = input.files?.[0]
    if (file) onImport(file)
  }
</script>

<h3 style="font-size:16px;font-weight:500;">Games</h3>

{#if confirming}
  <button onclick={() => { confirming = false; onNewGame() }} style="padding:8px 12px;border:1px solid var(--warn);border-radius:var(--radius);background:var(--surface);color:var(--warn);cursor:pointer;">Confirm new game (discards unsaved edits)</button>
  <button onclick={() => (confirming = false)} style="margin-left:8px;padding:8px 12px;border:1px solid var(--border);border-radius:var(--radius);background:var(--surface);cursor:pointer;">Cancel</button>
{:else}
  <button onclick={() => (confirming = true)} style="padding:8px 12px;border:1px solid var(--border);border-radius:var(--radius);background:var(--surface);cursor:pointer;">New game</button>
{/if}

<div style="margin-top:12px;display:flex;flex-direction:column;gap:8px;align-items:flex-start;">
  <button onclick={onExport} style="padding:8px 12px;border:1px solid var(--border);border-radius:var(--radius);background:var(--surface);cursor:pointer;">Export game (JSON)</button>
  <label style="font-size:14px;">Import game file
    <input type="file" accept="application/json,.json" aria-label="Import game file" onchange={handleFile} style="display:block;margin-top:4px;" />
  </label>
</div>
