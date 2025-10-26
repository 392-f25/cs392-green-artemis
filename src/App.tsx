import type { MouseEvent } from 'react'
import { useEffect, useMemo, useState } from 'react'
import './App.css'
import type { View, Shot, End, Round, StoredRound, StoredShot } from './utils/types'
import { RING_COUNT, SHOTS_PER_END, DEFAULT_ENDS_PER_ROUND, MIN_ENDS, MAX_ENDS } from './utils/constants'
import { generateEndTemplate, calculateScore, generateRingColors, calculateEndPrecision } from './utils/helpers'
import { Target } from './components/Target'
import { EndSummary } from './components/EndSummary'
import { EndsPerRoundSelector } from './components/EndsPerRoundSelector'
import { StatsView } from './components/StatsView'

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
    if (!stored) {
      return
    }

    try {
      const parsed: unknown = JSON.parse(stored)
      if (!Array.isArray(parsed)) {
        return
      }

      const hydrated = parsed
        .map(item => {
          if (typeof item !== 'object' || item === null) {
            return null
          }

          if ('round' in item && typeof item.round === 'object' && item.round !== null) {
            const storedRound = item as StoredRound
            const ends = Object.keys(storedRound.round ?? {})
              .sort()
              .map(endKey => {
                const storedShots = storedRound.round?.[endKey] ?? {}
                const orderedShots = Object.keys(storedShots)
                  .sort()
                  .map(shotKey => storedShots[shotKey])
                  .filter(
                    (entry): entry is StoredShot | number =>
                      typeof entry === 'number' || (typeof entry === 'object' && entry !== null && 'score' in entry),
                  )
                  .slice(0, SHOTS_PER_END)

                const shots: Shot[] = orderedShots.map(entry => {
                  if (typeof entry === 'number') {
                    return { x: 0, y: 0, score: entry }
                  }
                  const shotScore = typeof entry.score === 'number' ? entry.score : 0
                  const shotX = typeof entry.x === 'number' ? entry.x : 0
                  const shotY = typeof entry.y === 'number' ? entry.y : 0
                  return { x: shotX, y: shotY, score: shotScore }
                })

                const endScore = shots.reduce((total, shot) => total + shot.score, 0)
                const precision = calculateEndPrecision(shots)
                return { shots, endScore, precision }
              })

            const totalScore = storedRound.totalScore ?? ends.reduce((total, end) => total + end.endScore, 0)

            return {
              id: storedRound.id ?? crypto.randomUUID(),
              createdAt: storedRound.createdAt ?? new Date().toISOString(),
              ends,
              totalScore,
            }
          }

          if ('ends' in item) {
            const roundCandidate = item as Partial<Round>
            const ends = (roundCandidate.ends ?? []).map(end => {
              const shots = (end?.shots ?? []).map(shot => ({
                x: typeof shot?.x === 'number' ? shot.x : 0,
                y: typeof shot?.y === 'number' ? shot.y : 0,
                score: typeof shot?.score === 'number' ? shot.score : 0,
              })).slice(0, SHOTS_PER_END)
              const endScore = end?.endScore ?? shots.reduce((total, shot) => total + shot.score, 0)
              const precision = calculateEndPrecision(shots)
              return { shots, endScore, precision }
            })
            const totalScore = roundCandidate.totalScore ?? ends.reduce((total, end) => total + end.endScore, 0)
            return {
              id: roundCandidate.id ?? crypto.randomUUID(),
              createdAt: roundCandidate.createdAt ?? new Date().toISOString(),
              ends,
              totalScore,
            }
          }

          return null
        })
        .filter((round): round is Round => round !== null)

      if (hydrated.length > 0) {
        setRounds(hydrated)
      }
    } catch (err) {
      console.error('Failed to parse rounds', err)
    }
  }, [])

  useEffect(() => {
    const payload: StoredRound[] = rounds.map(round => {
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
    localStorage.setItem('archery-rounds', JSON.stringify(payload))
  }, [rounds])

  const ringColors = useMemo(() => generateRingColors(RING_COUNT), [])

  const resetRoundState = () => {
    setCurrentEndIndex(0)
    setCurrentRound(Array.from({ length: endsPerRound }, generateEndTemplate))
    setActiveShot(null)
  }

  useEffect(() => {
    if (view === 'new-practice') {
      resetRoundState()
    }
  }, [view, endsPerRound])

  const updateEndWithShot = (shot: Shot) => {
    setCurrentRound(prev => {
      const updated = [...prev]
      const end = updated[currentEndIndex]
      if (!end) return prev

      const shots = [...end.shots, shot].slice(0, SHOTS_PER_END)
      const endScore = shots.reduce((total, s) => total + s.score, 0)
      const precision = calculateEndPrecision(shots)
      updated[currentEndIndex] = { shots, endScore, precision }
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
      precision: calculateEndPrecision(end.shots.slice(0, SHOTS_PER_END)),
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
      <button className="primary-button" onClick={() => setView('new-practice')}>
        Add New Practice
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

  const newPracticeView = (
    <div className="flex flex-col gap-6 w-full max-w-sm mx-auto">
      <EndsPerRoundSelector
        endsPerRound={endsPerRound}
        minEnds={MIN_ENDS}
        maxEnds={MAX_ENDS}
        onChange={handleEndsPerRoundChange}
      />

      <Target
        ringColors={ringColors}
        currentRound={currentRound}
        currentEndIndex={currentEndIndex}
        activeShot={activeShot}
        onTargetClick={handleTargetClick}
        ringCount={RING_COUNT}
      />

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

      <EndSummary
        currentRound={currentRound}
        currentEndIndex={currentEndIndex}
        onEndClick={setCurrentEndIndex}
      />

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
      case 'new-practice':
        return newPracticeView
      case 'stats':
        return <StatsView rounds={rounds} />
      case 'feed':
        return <div className="text-center text-slate-200">Feed coming soon.</div>
      default:
        return null
    }
  }

  return (
    <div className="app-shell">
      <header className="app-header">
        {view !== 'landing' ? (
          <button className="back-button" onClick={() => setView('landing')}>
            Back
          </button>
        ) : (
          <div className="header-spacer" />
        )}
        <h1 className="app-title">Artemis Tracker</h1>
        <div className="header-spacer" />
      </header>
      <main className="app-main">
        {renderView()}
      </main>
      {view === 'new-practice' && (
        <footer className="app-footer text-slate-300 text-xs text-center">
          Tap target to place shot. Confirm to lock it in.
        </footer>
      )}
    </div>
  )
}

export default App
