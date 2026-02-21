<img width="3394" height="1330" alt="image" src="https://github.com/user-attachments/assets/4c0d2e62-e2a0-44d4-a005-cf2b32903cea" />
<img width="3388" height="1292" alt="Screenshot 2026-02-19 031618" src="https://github.com/user-attachments/assets/bea71347-6b9f-46cb-8d41-fa67e7b03368" />
<img width="3369" height="1328" alt="Screenshot 2026-02-19 030230" src="https://github.com/user-attachments/assets/31040639-ed4d-4b92-aa78-00cb548b04dc" />
<img width="3366" height="1281" alt="Screenshot 2026-02-19 025746" src="https://github.com/user-attachments/assets/cb777ad7-5c7b-4d74-b0d2-cab6d27d08f7" />

# OrbitForge

Professional CubeSat mission design workbench running entirely in the browser.
The free alternative to STK for small satellite teams, university groups, and
aerospace enthusiasts.

**No backend, no signup, no license fees.** All orbital mechanics, thermal modeling,
radiation estimation, and payload analysis runs client-side in TypeScript.

## Features

OrbitForge provides 11 interconnected analysis modules:

| # | Module | Description |
|---|--------|-------------|
| 1 | **Mission Config** | Spacecraft bus (1U--12U CubeSat), solar arrays, antennas, ground stations |
| 2 | **Orbit Design** | Keplerian elements with 3D globe, J2 perturbations, ground tracks, orbit presets (ISS, Landsat, GPS, GEO, Molniya) |
| 3 | **Power Budget** | Solar power generation (BOL/EOL), subsystem power draw, thermal equilibrium analysis |
| 4 | **Ground Passes** | Contact window prediction for 15 ground stations, RF link budget, data throughput |
| 5 | **Orbital Lifetime** | Atmospheric drag decay modeling, ballistic coefficient, 25-year debris compliance |
| 6 | **Constellation** | Walker Delta/Star patterns, multi-satellite coverage analysis |
| 7 | **Delta-V Budget** | Tsiolkovsky propulsion sizing, deorbit, station-keeping, drag compensation |
| 8 | **Radiation** | Total ionizing dose (AP-8/AE-8), Van Allen belt modeling, shielding attenuation |
| 9 | **Payload** | Earth Observation (GSD, SNR), SAR (resolution, NESZ), SatCom (link budget, capacity) |
| 10 | **Beyond-LEO** | Lagrange points (SE/EM), lunar transfers (TLI/LOI), interplanetary missions (Lambert solver, porkchop plots) |
| 11 | **Compare** | Side-by-side mission scenario comparison with charts |

Additional capabilities:
- **PDF mission reports** -- One-click generation of comprehensive A4 reports
- **Project save/load** -- Named project slots in browser storage, JSON import/export
- **CSV data export** -- Export analysis data per module
- **Orbit presets** -- ISS, Landsat, Sentinel, Starlink, GPS, GEO, Molniya
- **Payload presets** -- PlanetScope, SkySat, ICEYE, Capella, Sentinel-1, Iridium, Starlink

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | React 18, TypeScript, Vite 6 |
| 3D Rendering | Three.js 0.170, @react-three/fiber, @react-three/drei |
| State Management | Zustand 5 (devtools + persist middleware) |
| Charts | Plotly.js |
| Styling | Tailwind CSS 3.4, JetBrains Mono + IBM Plex Sans |
| PDF | jsPDF + jspdf-autotable (code-split, loaded on demand) |
| Analytics | Vercel Analytics |

## Setup

### Prerequisites

- Node.js 18+
- npm

### Installation

```bash
# Clone the repository
git clone <repo-url>
cd Orbit-Forge

# Install dependencies
cd frontend
npm install
```

### Earth Textures

The 3D globe requires texture images that are excluded from git (see `.gitignore`).
Place the following files in `frontend/public/textures/`:

- Day map (e.g., `earth_day.jpg`)
- Night map (e.g., `earth_night.jpg`)

See `frontend/public/textures/README.md` for download instructions.

### Development

```bash
cd frontend
npm run dev
```

Opens at [http://localhost:5173](http://localhost:5173). The Vite dev server includes
HMR and proxies `/api` requests to `localhost:8000` (currently unused -- all computation
is client-side).

### Build

```bash
cd frontend
npm run build
```

Output goes to `frontend/dist/`. Serve with any static file server.

### Preview Production Build

```bash
cd frontend
npm run preview
```

## Architecture

See [docs/CODEMAPS/INDEX.md](docs/CODEMAPS/INDEX.md) for the complete architecture
overview with dependency maps and data flow diagrams.

### Key Directories

```
frontend/src/
  app.tsx              Root component with hash-based routing
  components/
    layout/            App shell: TopBar, panels, viewport
    ui/                Reusable UI primitives
    viewport/          Three.js 3D scene components
  data/                Static data (ground stations)
  lib/                 Physics engine (pure TypeScript, no external deps)
  modules/             Per-module UI (Panel, Display, Chart for each)
  pages/               Landing page
  stores/              Zustand state slices (11 slices)
  types/               TypeScript interfaces and enums
```

### Physics Engine

All orbital mechanics and analysis algorithms are implemented from scratch in
`frontend/src/lib/`. Key modules:

- **orbital-mechanics.ts** -- Kepler equation solver, J2 perturbations, vis-viva, ground track propagation
- **coordinate-transforms.ts** -- Keplerian to Cartesian to ECEF to geodetic
- **interplanetary.ts** -- Lambert solver (universal variable), Hohmann transfers, porkchop plots
- **lagrange.ts** -- CR3BP Lagrange points, halo/lissajous/lyapunov orbits
- **lunar-transfer.ts** -- TLI/LOI delta-V, Tsiolkovsky propellant mass
- **power-budget.ts** -- Solar power with pointing-mode-aware incidence factors
- **thermal-analysis.ts** -- Stefan-Boltzmann equilibrium with albedo and Earth IR
- **radiation.ts** -- Simplified AP-8/AE-8 trapped particle dose model
- **pass-prediction.ts** -- Analytical ground station contact prediction

See [docs/CODEMAPS/physics-engine.md](docs/CODEMAPS/physics-engine.md) for detailed
function-level documentation.

## Documentation

| Document | Description |
|----------|-------------|
| [docs/CODEMAPS/INDEX.md](docs/CODEMAPS/INDEX.md) | Architecture overview and dependency map |
| [docs/CODEMAPS/frontend.md](docs/CODEMAPS/frontend.md) | UI components, layout, 3D rendering |
| [docs/CODEMAPS/physics-engine.md](docs/CODEMAPS/physics-engine.md) | Orbital mechanics and analysis algorithms |
| [docs/CODEMAPS/state-management.md](docs/CODEMAPS/state-management.md) | Zustand store, slices, persistence |
| [docs/CODEMAPS/beyond-leo.md](docs/CODEMAPS/beyond-leo.md) | Lagrange, lunar, interplanetary missions |

## License

Copyright 2026 North Star AI Solutions. All rights reserved.
