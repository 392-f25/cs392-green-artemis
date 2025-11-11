import type { MouseEvent } from 'react'
import { useEffect, useMemo, useState } from 'react'
import './App.css'
import type { View, Shot, End, Round } from './utils/types'
import { RING_COUNT, SHOTS_PER_END, DEFAULT_ENDS_PER_ROUND, MIN_ENDS, MAX_ENDS } from './utils/constants'
import { generateEndTemplate, calculateScore, generateRingColors, calculateEndPrecision } from './utils/helpers'
import { Target } from './components/Target'
import { EndSummary } from './components/EndSummary'
import { EndsPerRoundSelector } from './components/EndsPerRoundSelector'
import { StatsView } from './components/StatsView'
import { auth, googleProvider } from './firebase'
import { onAuthStateChanged, signInWithPopup, signOut, type User } from 'firebase/auth'
import { saveRoundToFirestore, loadRoundsFromFirestore } from './utils/firestore'

const App = () => {
  const [view, setView] = useState<View>('landing')
  const [endsPerRound, setEndsPerRound] = useState(DEFAULT_ENDS_PER_ROUND)
  const [endsPerRoundInput, setEndsPerRoundInput] = useState(String(DEFAULT_ENDS_PER_ROUND))
  const [currentEndIndex, setCurrentEndIndex] = useState(0)
  const [currentRound, setCurrentRound] = useState<End[]>(() =>
    Array.from({ length: DEFAULT_ENDS_PER_ROUND }, generateEndTemplate),
  )
  const [activeShot, setActiveShot] = useState<Shot | null>(null)
  const [rounds, setRounds] = useState<Round[]>([])
  const [user, setUser] = useState<User | null>(null)
  const [isLoadingRounds, setIsLoadingRounds] = useState(false)

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async current => {
      setUser(current)
      
      // Load rounds from Firestore when user signs in
      if (current) {
        setIsLoadingRounds(true)
        try {
          const firestoreRounds = await loadRoundsFromFirestore(current.uid)
          setRounds(firestoreRounds)
        } catch (error) {
          console.error('Failed to load rounds from Firestore:', error)
        } finally {
          setIsLoadingRounds(false)
        }
      } else {
        // Clear rounds when user signs out
        setRounds([])
      }
    })
    return () => unsubscribe()
  }, [])

  const handleSignIn = async () => {
    try {
      await signInWithPopup(auth, googleProvider)
    } catch (err) {
      console.error('Sign-in failed', err)
    }
  }

  const handleSignOut = async () => {
    try {
      await signOut(auth)
    } catch (err) {
      console.error('Sign-out failed', err)
    }
  }

  // Note: We save rounds individually when they're created (see handleSaveRound)

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
    
    // Automatically move to next end if current end will be complete after this shot
    if (end.shots.length + 1 === SHOTS_PER_END) {
      // Use setTimeout to allow state to update first
      setTimeout(() => {
        const nextIncompleteIndex = currentRound.findIndex((e, index) => index > currentEndIndex && e.shots.length < SHOTS_PER_END)
        if (nextIncompleteIndex !== -1) {
          setCurrentEndIndex(nextIncompleteIndex)
        } else if (currentEndIndex < endsPerRound - 1) {
          setCurrentEndIndex(currentEndIndex + 1)
        }
      }, 300) // Small delay for better UX
    }
  }

  const currentEnd = currentRound[currentEndIndex]
  const shotsInCurrentEnd = currentEnd?.shots ?? []

  const canConfirmShot = Boolean(activeShot) && shotsInCurrentEnd.length < SHOTS_PER_END
  const shotsRemainingInEnd = Math.max(0, SHOTS_PER_END - shotsInCurrentEnd.length)
  const isRoundComplete = currentRound.length === endsPerRound && currentRound.every(end => end.shots.length === SHOTS_PER_END)

  const handleSaveRound = async () => {
    if (!isRoundComplete || !user) return
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
    
    // Save to Firestore first
    try {
      await saveRoundToFirestore(user.uid, round)
      // Only update local state after successful save
      setRounds(prev => [round, ...prev])
      setView('landing')
    } catch (error) {
      console.error('Failed to save round:', error)
      alert('Failed to save your practice session. Please try again.')
    }
  }

  const handleResetEnd = () => {
    setCurrentRound(prev => {
      const updated = [...prev]
      updated[currentEndIndex] = generateEndTemplate()
      return updated
    })
    setActiveShot(null)
  }

  const formatDate = (isoString: string) => {
    const date = new Date(isoString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))
    
    if (diffDays === 0) return 'Today'
    if (diffDays === 1) return 'Yesterday'
    if (diffDays < 7) return `${diffDays} days ago`
    
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  }

  const landingView = (
    <div className="flex flex-col gap-6 w-full max-w-2xl mx-auto">
      <div className="flex flex-col gap-2 sm:flex-row sm:justify-center">
        <button className="primary-button" onClick={() => setView('new-practice')}>
          Add Practice Session
        </button>
        <button className="secondary-button" onClick={() => setView('stats')}>
          View Stats
        </button>
      </div>

      <section className="feed-panel">
        <header className="feed-panel__header">
          <div className="feed-panel__title-group">
            <span className="feed-panel__badge">Your Practice</span>
            <h2 className="feed-panel__title">Practice History</h2>
          </div>
        </header>

        {isLoadingRounds ? (
          <div className="text-center py-12 text-slate-300">
            <p>Loading your practice sessions...</p>
          </div>
        ) : rounds.length === 0 ? (
          <div className="text-center py-12 text-slate-300">
            <p className="text-lg mb-2">No practice sessions yet</p>
            <p className="text-sm text-slate-400">Click "Add Practice Session" to get started!</p>
          </div>
        ) : (
          <div className="feed-grid">
            {rounds.map(round => {
              const allShots = round.ends.flatMap(end => end.shots)
              const averagePerEnd = round.totalScore / round.ends.length
              const bestEnd = Math.max(...round.ends.map(end => end.endScore))
              const averageSpacing = round.ends.reduce((sum, end) => sum + end.precision, 0) / round.ends.length

              return (
                <article key={round.id} className="feed-card">
                  <div className="feed-card__header">
                    <div className="feed-card__avatar" aria-hidden="true">
                      {user?.displayName?.slice(0, 2).toUpperCase() || user?.email?.slice(0, 2).toUpperCase() || 'ME'}
                    </div>
                    <div className="feed-card__meta">
                      <span className="feed-card__username">{user?.displayName || user?.email || 'You'}</span>
                      <span className="feed-card__subtitle">{round.ends.length} ends · {formatDate(round.createdAt)}</span>
                    </div>
                  </div>

                  <div className="feed-card__body">
                    <div className="feed-card__stats">
                      {[
                        { label: 'Avg / End', value: `${averagePerEnd.toFixed(1)} pts` },
                        { label: 'Best End', value: `${bestEnd} pts` },
                        { label: 'Total Score', value: `${round.totalScore} pts` },
                        { label: 'Avg Spacing', value: `${averageSpacing.toFixed(2)} units` }
                      ].map(stat => (
                        <div key={`${round.id}-${stat.label}`} className="feed-card__stat">
                          <span className="feed-card__stat-label">{stat.label}</span>
                          <span className="feed-card__stat-value">{stat.value}</span>
                        </div>
                      ))}
                    </div>

                    <div className="feed-card__thumbnail" role="img" aria-label="Target snapshot">
                      <div className="feed-card__thumbnail-inner">
                        <div className="feed-card__target">
                          {ringColors.map((color, index) => (
                            <span
                              key={index}
                              className="feed-card__target-ring"
                              style={{
                                backgroundColor: color,
                                width: `${((ringColors.length - index) / ringColors.length) * 100}%`,
                                height: `${((ringColors.length - index) / ringColors.length) * 100}%`,
                              }}
                            />
                          ))}
                          {allShots.map((shot, shotIndex) => (
                            <span
                              key={`${round.id}-shot-${shotIndex}`}
                              className="feed-card__target-shot"
                              style={{
                                left: `${(shot.x + 1) * 50}%`,
                                top: `${(shot.y + 1) * 50}%`,
                              }}
                            />
                          ))}
                        </div>
                      </div>
                      <span className="feed-card__thumbnail-caption">All shots from this session</span>
                    </div>
                  </div>
                </article>
              )
            })}
          </div>
        )}
      </section>
    </div>
  )

  const clampEndsPerRound = (value: number) => Math.min(MAX_ENDS, Math.max(MIN_ENDS, Math.floor(value)))

  const handleEndsPerRoundInputChange = (value: string) => {
    setEndsPerRoundInput(value)
    if (value === '') {
      return
    }

    const parsed = Number(value)
    if (Number.isNaN(parsed)) {
      return
    }

    const clamped = clampEndsPerRound(parsed)
    setEndsPerRound(clamped)
  }

  const handleEndsPerRoundInputBlur = () => {
    if (endsPerRoundInput === '') {
      setEndsPerRoundInput(String(endsPerRound))
      return
    }

    const parsed = Number(endsPerRoundInput)
    if (Number.isNaN(parsed)) {
      setEndsPerRoundInput(String(endsPerRound))
      return
    }

    const clamped = clampEndsPerRound(parsed)
    setEndsPerRound(clamped)
    setEndsPerRoundInput(String(clamped))
  }

  const newPracticeView = (
    <div className="flex flex-col gap-6 w-full max-w-sm mx-auto">
      <EndsPerRoundSelector
        value={endsPerRoundInput}
        minEnds={MIN_ENDS}
        maxEnds={MAX_ENDS}
        onChange={handleEndsPerRoundInputChange}
        onBlur={handleEndsPerRoundInputBlur}
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
          <p className="text-sm text-slate-400 font-semibold">{shotsRemainingInEnd} shot{shotsRemainingInEnd === 1 ? '' : 's'} remaining in this end</p>
        ) : (
          <p className="text-sm text-emerald-400 font-semibold">End complete</p>
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
          onClick={handleConfirmShot}
          disabled={!canConfirmShot}
        >
          Confirm Shot
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
      default:
        return null
    }
  }

  const signInView = (
    <div className="flex items-center justify-center w-full h-full">
      <button className="primary-button" onClick={handleSignIn}>Sign in with Google</button>
    </div>
  )

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
        {user ? (
          <div className="flex items-center gap-2">
            {user.photoURL ? (
              <img
                src={user.photoURL}
                alt={user.displayName ?? 'User'}
                className="h-8 w-8 rounded-full"
                referrerPolicy="no-referrer"
              />
            ) : null}
            <button className="secondary-button" onClick={handleSignOut}>Sign out</button>
          </div>
        ) : (
          <div className="header-spacer" />
        )}
      </header>
      <main className="app-main">
        {user ? renderView() : signInView}
      </main>
      {user && view === 'new-practice' && (
        <footer className="app-footer text-slate-300 text-xs text-center">
          Tap target to place shot. Confirm to lock it in.
        </footer>
      )}
    </div>
  )
}

export default App
