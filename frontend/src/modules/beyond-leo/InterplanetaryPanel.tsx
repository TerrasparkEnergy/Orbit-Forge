import { useMemo } from 'react'
import { useStore } from '@/stores'
import SectionHeader from '@/components/ui/SectionHeader'
import DataReadout from '@/components/ui/DataReadout'
import { PLANET_DATA } from '@/lib/beyond-leo-constants'
import type { TargetBody, InterplanetaryMissionType, InterplanetaryTransferType } from '@/types/beyond-leo'

const TARGET_OPTIONS = Object.entries(PLANET_DATA).map(([key, data]) => ({
  value: key as TargetBody,
  label: data.name,
}))

const MISSION_TYPES: { value: InterplanetaryMissionType; label: string }[] = [
  { value: 'flyby', label: 'Flyby' },
  { value: 'orbiter', label: 'Orbiter' },
  { value: 'lander', label: 'Lander' },
]

const TRANSFER_TYPES: { value: InterplanetaryTransferType; label: string }[] = [
  { value: 'hohmann', label: 'Hohmann' },
  { value: 'lambert', label: 'Lambert' },
]

export default function InterplanetaryPanel() {
  const params = useStore((s) => s.beyondLeo.interplanetaryParams)
  const update = useStore((s) => s.updateInterplanetaryParams)

  const showOrbiterParams = params.missionType === 'orbiter' || params.missionType === 'lander'

  const transferTimeDays = useMemo(() => {
    if (params.transferType !== 'lambert') return null
    const dep = new Date(params.departureDateISO)
    const arr = new Date(params.arrivalDateISO)
    return Math.max(0, (arr.getTime() - dep.getTime()) / 86400000)
  }, [params.departureDateISO, params.arrivalDateISO, params.transferType])

  return (
    <>
      <SectionHeader title="Target">
        <div className="space-y-3">
          <label className="flex items-center justify-between">
            <span className="text-[10px] text-[var(--text-secondary)]">Target Body</span>
            <select
              value={params.targetBody}
              onChange={(e) => update({ targetBody: e.target.value as TargetBody })}
              className="input-field w-32 text-xs"
            >
              {TARGET_OPTIONS.map((t) => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
          </label>

          <label className="flex items-center justify-between">
            <span className="text-[10px] text-[var(--text-secondary)]">Mission Type</span>
            <select
              value={params.missionType}
              onChange={(e) => update({ missionType: e.target.value as InterplanetaryMissionType })}
              className="input-field w-32 text-xs"
            >
              {MISSION_TYPES.map((m) => (
                <option key={m.value} value={m.value}>{m.label}</option>
              ))}
            </select>
          </label>

          <label className="flex items-center justify-between">
            <span className="text-[10px] text-[var(--text-secondary)]">Transfer</span>
            <select
              value={params.transferType}
              onChange={(e) => update({ transferType: e.target.value as InterplanetaryTransferType })}
              className="input-field w-32 text-xs"
            >
              {TRANSFER_TYPES.map((t) => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
          </label>
        </div>
      </SectionHeader>

      <SectionHeader title="Departure">
        <div className="space-y-3">
          <label className="flex items-center justify-between">
            <span className="text-[10px] text-[var(--text-secondary)]">Parking Alt</span>
            <div className="flex items-center gap-1.5">
              <input
                type="number"
                value={params.departureAltKm}
                onChange={(e) => update({ departureAltKm: parseFloat(e.target.value) || 0 })}
                className="input-field w-24 text-sm font-mono"
                min="150"
                max="2000"
              />
              <span className="text-[11px] text-[var(--text-secondary)] font-mono w-6">km</span>
            </div>
          </label>

          {showOrbiterParams && (
            <label className="flex items-center justify-between">
              <span className="text-[10px] text-[var(--text-secondary)]">Arrival Orbit Alt</span>
              <div className="flex items-center gap-1.5">
                <input
                  type="number"
                  value={params.arrivalOrbitAltKm}
                  onChange={(e) => update({ arrivalOrbitAltKm: parseFloat(e.target.value) || 0 })}
                  className="input-field w-24 text-sm font-mono"
                  min="50"
                />
                <span className="text-[11px] text-[var(--text-secondary)] font-mono w-6">km</span>
              </div>
            </label>
          )}
        </div>
      </SectionHeader>

      {params.transferType === 'lambert' && (
        <SectionHeader title="Launch Window">
          <div className="space-y-3">
            <label className="flex items-center justify-between">
              <span className="text-[10px] text-[var(--text-secondary)]">Departure</span>
              <input
                type="date"
                value={params.departureDateISO.slice(0, 10)}
                onChange={(e) => update({ departureDateISO: new Date(e.target.value).toISOString() })}
                className="input-field w-36 text-xs"
              />
            </label>

            <label className="flex items-center justify-between">
              <span className="text-[10px] text-[var(--text-secondary)]">Arrival</span>
              <input
                type="date"
                value={params.arrivalDateISO.slice(0, 10)}
                onChange={(e) => update({ arrivalDateISO: new Date(e.target.value).toISOString() })}
                className="input-field w-36 text-xs"
              />
            </label>

            {transferTimeDays !== null && (
              <DataReadout
                label="Transfer Time"
                value={transferTimeDays.toFixed(0)}
                unit="days"
              />
            )}
          </div>
        </SectionHeader>
      )}

      <SectionHeader title="Spacecraft" defaultOpen={false}>
        <div className="space-y-3">
          <label className="flex items-center justify-between">
            <span className="text-[10px] text-[var(--text-secondary)]">Mass</span>
            <div className="flex items-center gap-1.5">
              <input
                type="number"
                value={params.spacecraftMassKg}
                onChange={(e) => update({ spacecraftMassKg: parseFloat(e.target.value) || 0 })}
                className="input-field w-24 text-sm font-mono"
                min="1"
              />
              <span className="text-[11px] text-[var(--text-secondary)] font-mono w-6">kg</span>
            </div>
          </label>
        </div>
      </SectionHeader>
    </>
  )
}
