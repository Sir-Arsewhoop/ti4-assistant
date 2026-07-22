import type { GameAction, GameState } from '../domain/types'
import { applyAction } from './reducers'

export function createGameStore(initial: GameState) {
  let state = $state<GameState>(initial)
  let history = $state<GameState[]>([])

  return {
    get state() {
      return state
    },
    dispatch(action: GameAction) {
      history = [...history, state]
      state = applyAction(state, action)
    },
    undo() {
      const prev = history.at(-1)
      if (!prev) return
      state = prev
      history = history.slice(0, -1)
    },
    canUndo() {
      return history.length > 0
    },
    load(next: GameState) {
      state = next
      history = []
    },
  }
}
