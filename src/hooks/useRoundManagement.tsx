import { useEffect } from 'react'
import type { End } from '../utils/types'
import { generateEndTemplate } from '../utils/helpers'

interface UseRoundManagementProps {
  view: string
  endsPerRound: number
  setCurrentRound: React.Dispatch<React.SetStateAction<End[]>>
  setCurrentEndIndex: React.Dispatch<React.SetStateAction<number>>
}

/**
 * Custom hook to manage round adjustments when endsPerRound changes.
 * This hook preserves existing end data when adding or removing ends mid-round.
 * 
 * @param view - Current view ('record', 'home', etc.)
 * @param endsPerRound - Target number of ends for the round
 * @param setCurrentRound - State setter for the current round data
 * @param setCurrentEndIndex - State setter for the current end index
 */
export const useRoundManagement = ({
  view,
  endsPerRound,
  setCurrentRound,
  setCurrentEndIndex,
}: UseRoundManagementProps) => {
  // Adjust round length when endsPerRound changes, preserving existing data
  useEffect(() => {
    if (view === 'record') {
      setCurrentRound(prev => {
        const newRound = Array.from({ length: endsPerRound }, (_, index) => {
          // Keep existing end data if it exists, otherwise create new template
          return prev[index] ?? generateEndTemplate()
        })
        return newRound
      })

      // Adjust currentEndIndex if it's now out of bounds
      setCurrentEndIndex(prevIndex => Math.min(prevIndex, endsPerRound - 1))
    }
  }, [view, endsPerRound, setCurrentRound, setCurrentEndIndex])
}
