import type { FC, ReactNode } from 'react'
import type { View } from '../../utils/types'

interface BottomNavItem {
  key: View
  label: string
  icon: ReactNode
}

interface BottomNavProps {
  items: BottomNavItem[]
  activeKey: View
  onSelect: (view: View) => void
}

export const BottomNav: FC<BottomNavProps> = ({ items, activeKey, onSelect }) => (
  <nav className="bottom-nav" aria-label="Primary navigation">
    {items.map(item => {
      const isActive = activeKey === item.key
      return (
        <button
          key={item.key}
          type="button"
          className={`bottom-nav__item ${isActive ? 'bottom-nav__item--active' : ''}`}
          onClick={() => onSelect(item.key)}
          aria-current={isActive ? 'page' : undefined}
        >
          <span className="bottom-nav__icon">{item.icon}</span>
          <span className="bottom-nav__label">{item.label}</span>
        </button>
      )
    })}
  </nav>
)
