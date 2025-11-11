import { collection, doc, setDoc, getDocs, query, orderBy, deleteDoc } from 'firebase/firestore'
import { db } from '../firebase'
import type { Round, StoredRound, StoredShot } from './types'
import { SHOTS_PER_END } from './constants'
import { calculateEndPrecision } from './helpers'

/**
 * Save a single round to Firestore for a specific user
 */
export const saveRoundToFirestore = async (userId: string, round: Round): Promise<void> => {
  try {
    const userRoundsRef = collection(db, 'users', userId, 'rounds')
    
    // Convert round to storable format
    const roundData = round.ends.reduce<Record<string, Record<string, StoredShot>>>((acc, end, endIndex) => {
      const endKey = `end${String(endIndex + 1).padStart(2, '0')}`
      const shotEntries: Record<string, StoredShot> = {}
      end.shots.forEach((shot, shotIndex) => {
        const shotKey = `shot${shotIndex + 1}`
        shotEntries[shotKey] = {
          x: shot.x,
          y: shot.y,
          score: shot.score,
        }
      })
      acc[endKey] = shotEntries
      return acc
    }, {})

    const storedRound: StoredRound = {
      id: round.id,
      createdAt: round.createdAt,
      totalScore: round.totalScore,
      round: roundData,
    }

    // Save the round with the round ID as the document ID
    await setDoc(doc(userRoundsRef, round.id), storedRound)
  } catch (error) {
    console.error('Error saving round to Firestore:', error)
    throw error
  }
}

/**
 * Save multiple rounds to Firestore for a specific user
 */
export const saveRoundsToFirestore = async (userId: string, rounds: Round[]): Promise<void> => {
  try {
    const userRoundsRef = collection(db, 'users', userId, 'rounds')
    
    // Convert rounds to storable format
    const storedRounds: StoredRound[] = rounds.map(round => {
      const roundData = round.ends.reduce<Record<string, Record<string, StoredShot>>>((acc, end, endIndex) => {
        const endKey = `end${String(endIndex + 1).padStart(2, '0')}`
        const shotEntries: Record<string, StoredShot> = {}
        end.shots.forEach((shot, shotIndex) => {
          const shotKey = `shot${shotIndex + 1}`
          shotEntries[shotKey] = {
            x: shot.x,
            y: shot.y,
            score: shot.score,
          }
        })
        acc[endKey] = shotEntries
        return acc
      }, {})

      return {
        id: round.id,
        createdAt: round.createdAt,
        totalScore: round.totalScore,
        round: roundData,
      }
    })

    // Save each round as a document with the round ID as the document ID
    await Promise.all(
      storedRounds.map(round =>
        setDoc(doc(userRoundsRef, round.id), round)
      )
    )
  } catch (error) {
    console.error('Error saving rounds to Firestore:', error)
    throw error
  }
}

/**
 * Load rounds from Firestore for a specific user
 */
export const loadRoundsFromFirestore = async (userId: string): Promise<Round[]> => {
  try {
    const userRoundsRef = collection(db, 'users', userId, 'rounds')
    const q = query(userRoundsRef, orderBy('createdAt', 'desc'))
    const querySnapshot = await getDocs(q)
    
    const rounds: Round[] = []
    
    querySnapshot.forEach(docSnapshot => {
      const data = docSnapshot.data() as StoredRound
      
      // Hydrate the round from stored format
      const ends = Object.keys(data.round ?? {})
        .sort()
        .map(endKey => {
          const storedShots = data.round?.[endKey] ?? {}
          const orderedShots = Object.keys(storedShots)
            .sort()
            .map(shotKey => storedShots[shotKey])
            .filter(
              (entry): entry is StoredShot =>
                typeof entry === 'object' && entry !== null && 'score' in entry
            )
            .slice(0, SHOTS_PER_END)

          const shots = orderedShots.map(entry => ({
            x: typeof entry.x === 'number' ? entry.x : 0,
            y: typeof entry.y === 'number' ? entry.y : 0,
            score: typeof entry.score === 'number' ? entry.score : 0,
          }))

          const endScore = shots.reduce((total, shot) => total + shot.score, 0)
          const precision = calculateEndPrecision(shots)
          return { shots, endScore, precision }
        })

      const totalScore = data.totalScore ?? ends.reduce((total, end) => total + end.endScore, 0)

      rounds.push({
        id: data.id ?? docSnapshot.id,
        createdAt: data.createdAt ?? new Date().toISOString(),
        ends,
        totalScore,
      })
    })
    
    return rounds
  } catch (error) {
    console.error('Error loading rounds from Firestore:', error)
    throw error
  }
}

/**
 * Delete a round from Firestore for a specific user
 */
export const deleteRoundFromFirestore = async (userId: string, roundId: string): Promise<void> => {
  try {
    const roundRef = doc(db, 'users', userId, 'rounds', roundId)
    await deleteDoc(roundRef)
  } catch (error) {
    console.error('Error deleting round from Firestore:', error)
    throw error
  }
}
