import type { FC } from 'react'

export interface PracticeCardProps {
  id: string
  date: string
  details: string
  totalScore: number
  averagePerEnd: string
  bestEnd: number
  notes?: string
}

export const PracticeCard: FC<PracticeCardProps> = ({
  date,
  details,
  totalScore,
  averagePerEnd,
  bestEnd,
  notes,
}) => (
  <article className="home-card">
    <header className="home-card__header">
      <div className="home-card__meta">
        <span className="home-card__date">{date}</span>
        <span className="home-card__details">{details}</span>
      </div>
    </header>
    <div className="home-card__metrics">
      <div className="home-card__metric">
        <span className="home-card__metric-label">Total Score</span>
        <span className="home-card__metric-value">{totalScore}</span>
      </div>
      <div className="home-card__metric">
        <span className="home-card__metric-label">Avg / End</span>
        <span className="home-card__metric-value">{averagePerEnd}</span>
      </div>
      <div className="home-card__metric">
        <span className="home-card__metric-label">Best End</span>
        <span className="home-card__metric-value">{bestEnd}</span>
      </div>
    </div>
    {notes ? (
      <div className="home-card__notes">
        <span className="home-card__notes-label">Notes:</span>
        <p className="home-card__notes-text">{notes}</p>
      </div>
    ) : null}
  </article>
)
