'use strict';

const { loadAll, fmt } = require('./helpers/loader');

let db;
beforeAll(() => { db = loadAll(); });

/**
 * Find duplicate keys in an array of records.
 * Returns an array of violation strings.
 */
function findDuplicates(records, keyFn, label) {
  const seen = new Map(); // key → first _file
  const duplicates = [];
  for (const r of records) {
    const key = keyFn(r);
    if (key == null || key === '') continue;
    if (seen.has(key)) {
      duplicates.push(`"${key}" — first in ${seen.get(key)}, duplicate in ${r._file}`);
    } else {
      seen.set(key, r._file);
    }
  }
  return duplicates.map(d => `[${label}] ${d}`);
}

// ─────────────────────────────────────────────
// 1. Simple unique keys
// ─────────────────────────────────────────────
describe('Unique keys — simple', () => {
  it('nations.Name must be unique', () => {
    expect(fmt(findDuplicates(db.nations, r => r.Name, 'nations'))).toBe('');
  });

  it('car_classes.UniqueName must be unique', () => {
    expect(fmt(findDuplicates(db.carClasses, r => r.UniqueName, 'car_classes'))).toBe('');
  });

  it('vendors.UniqueName must be unique', () => {
    expect(fmt(findDuplicates(db.vendors, r => r.UniqueName, 'vendors'))).toBe('');
  });

  it('games.UniqueName must be unique', () => {
    expect(fmt(findDuplicates(db.games, r => r.UniqueName, 'games'))).toBe('');
  });

  it('circuits.UniqueName must be unique', () => {
    expect(fmt(findDuplicates(db.circuits, r => r.UniqueName, 'circuits'))).toBe('');
  });

  it('cars.UniqueName must be unique', () => {
    expect(fmt(findDuplicates(db.cars, r => r.UniqueName, 'cars'))).toBe('');
  });

  it('teams.UniqueName must be unique', () => {
    expect(fmt(findDuplicates(db.teams, r => r.UniqueName, 'teams'))).toBe('');
  });

  it('drivers.Name must be unique within each driver file', () => {
    const violations = [];
    const byFile = {};
    for (const r of db.drivers) {
      (byFile[r._file] = byFile[r._file] || []).push(r);
    }
    for (const records of Object.values(byFile)) {
      violations.push(...findDuplicates(records, r => r.Name, 'drivers'));
    }
    expect(fmt(violations)).toBe('');
  });

  it('championships.UniqueName must be unique', () => {
    expect(fmt(findDuplicates(db.championships, r => r.UniqueName, 'championships'))).toBe('');
  });
});

// ─────────────────────────────────────────────
// 2. Composite keys
// ─────────────────────────────────────────────
describe('Unique keys — composite', () => {
  it('lineups: (Driver + SeatPosition + Championship) must be unique within each lineup file', () => {
    const violations = [];
    const byFile = {};
    for (const r of db.lineups) {
      (byFile[r._file] = byFile[r._file] || []).push(r);
    }
    for (const records of Object.values(byFile)) {
      violations.push(...findDuplicates(
        records,
        r => `${r.Driver}|${r.SeatPosition}|${r.Championship}`,
        'lineups'
      ));
    }
    expect(fmt(violations)).toBe('');
  });

  it('point_actions: (ActionType + SessionType + Championship + RaceType + QualificationType) must be unique', () => {
    const violations = findDuplicates(
      db.pointActions,
      r => `${r.ActionType}|${r.SessionType}|${r.Championship ?? ''}|${r.RaceType ?? ''}|${r.QualificationType ?? ''}`,
      'point_actions'
    );
    expect(fmt(violations)).toBe('');
  });
});
