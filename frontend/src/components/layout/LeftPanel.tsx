import { ReactNode } from 'react'

interface LeftPanelProps {
  children?: ReactNode
}

export default function LeftPanel({ children }: LeftPanelProps) {
  return (
    <div className="w-60 bg-space-800/60 backdrop-blur-sm border-r border-white/5 flex flex-col overflow-hidden">
      <div className="flex-1 overflow-y-auto overflow-x-hidden p-3 space-y-3">
        {children || (
          <div className="text-[var(--text-tertiary)] text-xs font-mono text-center py-8">
            Select a module to configure
          </div>
        )}
      </div>
    </div>
  )
}
