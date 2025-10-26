interface EndsPerRoundSelectorProps {
  endsPerRound: number
  minEnds: number
  maxEnds: number
  onChange: (value: number) => void
}

export const EndsPerRoundSelector = ({
  endsPerRound,
  minEnds,
  maxEnds,
  onChange,
}: EndsPerRoundSelectorProps) => {
  return (
    <div>
      <label className="block text-sm font-medium text-slate-200">Ends per round</label>
      <div className="flex gap-2 mt-2 items-center">
        {[3, 6, 9].map(value => (
          <button
            key={value}
            className={`chip ${value === endsPerRound ? 'chip--active' : ''}`}
            onClick={() => onChange(value)}
          >
            {value}
          </button>
        ))}
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400">Custom:</span>
          <input
            className="number-input"
            type="number"
            min={minEnds}
            max={maxEnds}
            value={endsPerRound}
            onChange={event => onChange(Number(event.target.value) || minEnds)}
            aria-label="Custom number of ends per round"
          />
        </div>
      </div>
      <p className="text-xs text-slate-400 mt-1">
        Choose between {minEnds} and {maxEnds} ends per round. Use preset buttons or enter a custom value.
      </p>
    </div>
  )
}
