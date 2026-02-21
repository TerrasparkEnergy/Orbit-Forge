import { useMemo } from 'react'
import { useStore } from '@/stores'
import MetricCard from '@/components/ui/MetricCard'
import SectionHeader from '@/components/ui/SectionHeader'
import DataReadout from '@/components/ui/DataReadout'
import { computeLagrangeResult, computeLissajousOutOfPlanePeriod } from '@/lib/lagrange'

export default function LagrangeDisplay() {
  const params = useStore((s) => s.beyondLeo.lagrangeParams)

  const result = useMemo(() => computeLagrangeResult(params), [params])

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-2">
        <MetricCard
          label="Transfer ΔV"
          value={result.transferDeltaVms.toFixed(0)}
          unit="m/s"
          status="nominal"
        />
        <MetricCard
          label="Insertion ΔV"
          value={result.insertionDeltaVms.toFixed(0)}
          unit="m/s"
          status="nominal"
        />
      </div>

      <SectionHeader title="Transfer">
        <div className="grid grid-cols-2 gap-2">
          <DataReadout
            label="L-Point Distance"
            value={result.pointDistanceKm > 1e6
              ? (result.pointDistanceKm / 1e6).toFixed(3) + 'M'
              : (result.pointDistanceKm / 1e3).toFixed(0) + 'k'}
            unit="km"
          />
          {result.pointDistanceAU > 0.001 && (
            <DataReadout
              label="Distance"
              value={result.pointDistanceAU.toFixed(4)}
              unit="AU"
            />
          )}
          <DataReadout
            label="Transfer Time"
            value={result.transferTimeDays.toFixed(0)}
            unit="days"
          />
          <DataReadout
            label="Total ΔV"
            value={result.totalDeltaVms.toFixed(0)}
            unit="m/s"
          />
        </div>
      </SectionHeader>

      <SectionHeader title="Orbit">
        <div className="grid grid-cols-2 gap-2">
          <DataReadout
            label={params.orbitType === 'lissajous' ? 'In-Plane Period' : 'Orbit Period'}
            value={result.haloPeriodDays.toFixed(1)}
            unit="days"
          />
          {params.orbitType === 'lissajous' && (
            <DataReadout
              label="Out-of-Plane Period"
              value={computeLissajousOutOfPlanePeriod(params.system, params.point).toFixed(1)}
              unit="days"
            />
          )}
          <DataReadout
            label="Stability"
            value={result.stabilityClass === 'stable' ? 'STABLE' : 'UNSTABLE'}
            status={result.stabilityClass === 'stable' ? 'nominal' : 'warning'}
          />
          <DataReadout
            label="Annual SK ΔV"
            value={result.annualStationKeepingMs.toFixed(1)}
            unit="m/s/yr"
          />
          <DataReadout
            label="Orbit Type"
            value={params.orbitType.charAt(0).toUpperCase() + params.orbitType.slice(1)}
          />
        </div>
      </SectionHeader>

      <SectionHeader title="Communications">
        <div className="grid grid-cols-2 gap-2">
          <DataReadout
            label="Distance"
            value={result.commsDistanceKm > 1e6
              ? (result.commsDistanceKm / 1e6).toFixed(3) + 'M'
              : (result.commsDistanceKm / 1e3).toFixed(0) + 'k'}
            unit="km"
          />
          <DataReadout
            label="One-Way Delay"
            value={result.commsDelayS.toFixed(2)}
            unit="s"
          />
        </div>
      </SectionHeader>

      <SectionHeader title="Mission Budget">
        <div className="grid grid-cols-2 gap-2">
          <DataReadout
            label="Mission Total ΔV"
            value={result.missionTotalDeltaVms.toFixed(0)}
            unit="m/s"
          />
          <DataReadout
            label="Mission Life"
            value={params.missionLifetimeYears.toFixed(1)}
            unit="yr"
          />
        </div>
      </SectionHeader>
    </div>
  )
}
