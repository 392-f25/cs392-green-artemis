import type { FC } from 'react'

interface UndoButtonProps {
  canUndo: boolean
  onUndo: () => void
  icon: FC
}

export const UndoButton: FC<UndoButtonProps> = ({ canUndo, onUndo, icon: Icon }) => (
  <button
    className="undo-button"
    onClick={onUndo}
    disabled={!canUndo}
    aria-label="Undo last shot"
  >
    <Icon />
    <span>Undo Shot</span>
  </button>
)
