# Startup Data — JSON Reference

## Overview

The `startup_data` folder contains pre-defined reference data that is bundled with the application. This data is loaded at startup and used to populate the league database with well-known championships, teams, cars, drivers, circuits, and related entities.

There are two separate locations from which files are loaded:

| Location | Purpose |
|----------|---------|
| `<app_root>/startup_data/` | Built-in default data, shipped with the application |
| `<user_dir>/startup_data/` | User-customised overrides; loaded **after** the built-in folder |

When the same unique key exists in both locations, the **user folder wins** — its entry replaces the built-in one.

---

## File Naming Conventions

### Pattern-based loading

The application does **not** look for exact file names. It scans each data folder using a **wildcard glob** and loads every matching file. This means any number of files can contribute to the same entity type, which allows splitting data across multiple thematic files (e.g. one file per series or per year).

| Entity type | Glob pattern | Example file names |
|-------------|-------------|-------------------|
| Nations | `nations*.json` | `nations.json` |
| Car classes | `car_classes*.json` | `car_classes.json` |
| Cars | `cars*.json` | `cars.gt1.json`, `cars.lmh.json` |
| Championships | `championships*.json` | `championships.wec.json`, `championships.indycar.json` |
| Drivers | `drivers*.json` | `drivers.wec.json`, `drivers.f1.json` |
| Games | `games*.json` | `games.json` |
| Vendors (manufacturers) | `vendors*.json` | `vendors.json` |
| Point actions | `point_actions*.json` | `point_actions.json`, `point_actions.f1.json` |
| Teams | `teams*.json` | `teams.wec.2025.json`, `teams.f1.2024.json` |
| Circuits (tracks) | `circuits*.json` | `circuits.json` |
| Lineups | `lineups*.json` | `lineups.wec.json`, `lineups.wec.2025.json` |

The recommended naming convention for additional files is:

```
<type>.<series>[.<year>].json
```

Examples: `teams.f1.2025.json`, `lineups.wec.2024.json`, `point_actions.indycar.json`.

### Sub-folder support

**Sub-folders are not supported.** The application calls `Directory.GetFiles(path, pattern)` without the `AllDirectories` flag, so only files located directly inside the `startup_data` folder are discovered. Nested directories are silently ignored.

### Export (user folder) file names

When the application exports user-edited startup data to the user folder it always writes to a **fixed canonical name** (e.g. `teams.json`, `lineups.json`). The wildcard-loading rules still apply on the next startup, so both the canonical user file and any additional `teams.*.json` files will be loaded.

---

## File Format

Every file is a **JSON array** `[ ... ]` where each element is one record of the corresponding entity type. All files must be valid UTF-8 JSON.

Parser settings applied by the application:

| Setting | Value |
|---------|-------|
| Trailing commas | Allowed |
| Comments (`// ...`) | Allowed (skipped) |
| Unknown fields | Ignored |
| Null fields | Omitted on export; treated as `null` on import |
| String encoding | Relaxed (non-ASCII characters allowed unescaped) |

---

## Entity Schemas

### `nations` — Nations / countries

**Unique key:** `Name`

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `Name` | string | ✅ | Full country name. Used as the unique key. Also referenced by `Driver.Nationality`, `Team.Nationality`, `Circuit.Nation`. |
| `Code` | string | | ISO country code (e.g. `"GBR"`). |
| `FlagFileName` | string | | File name of the flag image asset (e.g. `"united-kingdom.png"`). |

```json
[
  { "Name": "United Kingdom", "Code": "GBR", "FlagFileName": "united-kingdom.png" }
]
```

---

### `car_classes` — Car classes

**Unique key:** `UniqueName`

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `UniqueName` | string | ✅ | Stable identifier. Referenced by `Car.CarClass`. |
| `Name` | string | ✅ | Display name (e.g. `"Formula 1"`). |

```json
[
  { "UniqueName": "lmh", "Name": "Le Mans Hypercar" }
]
```

---

### `cars` — Cars / vehicles

**Unique key:** `UniqueName`

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `UniqueName` | string | ✅ | Stable identifier. Referenced by `Team.Car`, `Championship.Cars[]`. |
| `Name` | string | ✅ | Display name. |
| `CarClass` | string | | `car_classes.UniqueName` — the class this car belongs to. |
| `Vendor` | string | | `vendors.UniqueName` — manufacturer. |
| `Year` | integer | | Model year. |
| `Power` | integer | | Horsepower figure. |
| `AliasesRaw` | string | | Comma-separated list of alternative names used for matching external results. |

```json
[
  {
    "UniqueName": "ferrari.296.gt3",
    "Name": "Ferrari 296 GT3",
    "CarClass": "gt3",
    "Vendor": "ferrari",
    "Year": 2023,
    "AliasesRaw": "Ferrari 296 GT3"
  }
]
```

---

### `vendors` — Car manufacturers

**Unique key:** `UniqueName`

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `UniqueName` | string | ✅ | Stable identifier. Referenced by `Car.Vendor`. |
| `Name` | string | ✅ | Display name (e.g. `"Ferrari"`). |
| `Country` | string | | Country of origin. Should match a `nations.Name` value. |

```json
[
  { "UniqueName": "ferrari", "Name": "Ferrari", "Country": "Italy" }
]
```

---

### `games` — Simulation games / platforms

**Unique key:** `UniqueName`

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `UniqueName` | string | ✅ | Stable identifier. Referenced by `Championship.Games[]`. |
| `Name` | string | ✅ | Display name (e.g. `"F1 2024"`). |
| `Developer` | string | | Studio that developed the game. |
| `Publisher` | string | | Publisher. |
| `ReleaseDate` | string | | Release date string (informational only). |
| `PlatformsRaw` | string | | Comma-separated platform list (e.g. `"PC, PS5, Xbox"`). |
| `OfficialLink` | string | | URL to the official product page. |

```json
[
  {
    "UniqueName": "le.mans.ultimate",
    "Name": "Le Mans Ultimate",
    "Developer": "Studio 397",
    "Publisher": "Motorsport Games"
  }
]
```

---

### `championships` — Championships / series presets

**Unique key:** `UniqueName`

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `UniqueName` | string | ✅ | Stable identifier. Referenced by `LineUp.Championship`, `PointAction.Championship`. |
| `Name` | string | ✅ | Display name (e.g. `"WEC 2025"`). |
| `BaseChampionship` | string | | Parent series identifier (e.g. `"wec"`, `"f1"`). |
| `Games` | string[] | | List of `games.UniqueName` values — games this championship is played in. |
| `Cars` | string[] | | List of `cars.UniqueName` values available in this championship. |
| `Teams` | string[] | | List of `teams.UniqueName` values competing in this championship. |

```json
[
  {
    "UniqueName": "wec.2025",
    "Name": "WEC 2025",
    "BaseChampionship": "wec",
    "Games": ["le.mans.ultimate"],
    "Cars": ["ferrari.499p", "porsche.963"],
    "Teams": ["ferrari.50.2025", "porsche.5.2025"]
  }
]
```

---

### `circuits` — Race tracks / circuits

**Unique key:** `UniqueName`

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `UniqueName` | string | ✅ | Stable identifier. |
| `CircuitName` | string | ✅ | Short circuit name (e.g. `"Silverstone"`). |
| `CircuitFullName` | string | | Full official name. |
| `LocationName` | string | | Location / city name. |
| `CircuitOrigin` | string | | Origin / canonical circuit name (for grouping layouts). |
| `Years` | string | | Year(s) the layout was used (informational). |
| `TrackLayout` | string | | Layout variant (e.g. `"GrandPrix"`, `"National"`). |
| `TrackType` | string | | Type of event: `"Race"`, `"Oval"`, etc. |
| `Nation` | string | | Country name. Must match a `nations.Name` value. |
| `Length` | integer | | Track length in metres. |
| `NumberTurns` | integer | | Number of turns on the circuit. |
| `RaceLapRecordTimeMs` | integer | | Lap record time in milliseconds. |
| `RaceLapRecordDriverName` | string | | Name of the record holder. |
| `RaceLapRecordYear` | integer | | Year the record was set. |

```json
[
  {
    "UniqueName": "monaco.2003",
    "CircuitName": "Monaco",
    "CircuitFullName": "Circuit de Monaco",
    "Nation": "Monaco",
    "Length": 3337,
    "NumberTurns": 19
  }
]
```

---

### `drivers` — Drivers

**Unique key:** `Name`

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `Name` | string | ✅ | Full driver display name. Used as the unique key. Referenced by `LineUp.Driver`. |
| `Nationality` | string | | Country name. Should match a `nations.Name` value. |
| `RaceNumber` | integer | | Default/assigned race number. |
| `ShortName` | string | | Three-letter abbreviation (e.g. `"HAM"`). |
| `RealName` | string | | Real name if the display name is a pseudonym. |
| `Platform` | string | | Gaming platform (`"PC"`, `"PlayStation"`, `"Xbox"`, etc.). |
| `Description` | string | | Bio or notes. |
| `Discord` | string | | Discord username or link. |
| `Steam` | string | | Steam username or link. |

```json
[
  { "Name": "Lewis Hamilton", "Nationality": "United Kingdom", "RaceNumber": 44, "ShortName": "HAM" }
]
```

---

### `teams` — Teams

**Unique key:** `UniqueName`

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `UniqueName` | string | ✅ | Stable identifier. Referenced by `LineUp.Team`, `Championship.Teams[]`. |
| `Name` | string | ✅ | Short display name (e.g. `"Ferrari"`). |
| `FullName` | string | | Official full team name. |
| `Abbreviation` | string | | Short team code (e.g. `"007"` for car number). |
| `Car` | string | | Default car: `cars.UniqueName`. |
| `Nationality` | string | | Country name. Should match a `nations.Name` value. |
| `Position` | integer | | Display sort order. |
| `Color` | string | | Primary colour as ARGB hex (e.g. `"#FFEC001E"`). The leading `FF` byte is the alpha channel. |
| `SecondaryColor` | string | | Secondary colour (ARGB hex). |
| `TertiaryColor` | string | | Tertiary colour (ARGB hex). |
| `ColorRaw` | integer | | Raw integer representation of the primary colour (legacy field). |
| `SecondaryColorRaw` | integer | | Raw integer for secondary colour (legacy). |
| `Year` | integer | | Season year this team entry corresponds to. |
| `Seats` | integer | | Number of seats/drivers in the team. `0` means unspecified. |
| `AliasesRaw` | string | | Comma-separated alternative names used for matching external results. |
| `Origin` | string | | Manufacturer / parent organisation name. |
| `Prestige` | integer | | Prestige ranking (informational). |

> **Note:** Colour values use ARGB format with an `#FF` alpha prefix. When displayed in UI or exported as hex colours the alpha byte is dropped and the remaining 6 digits are used.

```json
[
  {
    "UniqueName": "ferrari.50.2025",
    "Name": "Ferrari",
    "FullName": "Ferrari AF Corse",
    "Abbreviation": "50",
    "Car": "ferrari.499p",
    "Nationality": "Italy",
    "Color": "#FFED1C24",
    "SecondaryColor": "#FFFFFFFF",
    "Year": 2025
  }
]
```

---

### `point_actions` — Points scoring rules

**Unique key:** composite `ActionType + SessionType + Championship + RaceType + QualificationType`

Point actions define how many points are awarded for a given finishing position or bonus achievement. Files without a `Championship` field define global defaults; files with `Championship` set define series-specific overrides.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `ActionType` | string | ✅ | Position identifier: `"P1"`, `"P2"`, …, `"P20"`, `"FastestLap"`, `"PolePosition"`, etc. |
| `DriverPoints` | number | ✅ | Points awarded to the driver. |
| `TeamPoints` | number | | Points awarded to the constructor/team. Defaults to `DriverPoints` if omitted. |
| `SessionType` | string | ✅ | Session this rule applies to: `"Race"`, `"Qualification"`, `"Practice"`. |
| `Championship` | string | | `championships.UniqueName` — scope this rule to a specific championship. If omitted or empty, the rule is a global default. |
| `ChampionshipId` | integer | | Internal DB id (set to `0` in startup data files; resolved at runtime). |
| `RaceType` | string | | Race sub-type: `"Main"`, `"Sprint"`, `"Feature"`, etc. Null means any race type. |
| `QualificationType` | string | | Qualification sub-type. Null means any qual type. |

```json
[
  { "ActionType": "P1",          "DriverPoints": 25, "TeamPoints": 25, "SessionType": "Race" },
  { "ActionType": "FastestLap",  "DriverPoints": 1,  "TeamPoints": 1,  "SessionType": "Race", "Championship": "f1.2024", "RaceType": "Main" }
]
```

---

### `lineups` — Driver / team assignments

**Unique key:** composite `Driver.Name + SeatPosition + Championship`

Lineups map drivers to teams within a specific championship.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `Driver` | string | ✅ | Driver display name. Must match a `drivers.Name` value. |
| `Team` | string | ✅ | `teams.UniqueName` — the team this driver belongs to. |
| `Championship` | string | ✅ | `championships.UniqueName` — the championship this lineup entry is for. |
| `SeatType` | string | ✅ | `"Primary"` for regular race seats; `"Reserve"` for reserve/substitute drivers. |
| `SeatPosition` | integer | | Seat number within the team for primary drivers (1-based). `0` for reserve drivers. |
| `ReservePosition` | integer | | Reserve slot number (1-based). `0` for primary drivers. |

```json
[
  {
    "SeatType": "Primary",
    "Team": "ferrari.50.2025",
    "Driver": "Antonio Fuoco",
    "SeatPosition": 1,
    "ReservePosition": 0,
    "Championship": "wec.2025"
  }
]
```

---

## Cross-Reference Map (Foreign Keys)

The table below lists every field that acts as a reference to another entity's unique key.

| Field | Located in | References |
|-------|-----------|-----------|
| `Car.CarClass` | `cars` | `car_classes.UniqueName` |
| `Car.Vendor` | `cars` | `vendors.UniqueName` |
| `Team.Car` | `teams` | `cars.UniqueName` |
| `Team.Nationality` | `teams` | `nations.Name` |
| `Driver.Nationality` | `drivers` | `nations.Name` |
| `Circuit.Nation` | `circuits` | `nations.Name` |
| `Vendor.Country` | `vendors` | `nations.Name` |
| `Championship.Games[]` | `championships` | `games.UniqueName` |
| `Championship.Cars[]` | `championships` | `cars.UniqueName` |
| `Championship.Teams[]` | `championships` | `teams.UniqueName` |
| `LineUp.Driver` | `lineups` | `drivers.Name` |
| `LineUp.Team` | `lineups` | `teams.UniqueName` |
| `LineUp.Championship` | `lineups` | `championships.UniqueName` |
| `PointAction.Championship` | `point_actions` | `championships.UniqueName` (optional) |

> Foreign key relationships are **not enforced** at parse time. Invalid references are ignored or result in a null association at runtime.

---

## Loading Order and Merge Behaviour

1. All files matching the glob pattern are loaded from the **built-in** `startup_data` folder.
2. All files matching the same pattern are then loaded from the **user** `startup_data` folder.
3. For each loaded item, a unique key is computed (see schemas above).
4. If a key already exists (duplicate within the same folder, or user overriding built-in), the **later** entry wins.

This means:
- You can **extend** the built-in data by placing additional files in the user folder.
- You can **override** a specific built-in entry by placing a file in the user folder with the same unique key.
- You cannot remove a built-in entry without replacing it.

---

## Validation Checklist

The following checks are recommended when validating startup data files:

| # | Check |
|---|-------|
| 1 | File is valid JSON (no syntax errors). |
| 2 | Root element is a JSON array `[...]`. |
| 3 | Every required field is present and non-empty. |
| 4 | All `UniqueName` / `Name` values within a single entity type are unique across all loaded files. |
| 5 | `Car.CarClass` references an existing `car_classes.UniqueName`. |
| 6 | `Car.Vendor` references an existing `vendors.UniqueName`. |
| 7 | `Team.Car` references an existing `cars.UniqueName`. |
| 8 | `Team.Nationality`, `Driver.Nationality`, `Circuit.Nation`, `Vendor.Country` reference existing `nations.Name` values. |
| 9 | `Championship.Games[]` items reference existing `games.UniqueName` values. |
| 10 | `Championship.Cars[]` items reference existing `cars.UniqueName` values. |
| 11 | `Championship.Teams[]` items reference existing `teams.UniqueName` values. |
| 12 | `LineUp.Driver` references an existing `drivers.Name`. |
| 13 | `LineUp.Team` references an existing `teams.UniqueName`. |
| 14 | `LineUp.Championship` references an existing `championships.UniqueName`. |
| 15 | `PointAction.Championship` (when set) references an existing `championships.UniqueName`. |
| 16 | Files are placed directly inside `startup_data/` — not in sub-folders. |
| 17 | File names follow the `<type>[.<qualifier>].json` convention. |
| 18 | Colour fields in `teams` use 8-digit ARGB hex format (`#FFrrggbb`). |
