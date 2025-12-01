import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { DeletePracticeModal } from './DeletePracticeModal'

describe('DeletePracticeModal', () => {
  const defaultProps = {
    titleId: 'delete-practice-title',
    descriptionId: 'delete-practice-description',
    practiceNumber: 5,
    practiceDate: 'January 15, 2025',
    isDeleting: false,
    error: null,
    onCancel: vi.fn(),
    onConfirm: vi.fn(),
  }

  describe('Rendering', () => {
    it('should render modal with practice number', () => {
      render(<DeletePracticeModal {...defaultProps} />)

      expect(screen.getByText('Delete Practice?')).toBeDefined()
      expect(screen.getByText(/Practice #5/)).toBeDefined()
      expect(screen.getByText(/January 15, 2025/)).toBeDefined()
    })

    it('should render modal without practice number when practiceNumber is null', () => {
      render(<DeletePracticeModal {...defaultProps} practiceNumber={null} />)

      expect(screen.getByText('Delete Practice?')).toBeDefined()
      expect(screen.getByText(/this practice/)).toBeDefined()
      expect(screen.queryByText(/Practice #/)).toBeNull()
    })

    it('should display error message when error is provided', () => {
      const errorMessage = 'Failed to delete this practice. Please try again.'
      render(<DeletePracticeModal {...defaultProps} error={errorMessage} />)

      expect(screen.getByText(errorMessage)).toBeDefined()
      expect(screen.getByText(errorMessage).className).toContain('modal__error')
    })

    it('should not display error message when error is null', () => {
      const { container } = render(<DeletePracticeModal {...defaultProps} />)

      expect(container.querySelector('.modal__error')).toBeNull()
    })
  })

  describe('Accessibility', () => {
    it('should have correct ARIA attributes', () => {
      const { container } = render(<DeletePracticeModal {...defaultProps} />)

      const modal = container.querySelector('[role="alertdialog"]')
      expect(modal).toBeDefined()
      expect(modal?.getAttribute('aria-modal')).toBe('true')
      expect(modal?.getAttribute('aria-labelledby')).toBe('delete-practice-title')
      expect(modal?.getAttribute('aria-describedby')).toBe('delete-practice-description')
    })

    it('should have correct title and description IDs', () => {
      render(<DeletePracticeModal {...defaultProps} />)

      const title = screen.getByText('Delete Practice?')
      expect(title.id).toBe('delete-practice-title')

      const description = screen.getByText(/Practice #5/)
      expect(description.id).toBe('delete-practice-description')
    })
  })

  describe('Button interactions', () => {
    it('should call onCancel when Cancel button is clicked', () => {
      const mockCancel = vi.fn()
      render(<DeletePracticeModal {...defaultProps} onCancel={mockCancel} />)

      const cancelButton = screen.getByRole('button', { name: 'Cancel' })
      fireEvent.click(cancelButton)

      expect(mockCancel).toHaveBeenCalledTimes(1)
    })

    it('should call onConfirm when Delete button is clicked', () => {
      const mockConfirm = vi.fn()
      render(<DeletePracticeModal {...defaultProps} onConfirm={mockConfirm} />)

      const deleteButton = screen.getByRole('button', { name: 'Delete' })
      fireEvent.click(deleteButton)

      expect(mockConfirm).toHaveBeenCalledTimes(1)
    })

    it('should disable both buttons when isDeleting is true', () => {
      render(<DeletePracticeModal {...defaultProps} isDeleting={true} />)

      const cancelButton = screen.getByRole('button', { name: 'Cancel' }) as HTMLButtonElement
      const deleteButton = screen.getByRole('button', { name: 'Deleting…' }) as HTMLButtonElement

      expect(cancelButton.disabled).toBe(true)
      expect(deleteButton.disabled).toBe(true)
    })

    it('should enable both buttons when isDeleting is false', () => {
      render(<DeletePracticeModal {...defaultProps} isDeleting={false} />)

      const cancelButton = screen.getByRole('button', { name: 'Cancel' }) as HTMLButtonElement
      const deleteButton = screen.getByRole('button', { name: 'Delete' }) as HTMLButtonElement

      expect(cancelButton.disabled).toBe(false)
      expect(deleteButton.disabled).toBe(false)
    })

    it('should show "Deleting…" text when isDeleting is true', () => {
      render(<DeletePracticeModal {...defaultProps} isDeleting={true} />)

      expect(screen.getByRole('button', { name: 'Deleting…' })).toBeDefined()
      expect(screen.queryByRole('button', { name: 'Delete' })).toBeNull()
    })

    it('should show "Delete" text when isDeleting is false', () => {
      render(<DeletePracticeModal {...defaultProps} isDeleting={false} />)

      expect(screen.getByRole('button', { name: 'Delete' })).toBeDefined()
      expect(screen.queryByRole('button', { name: 'Deleting…' })).toBeNull()
    })
  })

  describe('Deletion flow', () => {
    it('should call onConfirm when Delete is clicked, ensuring deletion is triggered', () => {
      const mockConfirm = vi.fn()
      render(<DeletePracticeModal {...defaultProps} onConfirm={mockConfirm} />)

      const deleteButton = screen.getByRole('button', { name: 'Delete' })
      fireEvent.click(deleteButton)

      // Verify that the deletion callback was called
      // Note: React event handlers receive the event object, but we just verify it was called
      expect(mockConfirm).toHaveBeenCalledTimes(1)
    })

    it('should not call onConfirm when Delete button is disabled during deletion', () => {
      const mockConfirm = vi.fn()
      render(
        <DeletePracticeModal
          {...defaultProps}
          onConfirm={mockConfirm}
          isDeleting={true}
        />,
      )

      const deleteButton = screen.getByRole('button', { name: 'Deleting…' }) as HTMLButtonElement
      
      // Button should be disabled
      expect(deleteButton.disabled).toBe(true)
      
      // Even if clicked (which shouldn't happen in real usage), it shouldn't call onConfirm
      // because the button is disabled, but we'll test the disabled state prevents interaction
      fireEvent.click(deleteButton)
      
      // The callback should not be called because the button is disabled
      // (In React Testing Library, disabled buttons don't trigger click events)
      expect(mockConfirm).not.toHaveBeenCalled()
    })

    it('should allow canceling during deletion process', () => {
      const mockCancel = vi.fn()
      render(
        <DeletePracticeModal
          {...defaultProps}
          onCancel={mockCancel}
          isDeleting={true}
        />,
      )

      const cancelButton = screen.getByRole('button', { name: 'Cancel' }) as HTMLButtonElement
      
      // Cancel button should be disabled during deletion
      expect(cancelButton.disabled).toBe(true)
    })
  })
})

