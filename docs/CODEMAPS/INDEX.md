# Orbit-Forge Architecture Index

**Last Updated:** 2026-02-21
**Project:** OrbitForge -- Satellite Mission Design Workbench
**Stack:** React 18, Three.js (R3F), TypeScript, Vite 6, Zustand 5, Tailwind CSS 3
**Entry Point:** `frontend/src/main.tsx` -> `frontend/src/App.tsx`
**Source Files:** 126 TypeScript files, ~16,700 lines of code

## Overview

OrbitForge is a browser-based satellite mission design tool. It provides 11 analysis
modules covering the full lifecycle from orbit selection through beyond-LEO mission
planning. The application runs entirely client-side with no backend -- all
computations happen in the browser. State persists to `localStorage`.

```
                              +------------------+
                              |    Landing Page   |
                              |  (#/ hash route)  |
                              +--------+---------+
                                       |
                                       v
              +------------------------------------------------+
              |                  App Shell                      |
              |  +----------+ +----------+ +----------------+  |
              |  |  TopBar  | | Module   | | Save/Load      |  |
              |  | (tabs,   | | Tabs     | | Dialog         |  |
              |  |  clock)  | | (1-11)   | | (localStorage) |  |
              |  +----------+ +----------+ +----------------+  |
              |                                                |
              |  +--------+ +-------------+ +---------+        |
              |  | Left   | | Center      | | Right   |        |
              |  | Panel  | | Viewport    | | Panel   |        |
              |  | (input)| | (3D Canvas) | | (output)|        |
              |  +--------+ +-------------+ +---------+        |
              |                                                |
              |  +-----------------------------------------+   |
              |  | Bottom Panel (charts, plots, timelines) |   |
              |  +-----------------------------------------+   |
              +------------------------------------------------+
```

## Analysis Modules (11)

| # | Module ID | Label | Purpose |
|---|-----------|-------|---------|
| 1 | `mission-config` | Mission | Spacecraft bus, CubeSat size, solar arrays, antenna, ground stations |
| 2 | `orbit-design` | Orbit | Keplerian elements, orbit presets (ISS/Landsat/GPS/GEO/Molniya), 3D globe, ground track |
| 3 | `power-budget` | Power | Solar panel generation, subsystem power draw, BOL/EOL degradation, thermal analysis |
| 4 | `ground-passes` | Passes | Contact window prediction, link budget, data throughput, pass timeline |
| 5 | `orbital-lifetime` | Lifetime | Atmospheric drag decay, ballistic coefficient, 25-year debris compliance |
| 6 | `constellation` | Constellation | Walker Delta/Star patterns, coverage analysis, multi-satellite visualization |
| 7 | `delta-v` | Delta-V Budget | Tsiolkovsky equation, propulsion sizing, deorbit, station-keeping, drag compensation |
| 8 | `radiation` | Radiation | Trapped particle dose (AP-8/AE-8 model), shielding attenuation, component tolerance |
| 9 | `payload` | Payload | Earth Observation (GSD/SNR), SAR (resolution/NESZ), SatCom (link budget/capacity) |
| 10 | `beyond-leo` | Beyond-LEO | Lagrange points, lunar transfers, interplanetary missions (Lambert solver, porkchop plots) |
| 11 | `comparison` | Compare | Side-by-side mission scenario comparison with charts |

## Codemap Files

| File | Scope |
|------|-------|
| [frontend.md](frontend.md) | UI components, layout, 3D rendering, module panels |
| [physics-engine.md](physics-engine.md) | Orbital mechanics, coordinate transforms, physics computations |
| [state-management.md](state-management.md) | Zustand store, slices, persistence, project save/load |
| [beyond-leo.md](beyond-leo.md) | Lagrange, lunar, interplanetary mission analysis |

## External Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| `react` | ^18.3.1 | UI framework |
| `three` | ^0.170.0 | 3D rendering engine |
| `@react-three/fiber` | ^8.17.0 | React Three.js bindings |
| `@react-three/drei` | ^9.117.0 | Three.js helpers (OrbitControls, etc.) |
| `@react-three/postprocessing` | ^2.16.0 | Post-processing effects |
| `zustand` | ^5.0.0 | State management |
| `framer-motion` | ^11.15.0 | Animations |
| `plotly.js-dist-min` | ^2.35.0 | 2D charts and plots |
| `react-plotly.js` | ^2.6.0 | React Plotly bindings |
| `satellite.js` | ^5.0.0 | SGP4/SDP4 propagator |
| `jspdf` | ^4.2.0 | PDF report generation |
| `jspdf-autotable` | ^5.0.7 | PDF table formatting |
| `tailwindcss` | ^3.4.0 | Utility-first CSS |
| `@vercel/analytics` | ^1.6.1 | Usage analytics |

## Design Decisions

- **No backend**: All physics runs client-side in TypeScript for instant feedback.
- **Zustand over Redux**: Simpler API, built-in persistence middleware, slice pattern for modularity.
- **Three.js via R3F**: Declarative 3D scenes with React component model.
- **Hash routing**: `#app` vs landing page -- avoids need for a router library.
- **localStorage persistence**: Auto-save via Zustand `persist`, named project save/load via `persistence.ts`.
- **Code-split jsPDF**: PDF report generation is dynamically imported to keep initial bundle small.
- **Tailwind + CSS variables**: Custom `space-*` and `accent-*` color palette for dark aerospace UI theme.
