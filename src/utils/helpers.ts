import type { End } from './types'
import { RING_COUNT } from './constants'

export const generateEndTemplate = (): End => ({
  shots: [],
  endScore: 0,
})

export const calculateScore = (x: number, y: number): number => {
  const distance = Math.sqrt(x * x + y * y)
  const normalized = Math.min(distance, 1)
  const ring = Math.floor(normalized * RING_COUNT)
  const score = Math.max(0, 10 - ring)
  return score
}

export const generateRingColors = (ringCount: number): string[] => {
  const colors: string[] = []
  for (let ringIndex = 0; ringIndex < ringCount; ringIndex += 1) {
    colors.push(ringIndex % 2 === 0 ? '#f87171' : '#ffffff')
  }
  return colors
}
