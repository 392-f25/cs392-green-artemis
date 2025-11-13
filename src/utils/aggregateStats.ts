/**
 * Utility for computing aggregate statistics from practice rounds.
 * This calculates various metrics across selected practices for analysis.
 */

import type { Round, AggregateStats } from './types'
import { calculateAverage, calculateDistanceFromCenter } from './helpers'

/**
 * Computes aggregate statistics from an array of practice rounds.
 * 
 * @param rounds - Array of practice rounds to analyze
 * @returns Aggregate statistics including averages, counts, and precision metrics
 * 
 * @example
 * ```typescript
 * const rounds = [
 *   {
 *     id: '1',
 *     createdAt: '2024-01-01',
 *     ends: [{ shots: [{ x: 0.1, y: 0.1, score: 10 }], endScore: 10, precision: 0 }],
 *     totalScore: 10
 *   }
 * ]
 * const stats = computeAggregateStats(rounds)
 * // Returns: { averagePoints: 10, averageDistanceFromCenter: ..., missedShots: 0, ... }
 * ```
 */
export const computeAggregateStats = (rounds: Round[]): AggregateStats => {
  const shots = rounds.flatMap(round => round.ends.flatMap(end => end.shots))
  const averagePoints = calculateAverage(shots.map(shot => shot.score))
  const averageDistanceFromCenter = calculateAverage(shots.map(shot => calculateDistanceFromCenter(shot)))
  const missedShots = shots.filter(shot => shot.score === 0).length
  const endPrecisions = rounds.flatMap(round => round.ends.map(end => end.precision).filter(value => value > 0))
  const averagePrecision = calculateAverage(endPrecisions)

  return {
    averagePoints,
    averageDistanceFromCenter,
    missedShots,
    averagePrecision,
    shotCount: shots.length,
  }
}

