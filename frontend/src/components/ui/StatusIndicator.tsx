interface StatusIndicatorProps {
  status: 'nominal' | 'warning' | 'critical'
  label?: string
  size?: 'sm' | 'md'
}

const STATUS_COLORS = {
  nominal: 'bg-accent-green',
  warning: 'bg-accent-amber',
  critical: 'bg-accent-red',
}

const STATUS_GLOW = {
  nominal: 'shadow-[0_0_8px_rgba(16,185,129,0.6)]',
  warning: 'shadow-[0_0_8px_rgba(245,158,11,0.6)]',
  critical: 'shadow-[0_0_8px_rgba(239,68,68,0.6)]',
}

export default function StatusIndicator({ status, label, size = 'md' }: StatusIndicatorProps) {
  const dotSize = size === 'sm' ? 'w-2 h-2' : 'w-2.5 h-2.5'

  return (
    <div className="flex items-center gap-2">
      <div
        className={`${dotSize} rounded-full ${STATUS_COLORS[status]} ${STATUS_GLOW[status]} pulse-glow`}
      />
      {label && (
        <span className="text-xs font-mono text-[var(--text-secondary)] uppercase tracking-wider">
          {label}
        </span>
      )}
    </div>
  )
}
