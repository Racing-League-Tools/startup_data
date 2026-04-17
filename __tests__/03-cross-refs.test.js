'use strict';

const { loadAll, fmt } = require('./helpers/loader');

let db;
beforeAll(() => { db = loadAll(); });

/**
 * Helper: for each record in `records`, check that record[field] exists in lookupSet.
 * If the field is optional (allowNull=true), null/undefined values are skipped.
 * If the field is an array, each element is checked individually.
 * Returns an array of violation strings.
 */
function checkFK(records, field, lookupSet, label, allowNull = false) {
  const violations = [];
  for (const r of records) {
    const value = r[field];

    // Array FK (e.g. Championship.Cars[])
    if (Array.isArray(value)) {
      for (const item of value) {
        if (!lookupSet.has(item)) {
          violations.push(`[${r._file}] "${r.UniqueName ?? r.Name}" → ${label}["${item}"] not found`);
        }
      }
      continue;
    }

    // Scalar FK
    if (value == null || value === '') {
      if (!allowNull) {
        violations.push(`[${r._file}] "${r.UniqueName ?? r.Name}" — required FK field "${field}" is missing`);
      }
      continue;
    }
    if (!lookupSet.has(value)) {
      violations.push(`[${r._file}] "${r.UniqueName ?? r.Name}" → ${label}["${value}"] not found`);
    }
  }
  return violations;
}

// ─────────────────────────────────────────────
// cars → car_classes and vendors
// ─────────────────────────────────────────────
describe('cars cross-references', () => {
  it('Car.CarClass must reference an existing car_classes.UniqueName', () => {
    // CarClass is optional per schema — skip nulls
    const violations = checkFK(db.cars, 'CarClass', db.carClassNames, 'car_classes.UniqueName', true);
    expect(fmt(violations)).toBe('');
  });

  it('Car.Vendor must reference an existing vendors.UniqueName (when set)', () => {
    const violations = checkFK(db.cars, 'Vendor', db.vendorNames, 'vendors.UniqueName', true);
    expect(fmt(violations)).toBe('');
  });
});

// ─────────────────────────────────────────────
// teams → cars, nations
// ─────────────────────────────────────────────
describe('teams cross-references', () => {
  it('Team.Car must reference an existing cars.UniqueName (when set)', () => {
    const violations = checkFK(db.teams, 'Car', db.carNames, 'cars.UniqueName', true);
    expect(fmt(violations)).toBe('');
  });

  it('Team.Nationality must reference an existing nations.Name (when set)', () => {
    const violations = checkFK(db.teams, 'Nationality', db.nationNames, 'nations.Name', true);
    expect(fmt(violations)).toBe('');
  });
});

// ─────────────────────────────────────────────
// drivers → nations
// ─────────────────────────────────────────────
describe('drivers cross-references', () => {
  it('Driver.Nationality must reference an existing nations.Name (when set)', () => {
    const violations = checkFK(db.drivers, 'Nationality', db.nationNames, 'nations.Name', true);
    expect(fmt(violations)).toBe('');
  });
});

// ─────────────────────────────────────────────
// circuits → nations
// ─────────────────────────────────────────────
describe('circuits cross-references', () => {
  it('Circuit.Nation must reference an existing nations.Name (when set)', () => {
    const violations = checkFK(db.circuits, 'Nation', db.nationNames, 'nations.Name', true);
    expect(fmt(violations)).toBe('');
  });
});

// ─────────────────────────────────────────────
// vendors → nations
// ─────────────────────────────────────────────
describe('vendors cross-references', () => {
  it('Vendor.Country must reference an existing nations.Name (when set)', () => {
    const violations = checkFK(db.vendors, 'Country', db.nationNames, 'nations.Name', true);
    expect(fmt(violations)).toBe('');
  });
});

// ─────────────────────────────────────────────
// championships → games, cars, teams, circuits
// ─────────────────────────────────────────────
describe('championships cross-references', () => {
  it('Championship.Games[] items must reference existing games.UniqueName', () => {
    const violations = [];
    for (const c of db.championships) {
      if (!Array.isArray(c.Games)) continue;
      for (const g of c.Games) {
        if (!db.gameNames.has(g)) {
          violations.push(`[${c._file}] Championship "${c.UniqueName}" → games["${g}"] not found`);
        }
      }
    }
    expect(fmt(violations)).toBe('');
  });

  it('Championship.Cars[] items must reference existing cars.UniqueName', () => {
    const violations = [];
    for (const c of db.championships) {
      if (!Array.isArray(c.Cars)) continue;
      for (const car of c.Cars) {
        if (!db.carNames.has(car)) {
          violations.push(`[${c._file}] Championship "${c.UniqueName}" → cars["${car}"] not found`);
        }
      }
    }
    expect(fmt(violations)).toBe('');
  });

  it('Championship.Teams[] items must reference existing teams.UniqueName', () => {
    const violations = [];
    for (const c of db.championships) {
      if (!Array.isArray(c.Teams)) continue;
      for (const team of c.Teams) {
        if (!db.teamNames.has(team)) {
          violations.push(`[${c._file}] Championship "${c.UniqueName}" → teams["${team}"] not found`);
        }
      }
    }
    expect(fmt(violations)).toBe('');
  });

  it('Championship.Tracks[] items must reference existing circuits.UniqueName', () => {
    const violations = [];
    for (const c of db.championships) {
      if (!Array.isArray(c.Tracks)) continue;
      for (const track of c.Tracks) {
        if (!db.circuitNames.has(track)) {
          violations.push(`[${c._file}] Championship "${c.UniqueName}" → circuits["${track}"] not found`);
        }
      }
    }
    expect(fmt(violations)).toBe('');
  });
});

// ─────────────────────────────────────────────
// lineups → drivers, teams, championships
// ─────────────────────────────────────────────
describe('lineups cross-references', () => {
  it('LineUp.Driver must reference an existing drivers.Name', () => {
    const violations = db.lineups
      .filter(l => !db.driverNames.has(l.Driver))
      .map(l => `[${l._file}] Lineup → drivers["${l.Driver}"] not found (Team: "${l.Team}", Championship: "${l.Championship}")`);
    expect(fmt(violations)).toBe('');
  });

  it('LineUp.Team must reference an existing teams.UniqueName', () => {
    const violations = db.lineups
      .filter(l => !db.teamNames.has(l.Team))
      .map(l => `[${l._file}] Lineup → teams["${l.Team}"] not found (Driver: "${l.Driver}", Championship: "${l.Championship}")`);
    expect(fmt(violations)).toBe('');
  });

  it('LineUp.Championship must reference an existing championships.UniqueName or BaseChampionship', () => {
    // Lineups can use either a full UniqueName (e.g. "f1.2021") or a BaseChampionship (e.g. "wec", "indycar").
    const violations = db.lineups
      .filter(l => !db.championshipRefs.has(l.Championship))
      .map(l => `[${l._file}] Lineup → championships["${l.Championship}"] not found (Driver: "${l.Driver}", Team: "${l.Team}")`);
    expect(fmt(violations)).toBe('');
  });
});

// ─────────────────────────────────────────────
// point_actions → championships
// ─────────────────────────────────────────────
describe('point_actions cross-references', () => {
  it('PointAction.Championship must reference an existing championships.UniqueName or BaseChampionship (when set)', () => {
    // PointAction.Championship can be a full UniqueName (e.g. "f1.2021") or a BaseChampionship
    // (e.g. "wec", "indycar") — the app matches both at runtime.
    const violations = db.pointActions
      .filter(p => p.Championship != null && p.Championship !== '')
      .filter(p => !db.championshipRefs.has(p.Championship))
      .map(p => `[${p._file}] PointAction "${p.ActionType}" → championships["${p.Championship}"] not found`);
    expect(fmt(violations)).toBe('');
  });
});
