import { useMemo } from 'react'
import Plot from 'react-plotly.js'
import { useStore } from '@/stores'
import {
  computeInterplanetaryResult,
  computeHohmannInterplanetary,
  computePorkchopGrid,
  generateHeliocentricProfile,
} from '@/lib/interplanetary'
import { PLANET_DATA } from '@/lib/beyond-leo-constants'

const darkLayout = {
  paper_bgcolor: 'transparent',
  plot_bgcolor: 'transparent',
  font: { family: 'JetBrains Mono, monospace', size: 10, color: '#9CA3AF' },
  margin: { l: 60, r: 20, t: 30, b: 40 },
  legend: { font: { size: 9, color: '#9CA3AF' }, bgcolor: 'transparent', orientation: 'h' as const, y: 1.12 },
}

export default function InterplanetaryChart() {
  const params = useStore((s) => s.beyondLeo.interplanetaryParams)

  const result = useMemo(() => computeInterplanetaryResult(params), [params])
  const planet = PLANET_DATA[params.targetBody]

  // Left chart: Porkchop plot (Lambert) or ΔV breakdown (Hohmann)
  const leftChart = useMemo(() => {
    if (params.transferType === 'lambert') {
      // Compute porkchop grid
      const startDate = new Date(params.departureDateISO)
      const hohmann = computeHohmannInterplanetary(params.targetBody)
      const minFlight = Math.max(30, hohmann.transferTimeDays * 0.3)
      const maxFlight = hohmann.transferTimeDays * 2.5

      const points = computePorkchopGrid(
        params.targetBody,
        startDate,
        730, // 2 years of departure dates
        25,  // samples
        minFlight,
        maxFlight,
        25,  // flight time samples
      )

      if (points.length < 10) {
        return { type: 'empty' as const }
      }

      // Build contour data
      const depDays = [...new Set(points.map((p) => p.departureDOY))].sort((a, b) => a - b)
      const flights = [...new Set(points.map((p) => p.flightTimeDays))].sort((a, b) => a - b)

      const z: number[][] = []
      for (const fd of flights) {
        const row: number[] = []
        for (const dd of depDays) {
          const pt = points.find((p) => p.departureDOY === dd && p.flightTimeDays === fd)
          row.push(pt ? Math.min(pt.c3, 100) : 100)
        }
        z.push(row)
      }

      return {
        type: 'porkchop' as const,
        trace: {
          x: depDays,
          y: flights,
          z,
          type: 'contour' as const,
          colorscale: 'Viridis',
          reversescale: true,
          contours: { coloring: 'heatmap' as const },
          colorbar: {
            title: { text: 'C3 (km²/s²)', font: { size: 9, color: '#9CA3AF' } },
            tickfont: { size: 8, color: '#9CA3AF' },
          },
        },
      }
    }

    // Hohmann: ΔV breakdown bars
    return {
      type: 'bars' as const,
      traces: [
        {
          x: ['Departure', 'Arrival'],
          y: [result.departureDeltaVms, result.arrivalInsertionDeltaVms],
          type: 'bar' as const,
          marker: { color: ['#3B82F6', '#10B981'] },
        },
      ],
    }
  }, [params, result])

  // Right chart: Heliocentric distance profile
  const helioProfile = useMemo(
    () => generateHeliocentricProfile(params.targetBody, result.transferTimeDays),
    [params.targetBody, result.transferTimeDays],
  )

  const helioTrace = useMemo(() => ({
    x: helioProfile.map((p) => p.day),
    y: helioProfile.map((p) => p.distanceAU),
    type: 'scatter' as const,
    mode: 'lines' as const,
    name: 'Spacecraft',
    line: { color: '#3B82F6', width: 2 },
  }), [helioProfile])

  const earthRef = useMemo(() => ({
    x: [0, result.transferTimeDays],
    y: [1.0, 1.0],
    type: 'scatter' as const,
    mode: 'lines' as const,
    name: 'Earth (1 AU)',
    line: { color: '#10B981', width: 1, dash: 'dash' as const },
  }), [result.transferTimeDays])

  const targetRef = useMemo(() => ({
    x: [0, result.transferTimeDays],
    y: [planet.semiMajorAxisAU, planet.semiMajorAxisAU],
    type: 'scatter' as const,
    mode: 'lines' as const,
    name: `${planet.name} (${planet.semiMajorAxisAU.toFixed(2)} AU)`,
    line: { color: planet.color, width: 1, dash: 'dash' as const },
  }), [result.transferTimeDays, planet])

  return (
    <div className="flex h-full gap-2">
      <div className="flex-1 h-full">
        {leftChart.type === 'porkchop' ? (
          <Plot
            data={[leftChart.trace] as any}
            layout={{
              ...darkLayout,
              title: { text: 'Porkchop Plot (C3)', font: { size: 11, color: '#9CA3AF' } },
              xaxis: {
                title: { text: 'Departure (day offset)', font: { size: 10 } },
                gridcolor: 'rgba(255,255,255,0.05)',
                color: '#6B7280',
              },
              yaxis: {
                title: { text: 'Flight Time (days)', font: { size: 10 } },
                gridcolor: 'rgba(255,255,255,0.05)',
                color: '#6B7280',
              },
            }}
            config={{ displayModeBar: false, responsive: true }}
            style={{ width: '100%', height: '100%' }}
            useResizeHandler
          />
        ) : leftChart.type === 'bars' ? (
          <Plot
            data={leftChart.traces as any}
            layout={{
              ...darkLayout,
              title: { text: 'ΔV Breakdown (Hohmann)', font: { size: 11, color: '#9CA3AF' } },
              xaxis: {
                gridcolor: 'rgba(255,255,255,0.05)',
                color: '#6B7280',
              },
              yaxis: {
                title: { text: 'ΔV (m/s)', font: { size: 10 } },
                gridcolor: 'rgba(255,255,255,0.05)',
                color: '#6B7280',
              },
              showlegend: false,
            }}
            config={{ displayModeBar: false, responsive: true }}
            style={{ width: '100%', height: '100%' }}
            useResizeHandler
          />
        ) : (
          <div className="flex items-center justify-center h-full text-[var(--text-tertiary)] text-xs italic">
            Insufficient data for porkchop plot
          </div>
        )}
      </div>

      <div className="flex-1 h-full">
        <Plot
          data={[helioTrace, earthRef, targetRef] as any}
          layout={{
            ...darkLayout,
            title: { text: 'Heliocentric Distance', font: { size: 11, color: '#9CA3AF' } },
            xaxis: {
              title: { text: 'Elapsed Time (days)', font: { size: 10 } },
              gridcolor: 'rgba(255,255,255,0.05)',
              color: '#6B7280',
            },
            yaxis: {
              title: { text: 'Distance from Sun (AU)', font: { size: 10 } },
              gridcolor: 'rgba(255,255,255,0.05)',
              color: '#6B7280',
            },
            showlegend: true,
          }}
          config={{ displayModeBar: false, responsive: true }}
          style={{ width: '100%', height: '100%' }}
          useResizeHandler
        />
      </div>
    </div>
  )
}
