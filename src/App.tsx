import type { MouseEvent, ReactNode } from 'react'
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

const HomeIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 10.5 12 3l9 7.5" />
    <path d="M5 10v10h14V10" />
    <path d="M9 21v-6h6v6" />
  </svg>
)

const RecordIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="9" />
    <circle cx="12" cy="12" r="5" />
    <circle cx="12" cy="12" r="2" fill="currentColor" stroke="none" />
  </svg>
)

const StatsIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 19h16" />
    <path d="M8 19V9" />
    <path d="M12 19V5" />
    <path d="M16 19v-7" />
  </svg>
)

const ProfileIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </svg>
)

const UndoIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 7v6h6" />
    <path d="M21 17a9 9 0 00-9-9 9 9 0 00-6 2.3L3 13" />
  </svg>
)

const App = () => {
  const [view, setView] = useState<View>('home')
  const [endsPerRound, setEndsPerRound] = useState(DEFAULT_ENDS_PER_ROUND)
  const [endsPerRoundInput, setEndsPerRoundInput] = useState(String(DEFAULT_ENDS_PER_ROUND))
  const [currentEndIndex, setCurrentEndIndex] = useState(0)
  const [currentRound, setCurrentRound] = useState<End[]>(() =>
    Array.from({ length: DEFAULT_ENDS_PER_ROUND }, generateEndTemplate),
  )
  const [rounds, setRounds] = useState<Round[]>([])
  const [user, setUser] = useState<User | null>(null)
  const [isLoadingRounds, setIsLoadingRounds] = useState(false)
  const [practiceNotes, setPracticeNotes] = useState('')

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
      setView('home')
    } catch (err) {
      console.error('Sign-out failed', err)
    }
  }

  // Note: We save rounds individually when they're created (see handleSaveRound)

  const ringColors = useMemo(() => generateRingColors(RING_COUNT), [])

  const resetRoundState = () => {
    setCurrentEndIndex(0)
    setCurrentRound(Array.from({ length: endsPerRound }, generateEndTemplate))
    setPracticeNotes('')
  }

  // Reset round state when entering record view
  useEffect(() => {
    if (view === 'record') {
      resetRoundState()
    }
  }, [view])

  // Adjust round length when endsPerRound changes, preserving existing data
  useEffect(() => {
    if (view === 'record') {
      setCurrentRound(prev => {
        const newRound = Array.from({ length: endsPerRound }, (_, index) => {
          // Keep existing end data if it exists
          return prev[index] ?? generateEndTemplate()
        })
        return newRound
      })
      
      // Adjust currentEndIndex if it's now out of bounds
      setCurrentEndIndex(prevIndex => Math.min(prevIndex, endsPerRound - 1))
    }
  }, [endsPerRound])

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
    const wrapper = event.currentTarget
    const rect = wrapper.getBoundingClientRect()
    const centerX = rect.left + rect.width / 2
    const centerY = rect.top + rect.height / 2
    const clickX = event.clientX - centerX
    const clickY = event.clientY - centerY
    
    // Use wrapper size for radius calculation
    // Since target is 70% of wrapper, we need to adjust normalization
    const wrapperRadius = rect.width / 2
    const targetRadius = wrapperRadius * 0.7 // target is 70% of wrapper
    
    // Normalize to target size (values > 1 or < -1 are outside target)
    const normalizedX = clickX / targetRadius
    const normalizedY = clickY / targetRadius
    const distance = Math.sqrt(normalizedX ** 2 + normalizedY ** 2)
    
    // Allow shots outside the target, but they score 0
    const score = distance > 1 ? 0 : calculateScore(normalizedX, normalizedY)
    const shot: Shot = {
      x: normalizedX,
      y: normalizedY,
      score,
    }
    
    // Immediately add the shot without confirmation
    updateEndWithShot(shot)
  }

  const handleUndoShot = () => {
    const currentEnd = currentRound[currentEndIndex]
    if (!currentEnd || currentEnd.shots.length === 0) return
    
    setCurrentRound(prev => {
      const updated = [...prev]
      const end = updated[currentEndIndex]
      if (!end) return prev

      const shots = end.shots.slice(0, -1) // Remove last shot
      const endScore = shots.reduce((total, s) => total + s.score, 0)
      const precision = calculateEndPrecision(shots)
      updated[currentEndIndex] = { shots, endScore, precision }
      return updated
    })
  }

  const handleConfirmEnd = () => {
    const end = currentRound[currentEndIndex]
    if (!end || end.shots.length !== SHOTS_PER_END) return

    // Move to next incomplete end or next end
    const nextIncompleteIndex = currentRound.findIndex((e, index) => index > currentEndIndex && e.shots.length < SHOTS_PER_END)
    if (nextIncompleteIndex !== -1) {
      setCurrentEndIndex(nextIncompleteIndex)
    } else if (currentEndIndex < endsPerRound - 1) {
      setCurrentEndIndex(currentEndIndex + 1)
    }
  }

  const currentEnd = currentRound[currentEndIndex]
  const shotsInCurrentEnd = currentEnd?.shots ?? []

  const isEndComplete = shotsInCurrentEnd.length === SHOTS_PER_END
  const isLastEnd = currentEndIndex === endsPerRound - 1
  const canConfirmEnd = isEndComplete && !isLastEnd
  const canUndoShot = shotsInCurrentEnd.length > 0
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
      notes: practiceNotes || undefined,
    }

    // Save to Firestore first
    try {
      await saveRoundToFirestore(user.uid, round)
      // Only update local state after successful save
      setRounds(prev => [round, ...prev])
      resetRoundState()
      setEndsPerRoundInput(String(endsPerRound))
      setView('home')
    } catch (error) {
      console.error('Failed to save round:', error)
      alert('Failed to save your practice session. Please try again.')
    }
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

  const userInitials = useMemo(() => {
    if (user?.displayName) {
      return user.displayName
        .trim()
        .split(/\s+/)
        .map(part => part[0] ?? '')
        .join('')
        .slice(0, 2)
        .toUpperCase() || 'AR'
    }
    if (user?.email) {
      return user.email.slice(0, 2).toUpperCase()
    }
    return 'AR'
  }, [user])

  const userDisplayName = user?.displayName || user?.email || 'Archer'

  const orderedRounds = useMemo(
    () =>
      [...rounds].sort(
        (first, second) => new Date(second.createdAt).getTime() - new Date(first.createdAt).getTime(),
      ),
    [rounds],
  )

  const homeView = (
    <div className="home-page">
      <button type="button" className="home-record-button" onClick={() => setView('record')}>
        Record New Practice
      </button>

      {isLoadingRounds ? (
        <div className="practice-placeholder">
          <p className="practice-placeholder__title">Loading your sessions…</p>
        </div>
      ) : orderedRounds.length === 0 ? (
        <div className="practice-placeholder">
          <p className="practice-placeholder__title">No practice sessions yet</p>
          <p className="practice-placeholder__subtitle">Tap "Record New Practice" to get started.</p>
        </div>
      ) : (
        <div className="practice-list">
          {orderedRounds.map(round => {
            const endCount = Math.max(round.ends.length, 1)
            const bestEnd = round.ends.length > 0 ? Math.max(...round.ends.map(end => end.endScore)) : 0
            const averagePerEnd = round.totalScore / endCount

            return (
              <article key={round.id} className="home-card">
                <header className="home-card__header">
                  <div className="home-card__avatar" aria-hidden="true">
                    {userInitials}
                  </div>
                  <div className="home-card__meta">
                    <span className="home-card__name">{userDisplayName}</span>
                    <span className="home-card__details">{formatDate(round.createdAt)} · {round.ends.length} ends</span>
                  </div>
                </header>
                <div className="home-card__metrics">
                  <div className="home-card__metric">
                    <span className="home-card__metric-label">Total Score</span>
                    <span className="home-card__metric-value">{round.totalScore}</span>
                  </div>
                  <div className="home-card__metric">
                    <span className="home-card__metric-label">Avg / End</span>
                    <span className="home-card__metric-value">{averagePerEnd.toFixed(1)}</span>
                  </div>
                  <div className="home-card__metric">
                    <span className="home-card__metric-label">Best End</span>
                    <span className="home-card__metric-value">{bestEnd}</span>
                  </div>
                </div>
                {round.notes && (
                  <div className="home-card__notes">
                    <span className="home-card__notes-label">Notes:</span>
                    <p className="home-card__notes-text">{round.notes}</p>
                  </div>
                )}
              </article>
            )
          })}
        </div>
      )}
    </div>
  )

  const recordView = (
    <div className="record-page">
      <div className="record-panel">
        <EndsPerRoundSelector
          value={endsPerRoundInput}
          minEnds={MIN_ENDS}
          maxEnds={MAX_ENDS}
          onChange={handleEndsPerRoundInputChange}
          onBlur={handleEndsPerRoundInputBlur}
        />

        <button 
          className="undo-button" 
          onClick={handleUndoShot} 
          disabled={!canUndoShot}
          aria-label="Undo last shot"
        >
          <UndoIcon />
          <span>Undo Shot</span>
        </button>

        <p className="record-instructions">Tap target to place shot.</p>

        <Target
          ringColors={ringColors}
          currentRound={currentRound}
          currentEndIndex={currentEndIndex}
          activeShot={null}
          onTargetClick={handleTargetClick}
          ringCount={RING_COUNT}
        />

        <div className="record-summary">
          <p className="record-summary__title">End {currentEndIndex + 1} of {endsPerRound}</p>
          <p className="record-summary__text">Shots taken: {shotsInCurrentEnd.length} / {SHOTS_PER_END}</p>
        </div>

        <EndSummary currentRound={currentRound} currentEndIndex={currentEndIndex} onEndClick={setCurrentEndIndex} />

        <div className="record-panel__actions">
          <button className="primary-button" onClick={handleConfirmEnd} disabled={!canConfirmEnd}>
            Next End
          </button>
        </div>

        <div className="record-notes">
          <label htmlFor="practice-notes" className="record-notes__label">
            Practice Notes (Optional)
          </label>
          <textarea
            id="practice-notes"
            className="record-notes__textarea"
            placeholder="Add notes about this practice session..."
            value={practiceNotes}
            onChange={(e) => setPracticeNotes(e.target.value)}
            rows={3}
          />
        </div>

        <button className="primary-button" onClick={handleSaveRound} disabled={!isRoundComplete}>
          Save Practice
        </button>
      </div>
    </div>
  )

  const statsView = (
    <div className="stats-page">
      <StatsView rounds={rounds} userId={user?.uid ?? ''} />
    </div>
  )

  const profileView = (
    <div className="profile-page">
      <div className="profile-card">
        <div className="profile-card__avatar" aria-hidden="true">{userInitials}</div>
        <h2 className="profile-card__name">{userDisplayName}</h2>
        {user?.email ? <p className="profile-card__email">{user.email}</p> : null}
      </div>
      <button type="button" className="profile-signout-button" onClick={handleSignOut}>
        Sign Out
      </button>
    </div>
  )

  const renderActiveView = () => {
    switch (view) {
      case 'home':
        return homeView
      case 'record':
        return recordView
      case 'stats':
        return statsView
      case 'profile':
        return profileView
      default:
        return null
    }
  }

  const signInView = (
    <div className="sign-in-shell">
      <div className="sign-in-content">
        <div>
          <h1 className="sign-in-title">Artemis</h1>
          <div className="sign-in-underline" aria-hidden="true" />
        </div>
        <p className="sign-in-subtitle">Track & Share Your Archery Progress</p>
        <button className="sign-in-button" onClick={handleSignIn}>
          Sign in With Google
        </button>
      </div>
    </div>
  )

  if (!user) {
    return signInView
  }

  const navItems: Array<{ key: View; label: string; icon: ReactNode }> = [
    { key: 'home', label: 'Home', icon: <HomeIcon /> },
    { key: 'record', label: 'Record', icon: <RecordIcon /> },
    { key: 'stats', label: 'Stats', icon: <StatsIcon /> },
    { key: 'profile', label: 'Profile', icon: <ProfileIcon /> },
  ]

  return (
    <div className="app-shell app-shell--authenticated">
      <header className="brand-header">
        <h1 className="brand-logo">Artemis</h1>
        <div className="brand-underline" aria-hidden="true" />
      </header>
      <main className="app-main">
        {renderActiveView()}
      </main>
      <nav className="bottom-nav" aria-label="Primary navigation">
        {navItems.map(item => {
          const isActive = view === item.key
          return (
            <button
              key={item.key}
              type="button"
              className={`bottom-nav__item ${isActive ? 'bottom-nav__item--active' : ''}`}
              onClick={() => setView(item.key)}
              aria-current={isActive ? 'page' : undefined}
            >
              <span className="bottom-nav__icon">{item.icon}</span>
              <span className="bottom-nav__label">{item.label}</span>
            </button>
          )
        })}
      </nav>
    </div>
  )
}

export default App
