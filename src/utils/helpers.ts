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
  const bandColors = ['#e6d100', '#e4442c', '#23a0d6', '#484239', '#d3c5b3']
  const colors: string[] = []

  for (let ringIndex = 0; ringIndex < ringCount; ringIndex += 1) {
    const bandIndex = Math.floor(ringIndex / 2)
    const color = bandColors[Math.min(bandIndex, bandColors.length - 1)]
    colors.push(color)
  }

  return colors.reverse()
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

  // Calculate the center of the group (mean x and y coordinates)
  const centerX = calculateAverage(shots.map(shot => shot.x))
  const centerY = calculateAverage(shots.map(shot => shot.y))

  // Calculate distance of each shot from the group center
  const distances = shots.map(shot => {
    const deltaX = shot.x - centerX
    const deltaY = shot.y - centerY
    const distance = Math.sqrt(deltaX ** 2 + deltaY ** 2)
    return distance * targetRadius
  })

  // Return the mean radius (average distance from group center)
  return calculateAverage(distances)
}
