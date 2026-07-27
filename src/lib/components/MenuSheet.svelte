<script lang="ts">
  import type { GameState, GameAction } from '../../domain/types'
  import type { Faction, Technology, StrategyCard, Objective, PlanetCatalogEntry } from '../../content/schema'
  import ReferenceBrowser from './ReferenceBrowser.svelte'
  import BoardEditor from './BoardEditor.svelte'
  import GamesSheet from './GamesSheet.svelte'

  interface Props {
    open: boolean
    onClose: () => void
    state: GameState
    factions: Faction[]
    technologies: Technology[]
    strategyCards: StrategyCard[]
    publicObjectives: Objective[]
    planets: PlanetCatalogEntry[]
    themeLabel: string
    onToggleTheme: () => void
    onAction: (a: GameAction) => void
    onNewGame: () => void
    onExport: () => void
    onImport: (file: File) => void
  }
  let { open, onClose, state: gameState, factions, technologies, strategyCards, publicObjectives, planets, themeLabel, onToggleTheme, onAction, onNewGame, onExport, onImport }: Props = $props()

  type Section = 'reference' | 'board' | 'games'
  let section = $state<Section>('reference')
  const sections: { s: Section; label: string }[] = [
    { s: 'reference', label: 'Reference' },
    { s: 'board', label: 'Your board' },
    { s: 'games', label: 'Games' },
  ]
</script>

{#if open}
  <div style="min-height:100vh;background:rgba(0,0,0,0.45);display:flex;justify-content:flex-end;">
    <div style="width:min(92%,420px);background:var(--bg);height:100vh;overflow-y:auto;padding:16px;">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;">
        <strong>Menu</strong>
        <button onclick={onClose} aria-label="Close menu" style="padding:6px 10px;border:1px solid var(--border);border-radius:var(--radius);background:var(--surface);cursor:pointer;">✕</button>
      </div>

      <div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:8px;">
        {#each sections as sec (sec.s)}
          <button onclick={() => (section = sec.s)} style="padding:6px 10px;border:1px solid var(--border);border-radius:var(--radius);background:{section === sec.s ? 'var(--accent)' : 'var(--surface)'};color:{section === sec.s ? '#fff' : 'var(--text)'};cursor:pointer;">{sec.label}</button>
        {/each}
        <button onclick={onToggleTheme} style="margin-left:auto;padding:6px 10px;border:1px solid var(--border);border-radius:var(--radius);background:var(--surface);cursor:pointer;">Theme: {themeLabel}</button>
      </div>

      {#if section === 'reference'}
        <ReferenceBrowser {factions} {technologies} {strategyCards} {publicObjectives} {planets} />
      {:else if section === 'board'}
        <BoardEditor state={gameState} {technologies} planetCatalog={planets} {onAction} />
      {:else}
        <GamesSheet {onNewGame} {onExport} {onImport} />
      {/if}
    </div>
  </div>
{/if}
