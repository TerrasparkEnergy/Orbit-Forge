import { ReactNode } from 'react'
import { useStore } from '@/stores'

interface BottomPanelProps {
  children?: ReactNode
}

export default function BottomPanel({ children }: BottomPanelProps) {
  const expanded = useStore((s) => s.bottomPanelExpanded)
  const toggle = useStore((s) => s.toggleBottomPanel)

  return (
    <div
      className="bg-space-800/80 backdrop-blur-sm border-t border-white/5 transition-all duration-200 ease-out flex flex-col"
      style={{ height: expanded ? 280 : 48 }}
    >
      {/* Toggle bar */}
      <button
        onClick={toggle}
        className="h-12 min-h-[48px] flex items-center px-4 gap-2 hover:bg-white/5 transition-colors w-full"
      >
        <svg
          className={`w-4 h-4 text-[var(--text-tertiary)] transition-transform duration-200 ${expanded ? 'rotate-180' : ''}`}
          viewBox="0 0 16 16"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <path d="M4 10l4-4 4 4" />
        </svg>
        <span className="text-xs font-mono text-[var(--text-tertiary)] uppercase tracking-wider">
          {expanded ? 'Collapse' : 'Expand'} Panel
        </span>
      </button>

      {/* Content */}
      {expanded && (
        <div className="flex-1 overflow-auto px-4 pb-3">
          {children || (
            <div className="text-[var(--text-tertiary)] text-xs font-mono text-center py-6">
              Charts and data will appear here
            </div>
          )}
        </div>
      )}
    </div>
  )
}
