# Frontend Architecture Codemap

**Last Updated:** 2026-02-21
**Framework:** React 18.3 + Vite 6 (SPA, no SSR)
**3D Engine:** Three.js 0.170 via @react-three/fiber 8.17
**Styling:** Tailwind CSS 3.4 with custom `space-*` / `accent-*` color tokens
**Entry Point:** `frontend/src/App.tsx`

## Directory Structure

```
frontend/src/
+-- App.tsx                     # Root: hash router (landing vs app), module switching
+-- main.tsx                    # React DOM entry point
+-- vite-env.d.ts               # Vite type declarations
|
+-- assets/
|   +-- hero-screenshot.png     # Landing page hero image
|
+-- components/
|   +-- layout/                 # App shell panels
|   |   +-- TopBar.tsx          # Module tab navigation, Save/Load, PDF report, UTC clock
|   |   +-- LeftPanel.tsx       # Scrollable input panel (left sidebar)
|   |   +-- CenterViewport.tsx  # Three.js Canvas with scene selector
|   |   +-- RightPanel.tsx      # Computed output display (right sidebar)
|   |   +-- BottomPanel.tsx     # Resizable chart panel
|   |
|   +-- ui/                     # Reusable UI primitives
|   |   +-- DataReadout.tsx     # Labeled value display with units
|   |   +-- ExportCSVButton.tsx # CSV data export
|   |   +-- GlassPanel.tsx      # Frosted-glass card container
|   |   +-- MetricCard.tsx      # Key metric highlight card
|   |   +-- MobileOverlay.tsx   # "Desktop only" overlay for mobile visitors
|   |   +-- Modal.tsx           # Generic modal dialog
|   |   +-- SaveLoadDialog.tsx  # Named project save/load/import/export
|   |   +-- SectionHeader.tsx   # Collapsible section heading
|   |   +-- SliderInput.tsx     # Numeric slider with text input
|   |   +-- StatusIndicator.tsx # Green/amber/red status dot
|   |   +-- UTCClock.tsx        # Live UTC time display
|   |
|   +-- viewport/               # Three.js 3D scene components
|       +-- EarthScene.tsx      # LEO scene: Earth globe + orbit + satellite + ground stations
|       +-- BeyondLeoScene.tsx  # Scene selector: Lagrange / Lunar / Solar System
|       +-- LagrangeScene.tsx   # Sun-Earth or Earth-Moon Lagrange point visualization
|       +-- LunarScene.tsx      # Earth-Moon transfer trajectories
|       +-- SolarSystemScene.tsx # Interplanetary transfer arcs and planet orbits
|       +-- Earth.tsx           # Textured Earth sphere with day/night
|       +-- Atmosphere.tsx      # Glow atmosphere shader
|       +-- OrbitLine.tsx       # 3D orbit ring from position array
|       +-- SatelliteMarker.tsx # Animated satellite position marker
|       +-- ApsisMarkers.tsx    # Perigee/apogee labels on orbit
|       +-- GroundStationMarker.tsx # 3D ground station pin on globe
|       +-- GroundTrack.tsx     # Projected ground track polyline
|       +-- CoordinateGrid.tsx  # Latitude/longitude grid overlay
|       +-- Starfield.tsx       # Background star particles
|       +-- SunLight.tsx        # Directional light simulating Sun
|
+-- data/
|   +-- ground-stations.ts     # 15 pre-configured ground stations (Svalbard, DSN, ESOC, etc.)
|
+-- lib/                        # Physics and computation library (see physics-engine.md)
+-- modules/                    # Module-specific UI panels
+-- pages/
|   +-- LandingPage.tsx         # Marketing landing page with module list
+-- stores/                     # Zustand state slices (see state-management.md)
+-- styles/
|   +-- globals.css             # CSS variables, scrollbar styles, Tailwind directives
+-- types/                      # TypeScript interfaces and enums
```

## Module UI Pattern

Every analysis module follows a consistent three-panel pattern:

```
+-----------------+------------------+-----------------+
|   Left Panel    |  Center Viewport |  Right Panel    |
|   (inputs)      |  (3D scene)      |  (outputs)      |
+-----------------+------------------+-----------------+
|            Bottom Panel (charts/plots)               |
+-----------------------------------------------------+
```

Each module contributes three component files:
- `*Panel.tsx` -- Left panel inputs (sliders, dropdowns, config)
- `*Display.tsx` -- Right panel computed results
- `*Chart.tsx` -- Bottom panel visualizations (Plotly charts)

### Module Component Map

| Module | Left Panel | Right Panel | Bottom Panel |
|--------|-----------|-------------|--------------|
| Mission Config | `MissionConfigPanel` + `GroundStationEditor` | `OrbitalParamsDisplay` | `GroundTrackPlot` |
| Orbit Design | `OrbitInputPanel` | `OrbitalParamsDisplay` | `GroundTrackPlot` |
| Power Budget | `PowerBudgetPanel` | `PowerAnalysisDisplay` | `PowerBottomPanel` (PowerChart + ThermalChart + ThermalSection) |
| Ground Passes | `PassPredictionPanel` | `PassDetailsDisplay` | `PassBottomPanel` (PassTimelineChart + LinkBudgetChart + LinkBudgetSection) |
| Orbital Lifetime | `LifetimeConfigPanel` | `LifetimeDisplay` | `DecayCurveChart` |
| Constellation | `ConstellationPanel` | `ConstellationDisplay` | `ConstellationChart` |
| Delta-V | `DeltaVPanel` | `DeltaVDisplay` | `DeltaVChart` |
| Radiation | `RadiationPanel` | `RadiationDisplay` | `RadiationChart` |
| Payload | `PayloadPanel` | `PayloadDisplay` | `PayloadChart` |
| Beyond-LEO | `BeyondLeoPanel` (Lagrange/Lunar/Interplanetary sub-panels) | `BeyondLeoDisplay` | `BeyondLeoChart` |
| Comparison | `ComparisonPanel` | `ComparisonDisplay` | `ComparisonChart` |

## 3D Viewport Architecture

The center viewport switches scenes based on the active module:

```
CenterViewport
  +-- Canvas (R3F)
      +-- SceneSelector
          +-- EarthScene        (modules 1-9, 11)
          |   +-- Earth (textured sphere)
          |   +-- Atmosphere (glow shader)
          |   +-- OrbitLine (Keplerian orbit)
          |   +-- SatelliteMarker (animated)
          |   +-- ApsisMarkers (perigee/apogee)
          |   +-- GroundStationMarker (per station)
          |   +-- GroundTrack
          |   +-- CoordinateGrid
          |   +-- Starfield
          |   +-- SunLight
          |
          +-- BeyondLeoScene    (module 10)
              +-- LagrangeScene     (Lagrange sub-mode)
              +-- LunarScene        (Lunar sub-mode)
              +-- SolarSystemScene  (Interplanetary sub-mode)
```

## Tailwind Theme

Custom color palette defined in `tailwind.config.ts`:

| Token | Hex | Usage |
|-------|-----|-------|
| `space-900` | `#0A0E17` | App background |
| `space-800` | `#111827` | Panel backgrounds |
| `space-700` | `#1F2937` | Card backgrounds |
| `space-600` | `#374151` | Borders |
| `accent-blue` | `#3B82F6` | Primary accent |
| `accent-green` | `#10B981` | Nominal status |
| `accent-amber` | `#F59E0B` | Warning status |
| `accent-red` | `#EF4444` | Critical status |
| `accent-purple` | `#8B5CF6` | Secondary accent |
| `accent-cyan` | `#06B6D4` | Tertiary accent |

Fonts: `JetBrains Mono` (monospace), `IBM Plex Sans` (sans-serif).

## Key UI Features

- **Hash-based routing**: `#app` shows the workbench; bare URL shows the landing page.
- **Mobile overlay**: Detects small screens and shows a "desktop only" notice.
- **Save/Load dialog**: Named project slots in `localStorage`, plus JSON import/export.
- **PDF report generation**: `TopBar` triggers `generateMissionReport()` which dynamically imports `jsPDF` (~300KB code-split).
- **CSV export**: Per-module data export via `ExportCSVButton`.
- **Resizable bottom panel**: Drag handle to resize chart area, min 120px / max 800px.
- **UTC clock**: Live clock in the top bar for mission operations feel.

## Related Areas

- [Physics Engine](physics-engine.md) -- All `lib/` computation modules
- [State Management](state-management.md) -- Zustand store slices
- [Beyond-LEO](beyond-leo.md) -- Lagrange, lunar, interplanetary analysis
