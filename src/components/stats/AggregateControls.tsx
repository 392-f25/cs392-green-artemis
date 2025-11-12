interface AggregateControlsProps {
  rangeInput: string
  onRangeInputChange: (value: string) => void
  onRangeInputBlur: () => void
}

export const AggregateControls = ({ rangeInput, onRangeInputChange, onRangeInputBlur }: AggregateControlsProps) => (
  <div className="stats-aggregate__controls">
    <label className="stats-aggregate__selector ends-selector" htmlFor="aggregate-range">
      <span className="ends-selector__label">Practices to Analyze</span>
      <input
        id="aggregate-range"
        className="number-input ends-selector__input"
        type="number"
        min={1}
        value={rangeInput}
        onChange={event => onRangeInputChange(event.target.value)}
        onBlur={onRangeInputBlur}
        aria-label="Number of recent practices to analyze in aggregate statistics"
      />
    </label>
  </div>
)
