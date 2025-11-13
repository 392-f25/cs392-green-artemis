import type { FC, MouseEvent } from 'react'
import type { End, Shot } from '../../utils/types'
import { EndsPerRoundSelector } from '../EndsPerRoundSelector'
import { Target } from '../Target'
import { EndSummary } from '../EndSummary'
import { UndoButton } from '../UndoButton'

interface RecordPageProps {
  endsPerRoundInput: string
  minEnds: number
  maxEnds: number
  onEndsPerRoundInputChange: (value: string) => void
  onEndsPerRoundInputBlur: () => void
  canUndoShot: boolean
  onUndoShot: () => void
  undoIcon: FC
  ringColors: string[]
  currentRound: End[]
  currentEndIndex: number
  onTargetClick: (event: MouseEvent<HTMLDivElement>) => void
  ringCount: number
  endsPerRound: number
  shotsInCurrentEnd: Shot[]
  shotsPerEnd: number
  onPrimaryActionClick: () => void
  primaryActionDisabled: boolean
  primaryActionLabel: string
  practiceNotes: string
  onPracticeNotesChange: (value: string) => void
  onSelectEnd: (index: number) => void
}

export const RecordPage: FC<RecordPageProps> = ({
  endsPerRoundInput,
  minEnds,
  maxEnds,
  onEndsPerRoundInputChange,
  onEndsPerRoundInputBlur,
  canUndoShot,
  onUndoShot,
  undoIcon: UndoIcon,
  ringColors,
  currentRound,
  currentEndIndex,
  onTargetClick,
  ringCount,
  endsPerRound,
  shotsInCurrentEnd,
  shotsPerEnd,
  onPrimaryActionClick,
  primaryActionDisabled,
  primaryActionLabel,
  practiceNotes,
  onPracticeNotesChange,
  onSelectEnd,
}) => (
  <div className="record-page">
    <div className="record-panel">
      <EndsPerRoundSelector
        value={endsPerRoundInput}
        minEnds={minEnds}
        maxEnds={maxEnds}
        onChange={onEndsPerRoundInputChange}
        onBlur={onEndsPerRoundInputBlur}
      />

      <UndoButton canUndo={canUndoShot} onUndo={onUndoShot} icon={UndoIcon} />

      <p className="record-instructions">Tap the target to place your shot. Tap outside to record a miss. </p>

      <Target
        ringColors={ringColors}
        currentRound={currentRound}
        currentEndIndex={currentEndIndex}
        activeShot={null}
        onTargetClick={onTargetClick}
        ringCount={ringCount}
      />

      <div className="record-summary">
        <p className="record-summary__title">End {currentEndIndex + 1} of {endsPerRound}</p>
        <p className="record-summary__text">Shots taken: {shotsInCurrentEnd.length} / {shotsPerEnd}</p>
      </div>

      <EndSummary currentRound={currentRound} currentEndIndex={currentEndIndex} onEndClick={onSelectEnd} />

      <div className="record-panel__actions">
        <button className="primary-button" onClick={onPrimaryActionClick} disabled={primaryActionDisabled}>
          {primaryActionLabel}
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
          onChange={event => onPracticeNotesChange(event.target.value)}
          rows={3}
        />
      </div>
    </div>
  </div>
)
