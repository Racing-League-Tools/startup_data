'use strict';

const path = require('path');
const { loadAll, IMAGES_DIR, fmt, listImages } = require('./helpers/loader');

let db;
beforeAll(() => { db = loadAll(); });

// ─────────────────────────────────────────────────────────────
// Helper: collect violations where an image has no matching entity
// ─────────────────────────────────────────────────────────────
function orphans(images, validSet, { subDir } = {}) {
  const violations = [];
  for (const img of images) {
    if (!validSet.has(img.base)) {
      violations.push(`[${img.relPath}] "${img.base}" has no matching entity`);
    }
  }
  return violations;
}

// ─────────────────────────────────────────────────────────────
// 1. Variant suffix integrity — every __variant file needs a base
// ─────────────────────────────────────────────────────────────
describe('Image variant suffixes', () => {
  const VALID_VARIANTS = new Set(['dark', 'light', 'alternative']);

  it('all __variant files use a known suffix (dark, light, alternative)', () => {
    const all = [
      ...listImages('logotypes'),
      ...listImages('liveries'),
    ];
    const bad = all
      .filter(img => img.variant !== null && !VALID_VARIANTS.has(img.variant))
      .map(img => `[${img.relPath}] unknown variant "__${img.variant}"`);
    expect(fmt(bad)).toBe('');
  });

  it('every __variant file has a corresponding base file', () => {
    // Build set of all base filenames (dir + base) for quick lookup
    const all = [
      ...listImages('logotypes'),
      ...listImages('liveries'),
    ];
    // Key: "dir/base" (dir = folder containing the file)
    const baseKeys = new Set(
      all
        .filter(img => img.variant === null)
        .map(img => path.dirname(img.relPath).replace(/\\/g, '/') + '/' + img.base)
    );
    const bad = all
      .filter(img => img.variant !== null)
      .filter(img => {
        const dir = path.dirname(img.relPath).replace(/\\/g, '/');
        return !baseKeys.has(dir + '/' + img.base);
      })
      .map(img => `[${img.relPath}] base file "${img.base}.png" not found`);
    expect(fmt(bad)).toBe('');
  });
});

// ─────────────────────────────────────────────────────────────
// 2. logotypes/classes → car_classes.UniqueName
// ─────────────────────────────────────────────────────────────
describe('logotypes/classes', () => {
  it('every image base matches a car_classes.UniqueName', () => {
    const images = listImages('logotypes/classes').filter(img => img.variant === null);
    expect(fmt(orphans(images, db.carClassNames))).toBe('');
  });
});

// ─────────────────────────────────────────────────────────────
// 3. logotypes/vendors → vendors.UniqueName
// ─────────────────────────────────────────────────────────────
describe('logotypes/vendors', () => {
  it('every image base matches a vendors.UniqueName', () => {
    const images = listImages('logotypes/vendors').filter(img => img.variant === null);
    expect(fmt(orphans(images, db.vendorNames))).toBe('');
  });
});

// ─────────────────────────────────────────────────────────────
// 4. logotypes/games → games.UniqueName
// ─────────────────────────────────────────────────────────────
describe('logotypes/games', () => {
  it('every image base matches a games.UniqueName', () => {
    const images = listImages('logotypes/games').filter(img => img.variant === null);
    expect(fmt(orphans(images, db.gameNames))).toBe('');
  });
});

// ─────────────────────────────────────────────────────────────
// 5. logotypes/championships → championships.UniqueName or BaseChampionship
// ─────────────────────────────────────────────────────────────
describe('logotypes/championships', () => {
  it('every image base matches a championships.UniqueName or BaseChampionship', () => {
    const images = listImages('logotypes/championships').filter(img => img.variant === null);
    expect(fmt(orphans(images, db.championshipRefs))).toBe('');
  });
});

// ─────────────────────────────────────────────────────────────
// 6. logotypes/circuits → normalize(circuits.CircuitOrigin)
//    Normalize: trim, lowercase, spaces/hyphens → underscore
// ─────────────────────────────────────────────────────────────
describe('logotypes/circuits', () => {
  it('every image base matches a normalized circuits.CircuitOrigin', () => {
    const normalizedOrigins = new Set(
      db.circuits
        .map(r => r.CircuitOrigin)
        .filter(Boolean)
        .map(o => o.trim().toLowerCase().replace(/\s+/g, '_'))
    );
    const images = listImages('logotypes/circuits').filter(img => img.variant === null);
    const bad = images
      .filter(img => !normalizedOrigins.has(img.base))
      .map(img => `[${img.relPath}] "${img.base}" has no matching CircuitOrigin`);
    expect(fmt(bad)).toBe('');
  });
});

// ─────────────────────────────────────────────────────────────
// 7. logotypes/teams — all series subfolders → teams.UniqueName
//    (excluding factory_teams and private_teams — those map to vendors/misc)
// ─────────────────────────────────────────────────────────────
describe('logotypes/teams (series)', () => {
  it('every image base in series subfolders matches a teams.UniqueName', () => {
    const all = listImages('logotypes/teams');
    // Only files inside named-series folders (not factory_teams / private_teams)
    const series = all.filter(img =>
      img.variant === null &&
      !img.relPath.includes('/factory_teams/') &&
      !img.relPath.includes('/private_teams/')
    );
    expect(fmt(orphans(series, db.teamNames))).toBe('');
  });
});

// ─────────────────────────────────────────────────────────────
// 8. liveries — series folders (F1, F2, WEC, ELMS) → teams.UniqueName
//              car folders (GT2, GT3, GT4, ST, TCX)  → cars.UniqueName
// ─────────────────────────────────────────────────────────────
describe('liveries (series — teams)', () => {
  const SERIES_DIRS = ['liveries/ELMS_2025', 'liveries/F1_2023', 'liveries/F1_2024',
    'liveries/F1_2025', 'liveries/F1_2026', 'liveries/F2_2023',
    'liveries/F2_2024', 'liveries/WEC_2025'];

  for (const dir of SERIES_DIRS) {
    it(`${dir} — every image base matches a teams.UniqueName`, () => {
      const images = listImages(dir).filter(img => img.variant === null);
      expect(fmt(orphans(images, db.teamNames))).toBe('');
    });
  }
});

describe('liveries (cars — cars.UniqueName)', () => {
  const CAR_DIRS = ['liveries/GT2', 'liveries/GT3', 'liveries/GT4', 'liveries/ST', 'liveries/TCX'];

  for (const dir of CAR_DIRS) {
    it(`${dir} — every image base matches a cars.UniqueName`, () => {
      const images = listImages(dir).filter(img => img.variant === null);
      expect(fmt(orphans(images, db.carNames))).toBe('');
    });
  }
});

// ─────────────────────────────────────────────────────────────
// 9. flags/ — every nations.FlagFileName must resolve to an existing file
// ─────────────────────────────────────────────────────────────
describe('flags', () => {
  it('every nations.FlagFileName must exist in images/flags/', () => {
    const flagFiles = new Set(
      listImages('flags').map(img => img.rawName + '.png')
    );
    const violations = [];
    for (const nation of db.nations) {
      if (!nation.FlagFileName) continue;
      if (!flagFiles.has(nation.FlagFileName)) {
        violations.push(`[${nation._file}] "${nation.Name}" — FlagFileName: "${nation.FlagFileName}" not found`);
      }
    }
    expect(fmt(violations)).toBe('');
  });
});

// ─────────────────────────────────────────────────────────────
// 9. flags → nations.FlagFileName
// ─────────────────────────────────────────────────────────────
describe('flags', () => {
  it('every flag file is referenced by at least one nation', () => {
    const flagFileNames = new Set(
      db.nations.map(r => r.FlagFileName).filter(Boolean)
    );
    const images = listImages('flags');
    // Flags use underscore-based names, compare as-is (with .png extension)
    const bad = images
      .filter(img => !flagFileNames.has(img.rawName + '.png'))
      .map(img => `[${img.relPath}] "${img.rawName}.png" not referenced by any nation`);
    expect(fmt(bad)).toBe('');
  });
});
