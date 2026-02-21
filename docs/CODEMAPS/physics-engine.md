# Physics Engine Codemap

**Last Updated:** 2026-02-21
**Location:** `frontend/src/lib/`
**Language:** TypeScript (pure functions, no side effects)
**Dependencies:** No external physics libraries -- all algorithms implemented from scratch

## Overview

The physics engine is a collection of pure TypeScript modules implementing astrodynamics,
thermal modeling, radiation estimation, payload analysis, and communication link budgets.
All computations run synchronously in the browser. Functions are stateless and take
typed parameters, returning typed result objects.

## Module Map

```
lib/
+-- constants.ts              Physical constants (mu, Re, J2, solar flux, atmosphere table)
+-- orbital-mechanics.ts      Core two-body + J2 perturbations
+-- coordinate-transforms.ts  Keplerian <-> Cartesian <-> ECEF <-> geodetic
+-- time-utils.ts             Julian dates, GMST, epoch conversions
+-- solar-position.ts         Sun position for eclipse/thermal calculations
+-- units.ts                  Unit conversion helpers
|
+-- power-budget.ts           Solar power generation, subsystem power draw
+-- thermal-analysis.ts       Equilibrium temperature (Stefan-Boltzmann + albedo + IR)
+-- link-budget.ts            RF link budget (EIRP, FSPL, Eb/N0, margin)
+-- pass-prediction.ts        Ground station contact window prediction
+-- orbital-lifetime.ts       Atmospheric drag decay (King-Hele theory)
+-- constellation.ts          Walker Delta/Star constellation generation
+-- delta-v.ts                Tsiolkovsky, Hohmann deorbit, drag compensation
+-- radiation.ts              Trapped particle dose (AP-8/AE-8 simplified)
|
+-- payload-eo.ts             Earth observation: GSD, swath, SNR, imaging capacity
+-- payload-sar.ts            SAR: resolution, NESZ, swath width, ambiguity
+-- payload-satcom.ts         SatCom: link budget, capacity, coverage
|
+-- lagrange.ts               CR3BP Lagrange points, halo/lissajous/lyapunov orbits
+-- lunar-transfer.ts         TLI/LOI delta-V, Tsiolkovsky propellant mass
+-- interplanetary.ts         Hohmann transfers, Lambert solver, porkchop plots
+-- beyond-leo-constants.ts   Planet data, mu values, orbital elements at J2000
|
+-- csv-export.ts             CSV file generation from data arrays
+-- persistence.ts            Named project save/load to localStorage
+-- pdf-report.ts             Mission report PDF generation (jsPDF)
```

## Core Orbital Mechanics (`orbital-mechanics.ts`)

### Functions

| Function | Input | Output | Algorithm |
|----------|-------|--------|-----------|
| `computeOrbitalPeriod(a)` | Semi-major axis (km) | Period (s) | T = 2*pi*sqrt(a^3/mu) |
| `computeVelocityAtRadius(a, r)` | SMA + radius (km) | Velocity (km/s) | Vis-viva equation |
| `computeVelocityPerigee(a, e)` | SMA + eccentricity | Velocity (km/s) | Vis-viva at perigee |
| `computeVelocityApogee(a, e)` | SMA + eccentricity | Velocity (km/s) | Vis-viva at apogee |
| `solveKeplerEquation(M, e)` | Mean anomaly + ecc | Eccentric anomaly (rad) | Newton-Raphson (30 iter) |
| `eccentricToTrueAnomaly(E, e)` | Eccentric anomaly | True anomaly (rad) | atan2 formula |
| `computeJ2RAANDrift(a, e, i)` | Orbital elements | RAAN drift (deg/day) | J2 secular perturbation |
| `computeJ2ArgPerigeeDrift(a, e, i)` | Orbital elements | omega drift (deg/day) | J2 secular perturbation |
| `computeSunSyncInclination(a, e)` | SMA + ecc | Inclination (deg) | From J2 RAAN = 0.9856 deg/day |
| `computeEclipseFraction(alt)` | Altitude (km) | Fraction 0-1 | asin(Re/r)/pi |
| `propagateOrbitPositions(elem)` | Keplerian elements | Vec3[] for 3D rendering | Keplerian -> ECEF-ThreeJS |
| `computeGroundTrack(elem, epoch)` | Elements + epoch | {lat, lon}[] | Full propagation with J2 drift |
| `computeDerivedParams(elem)` | Keplerian elements | Full derived parameter set | Combines all above |

### Coordinate Transform Chain

```
Keplerian Elements (a, e, i, RAAN, omega, nu)
        |
        v  keplerianToCartesian()
ECI Position/Velocity (x, y, z, vx, vy, vz)
        |
        v  eciToEcef(gmst)        eciToEcefThreeJS(gmst)
ECEF (x, y, z)              Three.js coords (x, y, z)
        |                          [for 3D rendering]
        v  ecefToGeodetic()
Geodetic (lat, lon, alt)
```

## Constants (`constants.ts`)

| Constant | Value | Description |
|----------|-------|-------------|
| `MU_EARTH_KM` | 3.986e5 km^3/s^2 | Earth gravitational parameter |
| `R_EARTH` | 6371.0 km | Mean equatorial radius |
| `R_EARTH_EQUATORIAL` | 6378.137 km | WGS84 equatorial radius |
| `J2` | 1.083e-3 | Zonal harmonic coefficient |
| `OMEGA_EARTH` | 7.292e-5 rad/s | Earth rotation rate |
| `SOLAR_FLUX` | 1361.0 W/m^2 | Solar flux at 1 AU |
| `C_LIGHT` | 2.998e8 m/s | Speed of light |
| `K_BOLTZMANN` | 1.381e-23 J/K | Boltzmann constant |

Also includes a 28-row atmospheric density lookup table from 0 to 1000 km altitude
with reference density (rho0) and scale height (H) for exponential interpolation.

## Power Budget (`power-budget.ts`)

```
Solar Power Generation:
  P_peak = solar_flux * panel_area * cell_efficiency * incidence_factor

  Incidence factors (pointing mode x panel config matrix):
    body-mounted:      tumbling=0.25, nadir=0.30, sun-pointing=0.50
    1-axis-deployable: tumbling=0.40, nadir=0.55, sun-pointing=0.70
    2-axis-deployable: tumbling=0.50, nadir=0.70, sun-pointing=0.90

Power Draw:
  avg_power = sum(subsystem_power * duty_cycle)
  Default subsystems: OBC, Radio TX, Camera, ADCS, Heater

Power Analysis:
  orbit_average_power = P_peak * (1 - eclipse_fraction)
  EOL_power = BOL_power * (1 - degradation_rate)^years
  battery_depth_of_discharge = eclipse_draw / battery_capacity
```

## Thermal Analysis (`thermal-analysis.ts`)

Equilibrium temperature model using Stefan-Boltzmann law:

```
Heat inputs:
  Q_solar   = alpha * A_sun * S      (direct solar)
  Q_albedo  = alpha * A_earth * S * albedo * F_earth
  Q_IR      = epsilon * A_earth * 240 * F_earth  (Earth IR)
  Q_internal = P_dissipated           (internal heat)

Heat output:
  Q_radiated = epsilon * sigma * A_rad * T^4

Solve: T_eq = ((Q_in) / (epsilon * sigma * A_rad))^0.25
```

Surface material presets: Black Anodized, Solar Cells, White Paint, Bare Aluminum,
Gold Foil, MLI Blanket -- each with absorptivity (alpha) and emissivity (epsilon).

## Orbital Lifetime (`orbital-lifetime.ts`)

```
King-Hele decay theory:
  da/dt = -pi * a * rho(alt) * B* * v

Where:
  B* = Cd * A / m  (ballistic coefficient)
  rho(alt) = rho0 * exp(-(alt - alt_ref) / H) * solar_activity_factor
  v = sqrt(mu / a)  (orbital velocity)

Integration: Forward Euler with daily timestep until altitude < 120 km
25-year debris compliance check: lifetime <= 25 years post-mission
```

## Delta-V Budget (`delta-v.ts`)

| Function | Formula | Notes |
|----------|---------|-------|
| `tsiolkovskyDeltaV` | dV = Isp * g0 * ln(m0/mf) | Available delta-V from propulsion |
| `propellantForDeltaV` | mp = m_dry * (exp(dV/(Isp*g0)) - 1) | Propellant needed for maneuver |
| `computeDeorbitDeltaV` | Hohmann from current alt to 200km | Single-burn perigee lowering |
| `computeDragDeltaV` | Integrated drag deceleration | Annual station-keeping delta-V |

Propulsion presets: None, Cold Gas (70s), Resistojet (150s), Ion (3000s), Hall (1500s).

Default maneuver list: Orbit Insertion (5 m/s), Station Keeping (2 m/s/yr),
Collision Avoidance (1 m/s/yr), Deorbit (auto-computed), 10% margin.

## Link Budget (`link-budget.ts`)

```
EIRP = P_tx + G_tx  (dBW)
FSPL = 20*log10(4*pi*d/lambda)  (dB)
Received power = EIRP + G_rx - FSPL - losses
Noise floor = 10*log10(k*T*B)  (dBW)
Margin = Received Eb/N0 - Required Eb/N0

Frequency bands: UHF (437 MHz), S-band (2.2 GHz), X-band (8.2 GHz), Ka-band (26.5 GHz)
```

## Radiation (`radiation.ts`)

Simplified AP-8/AE-8 trapped particle model:
- 20-row altitude-to-dose lookup table (200 km to 36,000 km)
- Log-linear interpolation between altitude bins
- Inclination factor: higher inclination = more radiation exposure
- Shielding attenuation: exponential with aluminum thickness
- Component tolerance thresholds: COTS (5 krad), Rad-tolerant (30 krad), Rad-hard (100 krad)

## Payload Analysis

### Earth Observation (`payload-eo.ts`)
- Ground Sample Distance: GSD = (pixel_size * altitude) / focal_length
- Swath width from detector array size and focal length
- SNR estimation from solar illumination and optical parameters
- Daily imaging capacity and storage fill rate

### SAR (`payload-sar.ts`)
- Range and azimuth resolution from bandwidth and antenna length
- NESZ (Noise-Equivalent Sigma-Zero) from radar equation
- Swath width from look angle and altitude geometry
- Ambiguity analysis (range and azimuth)

### SatCom (`payload-satcom.ts`)
- Full uplink/downlink link budgets
- Capacity from bandwidth and modulation efficiency
- Coverage from orbit altitude and beam width

## Pass Prediction (`pass-prediction.ts`)

Full analytical pass prediction algorithm:
1. Propagate satellite position at 30-second timesteps over simulation window
2. For each ground station, compute elevation angle at each timestep
3. Detect AOS (rise above min elevation) and LOS (drop below)
4. Find TCA (maximum elevation during pass)
5. Compute pass quality grade: A (>45 deg), B (>20 deg), C (>10 deg), D (<10 deg)
6. Compute azimuth at AOS and LOS

## Constellation (`constellation.ts`)

Walker constellation generation:
- Types: Delta (0-360 deg RAAN spread) and Star (0-180 deg)
- Parameters: T (total sats), P (planes), F (phasing factor)
- Generates `OrbitalElements` for each satellite
- Coverage metrics: overlap factor, average revisit time

## Data Flow Summary

```
User Input (module panels)
       |
       v
  Zustand Store (state slices)
       |
       v
  Physics Lib (pure functions)
       |
       +---> Derived Parameters (right panel display)
       +---> Chart Data (bottom panel Plotly charts)
       +---> 3D Positions (viewport scene components)
       +---> PDF Report Data (on-demand generation)
```

## Related Areas

- [Frontend](frontend.md) -- UI components that consume these computations
- [State Management](state-management.md) -- Store slices that trigger recomputation
- [Beyond-LEO](beyond-leo.md) -- Lagrange, lunar, and interplanetary modules
