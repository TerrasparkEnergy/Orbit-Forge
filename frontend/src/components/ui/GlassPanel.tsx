import { ReactNode } from 'react'

interface GlassPanelProps {
  children: ReactNode
  className?: string
  active?: boolean
  padding?: boolean
}

export default function GlassPanel({ children, className = '', active = false, padding = true }: GlassPanelProps) {
  return (
    <div
      className={`
        glass-panel
        ${active ? 'glass-panel-active' : ''}
        ${padding ? 'p-4' : ''}
        ${className}
      `}
    >
      {children}
    </div>
  )
}
