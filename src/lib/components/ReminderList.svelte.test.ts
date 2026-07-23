// src/lib/components/ReminderList.svelte.test.ts
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/svelte'
import ReminderList from './ReminderList.svelte'
import type { Reminder } from '../../domain/types'

describe('ReminderList', () => {
  it('renders each reminder text', () => {
    const reminders: Reminder[] = [
      { id: 'a', severity: 'info', text: 'Primary unused.' },
      { id: 'b', severity: 'warn', text: 'No tactic tokens.' },
    ]
    render(ReminderList, { props: { reminders } })
    expect(screen.getByText('Primary unused.')).toBeTruthy()
    expect(screen.getByText('No tactic tokens.')).toBeTruthy()
  })

  it('renders nothing when empty', () => {
    const { container } = render(ReminderList, { props: { reminders: [] } })
    expect(container.querySelectorAll('li').length).toBe(0)
  })
})
