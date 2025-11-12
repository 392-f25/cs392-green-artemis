interface EndsPerRoundSelectorProps {
  value: string
  minEnds: number
  maxEnds: number
  onChange: (value: string) => void
  onBlur: () => void
}

export const EndsPerRoundSelector = ({
  value,
  minEnds,
  maxEnds,
  onChange,
  onBlur,
}: EndsPerRoundSelectorProps) => {
  return (
    <div className="ends-selector">
      <span className="ends-selector__label">Ends per round</span>
      <input
        className="number-input ends-selector__input"
        type="number"
        min={minEnds}
        max={maxEnds}
        value={value}
        onChange={event => onChange(event.target.value)}
        onBlur={onBlur}
        aria-label="Number of ends per round"
      />
      {/* <span className="ends-selector__hint">{minEnds}-{maxEnds}</span> */}
    </div>
  )
}
