<script lang="ts">
  import { content, getFaction } from './content/index'
  import { createInitialState } from './domain/initialState'
  import { createGameStore } from './state/store.svelte'
  import { getAvailableActions, getReminders, getResearchableTechs, getScorablePublicObjectives } from './engine/index'
  import { saveGame, loadGame, exportGame, importGame } from './persistence/storage'
  import { onMount, untrack } from 'svelte'
  import { loadPrefs, savePrefs } from './lib/prefs'
  import { applyTheme } from './lib/theme'
  import type { Theme } from './lib/prefs'
  import type { AvailableAction, GameAction, GameState } from './domain/types'
  import type { SetupConfig } from './lib/ui-types'
  import OverviewHeader from './lib/components/OverviewHeader.svelte'
  import ReminderList from './lib/components/ReminderList.svelte'
  import ActionPanel from './lib/components/ActionPanel.svelte'
  import StrategyPhase from './lib/components/StrategyPhase.svelte'
  import SetupWizard from './lib/components/SetupWizard.svelte'
  import StatusChecklist from './lib/components/StatusChecklist.svelte'
  import AgendaHelper from './lib/components/AgendaHelper.svelte'
  import MenuSheet from './lib/components/MenuSheet.svelte'
  import ResearchPicker from './lib/components/ResearchPicker.svelte'

  let prefs = $state(loadPrefs())
  applyTheme(untrack(() => prefs.theme))

  let store: ReturnType<typeof createGameStore> | null = $state(null)
  let gameId: string | null = $state(null)
  let seq = 0
  let menuOpen = $state(false)
  let importError = $state('')
  let researchOpen = $state(false)

  // Plain (non-rune) helper: reading `.state` directly off the nullable `store` binding inside
  // a $derived expression trips a svelte-check/svelte2tsx narrowing bug (unrelated to runtime,
  // confirmed via a minimal repro) that resolves the nullable branch to `never`. Isolating the
  // property access in an ordinary function sidesteps it while keeping normal $derived tracking.
  function gameStateOf(s: ReturnType<typeof createGameStore> | null): GameState | null {
    return s ? s.state : null
  }

  const gameState = $derived(gameStateOf(store))

  const componentActionSources = $derived(
    gameState
      ? content.technologies
          .filter((t) => t.hasAction && gameState.technologyIds.includes(t.id))
          .map((t) => ({ id: t.id, summary: t.summary }))
      : [],
  )
  const researchResults = $derived(gameState ? getResearchableTechs(gameState, content.technologies) : [])
  const researchableIds = $derived(new Set(researchResults.filter((r) => r.researchable).map((r) => r.techId)))
  const actions = $derived(gameState ? getAvailableActions(gameState, { componentActionSources }) : [])
  const scorablePublics = $derived(gameState ? getScorablePublicObjectives(gameState, content.publicObjectives) : [])
  const stageTwoScorable = $derived(scorablePublics.some((o) => o.stage === 'II'))
  const reminders = $derived(
    gameState
      ? getReminders(gameState, { researchableCount: researchableIds.size, scorablePublicCount: scorablePublics.length, stageTwoScorable })
      : [],
  )

  $effect(() => {
    // $state.snapshot: store.state is a deeply-reactive Proxy, which structured-clone
    // (what IndexedDB uses under the hood, real or fake) cannot clone directly.
    if (store && gameId) saveGame(gameId, $state.snapshot(store.state))
  })

  onMount(async () => {
    if (prefs.currentGameId && !store) {
      const loaded = await loadGame(prefs.currentGameId)
      if (loaded) {
        store = createGameStore(loaded)
        gameId = prefs.currentGameId
      }
    }
  })

  function onSetupComplete(cfg: SetupConfig) {
    const faction = getFaction(cfg.factionId)
    if (!faction) return
    const initial = createInitialState(faction, { turnOrder: cfg.turnOrder, speaker: cfg.speaker })
    const s = createGameStore({ ...initial, phase: 'strategy' })
    store = s
    gameId = `game-${cfg.factionId}-${++seq}`
    prefs = savePrefs({ currentGameId: gameId })
  }

  function newGame() {
    prefs = savePrefs({ currentGameId: null })
    store = null
    gameId = null
    menuOpen = false
  }

  function exportCurrent() {
    if (!store) return
    const blob = new Blob([exportGame(store.state)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${gameId ?? 'ti4-game'}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  async function importFile(file: File) {
    try {
      const loaded = importGame(await file.text())
      store = createGameStore(loaded)
      gameId = `game-import-${++seq}`
      prefs = savePrefs({ currentGameId: gameId })
      importError = ''
      menuOpen = false
    } catch {
      importError = 'Could not import that file.'
    }
  }

  function toggleOverview() {
    prefs = savePrefs({ overviewOpen: !prefs.overviewOpen })
  }

  function cycleTheme() {
    const order: Theme[] = ['system', 'light', 'dark']
    const next = order[(order.indexOf(prefs.theme) + 1) % order.length]
    prefs = savePrefs({ theme: next })
    applyTheme(next)
  }

  function act(a: AvailableAction) {
    if (!store) return
    if (a.type === 'research') { researchOpen = true; return }
    if (a.type === 'componentAction') store.dispatch({ type: 'componentAction', sourceId: a.sourceId ?? '', summary: a.explanation })
    else store.dispatch({ type: a.type } as GameAction)
  }

  function toggleStrategyCard(initiative: number) {
    if (!store) return
    const held = store.state.strategyCardIds
    const next = held.includes(initiative) ? held.filter((n) => n !== initiative) : [...held, initiative]
    store.dispatch({ type: 'editState', patch: { strategyCardIds: next } })
  }
</script>

{#if !store || !gameState}
  <SetupWizard factions={content.factions} onComplete={onSetupComplete} />
{:else}
  <OverviewHeader state={gameState} open={prefs.overviewOpen} onToggle={toggleOverview} />

  <main style="padding:16px;max-width:480px;margin:0 auto;">
    {#if gameState.phase === 'strategy'}
      <StrategyPhase cards={content.strategyCards} selected={gameState.strategyCardIds} onToggle={toggleStrategyCard} />
    {:else if gameState.phase === 'action'}
      <h2 style="font-size:18px;font-weight:500;">Action phase — what can I do now?</h2>
      <ActionPanel {actions} onAct={act} />
    {:else if gameState.phase === 'status'}
      <StatusChecklist state={gameState} publicObjectives={content.publicObjectives} onAction={(a) => store?.dispatch(a)} />
    {:else if gameState.phase === 'agenda'}
      <AgendaHelper state={gameState} onAction={(a) => store?.dispatch(a)} />
    {:else}
      <h2 style="font-size:18px;font-weight:500;">{gameState.phase} phase</h2>
    {/if}

    <ReminderList {reminders} />
  </main>

  <nav style="position:sticky;bottom:0;display:flex;gap:8px;padding:12px 16px;background:var(--surface-2);border-top:1px solid var(--border);">
    <button onclick={() => store?.undo()} disabled={!store.canUndo()} style="flex:1;padding:10px;border:1px solid var(--border);border-radius:var(--radius);background:var(--surface);cursor:pointer;">Undo</button>
    <button onclick={() => store?.dispatch({ type: 'advancePhase' })} style="flex:1;padding:10px;border:1px solid var(--border);border-radius:var(--radius);background:var(--surface);cursor:pointer;">Advance phase</button>
    <button onclick={() => (menuOpen = true)} aria-label="Open menu" style="padding:10px 14px;border:1px solid var(--border);border-radius:var(--radius);background:var(--surface);cursor:pointer;">☰</button>
  </nav>

  {#if importError}<p style="color:var(--warn);text-align:center;font-size:13px;">{importError}</p>{/if}
  <MenuSheet
    open={menuOpen}
    onClose={() => (menuOpen = false)}
    state={gameState}
    factions={content.factions}
    technologies={content.technologies}
    strategyCards={content.strategyCards}
    publicObjectives={content.publicObjectives}
    planets={content.planets}
    themeLabel={prefs.theme}
    onToggleTheme={cycleTheme}
    onAction={(a) => store?.dispatch(a)}
    onNewGame={newGame}
    onExport={exportCurrent}
    onImport={importFile}
  />
  {#if researchOpen && gameState}
    <ResearchPicker
      technologies={content.technologies}
      ownedIds={new Set(gameState.technologyIds)}
      {researchableIds}
      onResearch={(techId, name) => { store?.dispatch({ type: 'researchTechnology', techId, name }); researchOpen = false }}
      onClose={() => (researchOpen = false)}
    />
  {/if}
{/if}
