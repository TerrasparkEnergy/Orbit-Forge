import { useCallback } from 'react'

interface SliderInputProps {
  label: string
  value: number
  min: number
  max: number
  step?: number
  unit?: string
  precision?: number
  onChange: (value: number) => void
  warning?: string
}

export default function SliderInput({
  label,
  value,
  min,
  max,
  step = 1,
  unit = '',
  precision = 2,
  onChange,
  warning,
}: SliderInputProps) {
  const handleSliderChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      onChange(parseFloat(e.target.value))
    },
    [onChange]
  )

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const val = parseFloat(e.target.value)
      if (!isNaN(val)) {
        onChange(Math.min(max, Math.max(min, val)))
      }
    },
    [onChange, min, max]
  )

  // Compute fill percentage for styling
  const fillPercent = ((value - min) / (max - min)) * 100

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <label className="text-[11px] uppercase tracking-wider text-[var(--text-tertiary)] font-sans">
          {label}
        </label>
        <div className="flex items-center gap-1">
          <input
            type="number"
            value={Number(value.toFixed(precision))}
            onChange={handleInputChange}
            min={min}
            max={max}
            step={step}
            className="w-20 text-right bg-transparent border border-white/10 rounded px-2 py-0.5 text-xs font-mono text-accent-cyan focus:border-accent-blue focus:outline-none"
          />
          {unit && (
            <span className="text-[10px] text-[var(--text-tertiary)] font-mono w-8">{unit}</span>
          )}
        </div>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={handleSliderChange}
        className="w-full h-1 rounded-full appearance-none cursor-pointer"
        style={{
          background: `linear-gradient(to right, #3B82F6 0%, #3B82F6 ${fillPercent}%, rgba(107,114,128,0.3) ${fillPercent}%, rgba(107,114,128,0.3) 100%)`,
        }}
      />
      {warning && (
        <div className="text-[10px] text-accent-amber flex items-center gap-1">
          <span>&#9888;</span> {warning}
        </div>
      )}
    </div>
  )
}
