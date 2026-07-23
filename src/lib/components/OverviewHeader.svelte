<script lang="ts">
  import type { GameState } from '../../domain/types'
  interface Props { state: GameState; open: boolean; onToggle: () => void }
  let { state, open, onToggle }: Props = $props()
</script>

<header style="background:var(--surface-2);border-bottom:1px solid var(--border);">
  <button
    onclick={onToggle}
    aria-expanded={open}
    style="width:100%;background:none;border:none;padding:10px 14px;display:flex;justify-content:space-between;align-items:center;cursor:pointer;"
  >
    <span style="font-size:14px;">Round {state.round} · {state.phase} · VP {state.victoryPoints}</span>
    <span style="color:var(--text-muted);transform:rotate({open ? 180 : 0}deg);transition:transform .15s;">⌄</span>
  </button>
  {#if open}
    <div style="padding:0 14px 12px;display:flex;flex-wrap:wrap;gap:12px;font-size:13px;color:var(--text-muted);">
      <span>Tactic {state.command.tactic}</span>
      <span>Fleet {state.command.fleet}</span>
      <span>Strategy {state.command.strategy}</span>
      <span>Trade goods {state.tradeGoods}</span>
      <span>Commodities {state.commodities}</span>
    </div>
  {/if}
</header>
