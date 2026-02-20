import { useMemo } from 'react'
import { useStore } from '@/stores'
import Plot from 'react-plotly.js'
import { generateWalkerConstellation } from '@/lib/constellation'
import { keplerianToCartesian, ecefToGeodetic, eciToEcef } from '@/lib/coordinate-transforms'
import { MU_EARTH_KM, R_EARTH_EQUATORIAL } from '@/lib/constants'
import { dateToGMST } from '@/lib/time-utils'

export default function ConstellationChart() {
  const storeParams = useStore((s) => s.walkerParams)
  const elements = useStore((s) => s.elements)

  const params = useMemo(() => {
    if (storeParams.syncWithOrbit) {
      return { ...storeParams, altitude: Math.round(elements.semiMajorAxis - R_EARTH_EQUATORIAL), inclination: elements.inclination }
    }
    return storeParams
  }, [storeParams, elements.semiMajorAxis, elements.inclination])

  const sats = useMemo(() => generateWalkerConstellation(params), [params])

  // Get subsatellite points (nadir)
  const satPoints = useMemo(() => {
    const gmst = dateToGMST(new Date())
    return sats.map((sat) => {
      const { position } = keplerianToCartesian(sat.elements, MU_EARTH_KM)
      const ecef = eciToEcef(position, gmst)
      return ecefToGeodetic(ecef)
    })
  }, [sats])

  // Ground track for each plane
  const planeTraces: any[] = useMemo(() => {
    const gmst = dateToGMST(new Date())
    const planes = params.planes
    const raanSpacing = params.type === 'delta' ? 360 / planes : 180 / planes

    return Array.from({ length: planes }, (_, p) => {
      const lats: number[] = []
      const lons: number[] = []

      for (let i = 0; i <= 90; i++) {
        const nu = (i / 90) * 360
        const elements = {
          semiMajorAxis: R_EARTH_EQUATORIAL + params.altitude,
          eccentricity: 0,
          inclination: params.inclination,
          raan: (params.raan0 + p * raanSpacing) % 360,
          argOfPerigee: 0,
          trueAnomaly: nu,
        }
        const { position } = keplerianToCartesian(elements, MU_EARTH_KM)
        const ecef = eciToEcef(position, gmst)
        const geo = ecefToGeodetic(ecef)
        lats.push(geo.lat)
        lons.push(geo.lon)
      }

      return {
        type: 'scattergeo',
        lat: lats,
        lon: lons,
        mode: 'lines',
        name: `Plane ${p + 1}`,
        line: {
          color: `hsl(${(p * 360) / planes}, 70%, 60%)`,
          width: 1,
        },
        hoverinfo: 'skip',
      }
    })
  }, [params])

  // Satellite position markers
  const satTrace: any = {
    type: 'scattergeo',
    lat: satPoints.map((p) => p.lat),
    lon: satPoints.map((p) => p.lon),
    mode: 'markers',
    name: 'Satellites',
    marker: {
      size: 6,
      color: sats.map((s) => `hsl(${(s.plane * 360) / params.planes}, 70%, 60%)`),
      line: { color: '#0A0E17', width: 1 },
    },
    text: sats.map((s) => `Sat ${s.id + 1} (Plane ${s.plane + 1})`),
    hoverinfo: 'text',
  }

  return (
    <div className="h-full">
      <Plot
        data={[...planeTraces, satTrace]}
        layout={{
          paper_bgcolor: 'transparent',
          plot_bgcolor: 'transparent',
          font: { family: 'JetBrains Mono', size: 10, color: '#9CA3AF' },
          margin: { l: 0, r: 0, t: 30, b: 0 },
          title: {
            text: `Walker ${params.type === 'delta' ? 'Delta' : 'Star'} ${params.totalSats}/${params.planes}/${params.phasing} — Subsatellite Points`,
            font: { size: 11, color: '#9CA3AF' },
          },
          geo: {
            bgcolor: 'transparent',
            showland: true,
            landcolor: '#1F2937',
            showocean: true,
            oceancolor: '#111827',
            showcoastlines: true,
            coastlinecolor: '#374151',
            showlakes: false,
            showcountries: true,
            countrycolor: '#374151',
            showframe: false,
            projection: { type: 'natural earth' },
            lataxis: { gridcolor: 'rgba(255,255,255,0.05)' },
            lonaxis: { gridcolor: 'rgba(255,255,255,0.05)' },
          },
          legend: {
            font: { size: 8, color: '#6B7280' },
            bgcolor: 'transparent',
            orientation: 'h',
            y: -0.05,
          },
          showlegend: false,
        }}
        config={{ displayModeBar: false, responsive: true }}
        style={{ width: '100%', height: '100%' }}
        useResizeHandler
      />
    </div>
  )
}
