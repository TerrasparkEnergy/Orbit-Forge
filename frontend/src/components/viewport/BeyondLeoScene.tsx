import { useStore } from '@/stores'
import LagrangeScene from './LagrangeScene'
import LunarScene from './LunarScene'
import SolarSystemScene from './SolarSystemScene'

export default function BeyondLeoScene() {
  const mode = useStore((s) => s.beyondLeo.mode)

  if (mode === 'lagrange') return <LagrangeScene />
  if (mode === 'lunar') return <LunarScene />
  return <SolarSystemScene />
}
