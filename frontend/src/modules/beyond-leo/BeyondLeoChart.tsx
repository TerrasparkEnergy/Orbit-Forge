import { useStore } from '@/stores'
import LagrangeChart from './LagrangeChart'
import LunarChart from './LunarChart'
import InterplanetaryChart from './InterplanetaryChart'

export default function BeyondLeoChart() {
  const mode = useStore((s) => s.beyondLeo.mode)

  if (mode === 'lagrange') return <LagrangeChart />
  if (mode === 'lunar') return <LunarChart />
  return <InterplanetaryChart />
}
