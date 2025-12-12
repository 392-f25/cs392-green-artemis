import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import App from '../App'

vi.mock('../utils/firestore', () => ({
  loadRoundsFromFirestore: vi.fn(async () => []),
  saveRoundToFirestore: vi.fn(async () => {}),
  saveRoundsToFirestore: vi.fn(async () => {}),
  updateRoundNotesInFirestore: vi.fn(async () => {}),
  deleteRoundFromFirestore: vi.fn(async () => {}),
}))

vi.mock('../firebase', () => ({
  auth: {},
  googleProvider: {},
  db: {},
  app: {},
}))

vi.mock('firebase/auth', () => ({
  onAuthStateChanged: vi.fn((_auth, callback) => {
    callback({
      uid: 'test-user-id',
      email: 'test@example.com',
      displayName: 'Test User',
      photoURL: null,
    })
    return vi.fn() 
  }),
  signInWithPopup: vi.fn(),
  signOut: vi.fn(),
}))

describe('useRoundManagement', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Make sure the app preserves shot data when changing the number of ends in the middle of a round', () => {
    it('make sure it preserves shot data when increasing ends and decreasing rounds', async () => {
      render(<App />)

      const recordButton = await screen.findByText('Record New Practice')
      fireEvent.click(recordButton)

      const targetWrapper = await waitFor(() => {
        const element = document.querySelector('.target-wrapper')
        expect(element).toBeDefined()
        return element!
      })

      fireEvent.click(targetWrapper, {
        clientX: targetWrapper.getBoundingClientRect().left + targetWrapper.getBoundingClientRect().width / 2,
        clientY: targetWrapper.getBoundingClientRect().top + targetWrapper.getBoundingClientRect().height / 2,
      })

      await waitFor(() => {
        const shotText = screen.getByText(/Shots taken: 1 \/ 3/i)
        expect(shotText).toBeDefined()
      })

      const endScoresBefore = screen.getAllByText(/^\d+$/)
      const initialScore = endScoresBefore[0].textContent

      const endsInput = screen.getByRole('spinbutton', { name: /number of ends/i })
      fireEvent.change(endsInput, { target: { value: '8' } })
      fireEvent.blur(endsInput)

      await waitFor(() => {
        const shotTextAfter = screen.getByText(/Shots taken: 1 \/ 3/i)
        expect(shotTextAfter).toBeDefined()
      })

      const endScoresAfter = screen.getAllByText(/^\d+$/)
      expect(endScoresAfter[0].textContent).toBe(initialScore)
    })
  })
})
