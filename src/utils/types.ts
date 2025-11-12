export type View = 'home' | 'record' | 'stats' | 'profile'

export type Shot = {
  x: number
  y: number
  score: number
}

export type End = {
  shots: Shot[]
  endScore: number
  precision: number
}

export type Round = {
  id: string
  createdAt: string
  ends: End[]
  totalScore: number
}

export type StoredRound = {
  id: string
  createdAt: string
  totalScore: number
  round: Record<string, Record<string, StoredShot | number>>
}

export type StoredShot = {
  x?: number
  y?: number
  score: number
}

export type AggregateStats = {
  averagePoints: number
  averageDistanceFromCenter: number
  averageDistanceBetweenShots: number
  averagePrecision: number
  shotCount: number
}
