import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/svelte'
import GamesSheet from './GamesSheet.svelte'

describe('GamesSheet', () => {
  it('calls onExport', async () => {
    const onExport = vi.fn()
    render(GamesSheet, { props: { onNewGame: () => {}, onExport, onImport: () => {} } })
    await fireEvent.click(screen.getByRole('button', { name: /Export/ }))
    expect(onExport).toHaveBeenCalledOnce()
  })

  it('requires a confirm before calling onNewGame', async () => {
    const onNewGame = vi.fn()
    render(GamesSheet, { props: { onNewGame, onExport: () => {}, onImport: () => {} } })
    await fireEvent.click(screen.getByRole('button', { name: /New game/ }))
    expect(onNewGame).not.toHaveBeenCalled()
    await fireEvent.click(screen.getByRole('button', { name: /Confirm new game/ }))
    expect(onNewGame).toHaveBeenCalledOnce()
  })

  it('passes the imported file to onImport', async () => {
    const onImport = vi.fn()
    render(GamesSheet, { props: { onNewGame: () => {}, onExport: () => {}, onImport } })
    const file = new File(['{}'], 'save.json', { type: 'application/json' })
    const input = screen.getByLabelText(/Import game file/)
    await fireEvent.change(input, { target: { files: [file] } })
    expect(onImport).toHaveBeenCalledWith(file)
  })
})
