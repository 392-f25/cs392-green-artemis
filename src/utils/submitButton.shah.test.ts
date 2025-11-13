import { describe, it, expect, vi } from 'vitest'
import { getSubmitButtonConfig } from './submitButton'
import type { SubmitButtonParams } from './submitButton'

describe('getSubmitButtonConfig', () => {
  describe('when round is complete', () => {
    it('should return "Save Practice" label', () => {
      const params: SubmitButtonParams = {
        isRoundComplete: true,
        canConfirmEnd: false,
        handleSaveRound: vi.fn(),
        handleConfirmEnd: vi.fn(),
      }

      const result = getSubmitButtonConfig(params)

      expect(result.label).toBe('Save Practice')
    })

    it('should not disable the button', () => {
      const params: SubmitButtonParams = {
        isRoundComplete: true,
        canConfirmEnd: false,
        handleSaveRound: vi.fn(),
        handleConfirmEnd: vi.fn(),
      }

      const result = getSubmitButtonConfig(params)

      expect(result.disabled).toBe(false)
    })

    it('should call handleSaveRound when onClick is triggered', () => {
      const mockSaveRound = vi.fn()
      const mockConfirmEnd = vi.fn()
      const params: SubmitButtonParams = {
        isRoundComplete: true,
        canConfirmEnd: false,
        handleSaveRound: mockSaveRound,
        handleConfirmEnd: mockConfirmEnd,
      }

      const result = getSubmitButtonConfig(params)
      result.onClick()

      expect(mockSaveRound).toHaveBeenCalledOnce()
      expect(mockConfirmEnd).not.toHaveBeenCalled()
    })
  })

  describe('when round is not complete', () => {
    it('should return "Next End" label', () => {
      const params: SubmitButtonParams = {
        isRoundComplete: false,
        canConfirmEnd: true,
        handleSaveRound: vi.fn(),
        handleConfirmEnd: vi.fn(),
      }

      const result = getSubmitButtonConfig(params)

      expect(result.label).toBe('Next End')
    })

    it('should disable the button when canConfirmEnd is false and not disabled when isRoundComplete is true', () => {
      const params: SubmitButtonParams = {
        isRoundComplete: false,
        canConfirmEnd: false,
        handleSaveRound: vi.fn(),
        handleConfirmEnd: vi.fn(),
      }

      const params2: SubmitButtonParams = {
        isRoundComplete: true,
        canConfirmEnd: false,
        handleSaveRound: vi.fn(),
        handleConfirmEnd: vi.fn(),
      }

      const result = getSubmitButtonConfig(params)
      const result2 = getSubmitButtonConfig(params2)

      expect(result.disabled).toBe(true)
      expect(result2.disabled).toBe(false)
    })
  })
})

