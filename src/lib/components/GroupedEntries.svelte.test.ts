import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/svelte'
import GroupedEntries from './GroupedEntries.svelte'

const groups = [
  { key: 'x', label: 'Group X', entries: [{ id: '1', title: 'First', summary: 's1', detail: 'd1' }] },
  { key: 'y', label: 'Group Y', entries: [{ id: '2', title: 'Second', summary: 's2', detail: 'd2' }] },
]

describe('GroupedEntries', () => {
  it('renders a header per group and an entry per item', () => {
    render(GroupedEntries, { props: { groups } })
    expect(screen.getByText('Group X')).toBeTruthy()
    expect(screen.getByText('Group Y')).toBeTruthy()
    expect(screen.getByText('First')).toBeTruthy()
    expect(screen.getByText('Second')).toBeTruthy()
  })

  it('shows an empty state when there are no groups', () => {
    render(GroupedEntries, { props: { groups: [] } })
    expect(screen.getByText('No matches.')).toBeTruthy()
  })
})
