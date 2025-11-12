import { useMemo } from 'react'
import { RING_COUNT } from '../../utils/constants'
import { generateRingColors } from '../../utils/helpers'
import type { Shot } from '../../utils/types'

interface MiniTargetProps {
  shots: Shot[]
}

export const MiniTarget = ({ shots }: MiniTargetProps) => {
  const ringColors = useMemo(() => generateRingColors(RING_COUNT), [])

  return (
    <div className="mini-target">
      {ringColors.map((color, index) => (
        <div
          key={index}
          className="mini-target__ring"
          style={{
            backgroundColor: color,
            width: `${100 - (index / RING_COUNT) * 100}%`,
            height: `${100 - (index / RING_COUNT) * 100}%`,
          }}
        />
      ))}
      {shots.map((shot, shotIndex) => (
        <div
          key={shotIndex}
          className="mini-target__dot"
          style={{
            left: `${(shot.x + 1) * 50}%`,
            top: `${(shot.y + 1) * 50}%`,
          }}
        />
      ))}
    </div>
  )
}
