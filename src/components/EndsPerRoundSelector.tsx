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
        <input
          className="number-input"
          type="number"
          min={minEnds}
          max={maxEnds}
          value={endsPerRound}
          onChange={event => onChange(Number(event.target.value) || minEnds)}
          aria-label="Number of ends per round"
        />
      </div>
      <p className="text-xs text-slate-400 mt-1">
        Choose between {minEnds} and {maxEnds} ends per round.
      </p>
    </div>
  )
}
