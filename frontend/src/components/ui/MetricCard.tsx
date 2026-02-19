interface MetricCardProps {
  label: string
  value: string | number
  unit?: string
  status?: 'nominal' | 'warning' | 'critical'
  icon?: string
}

const STATUS_BG = {
  nominal: 'border-accent-green/30 bg-accent-green/5',
  warning: 'border-accent-amber/30 bg-accent-amber/5',
  critical: 'border-accent-red/30 bg-accent-red/5',
}

const STATUS_TEXT = {
  nominal: 'text-accent-green',
  warning: 'text-accent-amber',
  critical: 'text-accent-red',
}

export default function MetricCard({ label, value, unit, status = 'nominal', icon }: MetricCardProps) {
  return (
    <div className={`rounded-lg border p-3 ${STATUS_BG[status]}`}>
      <div className="flex items-center gap-1.5 mb-1">
        {icon && <span className="text-sm">{icon}</span>}
        <span className="text-[11px] uppercase tracking-wider text-[var(--text-tertiary)] font-sans">
          {label}
        </span>
      </div>
      <div className="flex items-baseline gap-1">
        <span className={`text-xl font-mono font-bold ${STATUS_TEXT[status]}`}>
          {value}
        </span>
        {unit && (
          <span className="text-xs text-[var(--text-secondary)]">{unit}</span>
        )}
      </div>
    </div>
  )
}
