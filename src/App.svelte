<script lang="ts">
  import { getFaction, content } from './content/index'
  import { createInitialState } from './domain/initialState'
  import { createGameStore } from './state/store.svelte'
  import { getAvailableActions, getReminders } from './engine/index'
  import type { AvailableAction, GameAction } from './domain/types'

  // Vertical slice: start a Jol-Nar game and jump into the action phase.
  const faction = getFaction('jol-nar')!
  const store = createGameStore({
    ...createInitialState(faction, { turnOrder: 1, speaker: true }),
    phase: 'action',
    strategyCardIds: [7],
  })

  // Component-action sources = the player's techs that have an ACTION ability.
  const sources = $derived(
    content.technologies
      .filter((t) => t.hasAction && store.state.technologyIds.includes(t.id))
      .map((t) => ({ id: t.id, summary: t.summary })),
  )
  const actions = $derived(getAvailableActions(store.state, { componentActionSources: sources }))
  const reminders = $derived(getReminders(store.state))

  function run(a: AvailableAction) {
    if (a.type === 'componentAction') store.dispatch({ type: 'componentAction', sourceId: a.sourceId ?? '', summary: a.explanation })
    else store.dispatch({ type: a.type } as GameAction)
  }
</script>

<main style="font-family: system-ui; max-width: 480px; margin: 0 auto; padding: 1rem;">
  <h1>{faction.name}</h1>
  <p>Round {store.state.round} — <strong>{store.state.phase}</strong> phase</p>
  <p>Tactic {store.state.command.tactic} · Fleet {store.state.command.fleet} · Strategy {store.state.command.strategy}
     · Trade goods {store.state.tradeGoods} · VP {store.state.victoryPoints}</p>

  <h2>What can I do now?</h2>
  {#if actions.length === 0}
    <p>No action-phase options. Advance the phase.</p>
  {/if}
  <ul>
    {#each actions as a (a.type + (a.sourceId ?? '') + a.label)}
      <li>
        <button onclick={() => run(a)}>{a.label}</button>
        <small>{a.explanation}</small>
      </li>
    {/each}
  </ul>

  <button onclick={() => store.dispatch({ type: 'advancePhase' })}>Advance phase →</button>
  <button onclick={() => store.undo()} disabled={!store.canUndo()}>Undo</button>

  {#if reminders.length}
    <h3>Reminders</h3>
    <ul>
      {#each reminders as r (r.id)}
        <li>{r.severity === 'warn' ? '⚠️' : 'ℹ️'} {r.text}</li>
      {/each}
    </ul>
  {/if}
</main>
