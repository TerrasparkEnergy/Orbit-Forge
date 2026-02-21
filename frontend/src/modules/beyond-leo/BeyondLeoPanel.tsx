import { useStore } from '@/stores'
import LagrangePanel from './LagrangePanel'
import LunarPanel from './LunarPanel'
import InterplanetaryPanel from './InterplanetaryPanel'
import type { BeyondLeoMode } from '@/types/beyond-leo'

const MODES: { value: BeyondLeoMode; label: string }[] = [
  { value: 'lagrange', label: 'Lagrange' },
  { value: 'lunar', label: 'Lunar' },
  { value: 'interplanetary', label: 'Interplanetary' },
]

export default function BeyondLeoPanel() {
  const mode = useStore((s) => s.beyondLeo.mode)
  const setMode = useStore((s) => s.setBeyondLeoMode)

  return (
    <div className="space-y-2">
      {/* Mode selector tabs */}
      <div className="flex gap-1 p-1 glass-panel overflow-x-auto">
        {MODES.map((m) => (
          <button
            key={m.value}
            onClick={() => setMode(m.value)}
            className={`
              shrink-0 px-3 py-1.5 rounded text-[10px] font-mono font-medium transition-all duration-150 whitespace-nowrap
              ${mode === m.value
                ? 'bg-accent-blue/15 text-accent-blue border border-accent-blue/30'
                : 'text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] hover:bg-white/5 border border-transparent'
              }
            `}
          >
            {m.label}
          </button>
        ))}
      </div>

      {mode === 'lagrange' && <LagrangePanel />}
      {mode === 'lunar' && <LunarPanel />}
      {mode === 'interplanetary' && <InterplanetaryPanel />}
    </div>
  )
}
