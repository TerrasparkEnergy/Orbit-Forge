import { useMemo, useState } from 'react'
import Plot from 'react-plotly.js'
import { useStore } from '@/stores'
import { predictPasses } from '@/lib/pass-prediction'

const STATION_COLORS: Record<string, string> = {}
const COLOR_PALETTE = [
  '#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6',
  '#06B6D4', '#EC4899', '#84CC16', '#F97316', '#14B8A6',
]

function getStationColor(station: string): string {
  if (!STATION_COLORS[station]) {
    STATION_COLORS[station] = COLOR_PALETTE[Object.keys(STATION_COLORS).length % COLOR_PALETTE.length]
  }
  return STATION_COLORS[station]
}

export default function PassTimelineChart() {
  const elements = useStore((s) => s.elements)
  const mission = useStore((s) => s.mission)
  const groundStations = useStore((s) => s.groundStations)
  const [durationDays, setDurationDays] = useState(3)

  const passes = useMemo(
    () => predictPasses(elements, mission.epoch, groundStations, durationDays),
    [elements, mission.epoch, groundStations, durationDays]
  )

  // Build Gantt-style timeline using horizontal bars
  const traces: any[] = useMemo(() => {
    // Group passes by station
    const stationNames = [...new Set(passes.map((p) => p.station))]

    return stationNames.map((station) => {
      const stationPasses = passes.filter((p) => p.station === station)
      const color = getStationColor(station)

      return {
        type: 'scatter',
        mode: 'markers',
        name: station,
        x: stationPasses.map((p) => {
          // Plot at midpoint of pass
          const mid = new Date((p.aos.getTime() + p.los.getTime()) / 2)
          return mid.toISOString()
        }),
        y: stationPasses.map(() => station),
        text: stationPasses.map((p) =>
          `${station}<br>` +
          `AOS: ${p.aos.toISOString().slice(11, 19)} UTC<br>` +
          `LOS: ${p.los.toISOString().slice(11, 19)} UTC<br>` +
          `Duration: ${Math.round(p.durationSec / 60)} min<br>` +
          `Max El: ${p.maxElevation.toFixed(1)}&deg;<br>` +
          `Quality: ${p.quality}`
        ),
        hoverinfo: 'text',
        marker: {
          color: stationPasses.map((p) =>
            p.quality === 'A' ? '#10B981' :
            p.quality === 'B' ? '#3B82F6' :
            p.quality === 'C' ? '#F59E0B' : '#6B7280'
          ),
          size: stationPasses.map((p) => Math.max(6, Math.min(16, p.durationSec / 30))),
          symbol: 'diamond',
        },
      }
    })
  }, [passes])

  // Elevation profile for all passes
  const elevationTrace: any = useMemo(() => ({
    type: 'bar',
    x: passes.map((p) => p.aos.toISOString()),
    y: passes.map((p) => p.maxElevation),
    text: passes.map((p) => `${p.station}: ${p.maxElevation.toFixed(1)}&deg;`),
    hoverinfo: 'text',
    marker: {
      color: passes.map((p) =>
        p.quality === 'A' ? '#10B981' :
        p.quality === 'B' ? '#3B82F6' :
        p.quality === 'C' ? '#F59E0B' : '#6B7280'
      ),
    },
    name: 'Max Elevation',
  }), [passes])

  const darkLayout = {
    paper_bgcolor: 'transparent',
    plot_bgcolor: 'transparent',
    font: { family: 'JetBrains Mono', size: 10, color: '#9CA3AF' },
    margin: { l: 100, r: 20, t: 30, b: 50 },
    legend: {
      font: { size: 9, color: '#9CA3AF' },
      bgcolor: 'transparent',
      orientation: 'h' as const,
      y: 1.1,
    },
  }

  return (
    <div className="flex h-full gap-2">
      {/* Timeline */}
      <div className="flex-[2] h-full">
        <Plot
          data={traces}
          layout={{
            ...darkLayout,
            title: { text: `Pass Timeline — ${durationDays} Days`, font: { size: 11, color: '#9CA3AF' } },
            xaxis: {
              type: 'date',
              gridcolor: 'rgba(255,255,255,0.05)',
              color: '#6B7280',
            },
            yaxis: {
              gridcolor: 'rgba(255,255,255,0.05)',
              color: '#6B7280',
              automargin: true,
            },
          }}
          config={{ displayModeBar: false, responsive: true }}
          style={{ width: '100%', height: '100%' }}
          useResizeHandler
        />
      </div>

      {/* Elevation histogram */}
      <div className="flex-1 h-full">
        <Plot
          data={[elevationTrace]}
          layout={{
            ...darkLayout,
            title: { text: 'Pass Elevations', font: { size: 11, color: '#9CA3AF' } },
            xaxis: {
              type: 'date',
              showticklabels: false,
              gridcolor: 'rgba(255,255,255,0.05)',
            },
            yaxis: {
              title: { text: 'Max El (&deg;)', font: { size: 9 } },
              gridcolor: 'rgba(255,255,255,0.05)',
              color: '#6B7280',
              range: [0, 90],
            },
            showlegend: false,
          }}
          config={{ displayModeBar: false, responsive: true }}
          style={{ width: '100%', height: '100%' }}
          useResizeHandler
        />
      </div>
    </div>
  )
}
