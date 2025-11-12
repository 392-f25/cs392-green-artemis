import type { Round } from '../../utils/types'
import { PracticeCard } from './PracticeCard'

export interface PracticeEntry {
  round: Round
  practiceNumber: number
  formattedDate: string
}

interface PracticeListProps {
  entries: PracticeEntry[]
  onRequestDelete: (roundId: string) => void
  onSaveNotes: (roundId: string, notes: string) => Promise<void>
  pendingDeleteId: string | null
  isDeleting: boolean
}

export const PracticeList = ({ entries, onRequestDelete, onSaveNotes, pendingDeleteId, isDeleting }: PracticeListProps) => (
  <>
    {entries.map(entry => (
      <PracticeCard
        key={entry.round.id}
        round={entry.round}
        practiceNumber={entry.practiceNumber}
        formattedDate={entry.formattedDate}
        onRequestDelete={onRequestDelete}
        onSaveNotes={onSaveNotes}
        isDeleting={isDeleting}
        isDeletePending={pendingDeleteId === entry.round.id}
      />
    ))}
  </>
)
