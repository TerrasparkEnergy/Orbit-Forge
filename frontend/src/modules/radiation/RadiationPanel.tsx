import { useStore } from '@/stores'
import SectionHeader from '@/components/ui/SectionHeader'
import MetricCard from '@/components/ui/MetricCard'
import { useMemo } from 'react'
import { computeRadiationEnvironment } from '@/lib/radiation'
import { R_EARTH_EQUATORIAL } from '@/lib/constants'

const PRESETS = [
  { label: '0.5 mm', value: 0.5 },
  { label: '1 mm', value: 1 },
  { label: '2 mm', value: 2 },
  { label: '3 mm', value: 3 },
  { label: '5 mm', value: 5 },
]

export default function RadiationPanel() {
  const elements = useStore((s) => s.elements)
  const mission = useStore((s) => s.mission)
  const shieldingMm = useStore((s) => s.shieldingThicknessMm)
  const setShielding = useStore((s) => s.setShieldingThickness)

  const avgAlt = elements.semiMajorAxis - R_EARTH_EQUATORIAL
  const incDeg = elements.inclination

  const rad = useMemo(
    () => computeRadiationEnvironment(avgAlt, incDeg, shieldingMm, mission.lifetimeTarget),
    [avgAlt, incDeg, shieldingMm, mission.lifetimeTarget]
  )

  return (
    <div className="space-y-2">
      <SectionHeader title="Shielding" defaultOpen={true}>
        <div className="space-y-2">
          <label className="flex items-center justify-between">
            <span className="text-[10px] text-[var(--text-secondary)]">Al Thickness</span>
            <div className="flex items-center gap-1.5">
              <input
                type="number"
                value={shieldingMm}
                onChange={(e) => setShielding(parseFloat(e.target.value) || 0)}
                className="input-field w-24 text-sm font-mono"
                min="0"
                max="20"
              />
              <span className="text-[11px] text-[var(--text-secondary)] font-mono w-8">mm</span>
            </div>
          </label>

          <input
            type="range"
            value={shieldingMm}
            onChange={(e) => setShielding(parseFloat(e.target.value))}
            min="0"
            max="10"
            step="0.1"
            className="w-full accent-[#3B82F6] h-1"
          />

          <div className="flex gap-1">
            {PRESETS.map((p) => (
              <button
                key={p.value}
                onClick={() => setShielding(p.value)}
                className={`
                  flex-1 px-1 py-1 rounded text-[9px] font-mono border transition-all
                  ${shieldingMm === p.value
                    ? 'border-accent-blue/50 bg-accent-blue/10 text-accent-blue'
                    : 'border-white/10 text-[var(--text-tertiary)] hover:border-white/20'}
                `}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>
      </SectionHeader>

      <SectionHeader title="Dose Summary" defaultOpen={true}>
        <div className="grid grid-cols-2 gap-2">
          <MetricCard
            label="Annual Dose"
            value={rad.shieldedDoseKradPerYear < 0.1
              ? rad.shieldedDoseKradPerYear.toFixed(3)
              : rad.shieldedDoseKradPerYear.toFixed(1)}
            unit="krad/yr"
            status={rad.componentStatus}
          />
          <MetricCard
            label="Mission Total"
            value={rad.missionTotalDoseKrad < 0.1
              ? rad.missionTotalDoseKrad.toFixed(3)
              : rad.missionTotalDoseKrad.toFixed(1)}
            unit="krad"
            status={rad.componentStatus}
          />
        </div>
      </SectionHeader>

      <SectionHeader title="Component Guidance" defaultOpen={true}>
        <div className={`
          text-[10px] px-2 py-2 rounded border
          ${rad.componentStatus === 'nominal' ? 'border-accent-green/20 bg-accent-green/5 text-accent-green' :
            rad.componentStatus === 'warning' ? 'border-accent-amber/20 bg-accent-amber/5 text-accent-amber' :
            'border-accent-red/20 bg-accent-red/5 text-accent-red'}
        `}>
          {rad.componentRecommendation}
        </div>

        <div className="mt-2 space-y-1">
          <div className="flex justify-between text-[9px]">
            <span className="text-[var(--text-tertiary)]">COTS Limit</span>
            <span className="font-mono text-accent-green">{'<'} 10 krad</span>
          </div>
          <div className="flex justify-between text-[9px]">
            <span className="text-[var(--text-tertiary)]">Rad-Tolerant</span>
            <span className="font-mono text-accent-amber">10–100 krad</span>
          </div>
          <div className="flex justify-between text-[9px]">
            <span className="text-[var(--text-tertiary)]">Rad-Hardened</span>
            <span className="font-mono text-accent-red">{'>'} 100 krad</span>
          </div>
        </div>
      </SectionHeader>
    </div>
  )
}
