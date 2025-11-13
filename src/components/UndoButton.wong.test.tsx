import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import App from '../App'

// Mock Firebase auth
vi.mock('../firebase', () => ({
  auth: {},
  googleProvider: {},
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

describe('Undo button functionality', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('removes the last shot and decreases the score of the current end when undo button is pressed', async () => {
    render(<App />)

    const recordButton = await screen.findByText('Record New Practice')
    fireEvent.click(recordButton)

    const targetWrapper = await waitFor(() => {
      const element = document.querySelector('.target-wrapper')
      expect(element).toBeDefined()
      return element!
    })

    // try 1 shot
    fireEvent.click(targetWrapper, {
      clientX: targetWrapper.getBoundingClientRect().left + targetWrapper.getBoundingClientRect().width / 2,
      clientY: targetWrapper.getBoundingClientRect().top + targetWrapper.getBoundingClientRect().height / 2,
    })

    await waitFor(() => {
      const shotText = screen.getByText(/Shots taken: 1 \/ 3/i)
      expect(shotText).toBeDefined()
    })

    const endScores = screen.getAllByText(/^\d+$/)
    expect(endScores.length).toBeGreaterThan(0)

    // Click undo button
    const undoButton = screen.getByRole('button', { name: /Undo last shot/i })
    expect((undoButton as HTMLButtonElement).disabled).toBe(false)
    
    fireEvent.click(undoButton)

    await waitFor(() => {
      const shotText = screen.getByText(/Shots taken: 0 \/ 3/i)
      expect(shotText).toBeDefined()
    })

    await waitFor(() => {
      const updatedEndScores = screen.getAllByText(/^\d+$/)
      expect(updatedEndScores[0].textContent).toBe('0')
    })
  })

  it('allows user to enter a new shot after undoing at position 2/3 of a current end', async () => {
    render(<App />)

    const recordButton = await screen.findByText('Record New Practice')
    fireEvent.click(recordButton)

    const targetWrapper = await waitFor(() => {
      const element = document.querySelector('.target-wrapper')
      expect(element).toBeDefined()
      return element!
    })
    
    for (let i = 0; i < 2; i++) {
      fireEvent.click(targetWrapper, {
        clientX: targetWrapper.getBoundingClientRect().left + targetWrapper.getBoundingClientRect().width / 2,
        clientY: targetWrapper.getBoundingClientRect().top + targetWrapper.getBoundingClientRect().height / 2,
      })
      
      await waitFor(() => {
        const shotText = screen.getByText(new RegExp(`Shots taken: ${i + 1} / 3`, 'i'))
        expect(shotText).toBeDefined()
      })
    }

    const shotText2 = screen.getByText(/Shots taken: 2 \/ 3/i)
    expect(shotText2).toBeDefined()
    const endScoresBeforeUndo = screen.getAllByText(/^\d+$/)
    expect(endScoresBeforeUndo[0]).toBeDefined()

    const undoButton = screen.getByRole('button', { name: /Undo last shot/i })
    fireEvent.click(undoButton)

    await waitFor(() => {
      const shotText1 = screen.getByText(/Shots taken: 1 \/ 3/i)
      expect(shotText1).toBeDefined()
    })

    

    // Place a new shot to see if we can go back
    fireEvent.click(targetWrapper, {
      clientX: targetWrapper.getBoundingClientRect().left + targetWrapper.getBoundingClientRect().width / 2,
      clientY: targetWrapper.getBoundingClientRect().top + targetWrapper.getBoundingClientRect().height / 2,
    })

    await waitFor(() => {
      const shotText2Again = screen.getByText(/Shots taken: 2 \/ 3/i)
      expect(shotText2Again).toBeDefined()
    })

    const endScoresAfter = screen.getAllByText(/^\d+$/)
    expect(endScoresAfter.length).toBeGreaterThan(0)
  })
})
