import { useState } from 'react'
import { useStore } from '@/stores'
import type { GroundStation } from '@/types/ground-station'
import SectionHeader from '@/components/ui/SectionHeader'

export default function GroundStationEditor() {
  const groundStations = useStore((s) => s.groundStations)
  const toggleStationActive = useStore((s) => s.toggleStationActive)
  const addGroundStation = useStore((s) => s.addGroundStation)
  const removeGroundStation = useStore((s) => s.removeGroundStation)

  const [showAdd, setShowAdd] = useState(false)
  const [newStation, setNewStation] = useState({
    name: '',
    lat: 0,
    lon: 0,
    minElevation: 5,
  })

  const handleAdd = () => {
    if (!newStation.name.trim()) return
    const station: GroundStation = {
      id: `custom-${Date.now()}`,
      name: newStation.name.trim(),
      lat: newStation.lat,
      lon: newStation.lon,
      alt: 0,
      minElevation: newStation.minElevation,
      active: true,
    }
    addGroundStation(station)
    setNewStation({ name: '', lat: 0, lon: 0, minElevation: 5 })
    setShowAdd(false)
  }

  const activeCount = groundStations.filter((gs) => gs.active).length

  return (
    <SectionHeader title={`Ground Stations (${activeCount} active)`} defaultOpen={true}>
      <div className="space-y-1 max-h-60 overflow-y-auto">
        {groundStations.map((gs) => (
          <div
            key={gs.id}
            className={`
              flex items-center gap-2 px-2 py-1.5 rounded text-[11px] transition-colors cursor-pointer
              ${gs.active ? 'bg-accent-green/10 text-[var(--text-primary)]' : 'text-[var(--text-tertiary)] hover:bg-white/5'}
            `}
            onClick={() => toggleStationActive(gs.id)}
          >
            <div className={`w-2 h-2 rounded-full flex-shrink-0 ${gs.active ? 'bg-accent-green' : 'bg-white/20'}`} />
            <span className="flex-1 truncate font-sans">{gs.name}</span>
            <span className="font-mono text-[9px] text-[var(--text-tertiary)]">
              {gs.lat.toFixed(1)}, {gs.lon.toFixed(1)}
            </span>
            {gs.id.startsWith('custom-') && (
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  removeGroundStation(gs.id)
                }}
                className="text-accent-red/50 hover:text-accent-red text-xs"
              >
                ×
              </button>
            )}
          </div>
        ))}
      </div>

      {showAdd ? (
        <div className="space-y-2 mt-2 p-2 border border-white/10 rounded">
          <input
            type="text"
            placeholder="Station name"
            value={newStation.name}
            onChange={(e) => setNewStation((s) => ({ ...s, name: e.target.value }))}
            className="input-field w-full text-xs"
          />
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[9px] text-[var(--text-tertiary)]">Lat (\u00B0)</label>
              <input
                type="number"
                value={newStation.lat}
                onChange={(e) => setNewStation((s) => ({ ...s, lat: parseFloat(e.target.value) || 0 }))}
                className="input-field w-full text-xs font-mono"
                min={-90}
                max={90}
              />
            </div>
            <div>
              <label className="text-[9px] text-[var(--text-tertiary)]">Lon (\u00B0)</label>
              <input
                type="number"
                value={newStation.lon}
                onChange={(e) => setNewStation((s) => ({ ...s, lon: parseFloat(e.target.value) || 0 }))}
                className="input-field w-full text-xs font-mono"
                min={-180}
                max={180}
              />
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleAdd}
              className="flex-1 px-2 py-1 rounded bg-accent-blue/20 text-accent-blue text-[11px] font-sans hover:bg-accent-blue/30 transition-colors"
            >
              Add Station
            </button>
            <button
              onClick={() => setShowAdd(false)}
              className="px-2 py-1 rounded border border-white/10 text-[var(--text-tertiary)] text-[11px] hover:bg-white/5 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setShowAdd(true)}
          className="w-full mt-1 px-2 py-1.5 rounded border border-dashed border-white/20 text-[11px] text-[var(--text-tertiary)] hover:border-accent-blue/40 hover:text-accent-blue transition-colors"
        >
          + Add Custom Station
        </button>
      )}
    </SectionHeader>
  )
}
