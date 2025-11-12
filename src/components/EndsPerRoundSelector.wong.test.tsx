import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
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

describe('Ends per round input matches end cards displayed', () => {
  it('displays 8 end cards when user enters 8 in ends per round', async () => {
    render(<App />)

    const addPracticeButton = await screen.findByText('Record New Practice')
    fireEvent.click(addPracticeButton)

    const input = await screen.findByLabelText('Number of ends per round')
    fireEvent.change(input, { target: { value: '8' } })
    fireEvent.blur(input)

    await waitFor(() => {
      const endCards = screen.getAllByText(/^End \d+$/)
      expect(endCards).toHaveLength(8)
    })

    // Verify the names of the ends cards
    screen.getByText('End 1')
    screen.getByText('End 8')
  })

  it('displays 3 end cards when user enters 3 in ends per round', async () => {
    render(<App />)

    const addPracticeButton = await screen.findByText('Record New Practice')
    fireEvent.click(addPracticeButton)

    const input = await screen.findByLabelText('Number of ends per round')
    fireEvent.change(input, { target: { value: '3' } })
    fireEvent.blur(input)

    await waitFor(() => {
      const endCards = screen.getAllByText(/^End \d+$/)
      expect(endCards).toHaveLength(3)
    })

    screen.getByText('End 1')
    screen.getByText('End 3')
  })

  it('displays 12 end cards when user enters maximum in the ends per round', async () => {
    render(<App />)

    const addPracticeButton = await screen.findByText('Record New Practice')
    fireEvent.click(addPracticeButton)

    const input = await screen.findByLabelText('Number of ends per round')
    fireEvent.change(input, { target: { value: '12' } })
    fireEvent.blur(input)

    await waitFor(() => {
      const endCards = screen.getAllByText(/^End \d+$/)
      expect(endCards).toHaveLength(12)
    })

    screen.getByText('End 1')
    screen.getByText('End 12')
  })
})
