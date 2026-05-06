# Asset Images Reference

## Overview

The `images` folder contains PNG image assets bundled with the application. These assets provide logos, liveries, flags, and other visual elements displayed throughout the application and used during render generation.

There are two separate root locations from which image files are loaded:

| Location | Purpose |
|----------|---------|
| `<app_root>/images/` | Built-in default assets, shipped with the application |
| `<user_dir>/images/` | User-customised overrides; loaded with **higher priority** than built-in assets |

When the same file name exists in both locations, the **user folder wins**.

---

## Folder Structure

Image assets are organised into sub-folders under `images/` according to their entity type:

| Entity type | Sub-folder path | Notes |
|-------------|----------------|-------|
| Teams | `images/logotypes/teams/` | Team logos |
| Cars | `images/logotypes/cars/` | Car model logos |
| Car classes | `images/logotypes/classes/` | Car class logos |
| Championships | `images/logotypes/championships/` | Championship / series logos |
| Vendors (manufacturers) | `images/logotypes/vendors/` | Manufacturer logos |
| Games | `images/logotypes/games/` | Simulation game logos |
| Circuits | `images/logotypes/circuits/` | Circuit / track logos |
| Nations (flags) | `images/flags/` | Country flag images |
| Driver avatars | `images/driver_avatars/` | Driver profile pictures |
| Liveries | `images/liveries/` | Car livery images |

> Sub-folders within each of these directories are supported — the application searches recursively.

---

## File Naming Rules

### General rules

- File names must be **lowercase**.
- Use **hyphens** (`-`) or **underscores** (`_`) as word separators; prefer hyphens for readability.
- Dots (`.`) in `UniqueName` values may be replaced with underscores (`_`) — both variants are resolved automatically.
- Spaces in names are also replaced with underscores (`_`) automatically.
- Avoid special characters not valid in file names.

### Supported extensions

The application resolves image files by the following extensions, in order of priority:

| Extension | Format |
|-----------|--------|
| `.png` | Portable Network Graphics (**recommended**) |
| `.jpg` | JPEG |
| `.jpeg` | JPEG (alternative extension) |

---

## File Name Resolution

For each entity, the application attempts to find an image file by trying a sequence of **candidate names**. The first match found is used. Candidates are derived from the entity's identifier fields and are searched in the following order:

| Priority | Candidate source | Example |
|----------|-----------------|---------|
| 1 | `UniqueName` / `StringId` | `ferrari.499p` |
| 2 | `Name` (display name) | `Ferrari 499P` → `Ferrari 499P` |
| 3 | `Origin` / `BaseChampionshipString` / fallback id | `ferrari` |

For each candidate, the application additionally generates a variant where `.` is replaced by `_` and ` ` is replaced by `_`, so both forms resolve to the same file.

### Example — Team logo

Team `ferrari.50.2025` with `Name = "Ferrari"` and `Origin = "ferrari"` will try the following file names (in order):

```
ferrari.50.2025.png
ferrari_50_2025.png
Ferrari.png
ferrari.png
```

This means a single file named `ferrari.png` will serve as a fallback logo for all Ferrari teams.

### Example — Championship logo

Championship `wec.2025` with `Name = "WEC 2025"` and `BaseChampionship = "wec"` tries:

```
wec.2025.png
wec_2025.png
WEC 2025.png
WEC_2025.png
wec.png
wec.png  (BaseChampionship)
```

### Example — Nation flag

Nation `United Kingdom` with `Code = "GBR"` tries:

```
United Kingdom.png
United_Kingdom.png
GBR.png
```

---

## Logo Variants

In addition to the default logo, the application supports **visual variants** for UI theming. A variant is specified by appending a double-underscore suffix to the base file name:

| Variant | File suffix | Example |
|---------|------------|---------|
| Default | *(no suffix)* | `ferrari.png` |
| Alternative | `__alternative` | `ferrari__alternative.png` |
| Dark | `__dark` | `ferrari__dark.png` |
| Light | `__light` | `ferrari__light.png` |
| Grayed | `__grayed` | `ferrari__grayed.png` |

Variant files are placed in the same directory as the default logo. If a requested variant is not found and fallback is enabled, the application falls back to the default (no-suffix) file.

---

## Liveries

Liveries are multi-image sets representing the visual appearance of a car during rendering. They follow a different convention from logos.

- **Sub-folder:** `images/liveries/`
- **Naming:** `<UniqueName>*.png` — the livery id is used as a prefix; the application searches for all files matching `<UniqueName>*.png` within the liveries directory and its sub-directories.
- A livery set can consist of multiple PNG files (e.g. multiple panels or layers), all sharing the same prefix.
- The file with no additional suffix after the `UniqueName` is treated as the **default livery**.

**Example:** Car `ferrari.499p` → searches for files matching `ferrari.499p*.png`.

---

## Search Priority

For each entity type, the application checks directories in the following order:

1. **User directory** — `<user_dir>/images/<sub-folder>/`
2. **Active theme directory** — `<theme_dir>/images/<sub-folder>/` *(if a non-default theme is active)*
3. **Built-in app directory** — `<app_root>/images/<sub-folder>/`

The first file found wins. This allows user-placed images to override built-in ones without modifying application files.

---

## Entity-specific Notes

### Nations (flags)

- Sub-folder: `images/flags/`
- Candidate names: `Name`, `Code` (ISO code, e.g. `GBR`)
- Recommended file names: lowercase country name with spaces replaced by hyphens, e.g. `united-kingdom.png`, `gbr.png`

### Drivers (avatars)

- Sub-folder: `images/driver_avatars/`
- Candidate names: `StringId`, `Name`
- Recommended file name: driver full name with spaces replaced by underscores, e.g. `lewis_hamilton.png`

### Teams

- Sub-folder: `images/logotypes/teams/`
- Candidate names: `UniqueName`, `Name`, `Origin`
- Use `Origin` to share a single logo file across multiple season-specific team entries (e.g. `ferrari.50.2024` and `ferrari.50.2025` both fall back to `ferrari.png`)

### Cars

- Sub-folder: `images/logotypes/cars/`
- Candidate names: `UniqueName`, `Name`
- Liveries: `images/liveries/`, named by `UniqueName`

### Championships

- Sub-folder: `images/logotypes/championships/`
- Candidate names: `UniqueName`, `Name`, `BaseChampionship`
- Use `BaseChampionship` as a shared logo for all season editions of a series

### Vendors (manufacturers)

- Sub-folder: `images/logotypes/vendors/`
- Candidate names: `UniqueName`, `Name`

### Car classes

- Sub-folder: `images/logotypes/classes/`
- Candidate names: `UniqueName`, `Name`

### Circuits

- Sub-folder: `images/logotypes/circuits/`
- Candidate names: `UniqueName`, `CircuitName`

### Games

- Sub-folder: `images/logotypes/games/`
- Candidate names: `UniqueName`, `Name`

---

## Recommended Naming Convention

```
<entity_unique_name>.png
```

Where `entity_unique_name` is taken directly from the corresponding startup-data `UniqueName` (or `Name` for nations/drivers), converted to **lowercase**, with dots and spaces preserved (the application handles both dotted and underscored variants).

| Entity | Startup-data field | Example file name |
|--------|--------------------|-------------------|
| Team | `UniqueName` | `ferrari.50.2025.png` |
| Team (shared) | `Origin` | `ferrari.png` |
| Car | `UniqueName` | `ferrari.499p.png` |
| Car class | `UniqueName` | `lmh.png` |
| Championship | `UniqueName` | `wec.2025.png` |
| Championship (shared) | `BaseChampionship` | `wec.png` |
| Vendor | `UniqueName` | `ferrari.png` |
| Circuit | `UniqueName` | `monaco.2003.png` |
| Game | `UniqueName` | `le.mans.ultimate.png` |
| Nation flag | `Name` or `Code` | `united-kingdom.png` / `gbr.png` |
| Driver avatar | `Name` | `lewis_hamilton.png` |

---

## Validation Checklist

| # | Check |
|---|-------|
| 1 | File extension is `.png`, `.jpg`, or `.jpeg`. |
| 2 | File name is **lowercase**. |
| 3 | File is placed in the correct sub-folder for its entity type. |
| 4 | File name matches the `UniqueName`, `Name`, `Origin`, or `BaseChampionship` of the corresponding entity (with `.` optionally replaced by `_`). |
| 5 | Variant files use the correct `__<variant>` suffix and are in the same directory as the default file. |
| 6 | Livery files use the entity's `UniqueName` as a prefix. |
| 7 | No spaces in file names (use `_` or `-` instead). |
| 8 | No sub-folders deeper than one level within the type sub-folder are used for logos (liveries support deeper nesting). |
