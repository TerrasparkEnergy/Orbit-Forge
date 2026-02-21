# State Management Codemap

**Last Updated:** 2026-02-21
**Library:** Zustand 5.0 with `devtools` and `persist` middleware
**Location:** `frontend/src/stores/`
**Store Name:** `OrbitForge` (devtools label), `orbitforge-autosave` (localStorage key)

## Overview

The entire application state lives in a single Zustand store composed of 11 slices.
The store uses `persist` middleware for automatic save/restore to `localStorage`,
plus a separate `persistence.ts` module for named project save/load with JSON
import/export.

## Store Architecture

```
useStore = create<AppStore>(
  devtools(
    persist(
      ...slices,
      { name: 'orbitforge-autosave', version: 12 }
    ),
    { name: 'OrbitForge' }
  )
)
```

### Slice Composition

```
AppStore = UISlice
         & MissionSlice
         & OrbitSlice
         & GroundSlice
         & PowerSlice
         & ConstellationSlice
         & DeltaVSlice
         & RadiationSlice
         & ComparisonSlice
         & PayloadSlice
         & BeyondLeoSlice
```

## Slice Details

### UISlice (`ui-slice.ts`)

Controls application chrome and active module selection.

| Field | Type | Default | Persisted |
|-------|------|---------|-----------|
| `activeModule` | `ModuleId` | `OrbitDesign` | Yes |
| `bottomPanelExpanded` | `boolean` | `true` | Yes |
| `bottomPanelHeight` | `number` | `280` | No |
| `satSubPoint` | `{lat, lon} \| null` | `null` | No |

Actions: `setActiveModule`, `toggleBottomPanel`, `setBottomPanelExpanded`,
`setBottomPanelHeight`, `setSatSubPoint`.

### MissionSlice (`mission-slice.ts`)

Spacecraft bus configuration and mission parameters.

| Field | Type | Persisted |
|-------|------|-----------|
| `mission` | `MissionConfig` | Yes (epoch serialized as ISO string) |

Key nested fields in `MissionConfig`:
- `name` (string), `epoch` (Date), `missionType`, `lifetimeTarget` (years)
- `spacecraft`: `size` (CubeSat 1U-12U), `mass`, `solarPanelConfig`, `solarPanelArea`,
  `solarCellEfficiency`, `pointingMode`, `batteryCapacity`, `antennaType`, etc.

Actions: `updateMission(partial)`, `updateSpacecraft(partial)`.

### OrbitSlice (`orbit-slice.ts`)

Keplerian orbital elements and derived parameters.

| Field | Type | Persisted |
|-------|------|-----------|
| `elements` | `OrbitalElements` | Yes |
| `derived` | `DerivedOrbitalParams` | No (recomputed) |

Key `OrbitalElements` fields: `semiMajorAxis`, `eccentricity`, `inclination`,
`raan`, `argOfPerigee`, `trueAnomaly`.

Actions: `updateElements(partial)`, `recompute()`, `applyPreset(key)`.

The `recompute()` action calls `computeDerivedParams()` from the physics engine
and stores the result. It fires automatically on element changes and on rehydration.

### GroundSlice (`ground-slice.ts`)

Ground station network for pass prediction and link budget.

| Field | Type | Persisted |
|-------|------|-----------|
| `groundStations` | `GroundStation[]` | Yes |

15 default stations (Svalbard, Fairbanks, Darmstadt, Santiago active by default;
DSN, Tokyo, Bangalore, etc. available but inactive).

Actions: `updateStation(id, partial)`, `toggleStation(id)`, `addStation(station)`,
`removeStation(id)`.

### PowerSlice (`power-slice.ts`)

Power subsystem definitions and degradation.

| Field | Type | Persisted |
|-------|------|-----------|
| `subsystems` | `PowerSubsystem[]` | Yes |
| `degradationRate` | `number` (0-1) | Yes |

Default subsystems: OBC (0.5W), Radio TX (2W/15%), Camera (3W/10%), ADCS (1W),
Heater (1.5W/40% eclipse-only).

Actions: `updateSubsystem(id, partial)`, `addSubsystem(sub)`, `removeSubsystem(id)`,
`setDegradationRate(rate)`.

### ConstellationSlice (`constellation-slice.ts`)

Walker constellation parameters.

| Field | Type | Persisted |
|-------|------|-----------|
| `walkerParams` | `WalkerParams` | Yes |

Default: Walker Delta 24/6/1 at 550 km, 53 deg inclination.
`syncWithOrbit` flag links altitude/inclination to the Orbit tab.

Actions: `updateWalkerParams(partial)`.

### DeltaVSlice (`deltav-slice.ts`)

Propulsion system and maneuver list.

| Field | Type | Persisted |
|-------|------|-----------|
| `propulsion` | `PropulsionConfig` | Yes |
| `maneuvers` | `DeltaVManeuver[]` | Yes |

Default maneuvers: Insertion Correction (5 m/s), Station Keeping (2 m/s/yr),
Collision Avoidance (1 m/s/yr), Deorbit (auto-computed from altitude).

Actions: `updatePropulsion(partial)`, `updateManeuver(id, partial)`,
`addManeuver(maneuver)`, `removeManeuver(id)`.

### RadiationSlice (`radiation-slice.ts`)

Radiation shielding configuration.

| Field | Type | Persisted |
|-------|------|-----------|
| `shieldingThicknessMm` | `number` | Yes |

Actions: `setShieldingThickness(mm)`.

### ComparisonSlice (`comparison-slice.ts`)

Mission scenario snapshots for side-by-side comparison.

| Field | Type | Persisted |
|-------|------|-----------|
| `scenarios` | `Scenario[]` | Yes |

Actions: `addScenario(scenario)`, `removeScenario(id)`, `updateScenario(id, partial)`.

### PayloadSlice (`payload-slice.ts`)

Payload instrument configuration for EO, SAR, and SatCom analysis.

| Field | Type | Persisted |
|-------|------|-----------|
| `payloadType` | `PayloadType` | Yes |
| `payloadShared` | `SharedPayloadConfig` | Yes |
| `payloadEO` | `EOConfig` | Yes |
| `payloadSAR` | `SARConfig` | Yes |
| `payloadSATCOM` | `SATCOMConfig` | Yes |

Actions: `setPayloadType(type)`, `updatePayloadShared(partial)`,
`updatePayloadEO(partial)`, `updatePayloadSAR(partial)`, `updatePayloadSATCOM(partial)`,
`applyPayloadPreset(preset)`.

### BeyondLeoSlice (`beyond-leo-slice.ts`)

Beyond-LEO mission design state (Lagrange, lunar, interplanetary).

| Field | Type | Persisted |
|-------|------|-----------|
| `beyondLeo` | `BeyondLeoState` | Yes |

Nested: `mode` (lagrange/lunar/interplanetary), `lagrangeParams`, `lunarParams`,
`interplanetaryParams`.

Actions: `setBeyondLeoMode(mode)`, `updateLagrangeParams(partial)`,
`updateLunarParams(partial)`, `updateInterplanetaryParams(partial)`.

## Persistence Strategy

### Auto-Save (Zustand persist middleware)

- **Key:** `orbitforge-autosave`
- **Schema version:** 12
- **Partialize:** Only persists user-configurable state (not derived/computed values)
- **Merge strategy:** Shallow object merge per top-level key (preserves defaults for new fields)
- **Migration:** Handles v8 (groundStations reset), v9 (walkerParams.syncWithOrbit),
  v10 (pointingMode addition)
- **Rehydration:** Calls `recompute()` to regenerate derived parameters, validates
  duty cycles (clamps to 0-1), deserializes epoch ISO strings back to Date objects

### Named Projects (`persistence.ts`)

Separate from auto-save. Allows multiple named project files.

| Function | Description |
|----------|-------------|
| `saveProject(name, state)` | Serialize + save to `orbitforge-project-{name}` |
| `loadProject(name)` | Deserialize from localStorage |
| `listProjects()` | Enumerate all saved projects, sorted by date |
| `deleteProject(name)` | Remove from localStorage |
| `exportProjectJSON(name, state)` | Download as `.orbitforge.json` file |
| `importProjectJSON(file)` | Parse uploaded JSON file |

Schema version: 5. Includes full mission state: elements, ground stations, mission config,
subsystems, walker params, propulsion, maneuvers, shielding, scenarios, payload config,
beyond-LEO state.

## Type Definitions (`types/`)

| File | Key Exports |
|------|-------------|
| `types/index.ts` | `ModuleId` enum (11 modules), `MODULE_LABELS`, `MODULE_NUMBERS`, `Vec3` |
| `types/orbit.ts` | `OrbitalElements`, `DerivedOrbitalParams`, `OrbitType`, `ORBIT_PRESETS` (7 presets) |
| `types/mission.ts` | `CubeSatSize`, `SpacecraftConfig`, `MissionConfig`, antenna/solar/frequency types |
| `types/ground-station.ts` | `GroundStation` interface |
| `types/propulsion.ts` | `PropulsionConfig`, `DeltaVManeuver`, `PROPULSION_PRESETS` |
| `types/payload.ts` | `EOConfig`, `SARConfig`, `SATCOMConfig`, `SharedPayloadConfig`, presets |
| `types/beyond-leo.ts` | `LagrangeParams`, `LunarParams`, `InterplanetaryParams`, `PorkchopPoint` |

## Data Flow

```
User Action (slider, dropdown, preset button)
        |
        v
Store Action (e.g., updateElements({ semiMajorAxis: 7000 }))
        |
        v
Zustand set() -- immutable state update
        |
        +---> React re-render (useStore selectors)
        |     +---> Left Panel (reflects new input)
        |     +---> Right Panel (derived params recomputed)
        |     +---> Bottom Panel (charts update)
        |     +---> 3D Viewport (orbit geometry updates)
        |
        +---> persist middleware -- auto-save to localStorage
```

## Related Areas

- [Frontend](frontend.md) -- Components that read from and write to the store
- [Physics Engine](physics-engine.md) -- Pure functions called by store actions and components
- [Beyond-LEO](beyond-leo.md) -- BeyondLeoSlice details
