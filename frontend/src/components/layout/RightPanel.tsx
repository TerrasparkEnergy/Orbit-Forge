import { ReactNode } from 'react'

interface RightPanelProps {
  children?: ReactNode
}

export default function RightPanel({ children }: RightPanelProps) {
  return (
    <div className="w-80 bg-space-800/60 backdrop-blur-sm border-l border-white/5 flex flex-col overflow-hidden">
      <div className="flex-1 overflow-y-auto overflow-x-hidden p-3 space-y-3">
        {children || (
          <div className="text-[var(--text-tertiary)] text-xs font-mono text-center py-8">
            Data readouts will appear here
          </div>
        )}
      </div>
    </div>
  )
}
