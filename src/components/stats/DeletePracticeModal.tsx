interface DeletePracticeModalProps {
  titleId: string
  descriptionId: string
  practiceNumber: number | null
  practiceDate: string
  isDeleting: boolean
  error: string | null
  onCancel: () => void
  onConfirm: () => void
}

export const DeletePracticeModal = ({
  titleId,
  descriptionId,
  practiceNumber,
  practiceDate,
  isDeleting,
  error,
  onCancel,
  onConfirm,
}: DeletePracticeModalProps) => (
  <div
    className="modal-overlay"
    role="alertdialog"
    aria-modal="true"
    aria-labelledby={titleId}
    aria-describedby={descriptionId}
  >
    <div className="modal">
      <h3 id={titleId} className="modal__title">Delete Practice?</h3>
      <p id={descriptionId} className="modal__description">
        This will permanently remove{' '}
        {practiceNumber ? `Practice #${practiceNumber}` : 'this practice'} recorded on {practiceDate}.
      </p>
      {error ? <p className="modal__error">{error}</p> : null}
      <div className="modal__actions">
        <button
          type="button"
          className="modal__button modal__button--secondary"
          onClick={onCancel}
          disabled={isDeleting}
        >
          Cancel
        </button>
        <button
          type="button"
          className="modal__button modal__button--destructive"
          onClick={onConfirm}
          disabled={isDeleting}
        >
          {isDeleting ? 'Deleting…' : 'Delete'}
        </button>
      </div>
    </div>
  </div>
)
