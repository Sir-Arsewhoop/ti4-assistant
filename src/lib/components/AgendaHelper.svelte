<script lang="ts">
  import type { GameState, GameAction } from '../../domain/types'

  interface Props { state: GameState; onAction: (a: GameAction) => void }
  let { state: gameState, onAction }: Props = $props()

  let forV = $state(0)
  let against = $state(0)
  let abstain = $state(0)
  const total = $derived(forV + against + abstain)
</script>

<h2 style="font-size:18px;font-weight:500;">Agenda phase</h2>

{#if !gameState.custodiansTaken}
  <p style="color:var(--text-muted);font-size:14px;">The agenda phase begins only after a player takes the Mecatol Rex custodians token.</p>
  <button onclick={() => onAction({ type: 'editState', patch: { custodiansTaken: true } })} style="padding:8px 12px;border:1px solid var(--border);border-radius:var(--radius);background:var(--surface);cursor:pointer;">Mark custodians token taken</button>
{:else}
  <p style="color:var(--text-muted);font-size:14px;">Vote tally (scratchpad — not saved with the game).</p>
  <div style="display:flex;flex-direction:column;gap:6px;">
    <div><button aria-label="vote for" onclick={() => forV++} style="width:36px;">+</button> For: {forV}</div>
    <div><button aria-label="vote against" onclick={() => against++} style="width:36px;">+</button> Against: {against}</div>
    <div><button aria-label="vote abstain" onclick={() => abstain++} style="width:36px;">+</button> Abstain: {abstain}</div>
  </div>
  <p style="margin-top:8px;">Total votes cast: {total}</p>
  <button onclick={() => { forV = 0; against = 0; abstain = 0 }} style="padding:6px 12px;border:1px solid var(--border);border-radius:var(--radius);background:var(--surface);cursor:pointer;">Reset tally</button>
{/if}
