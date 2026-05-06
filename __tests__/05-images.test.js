'use strict';

const path = require('path');
const { loadAll, IMAGES_DIR, fmt, listImages } = require('./helpers/loader');

let db;
beforeAll(() => { db = loadAll(); });

// ─────────────────────────────────────────────────────────────
// Helper: collect violations where an image has no matching entity.
// Checks both the raw base name and a dots-for-underscores variant,
// because the app resolves both forms automatically (asset-images.md).
// ─────────────────────────────────────────────────────────────
function orphans(images, validSet) {
  const violations = [];
  for (const img of images) {
    const alt = img.base.replace(/_/g, '.');
    if (!validSet.has(img.base) && !validSet.has(alt)) {
      violations.push(`[${img.relPath}] "${img.base}" has no matching entity`);
    }
  }
  return violations;
}

// Normalize a display Name for file-name comparison:
// lowercase, collapse whitespace to underscores.
function normName(s) {
  return s.trim().toLowerCase().replace(/\s+/g, '_');
}

// ─────────────────────────────────────────────────────────────
// 1. Variant suffix integrity — every __variant file needs a base
// ─────────────────────────────────────────────────────────────
describe('Image variant suffixes', () => {
  const VALID_VARIANTS = new Set(['dark', 'light', 'alternative', 'grayed']);

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
// 2. logotypes/classes → car_classes.UniqueName or Name
// ─────────────────────────────────────────────────────────────
describe('logotypes/classes', () => {
  it('every image base matches a car_classes.UniqueName or Name', () => {
    const validClasses = new Set();
    for (const c of db.carClasses) {
      if (c.UniqueName) validClasses.add(c.UniqueName);
      if (c.Name)       validClasses.add(normName(c.Name));
    }
    const images = listImages('logotypes/classes').filter(img => img.variant === null);
    expect(fmt(orphans(images, validClasses))).toBe('');
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
// 4. logotypes/games → games.UniqueName or Name
// ─────────────────────────────────────────────────────────────
describe('logotypes/games', () => {
  it('every image base matches a games.UniqueName or Name', () => {
    const validGames = new Set();
    for (const g of db.games) {
      if (g.UniqueName) validGames.add(g.UniqueName);
      if (g.Name)       validGames.add(normName(g.Name));
    }
    const images = listImages('logotypes/games').filter(img => img.variant === null);
    expect(fmt(orphans(images, validGames))).toBe('');
  });
});

// ─────────────────────────────────────────────────────────────
// 5. logotypes/championships → UniqueName, Name, or BaseChampionship
// ─────────────────────────────────────────────────────────────
describe('logotypes/championships', () => {
  it('every image base matches a championships.UniqueName, Name, or BaseChampionship', () => {
    const validChampionships = new Set();
    for (const c of db.championships) {
      if (c.UniqueName)        validChampionships.add(c.UniqueName);
      if (c.Name)              validChampionships.add(normName(c.Name));
      if (c.BaseChampionship)  validChampionships.add(c.BaseChampionship);
    }
    const images = listImages('logotypes/championships').filter(img => img.variant === null);
    expect(fmt(orphans(images, validChampionships))).toBe('');
  });
});

// ─────────────────────────────────────────────────────────────
// 6. logotypes/circuits → circuits.UniqueName or normalized CircuitName
// ─────────────────────────────────────────────────────────────
describe('logotypes/circuits', () => {
  it('every image base matches a circuits.UniqueName or CircuitName', () => {
    const validCircuits = new Set();
    for (const c of db.circuits) {
      if (c.UniqueName)     validCircuits.add(c.UniqueName);
      if (c.CircuitName)    validCircuits.add(normName(c.CircuitName));
      if (c.CircuitOrigin)  validCircuits.add(normName(c.CircuitOrigin));
    }
    const images = listImages('logotypes/circuits').filter(img => img.variant === null);
    const bad = images
      .filter(img => {
        const alt = img.base.replace(/_/g, '.');
        return !validCircuits.has(img.base) && !validCircuits.has(alt);
      })
      .map(img => `[${img.relPath}] "${img.base}" has no matching circuit UniqueName or CircuitName`);
    expect(fmt(bad)).toBe('');
  });
});

// ─────────────────────────────────────────────────────────────
// 7. logotypes/teams — all series subfolders → teams.UniqueName, Name, or Origin
//    (excluding factory_teams and private_teams — those use different conventions)
// ─────────────────────────────────────────────────────────────
describe('logotypes/teams (series)', () => {
  it('every image base in series subfolders matches a teams.UniqueName, Name, or Origin', () => {
    const validTeams = new Set();
    for (const t of db.teams) {
      if (t.UniqueName) validTeams.add(t.UniqueName);
      if (t.Name)       validTeams.add(normName(t.Name));
      if (t.Origin)     validTeams.add(t.Origin);
    }
    const all = listImages('logotypes/teams');
    const series = all.filter(img =>
      img.variant === null &&
      !img.relPath.includes('/factory_teams/') &&
      !img.relPath.includes('/private_teams/')
    );
    expect(fmt(orphans(series, validTeams))).toBe('');
  });
});

// ─────────────────────────────────────────────────────────────
// 8. liveries — series folders (F1, F2, WEC, ELMS) → teams.UniqueName
//              car folders (GT2, GT3, GT4, ST, TCX)  → cars.UniqueName
// ─────────────────────────────────────────────────────────────
describe.skip('liveries (series — teams)', () => {
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

describe.skip('liveries (cars — cars.UniqueName)', () => {
  const CAR_DIRS = ['liveries/GT2', 'liveries/GT3', 'liveries/GT4', 'liveries/ST', 'liveries/TCX'];

  for (const dir of CAR_DIRS) {
    it(`${dir} — every image base matches a cars.UniqueName`, () => {
      const images = listImages(dir).filter(img => img.variant === null);
      expect(fmt(orphans(images, db.carNames))).toBe('');
    });
  }
});

// ─────────────────────────────────────────────────────────────
// 9a. flags — every nations.FlagFileName must resolve to an existing file
// ─────────────────────────────────────────────────────────────
describe.skip('flags — JSON references files', () => {
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
// 9b. flags — every flag file must be resolvable by at least one nation
//     Valid candidates: FlagFileName (exact), Name (normalized), Code (lowercase)
// ─────────────────────────────────────────────────────────────
describe.skip('flags — files referenced by nations', () => {
  it('every flag file is resolvable by at least one nation', () => {
    // Build set of all valid raw names (without .png) the app can resolve
    const validFlagBases = new Set();
    for (const nation of db.nations) {
      if (nation.FlagFileName) {
        // strip .png extension for comparison with img.rawName
        validFlagBases.add(nation.FlagFileName.replace(/\.png$/i, ''));
      }
      if (nation.Name) validFlagBases.add(normName(nation.Name));
      if (nation.Code) validFlagBases.add(nation.Code.toLowerCase());
    }
    const images = listImages('flags');
    const bad = images
      .filter(img => !validFlagBases.has(img.rawName))
      .map(img => `[${img.relPath}] "${img.rawName}.png" not resolvable by any nation`);
    expect(fmt(bad)).toBe('');
  });
});
