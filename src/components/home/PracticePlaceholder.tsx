import type { FC, ReactNode } from 'react'

interface PracticePlaceholderProps {
  title: string
  subtitle?: ReactNode
}

export const PracticePlaceholder: FC<PracticePlaceholderProps> = ({ title, subtitle }) => (
  <div className="practice-placeholder">
    <p className="practice-placeholder__title">{title}</p>
    {subtitle ? <p className="practice-placeholder__subtitle">{subtitle}</p> : null}
  </div>
)
