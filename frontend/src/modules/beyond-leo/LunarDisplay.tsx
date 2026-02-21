import { useMemo } from 'react'
import { useStore } from '@/stores'
import MetricCard from '@/components/ui/MetricCard'
import SectionHeader from '@/components/ui/SectionHeader'
import DataReadout from '@/components/ui/DataReadout'
import { computeLunarResult } from '@/lib/lunar-transfer'

export default function LunarDisplay() {
  const params = useStore((s) => s.beyondLeo.lunarParams)

  const result = useMemo(() => computeLunarResult(params), [params])

  const propStatus = result.propellantRequiredKg <= params.propellantMassKg
    ? 'nominal'
    : result.propellantRequiredKg <= params.propellantMassKg * 1.2
      ? 'warning'
      : 'critical'

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-2">
        <MetricCard
          label="TLI ΔV"
          value={result.tliDeltaVms.toFixed(0)}
          unit="m/s"
          status="nominal"
        />
        <MetricCard
          label="LOI ΔV"
          value={result.loiDeltaVms.toFixed(0)}
          unit="m/s"
          status={params.missionType === 'flyby' || params.missionType === 'free-return' ? 'nominal' : 'nominal'}
        />
      </div>

      <SectionHeader title="Transfer">
        <div className="grid grid-cols-2 gap-2">
          <DataReadout
            label="Transfer Time"
            value={result.transferTimeDays.toFixed(1)}
            unit="days"
          />
          <DataReadout
            label="Total ΔV"
            value={result.totalDeltaVms.toFixed(0)}
            unit="m/s"
          />
          <DataReadout
            label="Phase Angle"
            value={result.phaseAngleDeg.toFixed(1)}
            unit="°"
          />
        </div>
      </SectionHeader>

      {(params.missionType === 'orbit' || params.missionType === 'landing') && (
        <SectionHeader title="Lunar Orbit">
          <div className="grid grid-cols-2 gap-2">
            {result.lunarOrbitPeriodMin > 0 && (
              <DataReadout
                label="Orbital Period"
                value={result.lunarOrbitPeriodMin.toFixed(1)}
                unit="min"
              />
            )}
            <DataReadout
              label="Propellant Req"
              value={result.propellantRequiredKg.toFixed(1)}
              unit="kg"
              status={propStatus}
            />
            <DataReadout
              label="Propellant Avail"
              value={params.propellantMassKg.toFixed(1)}
              unit="kg"
            />
          </div>
        </SectionHeader>
      )}

      <SectionHeader title="Communications">
        <div className="grid grid-cols-2 gap-2">
          <DataReadout
            label="One-Way Delay"
            value={result.commDelayS.toFixed(2)}
            unit="s"
          />
        </div>
      </SectionHeader>

      {params.missionType === 'free-return' && result.freeReturnPeriodDays > 0 && (
        <SectionHeader title="Free-Return">
          <div className="grid grid-cols-2 gap-2">
            <DataReadout
              label="Return Period"
              value={result.freeReturnPeriodDays.toFixed(1)}
              unit="days"
            />
          </div>
        </SectionHeader>
      )}
    </div>
  )
}
