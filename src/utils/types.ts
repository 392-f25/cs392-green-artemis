export type View = 'landing' | 'new-workout' | 'stats' | 'feed'

export type Shot = {
  x: number
  y: number
  score: number
}

export type End = {
  shots: Shot[]
  endScore: number
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
  round: Record<string, Record<string, number>>
}
