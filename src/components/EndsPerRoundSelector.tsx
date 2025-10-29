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
    <div>
      <label className="block text-sm font-medium text-slate-200">Ends per round</label>
      <div className="flex gap-2 mt-2 items-center">
        <input
          className="number-input"
          type="number"
          min={minEnds}
          max={maxEnds}
          value={value}
          onChange={event => onChange(event.target.value)}
          onBlur={onBlur}
          aria-label="Number of ends per round"
        />
      </div>
      <p className="text-xs text-slate-400 mt-1">
        Choose between {minEnds} and {maxEnds} ends per round.
      </p>
    </div>
  )
}
