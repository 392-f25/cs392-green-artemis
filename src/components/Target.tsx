import type { MouseEvent } from 'react'
import type { Shot, End } from '../utils/types'

interface TargetProps {
  ringColors: string[]
  currentRound: End[]
  currentEndIndex: number
  activeShot: Shot | null
  onTargetClick: (event: MouseEvent<HTMLDivElement>) => void
  ringCount: number
}

export const Target = ({
  ringColors,
  currentRound,
  currentEndIndex,
  activeShot,
  onTargetClick,
  ringCount,
}: TargetProps) => {
  return (
    <div className="target-wrapper" onClick={onTargetClick} role="presentation">
      <div className="target">
        {ringColors.map((color, index) => (
          <div
            key={index}
            className="target-ring"
            style={{
              backgroundColor: color,
              width: `${100 - (index / ringCount) * 100}%`,
              height: `${100 - (index / ringCount) * 100}%`,
            }}
          />
        ))}
        {currentRound.flatMap((end, endIndex) =>
          end.shots.map((shot, shotIndex) => {
            const distance = Math.sqrt(shot.x ** 2 + shot.y ** 2)
            const isMiss = distance > 1
            return (
              <div
                key={`${endIndex}-${shotIndex}`}
                className={`shot-dot ${endIndex === currentEndIndex ? 'shot-dot--current' : 'shot-dot--previous'} ${isMiss ? 'shot-dot--miss' : ''}`}
                style={{
                  left: `${(shot.x + 1) * 50}%`,
                  top: `${(shot.y + 1) * 50}%`,
                }}
              />
            )
          }),
        )}
        {activeShot && (
          <div
            className={`shot-dot shot-dot--preview ${Math.sqrt(activeShot.x ** 2 + activeShot.y ** 2) > 1 ? 'shot-dot--miss' : ''}`}
            style={{
              left: `${(activeShot.x + 1) * 50}%`,
              top: `${(activeShot.y + 1) * 50}%`,
            }}
          />
        )}
      </div>
    </div>
  )
}
