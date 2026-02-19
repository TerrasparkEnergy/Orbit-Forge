import { useMemo } from 'react'
import { useStore } from '@/stores'
import DataReadout from '@/components/ui/DataReadout'
import SectionHeader from '@/components/ui/SectionHeader'
import { computeConstellationMetrics } from '@/lib/constellation'

export default function ConstellationDisplay() {
  const mission = useStore((s) => s.mission)
  const params = useStore((s) => s.walkerParams)

  const metrics = useMemo(
    () => computeConstellationMetrics(params, mission.spacecraft.mass),
    [params, mission.spacecraft.mass]
  )

  return (
    <div className="space-y-3">
      <SectionHeader title="Configuration Summary">
        <div className="grid grid-cols-2 gap-2">
          <DataReadout
            label="Pattern"
            value={`${params.totalSats}/${params.planes}/${params.phasing}`}
          />
          <DataReadout
            label="Type"
            value={params.type === 'delta' ? 'Delta' : 'Star'}
          />
          <DataReadout
            label="Total Satellites"
            value={metrics.totalSatellites}
          />
          <DataReadout
            label="Orbital Planes"
            value={metrics.planesCount}
          />
        </div>
      </SectionHeader>

      <SectionHeader title="Orbit Parameters">
        <div className="grid grid-cols-2 gap-2">
          <DataReadout
            label="Altitude"
            value={params.altitude.toFixed(0)}
            unit="km"
          />
          <DataReadout
            label="Inclination"
            value={params.inclination.toFixed(1)}
            unit="deg"
          />
          <DataReadout
            label="Period"
            value={metrics.orbitalPeriodMin.toFixed(1)}
            unit="min"
          />
          <DataReadout
            label="Sats per Plane"
            value={metrics.satsPerPlane}
          />
        </div>
      </SectionHeader>

      <SectionHeader title="Coverage">
        <div className="grid grid-cols-2 gap-2">
          <DataReadout
            label="Lat. Band"
            value={`${metrics.coverageLatBand.min.toFixed(0)} to ${metrics.coverageLatBand.max.toFixed(0)}`}
            unit="deg"
          />
          <DataReadout
            label="Total Mass"
            value={metrics.totalMass.toFixed(0)}
            unit="kg"
          />
        </div>
      </SectionHeader>

      <SectionHeader title="Deployment Notes">
        <div className="text-[10px] text-[var(--text-tertiary)] leading-relaxed space-y-2">
          <p>
            Walker {params.type === 'delta' ? 'Delta' : 'Star'} pattern
            distributes {metrics.totalSatellites} satellites across {metrics.planesCount} orbital
            planes with {metrics.satsPerPlane} sats each.
          </p>
          <p>
            RAAN spacing: {params.type === 'delta' ? (360 / metrics.planesCount).toFixed(1) : (180 / metrics.planesCount).toFixed(1)} per plane.
            In-plane spacing: {(360 / metrics.satsPerPlane).toFixed(1)} per satellite.
          </p>
        </div>
      </SectionHeader>
    </div>
  )
}
