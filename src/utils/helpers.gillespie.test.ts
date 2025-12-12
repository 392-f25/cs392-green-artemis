import { describe, it, expect } from 'vitest'
import { calculateEndPrecision } from './helpers'
import type { Shot } from './types'

describe('calculateEndPrecision', () => {
  describe('Check when there is not enough shots', () => {
    it('should return 0 when there are no shots', () => {
      const shots: Shot[] = []
      expect(calculateEndPrecision(shots)).toBe(0)
    })

    it('no shots should mean 0 precision', () => {
      const shots: Shot[] = [{ x: 0.5, y: 0.5 }]
      expect(calculateEndPrecision(shots)).toBe(0)
    })
  })

  describe('All shots are the exact same', () => {
    it('return 0 when all the shots are the same', () => {
      const shots: Shot[] = [
        { x: 0.3, y: 0.4 },
        { x: 0.3, y: 0.4 },
        { x: 0.3, y: 0.4 }
      ]
      expect(calculateEndPrecision(shots)).toBeCloseTo(0, 10)
    })
  })

  describe('Multiple shots on the same axis', () => {
    it('calculate precision shots on x axis', () => {
      const shots: Shot[] = [
        { x: -0.1, y: 0 },
        { x: 0.1, y: 0 }
      ]
      expect(calculateEndPrecision(shots)).toBeCloseTo(1, 1)
    })

    it('calculate precision for shots on y axis', () => {
      const shots: Shot[] = [
        { x: 0, y: -0.2 },
        { x: 0, y: 0.2 }
      ]
      expect(calculateEndPrecision(shots)).toBeCloseTo(2, 1)
    })
  })

  describe('Shots at random positions', () => {
    it('calculate precision for shots close together', () => {
      const shots: Shot[] = [
        { x: 0, y: 0 },
        { x: 0.01, y: 0 },
        { x: 0, y: 0.01 }
      ]
      const precision = calculateEndPrecision(shots)
      expect(precision).toBeLessThan(1)
      expect(precision).toBeGreaterThan(0)
    })

    it('calculate precision for shots further apart', () => {
      const shots: Shot[] = [
        { x: -0.2, y: 0 },
        { x: 0.2, y: 0 },
        { x: 0, y: 0.2 }
      ]
      const precision = calculateEndPrecision(shots)
      expect(precision).toBeGreaterThan(1)
    })
  })

  describe('More random shot patterns', () => {
    it('calculate precision for shots all on one side', () => {
      const shots: Shot[] = [
        { x: 0.5, y: 0 },
        { x: 0.5, y: 0.1 },
        { x: 0.5, y: -0.1 }
      ]
      const precision = calculateEndPrecision(shots)
      expect(precision).toBeLessThan(2)
      expect(precision).toBeGreaterThan(0)
    })
  })
})



