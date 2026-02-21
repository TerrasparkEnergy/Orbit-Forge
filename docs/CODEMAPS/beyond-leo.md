# Beyond-LEO Mission Design Codemap

**Last Updated:** 2026-02-21
**Module ID:** `beyond-leo` (Module 10)
**Location:** `frontend/src/lib/lagrange.ts`, `lunar-transfer.ts`, `interplanetary.ts`, `beyond-leo-constants.ts`
**UI Components:** `frontend/src/modules/beyond-leo/`
**3D Scenes:** `frontend/src/components/viewport/LagrangeScene.tsx`, `LunarScene.tsx`, `SolarSystemScene.tsx`

## Overview

The Beyond-LEO module provides mission design analysis for three classes of deep-space
missions. Each sub-mode has its own physics engine, 3D scene, and UI panels.

```
BeyondLeoPanel
  +-- [mode selector: Lagrange | Lunar | Interplanetary]
  |
  +-- LagrangePanel     --> LagrangeDisplay     --> LagrangeChart
  +-- LunarPanel        --> LunarDisplay        --> LunarChart
  +-- InterplanetaryPanel --> InterplanetaryDisplay --> InterplanetaryChart

BeyondLeoScene (3D)
  +-- LagrangeScene      (SE/EM Lagrange points, halo/lissajous/lyapunov orbits)
  +-- LunarScene         (Earth-Moon system, transfer arcs, flyby, free-return)
  +-- SolarSystemScene   (Heliocentric view, planet orbits, transfer arcs)
```

## Sub-Mode 1: Lagrange Point Missions (`lagrange.ts`)

### Systems and Points

| System | Bodies | Distance | L-points available |
|--------|--------|----------|--------------------|
| SE (Sun-Earth) | Sun + Earth | 1 AU (149.6M km) | L1, L2, L3, L4, L5 |
| EM (Earth-Moon) | Earth + Moon | 384,400 km | L1, L2, L3, L4, L5 |

### Orbit Types

| Type | Description | Station-Keeping | Z-component |
|------|-------------|-----------------|-------------|
| Halo | Periodic closed loop | Highest (base) | cos(theta) |
| Lissajous | Quasi-periodic open curve | ~25% less | Different frequency ratio |
| Lyapunov | Planar ellipse | ~45% less | None (z=0) |

### Key Computations

| Function | Purpose | Key formula |
|----------|---------|-------------|
| `computeLagrangeDistance(sys, pt)` | L-point distance from secondary body | Lookup table |
| `computeOrbitPeriod(sys, pt, type)` | Orbit period at L-point | Base period * type factor |
| `computeLagrangeTransferDV(sys, pt, alt, type)` | Transfer delta-V from parking orbit | Patched-conic: V_depart = sqrt(V_inf^2 + 2*mu/r) |
| `computeStationKeeping(sys, pt, type, amp)` | Annual station-keeping budget (m/s/yr) | Base * type_factor * amplitude_factor |
| `computeLagrangeResult(params)` | Full analysis result | Combines all above + comms delay |

### Transfer Delta-V Models

**SE L1/L2:**
- Near-escape trajectory from Earth parking orbit
- V_inf approx 0.3-0.7 km/s
- Direct transfer: ~30 days, insertion ~15 m/s
- Low-energy transfer: ~120 days, insertion ~5 m/s

**SE L3:**
- Opposite side of Sun from Earth
- V_inf approx 2.0 km/s, transfer ~200 days

**SE L4/L5:**
- 60 deg ahead/behind Earth
- V_inf approx 1.5 km/s, transfer 180-365 days

**EM L1/L2:**
- Similar to lunar transfer energy
- Hohmann-like ellipse to L-point distance
- Direct: ~4.5 days; low-energy: ~90 days

### 3D Rendering (`LagrangeScene.tsx`)

Generates orbit and transfer arc points in normalized coordinates:
- SE system: 1 unit = 1 AU
- EM system: 1 unit = lunar distance (384,400 km)

Orbit shapes:
- Halo: ellipse in y-z plane, ampX = 0.1 * amplitude
- Lissajous: 2.5 loops with frequency ratio 1.12 between y and z
- Lyapunov: flat ellipse in x-y plane, z = 0

## Sub-Mode 2: Lunar Missions (`lunar-transfer.ts`)

### Mission Types

| Type | TLI | LOI | Additional |
|------|-----|-----|------------|
| Orbit | Hohmann to Moon distance | Hyperbolic arrival to circular | Lunar orbit period computed |
| Flyby | Same TLI | None (0 m/s) | No capture burn |
| Landing | Same TLI | LOI + 1,700 m/s (deorbit + descent) | Surface operations |
| Free-Return | Same TLI | None (0 m/s) | Figure-8 trajectory, return to Earth |

### Key Computations

| Function | Purpose |
|----------|---------|
| `computeTLIDeltaV(altKm)` | Trans-Lunar Injection from parking orbit via vis-viva |
| `computeLOIDeltaV(targetAltKm)` | Lunar Orbit Insertion, hyperbolic -> circular |
| `computeLunarTransferTime(type)` | Hohmann: 4.5d, low-energy: 100d, gravity-assist: 14d |
| `computeLunarPhaseAngle(days)` | Required Earth-Moon phase angle at departure |
| `computePropellantMass(dv, m_dry, isp)` | Tsiolkovsky rocket equation for propellant |
| `computeLunarResult(params)` | Full analysis with all delta-V, times, propellant |

### 3D Trajectory Generation

All functions use `LUNAR_SCENE_SCALE = 400,000 km/unit` for scene coordinates:

| Function | Output |
|----------|--------|
| `generateLunarTransferArc(alt, targetAlt)` | Half-ellipse from Earth to Moon |
| `generateFlybyPath(alt, closestApproach)` | Phased: approach + near-Moon arc + departure |
| `generateFreeReturnTrajectory(alt)` | Figure-8: outbound (above) + swing + return (below) |
| `generateDescentPath(targetAlt)` | 1.5-revolution spiral from orbit to surface |

All near-Moon arcs use an enlarged visual Moon radius (`VISUAL_MOON_R`) to prevent
trajectory clipping through the 3D sphere.

## Sub-Mode 3: Interplanetary Missions (`interplanetary.ts`)

### Target Bodies

| Body | SMA (AU) | Radius (km) | mu (km^3/s^2) | Period (days) |
|------|----------|-------------|----------------|---------------|
| Mercury | 0.387 | 2,440 | 22,032 | 87.97 |
| Venus | 0.723 | 6,052 | 324,859 | 224.7 |
| Mars | 1.524 | 3,390 | 42,828 | 686.97 |
| Jupiter | 5.203 | 69,911 | 126,687,000 | 4,332.6 |
| Saturn | 9.537 | 58,232 | 37,931,000 | 10,759.2 |
| Uranus | 19.19 | 25,362 | 5,794,000 | 30,688.5 |
| Neptune | 30.07 | 24,622 | 6,836,500 | 60,182 |
| Ceres | 2.767 | 473 | 63.2 | 1,681.6 |
| Vesta | 2.362 | 263 | 17.3 | 1,325.8 |

Planet data from `beyond-leo-constants.ts` includes mean longitude at J2000 epoch
for computing approximate positions at any date.

### Transfer Types

**Hohmann Transfer:**
- Minimum-energy coplanar transfer between circular orbits
- SMA_transfer = (r1 + r2) / 2
- Half-period transit time

**Lambert Solver:**
- Arbitrary departure/arrival dates
- Universal variable method with Stumpff functions
- Newton-Raphson iteration (max 100 steps)
- Tries both short-way and long-way solutions, picks lower C3
- Falls back to Hohmann if Lambert fails to converge

### Key Computations

| Function | Purpose |
|----------|---------|
| `computeHohmannInterplanetary(target)` | C3, V_inf departure/arrival, transfer time |
| `solveLambert(r1, r2, tof, mu, shortWay)` | Two-body boundary value problem |
| `computeDepartureDeltaV(altKm, vInf)` | Hyperbolic departure from parking orbit |
| `computeArrivalInsertionDeltaV(target, altKm, vInf)` | Capture into circular orbit |
| `computeEllipticalCaptureInsertionDeltaV(...)` | Capture into elliptical orbit (gas giants) |
| `computePorkchopGrid(target, start, ...)` | C3 grid for departure date x flight time |
| `computeInterplanetaryResult(params)` | Full analysis: C3, dV, transfer time, comms |

### Arrival Orbit Defaults

Gas giants (Jupiter, Saturn, Uranus, Neptune) default to elliptical capture orbits
with large apoapsis factors (15-20x body radius) since circular capture at these
bodies requires impractical delta-V. Rocky bodies default to circular orbits.

### Porkchop Plots

`computePorkchopGrid()` produces a 2D array of C3 values:
- X-axis: departure date offset (days from start)
- Y-axis: flight time (days)
- Value: C3 (km^2/s^2) from Lambert solver
- Filtered to C3 < 200 km^2/s^2

### 3D Solar System Rendering (`SolarSystemScene.tsx`)

Generates orbit and transfer geometry in AU coordinates:
- `generatePlanetOrbitPoints(target)` -- circle at target SMA
- `generateEarthOrbitPoints()` -- circle at 1 AU
- `generateInterplanetaryTransferArc(target)` -- Hohmann half-ellipse
- Planet positions computed from mean longitude at current date

## State Shape

```typescript
interface BeyondLeoState {
  mode: 'lagrange' | 'lunar' | 'interplanetary'
  lagrangeParams: {
    system: 'SE' | 'EM'
    point: 'L1' | 'L2' | 'L3' | 'L4' | 'L5'
    orbitType: 'halo' | 'lissajous' | 'lyapunov'
    amplitudeKm: number
    departureAltKm: number
    transferType: 'direct' | 'low-energy'
    missionLifetimeYears: number
    stationKeepingBudgetMs: number
  }
  lunarParams: {
    missionType: 'orbit' | 'flyby' | 'landing' | 'free-return'
    targetOrbitAltKm: number
    targetOrbitIncDeg: number
    transferType: 'hohmann' | 'low-energy' | 'gravity-assist'
    departureAltKm: number
    spacecraftMassKg: number
    ispS: number
    propellantMassKg: number
  }
  interplanetaryParams: {
    targetBody: TargetBody  // 9 options
    missionType: 'flyby' | 'orbiter' | 'lander'
    transferType: 'hohmann' | 'lambert'
    departureAltKm: number
    arrivalOrbitAltKm: number
    arrivalOrbitType: 'circular' | 'elliptical'
    captureApoFactor: number
    departureDateISO: string
    arrivalDateISO: string
    spacecraftMassKg: number
  }
}
```

## Related Areas

- [Physics Engine](physics-engine.md) -- Core orbital mechanics used by beyond-LEO calculations
- [Frontend](frontend.md) -- 3D scenes and UI panel layout
- [State Management](state-management.md) -- BeyondLeoSlice persistence
