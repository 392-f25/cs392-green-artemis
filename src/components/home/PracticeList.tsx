import type { FC } from 'react'
import { PracticeCard, type PracticeCardProps } from './PracticeCard'

interface PracticeListProps {
  cards: PracticeCardProps[]
}

export const PracticeList: FC<PracticeListProps> = ({ cards }) => (
  <div className="practice-list">
    {cards.map(card => (
      <PracticeCard key={card.id} {...card} />
    ))}
  </div>
)
