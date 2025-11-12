import type { MouseEvent, ReactNode } from 'react'
import { useEffect, useMemo, useState } from 'react'
import './App.css'
import type { View, Shot, End, Round } from './utils/types'
import type { PracticeCardProps } from './components/home/PracticeCard'
import { RING_COUNT, SHOTS_PER_END, DEFAULT_ENDS_PER_ROUND, MIN_ENDS, MAX_ENDS } from './utils/constants'
import { generateEndTemplate, calculateScore, generateRingColors, calculateEndPrecision } from './utils/helpers'
import { StatsView } from './components/StatsView'
import { HomeHeader } from './components/home/HomeHeader'
import { PracticeList } from './components/home/PracticeList'
import { PracticePlaceholder } from './components/home/PracticePlaceholder'
import { RecordPage } from './components/record/RecordPage'
import { ProfilePage } from './components/profile/ProfilePage'
import { SignInView } from './components/auth/SignInView'
import { BottomNav } from './components/navigation/BottomNav'
import { auth, googleProvider } from './firebase'
import { onAuthStateChanged, signInWithPopup, signOut, type User } from 'firebase/auth'
import { saveRoundToFirestore, loadRoundsFromFirestore, deleteRoundFromFirestore } from './utils/firestore'

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

  const primaryActionLabel = isRoundComplete ? 'Save Practice' : 'Next End'
  const primaryActionDisabled = isRoundComplete ? false : !canConfirmEnd
  const handlePrimaryActionClick = () => {
    if (isRoundComplete) {
      void handleSaveRound()
      return
    }
    handleConfirmEnd()
  }

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

  const handleDeleteRound = async (roundId: string) => {
    if (!user) {
      throw new Error('User not authenticated')
    }

    try {
      await deleteRoundFromFirestore(user.uid, roundId)
      setRounds(prev => prev.filter(round => round.id !== roundId))
    } catch (error) {
      console.error('Failed to delete round:', error)
      throw error instanceof Error ? error : new Error('Failed to delete round')
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

  const formatFullDate = (isoString: string) => {
    const date = new Date(isoString)
    return date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
  }

  const formatTime = (isoString: string) => {
    const date = new Date(isoString)
    return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
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
  const practiceOrderMap = useMemo(() => {
    const chronological = [...rounds].sort(
      (first, second) => new Date(first.createdAt).getTime() - new Date(second.createdAt).getTime(),
    )
    return new Map(chronological.map((round, index) => [round.id, index + 1]))
  }, [rounds])

  const practiceCards = useMemo<PracticeCardProps[]>(() => {
    return orderedRounds.map((round, index) => {
      const endCount = Math.max(round.ends.length, 1)
      const bestEnd = round.ends.length > 0 ? Math.max(...round.ends.map(end => end.endScore)) : 0
      const averagePerEnd = (round.totalScore / endCount).toFixed(1)
      const practiceNumber = practiceOrderMap.get(round.id) ?? orderedRounds.length - index
      const relativeLabel = formatDate(round.createdAt)
      const practiceLabel = relativeLabel === 'Today' ? `Practice #${practiceNumber}` : relativeLabel
      const endsLabel = endCount === 1 ? '1 end' : `${endCount} ends`

      return {
        id: round.id,
        date: formatFullDate(round.createdAt),
        details: `${practiceLabel} · ${formatTime(round.createdAt)} · ${endsLabel}`,
        totalScore: round.totalScore,
        averagePerEnd,
        bestEnd,
        notes: round.notes,
      }
    })
  }, [orderedRounds, practiceOrderMap])

  const homeView = (
    <div className="home-page">
      <HomeHeader onRecordNewPractice={() => setView('record')} />

      {isLoadingRounds ? (
        <PracticePlaceholder title="Loading your sessions…" />
      ) : practiceCards.length === 0 ? (
        <PracticePlaceholder title="No practice sessions yet" subtitle={'Tap "Record New Practice" to get started.'} />
      ) : (
        <PracticeList cards={practiceCards} />
      )}
    </div>
  )

  const recordView = (
    <RecordPage
      endsPerRoundInput={endsPerRoundInput}
      minEnds={MIN_ENDS}
      maxEnds={MAX_ENDS}
      onEndsPerRoundInputChange={handleEndsPerRoundInputChange}
      onEndsPerRoundInputBlur={handleEndsPerRoundInputBlur}
      canUndoShot={canUndoShot}
      onUndoShot={handleUndoShot}
      undoIcon={UndoIcon}
      ringColors={ringColors}
      currentRound={currentRound}
      currentEndIndex={currentEndIndex}
      onTargetClick={handleTargetClick}
      ringCount={RING_COUNT}
      endsPerRound={endsPerRound}
      shotsInCurrentEnd={shotsInCurrentEnd}
      shotsPerEnd={SHOTS_PER_END}
      onPrimaryActionClick={handlePrimaryActionClick}
      primaryActionDisabled={primaryActionDisabled}
      primaryActionLabel={primaryActionLabel}
      practiceNotes={practiceNotes}
      onPracticeNotesChange={setPracticeNotes}
      onSelectEnd={setCurrentEndIndex}
    />
  )

  const statsView = (
    <div className="stats-page">
      <StatsView rounds={rounds} userId={user?.uid ?? ''} onDeleteRound={handleDeleteRound} />
    </div>
  )

  const profileView = (
    <ProfilePage
      initials={userInitials}
      displayName={userDisplayName}
      email={user?.email}
      onSignOut={handleSignOut}
    />
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

  const signInView = <SignInView onSignIn={handleSignIn} />

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
      <BottomNav items={navItems} activeKey={view} onSelect={setView} />
    </div>
  )
}

export default App
