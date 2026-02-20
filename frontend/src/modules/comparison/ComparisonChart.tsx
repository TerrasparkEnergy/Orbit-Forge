import { useMemo } from 'react'
import Plot from 'react-plotly.js'
import { useStore } from '@/stores'

export default function ComparisonChart() {
  const scenarios = useStore((s) => s.scenarios)

  const darkLayout = {
    paper_bgcolor: 'transparent',
    plot_bgcolor: 'transparent',
    font: { family: 'JetBrains Mono', size: 10, color: '#9CA3AF' },
    margin: { l: 50, r: 50, t: 30, b: 60 },
    legend: {
      font: { size: 9, color: '#9CA3AF' },
      bgcolor: 'transparent',
      orientation: 'h' as const,
      y: 1.12,
    },
  }

  const barColors = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444']

  // Grouped bar chart comparing key metrics across scenarios
  const metricDefs = useMemo(() => [
    { key: 'powerMarginBol', label: 'Power BOL %', transform: (v: number) => v * 100 },
    { key: 'powerMarginEol', label: 'Power EOL %', transform: (v: number) => v * 100 },
    { key: 'batteryDoD', label: 'Battery DoD %', transform: (v: number) => v * 100 },
    { key: 'eclipseFraction', label: 'Eclipse %', transform: (v: number) => v * 100 },
    { key: 'passesPerDay', label: 'Passes/Day', transform: (v: number) => v },
  ], [])

  const barTraces: any[] = scenarios.map((sc, i) => ({
    x: metricDefs.map((m) => m.label),
    y: metricDefs.map((m) => m.transform((sc.metrics as any)[m.key])),
    type: 'bar',
    name: sc.name,
    marker: { color: barColors[i % barColors.length] },
    text: metricDefs.map((m) => m.transform((sc.metrics as any)[m.key]).toFixed(1)),
    textposition: 'outside',
    textfont: { size: 8, color: '#9CA3AF' },
  }))

  // Lifetime comparison bar
  const lifetimeTraces: any[] = scenarios.map((sc, i) => ({
    x: [sc.name],
    y: [sc.metrics.lifetimeDays / 365.25],
    type: 'bar',
    name: sc.name,
    marker: { color: barColors[i % barColors.length] },
    text: [`${(sc.metrics.lifetimeDays / 365.25).toFixed(1)} yr`],
    textposition: 'outside',
    textfont: { size: 9, color: '#9CA3AF' },
    showlegend: false,
  }))

  if (scenarios.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-[11px] text-[var(--text-tertiary)] italic">
        Save scenarios to see comparison charts
      </div>
    )
  }

  return (
    <div className="flex h-full gap-2">
      <div className="flex-[2] h-full">
        <Plot
          data={barTraces}
          layout={{
            ...darkLayout,
            title: { text: 'Key Metrics Comparison', font: { size: 11, color: '#9CA3AF' } },
            barmode: 'group',
            xaxis: {
              gridcolor: 'rgba(255,255,255,0.05)',
              color: '#6B7280',
              tickangle: -15,
            },
            yaxis: {
              title: { text: 'Value', font: { size: 9 } },
              gridcolor: 'rgba(255,255,255,0.05)',
              color: '#6B7280',
            },
          }}
          config={{ displayModeBar: false, responsive: true }}
          style={{ width: '100%', height: '100%' }}
          useResizeHandler
        />
      </div>

      <div className="flex-1 h-full">
        <Plot
          data={lifetimeTraces}
          layout={{
            ...darkLayout,
            title: { text: 'Orbital Lifetime', font: { size: 11, color: '#9CA3AF' } },
            xaxis: {
              gridcolor: 'rgba(255,255,255,0.05)',
              color: '#6B7280',
            },
            yaxis: {
              title: { text: 'Lifetime (years)', font: { size: 9 } },
              gridcolor: 'rgba(255,255,255,0.05)',
              color: '#6B7280',
              rangemode: 'tozero',
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
