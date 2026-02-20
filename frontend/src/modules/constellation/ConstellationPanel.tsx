import { useMemo } from 'react'
import { useStore } from '@/stores'
import SectionHeader from '@/components/ui/SectionHeader'
import MetricCard from '@/components/ui/MetricCard'
import SliderInput from '@/components/ui/SliderInput'
import ExportCSVButton from '@/components/ui/ExportCSVButton'
import {
  DEFAULT_WALKER,
  generateWalkerConstellation,
  computeConstellationMetrics,
  type WalkerParams,
  type WalkerType,
} from '@/lib/constellation'
import { R_EARTH_EQUATORIAL } from '@/lib/constants'
import { exportCSV } from '@/lib/csv-export'

export default function ConstellationPanel() {
  const mission = useStore((s) => s.mission)
  const elements = useStore((s) => s.elements)
  const params = useStore((s) => s.walkerParams)
  const updateWalkerParams = useStore((s) => s.updateWalkerParams)
  const setWalkerParams = useStore((s) => s.setWalkerParams)

  // When synced with orbit tab, use orbit tab's altitude and inclination
  const orbitAltitude = Math.round(elements.semiMajorAxis - R_EARTH_EQUATORIAL)
  const orbitInclination = elements.inclination

  const effectiveParams = useMemo(() => {
    if (params.syncWithOrbit) {
      return { ...params, altitude: orbitAltitude, inclination: orbitInclination }
    }
    return params
  }, [params, orbitAltitude, orbitInclination])

  const metrics = useMemo(
    () => computeConstellationMetrics(effectiveParams, mission.spacecraft.mass),
    [effectiveParams, mission.spacecraft.mass]
  )

  // Preset constellations (presets break orbit sync)
  const presets: { label: string; params: WalkerParams }[] = [
    { label: 'Starlink-like', params: { ...DEFAULT_WALKER, syncWithOrbit: false, totalSats: 72, planes: 6, phasing: 1, altitude: 550, inclination: 53 } },
    { label: 'GPS-like', params: { ...DEFAULT_WALKER, syncWithOrbit: false, totalSats: 24, planes: 6, phasing: 1, altitude: 20200, inclination: 55 } },
    { label: 'Iridium-like', params: { ...DEFAULT_WALKER, syncWithOrbit: false, type: 'star', totalSats: 66, planes: 6, phasing: 2, altitude: 780, inclination: 86.4 } },
    { label: 'Small SSO', params: { ...DEFAULT_WALKER, syncWithOrbit: false, totalSats: 12, planes: 4, phasing: 1, altitude: 500, inclination: 97.4 } },
  ]

  return (
    <div className="space-y-2">
      <SectionHeader title="Walker Parameters">
        <div className="space-y-2">
          <label className="flex items-center justify-between">
            <span className="text-[10px] text-[var(--text-secondary)]">Type</span>
            <select
              value={params.type}
              onChange={(e) => updateWalkerParams({ type: e.target.value as WalkerType })}
              className="input-field w-24 text-xs"
            >
              <option value="delta">Walker Delta</option>
              <option value="star">Walker Star</option>
            </select>
          </label>

          <SliderInput
            label="Total Satellites (T)"
            value={params.totalSats}
            onChange={(v) => updateWalkerParams({ totalSats: v })}
            min={3}
            max={120}
            step={1}
            unit=""
          />
          <SliderInput
            label="Planes (P)"
            value={params.planes}
            onChange={(v) => updateWalkerParams({ planes: Math.min(v, params.totalSats) })}
            min={1}
            max={Math.min(24, params.totalSats)}
            step={1}
            unit=""
          />
          <SliderInput
            label="Phasing (F)"
            value={params.phasing}
            onChange={(v) => updateWalkerParams({ phasing: v })}
            min={0}
            max={Math.max(0, params.planes - 1)}
            step={1}
            unit=""
          />
          <SliderInput
            label="Altitude"
            value={effectiveParams.altitude}
            onChange={(v) => updateWalkerParams({ altitude: v, syncWithOrbit: false })}
            min={200}
            max={35786}
            step={10}
            unit="km"
          />
          <SliderInput
            label="Inclination"
            value={effectiveParams.inclination}
            onChange={(v) => updateWalkerParams({ inclination: v, syncWithOrbit: false })}
            min={0}
            max={180}
            step={0.1}
            unit={"\u00B0"}
          />
          {params.syncWithOrbit && (
            <div className="text-[9px] text-accent-blue/70 font-mono px-1">
              Synced with orbit tab
            </div>
          )}
          {!params.syncWithOrbit && (
            <button
              onClick={() => updateWalkerParams({ syncWithOrbit: true })}
              className="text-[9px] text-[var(--text-tertiary)] hover:text-accent-blue font-mono px-1 transition-colors"
            >
              Reset to orbit tab values
            </button>
          )}
        </div>
      </SectionHeader>

      <SectionHeader title="Presets">
        <div className="grid grid-cols-2 gap-1">
          {presets.map((p) => (
            <button
              key={p.label}
              onClick={() => setWalkerParams(p.params)}
              className="px-2 py-1.5 rounded text-[10px] font-mono border border-white/10 text-[var(--text-secondary)] hover:bg-white/5 hover:border-accent-blue/30 transition-colors"
            >
              {p.label}
            </button>
          ))}
        </div>
      </SectionHeader>

      <SectionHeader title="Constellation Metrics" actions={
        <ExportCSVButton onClick={() => {
          const sats = generateWalkerConstellation(effectiveParams)
          exportCSV(
            `${mission.name.replace(/\s+/g, '_')}_constellation`,
            ['Sat ID', 'Plane', 'Index', 'SMA (km)', 'Ecc', 'Inc (deg)', 'RAAN (deg)', 'AoP (deg)', 'True Anomaly (deg)'],
            sats.map(s => [
              s.id + 1, s.plane + 1, s.indexInPlane + 1,
              s.elements.semiMajorAxis.toFixed(3),
              s.elements.eccentricity.toFixed(6),
              s.elements.inclination.toFixed(4),
              s.elements.raan.toFixed(4),
              s.elements.argOfPerigee.toFixed(4),
              s.elements.trueAnomaly.toFixed(4),
            ])
          )
        }} />
      }>
        <div className="grid grid-cols-2 gap-2">
          <MetricCard
            label="Total Sats"
            value={metrics.totalSatellites}
            status="nominal"
          />
          <MetricCard
            label="Sats/Plane"
            value={metrics.satsPerPlane}
            status="nominal"
          />
          <MetricCard
            label="Total Mass"
            value={metrics.totalMass.toFixed(0)}
            unit="kg"
            status="nominal"
          />
          <MetricCard
            label="Period"
            value={metrics.orbitalPeriodMin.toFixed(1)}
            unit="min"
            status="nominal"
          />
        </div>
        <div className="px-2 py-1.5 mt-1 text-[9px] text-[var(--text-tertiary)] font-mono">
          Coverage band: {metrics.coverageLatBand.min.toFixed(1)} to {metrics.coverageLatBand.max.toFixed(1)} lat
        </div>
      </SectionHeader>
    </div>
  )
}
