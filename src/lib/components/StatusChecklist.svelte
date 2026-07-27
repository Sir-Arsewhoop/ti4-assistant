<script lang="ts">
  import type { GameState, GameAction } from '../../domain/types'
  import type { Objective } from '../../content/schema'
  import ExpandableItem from './ExpandableItem.svelte'

  interface Props { state: GameState; publicObjectives: Objective[]; onAction: (a: GameAction) => void }
  let { state: gameState, publicObjectives, onAction }: Props = $props()

  const revealed = $derived(publicObjectives.filter((o) => gameState.revealedPublicObjectiveIds.includes(o.id)))
  const stageGroups = $derived(
    (['I', 'II'] as const)
      .map((stage) => ({ stage, objectives: revealed.filter((o) => o.stage === stage) }))
      .filter((g) => g.objectives.length > 0),
  )

  let revealQuery = $state('')
  const revealMatches = $derived(
    publicObjectives
      .filter((o) => !gameState.revealedPublicObjectiveIds.includes(o.id) && o.name.toLowerCase().includes(revealQuery.toLowerCase()))
      .slice(0, 8),
  )
  function reveal(o: Objective) {
    onAction({ type: 'revealPublicObjective', objectiveId: o.id, name: o.name })
    revealQuery = ''
  }

  let drewCards = $state(false)
  let repaired = $state(false)

  function scorePublic(o: Objective) {
    onAction({ type: 'scorePublicObjective', objectiveId: o.id, points: o.points })
  }
  function unreveal(o: Objective) {
    onAction({ type: 'editState', patch: { revealedPublicObjectiveIds: gameState.revealedPublicObjectiveIds.filter((id) => id !== o.id) } })
  }
  function scoreSecret() {
    onAction({ type: 'editState', patch: {
      secretObjectives: [...gameState.secretObjectives, { id: `secret-${gameState.secretObjectives.length + 1}`, scored: true }],
      victoryPoints: gameState.victoryPoints + 1,
    } })
  }
  function adjustPool(pool: 'tactic' | 'fleet' | 'strategy', delta: number) {
    onAction({ type: 'editState', patch: { command: { ...gameState.command, [pool]: Math.max(0, gameState.command[pool] + delta) } } })
  }
  function readyAll() {
    onAction({ type: 'editState', patch: { planets: gameState.planets.map((p) => ({ ...p, exhausted: false })) } })
  }
</script>

<h2 style="font-size:18px;font-weight:500;">Status phase</h2>

<ExpandableItem title="Score a public objective" summary="If you qualify, claim 1 revealed public objective for VP." detail="Once per status phase you may score a single public objective you meet the requirement for. Only objectives the table has revealed are listed; reveal more below." />
{#each stageGroups as g (g.stage)}
  <h4 style="font-weight:500;margin-top:10px;">Stage {g.stage}</h4>
  {#each g.objectives as o (o.id)}
    {@const scored = gameState.scoredPublicObjectiveIds.includes(o.id)}
    <div style="display:flex;align-items:center;gap:6px;margin:4px 0;">
      <button
        onclick={() => scorePublic(o)}
        style="flex:1;text-align:left;padding:8px 12px;border:1px solid var(--border);border-radius:var(--radius);background:{scored ? 'var(--surface-2)' : 'var(--surface)'};color:{scored ? 'var(--text-muted)' : 'var(--text)'};cursor:pointer;"
      >{scored ? '✓ ' : ''}Score: {o.name} (+{o.points})</button>
      <button onclick={() => unreveal(o)} aria-label={`unreveal ${o.name}`} style="padding:6px 10px;border:1px solid var(--border);border-radius:var(--radius);background:var(--surface);cursor:pointer;">✕</button>
    </div>
  {/each}
{/each}
{#if stageGroups.length === 0}<p style="color:var(--text-muted);font-size:14px;">No public objectives revealed yet — reveal one below.</p>{/if}

<input placeholder="Reveal a public objective…" bind:value={revealQuery} style="width:100%;padding:8px;margin-top:8px;border:1px solid var(--border);border-radius:var(--radius);background:var(--surface);color:var(--text);" />
{#each revealMatches as o (o.id)}
  <button onclick={() => reveal(o)} aria-label={`reveal ${o.name}`} style="display:block;width:100%;text-align:left;margin:4px 0;padding:6px 10px;border:1px solid var(--border);border-radius:var(--radius);background:var(--surface);cursor:pointer;">+ {o.name} (Stage {o.stage}, +{o.points})</button>
{/each}

<ExpandableItem title="Score a secret objective" summary="If you completed one, reveal it for VP." detail="Secret objective content isn't loaded yet, so this just records a secret scored (+1 VP)." />
<button onclick={scoreSecret} style="padding:8px 12px;border:1px solid var(--border);border-radius:var(--radius);background:var(--surface);cursor:pointer;">Scored a secret (+1 VP)</button>

<ExpandableItem title="Gain + redistribute command tokens" summary="Gain 2 tokens, then place them across your pools." detail="In the status phase you gain 2 command tokens and redistribute your pools." />
{#each (['tactic', 'fleet', 'strategy'] as const) as pool (pool)}
  <div style="display:flex;align-items:center;gap:8px;margin:4px 0;">
    <span style="width:80px;text-transform:capitalize;">{pool}</span>
    <button onclick={() => adjustPool(pool, -1)} aria-label={`decrease ${pool}`} style="width:32px;">-</button>
    <span style="width:24px;text-align:center;">{gameState.command[pool]}</span>
    <button onclick={() => adjustPool(pool, 1)} aria-label={`increase ${pool}`} style="width:32px;">+</button>
  </div>
{/each}

<ExpandableItem title="Ready planets" summary="Ready all your exhausted planets." detail="At the end of the status phase all your planets ready." />
<button onclick={readyAll} style="padding:8px 12px;border:1px solid var(--border);border-radius:var(--radius);background:var(--surface);cursor:pointer;">Ready all planets</button>

<div style="margin-top:12px;display:flex;flex-direction:column;gap:6px;color:var(--text-muted);font-size:14px;">
  <label><input type="checkbox" bind:checked={drewCards} /> Drew action card(s)</label>
  <label><input type="checkbox" bind:checked={repaired} /> Repaired units</label>
</div>

{#if !gameState.custodiansTaken}
  <ExpandableItem title="Custodians token" summary="Taken Mecatol Rex this game yet?" detail="Once a player takes the custodians token from Mecatol Rex, every following round ends with an agenda phase." />
  <button onclick={() => onAction({ type: 'editState', patch: { custodiansTaken: true } })} style="padding:8px 12px;border:1px solid var(--border);border-radius:var(--radius);background:var(--surface);cursor:pointer;">Mark custodians token taken</button>
{/if}
