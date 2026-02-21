import { useMemo } from 'react'
import Plot from 'react-plotly.js'
import { useStore } from '@/stores'
import { computeGSDvsOffNadir, computeCoverageAccumulation, computeEOAnalysis } from '@/lib/payload-eo'
import { computeResVsLookAngle, computeAmbiguityDiagram } from '@/lib/payload-sar'
import { computeLinkBudgetWaterfall, computeDataRateVsElevation } from '@/lib/payload-satcom'
import { R_EARTH_EQUATORIAL } from '@/lib/constants'

const darkLayout = {
  paper_bgcolor: 'transparent',
  plot_bgcolor: 'transparent',
  font: { family: 'JetBrains Mono', size: 10, color: '#9CA3AF' },
  margin: { l: 55, r: 30, t: 30, b: 45 },
  legend: {
    font: { size: 9, color: '#9CA3AF' },
    bgcolor: 'transparent',
    orientation: 'h' as const,
    y: 1.12,
  },
}

const gridColor = 'rgba(255,255,255,0.05)'
const axisColor = '#6B7280'

export default function PayloadChart() {
  const payloadType = useStore((s) => s.payloadType)
  const eo = useStore((s) => s.payloadEO)
  const shared = useStore((s) => s.payloadShared)
  const sar = useStore((s) => s.payloadSAR)
  const satcom = useStore((s) => s.payloadSATCOM)
  const elements = useStore((s) => s.elements)
  const altKm = elements.semiMajorAxis - R_EARTH_EQUATORIAL

  if (payloadType === 'earth-observation') return <EOCharts eo={eo} shared={shared} altKm={altKm} incDeg={elements.inclination} />
  if (payloadType === 'sar') return <SARCharts sar={sar} altKm={altKm} />
  return <SATCOMCharts satcom={satcom} altKm={altKm} />
}

// ─── EO Charts ───

function EOCharts({ eo, shared, altKm, incDeg }: { eo: any; shared: any; altKm: number; incDeg: number }) {
  const gsdData = useMemo(() => computeGSDvsOffNadir(eo, altKm), [eo, altKm])
  const eoAnalysis = useMemo(() => computeEOAnalysis(eo, shared, altKm, incDeg), [eo, shared, altKm, incDeg])
  const coverageData = useMemo(
    () => computeCoverageAccumulation(eoAnalysis.swathWidth, shared.dutyCycle, altKm),
    [eoAnalysis.swathWidth, shared.dutyCycle, altKm],
  )

  const gsdTrace: any = {
    x: gsdData.map((p) => p.angle),
    y: gsdData.map((p) => p.gsd),
    type: 'scatter',
    mode: 'lines',
    name: 'GSD',
    line: { color: '#3B82F6', width: 2 },
    fill: 'tozeroy',
    fillcolor: 'rgba(59, 130, 246, 0.1)',
    hovertemplate: '%{x:.1f}° → %{y:.2f} m<extra></extra>',
  }

  // Max off-nadir marker
  const maxONIdx = gsdData.findIndex((p) => p.angle >= eo.maxOffNadir)
  const markerTrace: any = {
    x: [eo.maxOffNadir],
    y: [maxONIdx >= 0 ? gsdData[maxONIdx].gsd : 0],
    type: 'scatter',
    mode: 'markers',
    name: 'Max Off-Nadir',
    marker: { color: '#F59E0B', size: 10, symbol: 'diamond' },
    hovertemplate: `Max: ${eo.maxOffNadir}° → %{y:.2f} m<extra></extra>`,
  }

  const coverageTrace: any = {
    x: coverageData.map((p) => p.day),
    y: coverageData.map((p) => p.areaSqKm),
    type: 'scatter',
    mode: 'lines',
    name: 'Cumulative Coverage',
    line: { color: '#10B981', width: 2 },
    fill: 'tozeroy',
    fillcolor: 'rgba(16, 185, 129, 0.1)',
    hovertemplate: 'Day %{x} → %{y:,.0f} km²<extra></extra>',
  }

  return (
    <div className="flex h-full gap-2">
      <div className="flex-1 h-full">
        <Plot
          data={[gsdTrace, markerTrace]}
          layout={{
            ...darkLayout,
            title: { text: 'GSD vs Off-Nadir Angle', font: { size: 11, color: '#9CA3AF' } },
            xaxis: { title: { text: 'Off-Nadir Angle (°)', font: { size: 9 } }, gridcolor: gridColor, color: axisColor },
            yaxis: { title: { text: 'GSD (m)', font: { size: 9 } }, gridcolor: gridColor, color: axisColor },
          }}
          config={{ displayModeBar: false, responsive: true }}
          style={{ width: '100%', height: '100%' }}
          useResizeHandler
        />
      </div>
      <div className="flex-1 h-full">
        <Plot
          data={[coverageTrace]}
          layout={{
            ...darkLayout,
            title: { text: 'Coverage Accumulation', font: { size: 11, color: '#9CA3AF' } },
            xaxis: { title: { text: 'Days', font: { size: 9 } }, gridcolor: gridColor, color: axisColor },
            yaxis: { title: { text: 'Area (km²)', font: { size: 9 } }, gridcolor: gridColor, color: axisColor },
          }}
          config={{ displayModeBar: false, responsive: true }}
          style={{ width: '100%', height: '100%' }}
          useResizeHandler
        />
      </div>
    </div>
  )
}

// ─── SAR Charts ───

function SARCharts({ sar, altKm }: { sar: any; altKm: number }) {
  const resData = useMemo(() => computeResVsLookAngle(sar, altKm), [sar, altKm])
  const ambData = useMemo(() => computeAmbiguityDiagram(sar, altKm), [sar, altKm])

  const grTrace: any = {
    x: resData.map((p) => p.angle),
    y: resData.map((p) => p.groundRange),
    type: 'scatter',
    mode: 'lines',
    name: 'Ground Range',
    line: { color: '#3B82F6', width: 2 },
    hovertemplate: '%{x:.1f}° → %{y:.2f} m<extra></extra>',
  }

  const azTrace: any = {
    x: resData.map((p) => p.angle),
    y: resData.map((p) => p.azimuth),
    type: 'scatter',
    mode: 'lines',
    name: 'Azimuth',
    line: { color: '#10B981', width: 2, dash: 'dash' },
    hovertemplate: '%{x:.1f}° → %{y:.2f} m<extra></extra>',
  }

  // Current look angle marker
  const currentResIdx = resData.findIndex((p) => p.angle >= sar.lookAngle)
  const currentMarker: any = {
    x: [sar.lookAngle],
    y: [currentResIdx >= 0 ? resData[currentResIdx].groundRange : 0],
    type: 'scatter',
    mode: 'markers',
    name: 'Current',
    marker: { color: '#F59E0B', size: 10, symbol: 'diamond' },
    showlegend: true,
  }

  // Ambiguity diagram
  const maxPRFTrace: any = {
    x: ambData.prfValues,
    y: ambData.maxPRFLine,
    type: 'scatter',
    mode: 'lines',
    name: 'Max PRF (Range)',
    line: { color: '#EF4444', width: 2 },
    fill: 'tozeroy',
    fillcolor: 'rgba(239, 68, 68, 0.05)',
    hovertemplate: '%{x:.1f}° → %{y:.0f} Hz<extra></extra>',
  }

  const minPRFLine: any = {
    type: 'line',
    xref: 'paper',
    yref: 'y',
    x0: 0,
    x1: 1,
    y0: ambData.minPRFLine,
    y1: ambData.minPRFLine,
    line: { color: '#3B82F6', width: 2, dash: 'dash' },
  }

  const currentPRFLine: any = {
    type: 'line',
    xref: 'paper',
    yref: 'y',
    x0: 0,
    x1: 1,
    y0: ambData.currentPRF,
    y1: ambData.currentPRF,
    line: { color: '#F59E0B', width: 2 },
  }

  return (
    <div className="flex h-full gap-2">
      <div className="flex-1 h-full">
        <Plot
          data={[grTrace, azTrace, currentMarker]}
          layout={{
            ...darkLayout,
            title: { text: 'Resolution vs Look Angle', font: { size: 11, color: '#9CA3AF' } },
            xaxis: { title: { text: 'Look Angle (°)', font: { size: 9 } }, gridcolor: gridColor, color: axisColor },
            yaxis: { title: { text: 'Resolution (m)', font: { size: 9 } }, gridcolor: gridColor, color: axisColor },
          }}
          config={{ displayModeBar: false, responsive: true }}
          style={{ width: '100%', height: '100%' }}
          useResizeHandler
        />
      </div>
      <div className="flex-1 h-full">
        <Plot
          data={[maxPRFTrace]}
          layout={{
            ...darkLayout,
            title: { text: 'PRF Ambiguity Diagram', font: { size: 11, color: '#9CA3AF' } },
            xaxis: { title: { text: 'Look Angle (°)', font: { size: 9 } }, gridcolor: gridColor, color: axisColor },
            yaxis: { title: { text: 'PRF (Hz)', font: { size: 9 } }, gridcolor: gridColor, color: axisColor },
            shapes: [minPRFLine, currentPRFLine] as any[],
            annotations: [
              { x: 1, xref: 'paper', y: ambData.minPRFLine, yref: 'y', text: 'Min PRF (Azimuth)', showarrow: false, font: { size: 8, color: '#3B82F6' }, xanchor: 'right' as const, yshift: 10 },
              { x: 1, xref: 'paper', y: ambData.currentPRF, yref: 'y', text: `Current: ${ambData.currentPRF} Hz`, showarrow: false, font: { size: 8, color: '#F59E0B' }, xanchor: 'right' as const, yshift: -10 },
            ] as any[],
          }}
          config={{ displayModeBar: false, responsive: true }}
          style={{ width: '100%', height: '100%' }}
          useResizeHandler
        />
      </div>
    </div>
  )
}

// ─── SATCOM Charts ───

function SATCOMCharts({ satcom, altKm }: { satcom: any; altKm: number }) {
  const waterfall = useMemo(() => computeLinkBudgetWaterfall(satcom, altKm), [satcom, altKm])
  const rateData = useMemo(() => computeDataRateVsElevation(satcom, altKm), [satcom, altKm])

  // Waterfall as horizontal bar chart
  const waterfallTrace: any = {
    y: waterfall.map((w) => w.label),
    x: waterfall.map((w) => w.value),
    type: 'bar',
    orientation: 'h',
    marker: {
      color: waterfall.map((w) => w.value >= 0 ? '#3B82F6' : '#EF4444'),
    },
    hovertemplate: '%{y}: %{x:.1f} dB<extra></extra>',
  }

  // Data rate vs elevation
  const rateTrace: any = {
    x: rateData.map((p) => p.elevation),
    y: rateData.map((p) => p.dataRate),
    type: 'scatter',
    mode: 'lines',
    name: 'Max Data Rate',
    line: { color: '#3B82F6', width: 2 },
    fill: 'tozeroy',
    fillcolor: 'rgba(59, 130, 246, 0.1)',
    hovertemplate: '%{x:.0f}° → %{y:.2f} Mbps<extra></extra>',
  }

  return (
    <div className="flex h-full gap-2">
      <div className="flex-1 h-full">
        <Plot
          data={[waterfallTrace]}
          layout={{
            ...darkLayout,
            title: { text: 'Link Budget Waterfall', font: { size: 11, color: '#9CA3AF' } },
            xaxis: { title: { text: 'Contribution (dB)', font: { size: 9 } }, gridcolor: gridColor, color: axisColor },
            yaxis: { autorange: 'reversed' as const, color: axisColor },
            showlegend: false,
          }}
          config={{ displayModeBar: false, responsive: true }}
          style={{ width: '100%', height: '100%' }}
          useResizeHandler
        />
      </div>
      <div className="flex-1 h-full">
        <Plot
          data={[rateTrace]}
          layout={{
            ...darkLayout,
            title: { text: 'Data Rate vs Elevation', font: { size: 11, color: '#9CA3AF' } },
            xaxis: { title: { text: 'Elevation (°)', font: { size: 9 } }, gridcolor: gridColor, color: axisColor },
            yaxis: { title: { text: 'Max Data Rate (Mbps)', font: { size: 9 } }, type: 'log', gridcolor: gridColor, color: axisColor },
          }}
          config={{ displayModeBar: false, responsive: true }}
          style={{ width: '100%', height: '100%' }}
          useResizeHandler
        />
      </div>
    </div>
  )
}
