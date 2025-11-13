import { describe, it, expect } from 'vitest'
import {
  calculateScore,
  calculateDistanceFromCenter,
  calculateAverage,
  calculateEndPrecision,
} from './helpers'
import type { Shot } from './types'


describe('calculateScore', () => {
  it('should return 10 for center shot (0, 0)', () => {
    expect(calculateScore(0, 0)).toBe(10)
  })

  it('should return 10 for shots very close to center', () => {
    expect(calculateScore(0.01, 0.01)).toBe(10)
    expect(calculateScore(0.05, 0.05)).toBe(10)
  })

  it('should return 9 for shots in ring 1', () => {
    // Just outside ring 0, distance around 0.1
    expect(calculateScore(0.1, 0)).toBe(9)
    expect(calculateScore(0, 0.1)).toBe(9)
  })

  it('should return decreasing scores for increasing distances', () => {
    // Ring 0 (center) = score 10
    expect(calculateScore(0, 0)).toBe(10)
    
    // Ring 2-3 = score 8-7
    expect(calculateScore(0.3, 0)).toBe(7)
    
    // Ring 5 = score 5
    expect(calculateScore(0.5, 0)).toBe(5)
  })

  it('should return 1 for shots near the edge', () => {
    expect(calculateScore(0.9, 0)).toBe(1)
  })

  it('should return 0 for shots outside the target (distance >= 1)', () => {
    expect(calculateScore(1, 0)).toBe(0)
    expect(calculateScore(1.5, 0)).toBe(0)
    expect(calculateScore(2, 2)).toBe(0)
  })

  it('should handle diagonal shots correctly', () => {
    // Distance = sqrt(0.5^2 + 0.5^2) = sqrt(0.5) ≈ 0.707
    const score = calculateScore(0.5, 0.5)
    expect(score).toBeGreaterThanOrEqual(2)
    expect(score).toBeLessThanOrEqual(3)
  })

  it('should handle negative coordinates', () => {
    expect(calculateScore(-0.1, 0)).toBe(9)
    expect(calculateScore(0, -0.2)).toBe(8)
    expect(calculateScore(-0.5, -0.5)).toBeGreaterThanOrEqual(2)
  })
})

describe('calculateDistanceFromCenter', () => {
  it('should return 0 for center shot', () => {
    const shot: Shot = { x: 0, y: 0, score: 10 }
    expect(calculateDistanceFromCenter(shot)).toBe(0)
  })

  it('should calculate distance correctly with default target radius', () => {
    const shot: Shot = { x: 0.5, y: 0, score: 5 }
    // Distance = 0.5 * 10 = 5
    expect(calculateDistanceFromCenter(shot)).toBe(5)
  })

  it('should calculate distance for diagonal shots', () => {
    const shot: Shot = { x: 0.6, y: 0.8, score: 4 }
    // Distance = sqrt(0.6^2 + 0.8^2) * 10 = sqrt(0.36 + 0.64) * 10 = 1 * 10 = 10
    expect(calculateDistanceFromCenter(shot)).toBe(10)
  })

  it('should handle negative coordinates', () => {
    const shot: Shot = { x: -0.3, y: 0, score: 7 }
    // Distance = 0.3 * 10 = 3
    expect(calculateDistanceFromCenter(shot)).toBe(3)
  })

  it('should handle custom target radius', () => {
    const shot: Shot = { x: 0.5, y: 0, score: 5 }
    // Distance = 0.5 * 20 = 10
    expect(calculateDistanceFromCenter(shot, 20)).toBe(10)
  })

  it('should calculate distance for missed shots', () => {
    const shot: Shot = { x: 1.5, y: 1.5, score: 0 }
    // Distance = sqrt(1.5^2 + 1.5^2) * 10 ≈ 21.21
    expect(calculateDistanceFromCenter(shot)).toBeCloseTo(21.21, 2)
  })
})

describe('calculateAverage', () => {
  it('should return 0 for empty array', () => {
    expect(calculateAverage([])).toBe(0)
  })

  it('should return the value for single element array', () => {
    expect(calculateAverage([5])).toBe(5)
    expect(calculateAverage([10])).toBe(10)
  })

  it('should calculate average of positive numbers', () => {
    expect(calculateAverage([1, 2, 3, 4, 5])).toBe(3)
    expect(calculateAverage([10, 20, 30])).toBe(20)
  })

  it('should calculate average of negative numbers', () => {
    expect(calculateAverage([-1, -2, -3])).toBe(-2)
  })

  it('should calculate average of mixed positive and negative numbers', () => {
    expect(calculateAverage([-5, 0, 5])).toBe(0)
    expect(calculateAverage([-10, 10, -5, 5])).toBe(0)
  })

  it('should calculate average of decimal numbers', () => {
    expect(calculateAverage([1.5, 2.5, 3.5])).toBe(2.5)
  })

  it('should handle very small numbers', () => {
    expect(calculateAverage([0.001, 0.002, 0.003])).toBeCloseTo(0.002, 6)
  })

  it('should handle very large numbers', () => {
    expect(calculateAverage([1000, 2000, 3000])).toBe(2000)
  })

  it('should handle arrays with zeros', () => {
    expect(calculateAverage([0, 0, 0])).toBe(0)
    expect(calculateAverage([0, 5, 10])).toBe(5)
  })
})

describe('calculateEndPrecision', () => {
  it('should return 0 for empty shots array', () => {
    expect(calculateEndPrecision([])).toBe(0)
  })

  it('should return 0 for single shot', () => {
    const shots: Shot[] = [{ x: 0.5, y: 0.5, score: 8 }]
    expect(calculateEndPrecision(shots)).toBe(0)
  })

  it('should return 0 for shots at same location', () => {
    const shots: Shot[] = [
      { x: 0.5, y: 0.5, score: 8 },
      { x: 0.5, y: 0.5, score: 8 },
      { x: 0.5, y: 0.5, score: 8 },
    ]
    expect(calculateEndPrecision(shots)).toBe(0)
  })

  it('should calculate precision for shots centered at origin', () => {
    const shots: Shot[] = [
      { x: -0.1, y: 0, score: 9 },
      { x: 0.1, y: 0, score: 9 },
      { x: 0, y: 0, score: 10 },
    ]
    // Center: (0, 0)
    // Distances: 0.1, 0.1, 0
    // Average: 0.2/3 * 10 ≈ 0.67
    expect(calculateEndPrecision(shots)).toBeCloseTo(0.67, 2)
  })

  it('should calculate precision for off-center group', () => {
    const shots: Shot[] = [
      { x: 0.5, y: 0.5, score: 8 },
      { x: 0.6, y: 0.5, score: 8 },
      { x: 0.5, y: 0.6, score: 8 },
    ]
    // Center: (0.5333..., 0.5333...)
    // Each shot is approximately 0.0667 units from center
    // Average distance ≈ 0.0667 * 10 ≈ 0.67
    expect(calculateEndPrecision(shots)).toBeCloseTo(0.67, 1)
  })

  it('should calculate precision for scattered shots', () => {
    const shots: Shot[] = [
      { x: 0, y: 0, score: 10 },
      { x: 0.6, y: 0, score: 8 },
      { x: 0, y: 0.6, score: 8 },
    ]
    // Center: (0.2, 0.2)
    // Distance from (0,0) to center: sqrt(0.04 + 0.04) ≈ 0.283
    // Distance from (0.6,0) to center: sqrt(0.16 + 0.04) ≈ 0.447
    // Distance from (0,0.6) to center: sqrt(0.04 + 0.16) ≈ 0.447
    // Average: (0.283 + 0.447 + 0.447) / 3 ≈ 0.392 * 10 ≈ 3.92
    expect(calculateEndPrecision(shots)).toBeCloseTo(3.92, 1)
  })

  it('should handle two shots', () => {
    const shots: Shot[] = [
      { x: 0, y: 0, score: 10 },
      { x: 0.2, y: 0, score: 9 },
    ]
    // Center: (0.1, 0)
    // Each shot is 0.1 units from center
    // Average: 0.1 * 10 = 1
    expect(calculateEndPrecision(shots)).toBe(1)
  })

  it('should handle custom target radius', () => {
    const shots: Shot[] = [
      { x: 0, y: 0, score: 10 },
      { x: 0.2, y: 0, score: 9 },
    ]
    // Center: (0.1, 0)
    // Each shot is 0.1 units from center
    // Average: 0.1 * 20 = 2
    expect(calculateEndPrecision(shots, 20)).toBe(2)
  })

  it('should handle negative coordinates', () => {
    const shots: Shot[] = [
      { x: -0.2, y: -0.2, score: 9 },
      { x: -0.4, y: -0.2, score: 8 },
      { x: -0.2, y: -0.4, score: 8 },
    ]
    // Center: (-0.2667, -0.2667)
    // Should calculate mean radius from this center
    const precision = calculateEndPrecision(shots)
    expect(precision).toBeGreaterThan(0)
    expect(precision).toBeLessThan(2)
  })

  it('should measure consistency, not accuracy', () => {
    // Tight group far from center
    const tightGroup: Shot[] = [
      { x: 0.8, y: 0.8, score: 2 },
      { x: 0.81, y: 0.8, score: 2 },
      { x: 0.8, y: 0.81, score: 2 },
    ]
    
    // Loose group at center
    const looseGroup: Shot[] = [
      { x: 0, y: 0, score: 10 },
      { x: 0.3, y: 0, score: 7 },
      { x: 0, y: 0.3, score: 7 },
    ]
    
    // Tight group should have better (lower) precision
    expect(calculateEndPrecision(tightGroup)).toBeLessThan(calculateEndPrecision(looseGroup))
  })

  it('should handle missed shots in precision calculation', () => {
    const shots: Shot[] = [
      { x: 0, y: 0, score: 10 },
      { x: 1.5, y: 0, score: 0 }, // Missed shot
      { x: 0, y: 1.5, score: 0 }, // Missed shot
    ]
    // Should still calculate precision based on group center
    const precision = calculateEndPrecision(shots)
    expect(precision).toBeGreaterThan(0)
  })
})
