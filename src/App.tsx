import type { MouseEvent } from 'react'
import { useEffect, useMemo, useState } from 'react'
import './App.css'

type View = 'landing' | 'new-workout' | 'stats' | 'feed'

type Shot = {
  x: number
  y: number
  score: number
}

type End = {
  shots: Shot[]
  endScore: number
}

type Round = {
  id: string
  createdAt: string
  ends: End[]
  totalScore: number
}

type StoredRound = {
  id: string
  createdAt: string
  totalScore: number
  round: Record<string, Record<string, number>>
}

const RING_COUNT = 10
const SHOTS_PER_END = 3
const DEFAULT_ENDS_PER_ROUND = 6
const MIN_ENDS = 1
const MAX_ENDS = 12

const generateEndTemplate = (): End => ({
  shots: [],
  endScore: 0,
})

const App = () => {
  const [view, setView] = useState<View>('landing')
  const [endsPerRound, setEndsPerRound] = useState(DEFAULT_ENDS_PER_ROUND)
  const [currentEndIndex, setCurrentEndIndex] = useState(0)
  const [currentRound, setCurrentRound] = useState<End[]>(() =>
    Array.from({ length: DEFAULT_ENDS_PER_ROUND }, generateEndTemplate),
  )
  const [activeShot, setActiveShot] = useState<Shot | null>(null)
  const [rounds, setRounds] = useState<Round[]>([])

  useEffect(() => {
    const stored = localStorage.getItem('archery-rounds')
    if (stored) {
      try {
        const parsed: unknown = JSON.parse(stored)
        if (Array.isArray(parsed)) {
          if (parsed.every(item => typeof item === 'object' && item !== null && 'round' in item)) {
            const hydrated: Round[] = (parsed as StoredRound[]).map(storedRound => {
              const ends = Object.keys(storedRound.round ?? {})
                .sort()
                .map(endKey => {
                  const scoreMap = storedRound.round[endKey] ?? {}
                  const scoreEntries = Object.keys(scoreMap)
                    .sort()
                    .map(scoreKey => scoreMap[scoreKey])
                    .filter(score => typeof score === 'number')
                    .slice(0, SHOTS_PER_END)
                  const shots: Shot[] = scoreEntries.map(score => ({ x: 0, y: 0, score }))
                  const endScore = shots.reduce((total, shot) => total + shot.score, 0)
                  return { shots, endScore }
                })

              const totalScore = storedRound.totalScore ?? ends.reduce((total, end) => total + end.endScore, 0)

              return {
                id: storedRound.id ?? crypto.randomUUID(),
                createdAt: storedRound.createdAt ?? new Date().toISOString(),
                ends,
                totalScore,
              }
            })
            setRounds(hydrated)
          } else {
            setRounds(parsed as Round[])
          }
        }
      } catch (err) {
        console.error('Failed to parse rounds', err)
      }
    }
  }, [])

  useEffect(() => {
    const payload: StoredRound[] = rounds.map(round => {
      const roundData = round.ends.reduce<Record<string, Record<string, number>>>((acc, end, endIndex) => {
        const endKey = `end${String(endIndex + 1).padStart(2, '0')}`
        const scoreEntries: Record<string, number> = {}
        end.shots.forEach((shot, shotIndex) => {
          const scoreKey = `score${shotIndex + 1}`
          scoreEntries[scoreKey] = shot.score
        })
        acc[endKey] = scoreEntries
        return acc
      }, {})

      return {
        id: round.id,
        createdAt: round.createdAt,
        totalScore: round.totalScore,
        round: roundData,
      }
    })
    localStorage.setItem('archery-rounds', JSON.stringify(payload))
  }, [rounds])

  const ringColors = useMemo(() => {
    const colors: string[] = []
    for (let ringIndex = 0; ringIndex < RING_COUNT; ringIndex += 1) {
      colors.push(ringIndex % 2 === 0 ? '#f87171' : '#ffffff')
    }
    return colors
  }, [])

  const resetRoundState = () => {
    setCurrentEndIndex(0)
    setCurrentRound(Array.from({ length: endsPerRound }, generateEndTemplate))
    setActiveShot(null)
  }

  useEffect(() => {
    if (view === 'new-workout') {
      resetRoundState()
    }
  }, [view, endsPerRound])

  const calculateScore = (x: number, y: number) => {
    const distance = Math.sqrt(x * x + y * y)
    const normalized = Math.min(distance, 1)
    const ring = Math.floor(normalized * RING_COUNT)
    const score = Math.max(0, 10 - ring)
    return score
  }

  const updateEndWithShot = (shot: Shot) => {
    setCurrentRound(prev => {
      const updated = [...prev]
      const end = updated[currentEndIndex]
      if (!end) return prev

      const shots = [...end.shots, shot].slice(0, SHOTS_PER_END)
      const endScore = shots.reduce((total, s) => total + s.score, 0)
      updated[currentEndIndex] = { shots, endScore }
      return updated
    })
  }

  const handleTargetClick = (event: MouseEvent<HTMLDivElement>) => {
    const currentEnd = currentRound[currentEndIndex]
    if (!currentEnd || currentEnd.shots.length >= SHOTS_PER_END) {
      return
    }
    const target = event.currentTarget
    const rect = target.getBoundingClientRect()
    const centerX = rect.left + rect.width / 2
    const centerY = rect.top + rect.height / 2
    const clickX = event.clientX - centerX
    const clickY = event.clientY - centerY
    const radius = rect.width / 2
    const normalizedX = clickX / radius
    const normalizedY = clickY / radius
    const distance = Math.sqrt(normalizedX ** 2 + normalizedY ** 2)
    if (distance > 1) return

    const score = calculateScore(normalizedX, normalizedY)
    const shot: Shot = {
      x: normalizedX,
      y: normalizedY,
      score,
    }
    setActiveShot(shot)
  }

  const handleConfirmShot = () => {
    const end = currentRound[currentEndIndex]
    if (!activeShot || !end || end.shots.length >= SHOTS_PER_END) return
    updateEndWithShot(activeShot)
    setActiveShot(null)
  }

  const currentEnd = currentRound[currentEndIndex]
  const shotsInCurrentEnd = currentEnd?.shots ?? []

  const canConfirmShot = Boolean(activeShot) && shotsInCurrentEnd.length < SHOTS_PER_END
  const shotsRemainingInEnd = Math.max(0, SHOTS_PER_END - shotsInCurrentEnd.length)
  const isEndComplete = shotsInCurrentEnd.length === SHOTS_PER_END
  const isRoundComplete = currentRound.length === endsPerRound && currentRound.every(end => end.shots.length === SHOTS_PER_END)

  const handleSaveEnd = () => {
    if (!isEndComplete) return
    const nextIncompleteIndex = currentRound.findIndex((end, index) => index > currentEndIndex && end.shots.length < SHOTS_PER_END)
    if (nextIncompleteIndex !== -1) {
      setCurrentEndIndex(nextIncompleteIndex)
    } else {
      setCurrentEndIndex(Math.min(currentEndIndex + 1, endsPerRound - 1))
    }
  }

  const handleSaveRound = () => {
    if (!isRoundComplete) return
    const normalizedEnds = currentRound.map(end => ({
      shots: end.shots.slice(0, SHOTS_PER_END),
      endScore: end.shots.slice(0, SHOTS_PER_END).reduce((total, shot) => total + shot.score, 0),
    }))
    const totalScore = normalizedEnds.reduce((total, end) => total + end.endScore, 0)
    const round: Round = {
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
      ends: normalizedEnds,
      totalScore,
    }
    setRounds(prev => [...prev, round])
    setView('landing')
  }

  const handleResetEnd = () => {
    setCurrentRound(prev => {
      const updated = [...prev]
      updated[currentEndIndex] = generateEndTemplate()
      return updated
    })
    setActiveShot(null)
  }

  const landingView = (
    <div className="flex flex-col gap-4 w-full max-w-sm mx-auto">
      <button className="primary-button" onClick={() => setView('new-workout')}>
        Add New Workout
      </button>
      <button className="secondary-button" onClick={() => setView('stats')}>
        View Stats
      </button>
      <button className="secondary-button" onClick={() => setView('feed')}>
        View Feed
      </button>
    </div>
  )

  const handleEndsPerRoundChange = (value: number) => {
    const clamped = Math.min(MAX_ENDS, Math.max(MIN_ENDS, Math.floor(value)))
    setEndsPerRound(clamped)
  }

  const newWorkoutView = (
    <div className="flex flex-col gap-6 w-full max-w-sm mx-auto">
      <div>
        <label className="block text-sm font-medium text-slate-200">Ends per round</label>
        <div className="flex gap-2 mt-2 items-center">
          {[3, 6, 9].map(value => (
            <button
              key={value}
              className={`chip ${value === endsPerRound ? 'chip--active' : ''}`}
              onClick={() => handleEndsPerRoundChange(value)}
            >
              {value}
            </button>
          ))}
          <input
            className="number-input"
            type="number"
            min={MIN_ENDS}
            max={MAX_ENDS}
            value={endsPerRound}
            onChange={event => handleEndsPerRoundChange(Number(event.target.value) || MIN_ENDS)}
          />
        </div>
        <p className="text-xs text-slate-400 mt-1">Choose between {MIN_ENDS} and {MAX_ENDS} ends per round.</p>
      </div>

      <div className="relative mx-auto">
        <div className="target" onClick={handleTargetClick} role="presentation">
          {ringColors.map((color, index) => (
            <div
              key={index}
              className="target-ring"
              style={{
                backgroundColor: color,
                width: `${100 - (index / RING_COUNT) * 100}%`,
                height: `${100 - (index / RING_COUNT) * 100}%`,
              }}
            />
          ))}
        {currentRound.flatMap((end, endIndex) =>
          end.shots.map((shot, shotIndex) => (
            <div
              key={`${endIndex}-${shotIndex}`}
              className={`shot-dot ${endIndex === currentEndIndex ? 'shot-dot--current' : 'shot-dot--previous'}`}
              style={{
                left: `${(shot.x + 1) * 50}%`,
                top: `${(shot.y + 1) * 50}%`,
              }}
            />
          )),
        )}
          {activeShot && (
            <div
              className="shot-dot shot-dot--preview"
              style={{
                left: `${(activeShot.x + 1) * 50}%`,
                top: `${(activeShot.y + 1) * 50}%`,
              }}
            />
          )}
        </div>
      </div>

      <div className="text-center text-slate-200">
        <p className="text-lg font-semibold">End {currentEndIndex + 1} of {endsPerRound}</p>
        <p className="text-sm text-slate-300">Shots taken: {shotsInCurrentEnd.length} / {SHOTS_PER_END}</p>
        {shotsRemainingInEnd > 0 ? (
          <p className="text-xs text-slate-400">{shotsRemainingInEnd} shot{shotsRemainingInEnd === 1 ? '' : 's'} remaining in this end</p>
        ) : (
          <p className="text-xs text-emerald-400">End complete</p>
        )}
        <p className="text-sm text-slate-300">End score: {currentEnd?.endScore ?? 0}</p>
      </div>

      <div className="end-summary">
        {currentRound.map((end, index) => (
          <div
            key={index}
            className={`end-summary__item ${index === currentEndIndex ? 'end-summary__item--active' : ''}`}
            onClick={() => setCurrentEndIndex(index)}
            role="button"
            tabIndex={0}
            onKeyDown={event => {
              if (event.key === 'Enter' || event.key === ' ') {
                setCurrentEndIndex(index)
              }
            }}
          >
            <span className="end-summary__label">End {index + 1}</span>
            <span className="end-summary__score">{end.endScore}</span>
          </div>
        ))}
      </div>

      <div className="flex flex-col gap-2">
        <button
          className="primary-button"
          onClick={canConfirmShot ? handleConfirmShot : handleSaveEnd}
          disabled={canConfirmShot ? false : !isEndComplete}
        >
          {canConfirmShot ? 'Confirm Shot' : 'Save End'}
        </button>
        <button
          className="secondary-button"
          onClick={handleResetEnd}
        >
          Reset End
        </button>
        <button
          className="secondary-button"
          onClick={() => setView('landing')}
        >
          Cancel Round
        </button>
      </div>

      <button
        className="primary-button"
        onClick={handleSaveRound}
        disabled={!isRoundComplete}
      >
        Save Round
      </button>
    </div>
  )

  const renderView = () => {
    switch (view) {
      case 'landing':
        return landingView
      case 'new-workout':
        return newWorkoutView
      case 'stats':
        return <div className="text-center text-slate-200">Stats coming soon.</div>
      case 'feed':
        return <div className="text-center text-slate-200">Feed coming soon.</div>
      default:
        return null
    }
  }

  return (
    <div className="app-shell">
      <header className="app-header">
        {view !== 'landing' && (
          <button className="back-button" onClick={() => setView('landing')}>
            Back
          </button>
        )}
        <h1 className="app-title">Artemis Tracker</h1>
      </header>
      <main className="app-main">
        {renderView()}
      </main>
      {view === 'new-workout' && (
        <footer className="app-footer text-slate-300 text-xs text-center">
          Tap target to place shot. Confirm to lock it in.
        </footer>
      )}
    </div>
  )
}

export default App
