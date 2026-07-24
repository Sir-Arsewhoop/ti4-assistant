import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/svelte'
import ResearchPicker from './ResearchPicker.svelte'
import type { Technology } from '../../content/schema'

const T = (o: Partial<Technology> & { id: string; name: string }): Technology =>
  ({ color: 'blue', type: 'ability', expansion: 'base', prerequisites: [], summary: '', hasAction: false, ...o })

const technologies: Technology[] = [
  T({ id: 'antimass-deflectors', name: 'Antimass Deflectors', color: 'blue', prerequisites: [] }),
  T({ id: 'fleet-logistics', name: 'Fleet Logistics', color: 'blue', prerequisites: ['blue', 'blue'] }),
  T({ id: 'carrier-ii', name: 'Carrier II', color: 'none', type: 'unit-upgrade', prerequisites: ['blue', 'blue'] }),
  T({ id: 'sarween-tools', name: 'Sarween Tools', color: 'yellow', prerequisites: [] }),
]

describe('ResearchPicker', () => {
  it('groups techs, tags expansion, and excludes owned ones', () => {
    render(ResearchPicker, { props: { technologies, ownedIds: new Set(['sarween-tools']), researchableIds: new Set(['antimass-deflectors']), onResearch: () => {}, onClose: () => {} } })
    expect(screen.getByText('Unit Upgrades')).toBeTruthy()
    expect(screen.getByRole('button', { name: /research Antimass Deflectors/ })).toBeTruthy()
    expect(screen.queryByRole('button', { name: /research Sarween Tools/ })).toBeNull()
  })

  it('researches on click even a non-researchable tech (assistant, not referee)', async () => {
    const onResearch = vi.fn()
    render(ResearchPicker, { props: { technologies, ownedIds: new Set<string>(), researchableIds: new Set(['antimass-deflectors']), onResearch, onClose: () => {} } })
    await fireEvent.click(screen.getByRole('button', { name: /research Fleet Logistics/ }))
    expect(onResearch).toHaveBeenCalledWith('fleet-logistics', 'Fleet Logistics')
  })

  it('closes via the close button', async () => {
    const onClose = vi.fn()
    render(ResearchPicker, { props: { technologies, ownedIds: new Set<string>(), researchableIds: new Set<string>(), onResearch: () => {}, onClose } })
    await fireEvent.click(screen.getByRole('button', { name: /close research picker/ }))
    expect(onClose).toHaveBeenCalled()
  })
})
