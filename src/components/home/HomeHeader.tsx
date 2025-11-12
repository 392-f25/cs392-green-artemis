import type { FC } from 'react'

interface HomeHeaderProps {
  onRecordNewPractice: () => void
  buttonLabel?: string
}

export const HomeHeader: FC<HomeHeaderProps> = ({ onRecordNewPractice, buttonLabel = 'Record New Practice' }) => (
  <div className="home-page__header">
    <h2 className="home-section-title">Your Recent Practices</h2>
    <button type="button" className="home-record-button" onClick={onRecordNewPractice}>
      {buttonLabel}
    </button>
  </div>
)
