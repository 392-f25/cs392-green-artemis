import type { End, Shot } from './types'
import { RING_COUNT, TARGET_RADIUS_UNITS } from './constants'

export const generateEndTemplate = (): End => ({
  shots: [],
  endScore: 0,
  precision: 0,
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

export const calculateDistanceFromCenter = (shot: Shot, targetRadius = TARGET_RADIUS_UNITS): number => {
  const distance = Math.sqrt(shot.x ** 2 + shot.y ** 2)
  return distance * targetRadius
}

export const calculateDistanceBetweenShots = (first: Shot, second: Shot, targetRadius = TARGET_RADIUS_UNITS): number => {
  const deltaX = first.x - second.x
  const deltaY = first.y - second.y
  const distance = Math.sqrt(deltaX ** 2 + deltaY ** 2)
  return distance * targetRadius
}

export const calculateAverage = (values: number[]): number => {
  if (values.length === 0) {
    return 0
  }
  const total = values.reduce((sum, value) => sum + value, 0)
  return total / values.length
}

export const calculateEndPrecision = (shots: Shot[], targetRadius = TARGET_RADIUS_UNITS): number => {
  if (shots.length <= 1) {
    return 0
  }
  
  const distances: number[] = []
  for (let i = 1; i < shots.length; i += 1) {
    distances.push(calculateDistanceBetweenShots(shots[i - 1], shots[i], targetRadius))
  }
  
  return calculateAverage(distances)
}
