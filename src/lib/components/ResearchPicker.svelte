<script lang="ts">
  import type { Technology } from '../../content/schema'
  import { TECH_GROUPS } from '../techGroups'

  interface Props {
    technologies: Technology[]
    ownedIds: Set<string>
    researchableIds: Set<string>
    onResearch: (techId: string, name: string) => void
    onClose: () => void
  }
  let { technologies, ownedIds, researchableIds, onResearch, onClose }: Props = $props()

  const groups = $derived(
    TECH_GROUPS.map((g) => ({
      key: g.key,
      label: g.label,
      techs: technologies
        .filter((t) => !ownedIds.has(t.id) && g.match(t))
        .sort((a, b) => a.prerequisites.length - b.prerequisites.length),
    })).filter((g) => g.techs.length > 0),
  )
</script>

<div style="position:fixed;inset:0;background:rgba(0,0,0,0.5);display:flex;align-items:flex-end;justify-content:center;z-index:20;">
  <div role="dialog" aria-label="Research technology" style="background:var(--surface);max-width:480px;width:100%;max-height:80vh;overflow:auto;border-radius:12px 12px 0 0;padding:16px;">
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;">
      <h3 style="font-size:16px;font-weight:500;">Research technology</h3>
      <button onclick={onClose} aria-label="close research picker" style="padding:6px 10px;border:1px solid var(--border);border-radius:var(--radius);background:var(--surface);cursor:pointer;">✕</button>
    </div>
    <p style="color:var(--text-muted);font-size:13px;">Highlighted techs meet their prerequisites now. Others are greyed but still selectable — the app never blocks you.</p>

    {#each groups as g (g.key)}
      <h4 style="font-weight:500;margin-top:12px;">{g.label}</h4>
      {#each g.techs as t (t.id)}
        {@const ok = researchableIds.has(t.id)}
        <button
          onclick={() => onResearch(t.id, t.name)}
          aria-label={`research ${t.name}`}
          style="display:block;width:100%;text-align:left;margin:4px 0;padding:8px 10px;border:1px solid {ok ? 'var(--accent)' : 'var(--border)'};border-radius:var(--radius);background:{ok ? 'var(--surface-2)' : 'var(--surface)'};color:{ok ? 'var(--text)' : 'var(--text-muted)'};cursor:pointer;"
        >
          <span style="font-weight:{ok ? 500 : 400};">{t.name}</span>
          <span style="font-size:12px;color:var(--text-muted);"> · {t.prerequisites.length ? t.prerequisites.join('/') : 'no prereq'} · {t.expansion.toUpperCase()}</span>
        </button>
      {/each}
    {/each}

    {#if groups.length === 0}<p style="color:var(--text-muted);font-size:14px;">You already own every technology in the catalog.</p>{/if}
  </div>
</div>
