<script lang="ts">
  import type { GameState, GameAction } from '../../domain/types'
  import type { Objective } from '../../content/schema'
  import ExpandableItem from './ExpandableItem.svelte'

  interface Props { state: GameState; objectives: Objective[]; onAction: (a: GameAction) => void }
  let { state, objectives, onAction }: Props = $props()

  const unscored = $derived(objectives.filter((o) => !state.scoredPublicObjectiveIds.includes(o.id)))

  let drewCards = false
  let repaired = false

  function scorePublic(o: Objective) {
    onAction({ type: 'scorePublicObjective', objectiveId: o.id, points: o.points })
  }
  function scoreSecret() {
    onAction({ type: 'editState', patch: {
      secretObjectives: [...state.secretObjectives, { id: `secret-${state.secretObjectives.length + 1}`, scored: true }],
      victoryPoints: state.victoryPoints + 1,
    } })
  }
  function adjustPool(pool: 'tactic' | 'fleet' | 'strategy', delta: number) {
    onAction({ type: 'editState', patch: { command: { ...state.command, [pool]: Math.max(0, state.command[pool] + delta) } } })
  }
  function readyAll() {
    onAction({ type: 'editState', patch: { planets: state.planets.map((p) => ({ ...p, exhausted: false })) } })
  }
</script>

<h2 style="font-size:18px;font-weight:500;">Status phase</h2>

<ExpandableItem title="Score a public objective" summary="If you qualify, claim 1 public objective for VP." detail="Once per status phase you may score a single public objective you meet the requirement for." />
{#each unscored as o (o.id)}
  <button onclick={() => scorePublic(o)} style="display:block;margin:4px 0;padding:8px 12px;border:1px solid var(--border);border-radius:var(--radius);background:var(--surface);cursor:pointer;">Score: {o.name} (+{o.points})</button>
{/each}
{#if unscored.length === 0}<p style="color:var(--text-muted);font-size:14px;">All seeded public objectives scored.</p>{/if}

<ExpandableItem title="Score a secret objective" summary="If you completed one, reveal it for VP." detail="Secret objective content isn't loaded yet, so this just records a secret scored (+1 VP)." />
<button onclick={scoreSecret} style="padding:8px 12px;border:1px solid var(--border);border-radius:var(--radius);background:var(--surface);cursor:pointer;">Scored a secret (+1 VP)</button>

<ExpandableItem title="Gain + redistribute command tokens" summary="Gain 2 tokens, then place them across your pools." detail="In the status phase you gain 2 command tokens and redistribute your pools." />
{#each (['tactic', 'fleet', 'strategy'] as const) as pool (pool)}
  <div style="display:flex;align-items:center;gap:8px;margin:4px 0;">
    <span style="width:80px;text-transform:capitalize;">{pool}</span>
    <button onclick={() => adjustPool(pool, -1)} aria-label={`decrease ${pool}`} style="width:32px;">-</button>
    <span style="width:24px;text-align:center;">{state.command[pool]}</span>
    <button onclick={() => adjustPool(pool, 1)} aria-label={`increase ${pool}`} style="width:32px;">+</button>
  </div>
{/each}

<ExpandableItem title="Ready planets" summary="Ready all your exhausted planets." detail="At the end of the status phase all your planets ready." />
<button onclick={readyAll} style="padding:8px 12px;border:1px solid var(--border);border-radius:var(--radius);background:var(--surface);cursor:pointer;">Ready all planets</button>

<div style="margin-top:12px;display:flex;flex-direction:column;gap:6px;color:var(--text-muted);font-size:14px;">
  <label><input type="checkbox" bind:checked={drewCards} /> Drew action card(s)</label>
  <label><input type="checkbox" bind:checked={repaired} /> Repaired units</label>
</div>

{#if !state.custodiansTaken}
  <ExpandableItem title="Custodians token" summary="Taken Mecatol Rex this game yet?" detail="Once a player takes the custodians token from Mecatol Rex, every following round ends with an agenda phase." />
  <button onclick={() => onAction({ type: 'editState', patch: { custodiansTaken: true } })} style="padding:8px 12px;border:1px solid var(--border);border-radius:var(--radius);background:var(--surface);cursor:pointer;">Mark custodians token taken</button>
{/if}
