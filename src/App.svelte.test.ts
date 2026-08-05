// src/App.svelte.test.ts
import 'fake-indexeddb/auto'
import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/svelte'
import App from './App.svelte'
import { saveGame } from './persistence/storage'
import { createInitialState } from './domain/initialState'
import { getFaction } from './content/index'

beforeEach(() => {
  localStorage.clear()
  // jsdom doesn't implement matchMedia; App calls applyTheme() on init, same stub as lib/theme.test.ts.
  window.matchMedia = ((q: string) => ({
    matches: false,
    media: q,
    addEventListener() {},
    removeEventListener() {},
  })) as unknown as typeof window.matchMedia
})

describe('App', () => {
  it('shows the setup wizard when there is no current game', () => {
    render(App)
    expect(screen.getByRole('button', { name: /Start game/ })).toBeTruthy()
  })

  it('starts a game from setup and lands in the strategy phase', async () => {
    render(App)
    await fireEvent.click(screen.getByRole('button', { name: /Start game/ }))
    expect(screen.getByText(/Strategy phase/)).toBeTruthy()
    expect(screen.getByText(/Round 1/)).toBeTruthy()
  })

  it('resumes the saved game named by prefs.currentGameId', async () => {
    const seeded = { ...createInitialState(getFaction('sol')!, { turnOrder: 2, speaker: true }), phase: 'action' as const }
    await saveGame('resume-1', seeded)
    localStorage.setItem('ti4:prefs', JSON.stringify({ theme: 'system', overviewOpen: true, currentGameId: 'resume-1' }))
    render(App)
    expect(await screen.findByText(/Action phase/)).toBeTruthy()
  })

  it('re-renders the overview header when an action is dispatched', async () => {
    render(App)
    await fireEvent.click(screen.getByRole('button', { name: /Start game/ }))
    // strategy -> action
    await fireEvent.click(screen.getByRole('button', { name: /Advance phase/ }))
    expect(screen.getByText(/Action phase/)).toBeTruthy()
    // overview header (open by default) shows the starting tactic pool of 3
    expect(screen.getByText(/Tactic 3/)).toBeTruthy()
    // take the tactical action -> reducer decrements the tactic pool -> header re-renders
    await fireEvent.click(screen.getByRole('button', { name: /Take: Tactical action/ }))
    expect(screen.getByText(/Tactic 2/)).toBeTruthy()
  })

  it('routes to the status checklist after advancing there', async () => {
    render(App)
    await fireEvent.click(screen.getByRole('button', { name: /Start game/ }))
    await fireEvent.click(screen.getByRole('button', { name: /Advance phase/ })) // strategy -> action
    await fireEvent.click(screen.getByRole('button', { name: /Advance phase/ })) // action -> status
    expect(screen.getByText(/Status phase/)).toBeTruthy()
  })

  it('opens the menu from the bottom bar', async () => {
    render(App)
    await fireEvent.click(screen.getByRole('button', { name: /Start game/ }))
    await fireEvent.click(screen.getByRole('button', { name: /Open menu/ }))
    expect(screen.getByRole('button', { name: /Close menu/ })).toBeTruthy()
  })

  it('limits the research picker to the player\'s own faction techs, excluding generics their sheet supersedes', async () => {
    render(App)
    await fireEvent.change(screen.getByLabelText('Faction'), { target: { value: 'sol' } })
    await fireEvent.click(screen.getByRole('button', { name: /Start game/ }))
    await fireEvent.click(screen.getByRole('button', { name: /Advance phase/ })) // strategy -> action
    await fireEvent.click(screen.getByRole('button', { name: /Take: Research technology/ }))
    // Sol's own faction tech is offered.
    expect(screen.getByRole('button', { name: /research Advanced Carrier II/i })).toBeTruthy()
    // Another faction's tech (Naalu) is not.
    expect(screen.queryByRole('button', { name: /research Neuroglaive/i })).toBeNull()
    // The generic Sol's sheet supersedes is not.
    expect(screen.queryByRole('button', { name: /research Carrier II/i })).toBeNull()
  })
})
