import { useStore } from '@/stores'
import SectionHeader from '@/components/ui/SectionHeader'
import type { LagrangeSystem, LagrangePoint, LagrangeOrbitType, LagrangeTransferType } from '@/types/beyond-leo'

const SYSTEMS: { value: LagrangeSystem; label: string }[] = [
  { value: 'SE', label: 'Sun-Earth' },
  { value: 'EM', label: 'Earth-Moon' },
]

const POINTS: { value: LagrangePoint; label: string; desc: string }[] = [
  { value: 'L1', label: 'L1', desc: 'Between bodies' },
  { value: 'L2', label: 'L2', desc: 'Beyond secondary' },
  { value: 'L3', label: 'L3', desc: 'Opposite side' },
  { value: 'L4', label: 'L4', desc: '60° ahead' },
  { value: 'L5', label: 'L5', desc: '60° behind' },
]

const ORBIT_TYPES: { value: LagrangeOrbitType; label: string }[] = [
  { value: 'halo', label: 'Halo' },
  { value: 'lissajous', label: 'Lissajous' },
  { value: 'lyapunov', label: 'Lyapunov' },
]

const TRANSFER_TYPES: { value: LagrangeTransferType; label: string }[] = [
  { value: 'direct', label: 'Direct' },
  { value: 'low-energy', label: 'Low-Energy' },
]

export default function LagrangePanel() {
  const params = useStore((s) => s.beyondLeo.lagrangeParams)
  const update = useStore((s) => s.updateLagrangeParams)

  return (
    <>
      <SectionHeader title="System & Point">
        <div className="space-y-3">
          <label className="flex items-center justify-between">
            <span className="text-[10px] text-[var(--text-secondary)]">System</span>
            <select
              value={params.system}
              onChange={(e) => update({ system: e.target.value as LagrangeSystem })}
              className="input-field w-32 text-xs"
            >
              {SYSTEMS.map((s) => (
                <option key={s.value} value={s.value}>{s.label}</option>
              ))}
            </select>
          </label>

          <label className="flex items-center justify-between">
            <span className="text-[10px] text-[var(--text-secondary)]">L-Point</span>
            <select
              value={params.point}
              onChange={(e) => update({ point: e.target.value as LagrangePoint })}
              className="input-field w-32 text-xs"
            >
              {POINTS.map((p) => (
                <option key={p.value} value={p.value}>{p.label} — {p.desc}</option>
              ))}
            </select>
          </label>

          <label className="flex items-center justify-between">
            <span className="text-[10px] text-[var(--text-secondary)]">Orbit Type</span>
            <select
              value={params.orbitType}
              onChange={(e) => update({ orbitType: e.target.value as LagrangeOrbitType })}
              className="input-field w-32 text-xs"
            >
              {ORBIT_TYPES.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </label>
        </div>
      </SectionHeader>

      <SectionHeader title="Transfer">
        <div className="space-y-3">
          <label className="flex items-center justify-between">
            <span className="text-[10px] text-[var(--text-secondary)]">Departure Alt</span>
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

          <label className="flex items-center justify-between">
            <span className="text-[10px] text-[var(--text-secondary)]">Transfer Type</span>
            <select
              value={params.transferType}
              onChange={(e) => update({ transferType: e.target.value as LagrangeTransferType })}
              className="input-field w-32 text-xs"
            >
              {TRANSFER_TYPES.map((t) => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
          </label>

          <label className="flex items-center justify-between">
              <span className="text-[10px] text-[var(--text-secondary)]">Amplitude</span>
              <div className="flex items-center gap-1.5">
                <input
                  type="number"
                  value={params.amplitudeKm}
                  onChange={(e) => update({ amplitudeKm: parseFloat(e.target.value) || 0 })}
                  className="input-field w-24 text-sm font-mono"
                  min="10000"
                  step="10000"
                />
                <span className="text-[11px] text-[var(--text-secondary)] font-mono w-6">km</span>
              </div>
            </label>
        </div>
      </SectionHeader>

      <SectionHeader title="Mission" defaultOpen={false}>
        <div className="space-y-3">
          <label className="flex items-center justify-between">
            <span className="text-[10px] text-[var(--text-secondary)]">Lifetime</span>
            <div className="flex items-center gap-1.5">
              <input
                type="number"
                value={params.missionLifetimeYears}
                onChange={(e) => update({ missionLifetimeYears: parseFloat(e.target.value) || 0 })}
                className="input-field w-24 text-sm font-mono"
                min="0.5"
                max="30"
                step="0.5"
              />
              <span className="text-[11px] text-[var(--text-secondary)] font-mono w-6">yr</span>
            </div>
          </label>

          <label className="flex items-center justify-between">
            <span className="text-[10px] text-[var(--text-secondary)]">SK Budget</span>
            <div className="flex items-center gap-1.5">
              <input
                type="number"
                value={params.stationKeepingBudgetMs}
                onChange={(e) => update({ stationKeepingBudgetMs: parseFloat(e.target.value) || 0 })}
                className="input-field w-24 text-sm font-mono"
                min="0"
                max="100"
                step="1"
              />
              <span className="text-[11px] text-[var(--text-secondary)] font-mono w-10">m/s/yr</span>
            </div>
          </label>
        </div>
      </SectionHeader>
    </>
  )
}
