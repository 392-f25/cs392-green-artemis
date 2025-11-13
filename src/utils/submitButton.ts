/**
 * Utility for determining submit button properties in the record view.
 * This handles the logic for switching between "Next End" and "Save Practice" actions.
 */

export interface SubmitButtonConfig {
  label: string
  disabled: boolean
  onClick: () => void
}

export interface SubmitButtonParams {
  isRoundComplete: boolean
  canConfirmEnd: boolean
  handleSaveRound: () => void | Promise<void>
  handleConfirmEnd: () => void
}

/**
 * Calculates the properties for the submit button based on round state.
 * 
 * @param params - Configuration parameters
 * @param params.isRoundComplete - Whether all ends in the round are complete
 * @param params.canConfirmEnd - Whether the current end can be confirmed
 * @param params.handleSaveRound - Function to call when saving the round
 * @param params.handleConfirmEnd - Function to call when confirming an end
 * @returns Configuration object with label, disabled state, and onClick handler
 */
export const getSubmitButtonConfig = ({
  isRoundComplete,
  canConfirmEnd,
  handleSaveRound,
  handleConfirmEnd,
}: SubmitButtonParams): SubmitButtonConfig => {
  const label = isRoundComplete ? 'Save Practice' : 'Next End'
  const disabled = isRoundComplete ? false : !canConfirmEnd

  const onClick = () => {
    if (isRoundComplete) {
      void handleSaveRound()
      return
    }
    handleConfirmEnd()
  }

  return {
    label,
    disabled,
    onClick,
  }
}

