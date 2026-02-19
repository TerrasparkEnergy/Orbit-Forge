interface DataReadoutProps {
  label: string
  value: string | number
  unit?: string
  status?: 'nominal' | 'warning' | 'critical' | 'default'
}

const VALUE_COLORS = {
  default: 'text-accent-cyan',
  nominal: 'text-accent-green',
  warning: 'text-accent-amber',
  critical: 'text-accent-red',
}

export default function DataReadout({ label, value, unit, status = 'default' }: DataReadoutProps) {
  return (
    <div className="data-readout">
      <div className="text-[10px] uppercase tracking-wider text-[var(--text-tertiary)] mb-1">
        {label}
      </div>
      <div className="flex items-baseline gap-1">
        <span className={`text-base font-mono font-semibold ${VALUE_COLORS[status]}`}>
          {value}
        </span>
        {unit && (
          <span className="text-xs text-[var(--text-tertiary)]">{unit}</span>
        )}
      </div>
    </div>
  )
}
