import { useStore } from '@/stores'
import LagrangeDisplay from './LagrangeDisplay'
import LunarDisplay from './LunarDisplay'
import InterplanetaryDisplay from './InterplanetaryDisplay'

export default function BeyondLeoDisplay() {
  const mode = useStore((s) => s.beyondLeo.mode)

  if (mode === 'lagrange') return <LagrangeDisplay />
  if (mode === 'lunar') return <LunarDisplay />
  return <InterplanetaryDisplay />
}
