'use strict';

const { loadAll, fmt } = require('./helpers/loader');

let db;
beforeAll(() => { db = loadAll(); });

/**
 * Scan records for non-ASCII characters in the given string fields.
 * Returns violation strings showing the offending characters.
 */
function nonAsciiFields(records, keyFn, ...fields) {
  const violations = [];
  for (const r of records) {
    for (const field of fields) {
      const val = r[field];
      if (typeof val !== 'string' || val === '') continue;
      const bad = [...val].filter(ch => ch.charCodeAt(0) > 0x7E);
      if (bad.length) {
        const glyphs = [...new Set(bad)].map(ch => `'${ch}' U+${ch.charCodeAt(0).toString(16).toUpperCase().padStart(4,'0')}`).join(', ');
        violations.push(`[${r._file}] "${keyFn(r)}" — ${field}: "${val}" contains non-ASCII: ${glyphs}`);
      }
    }
  }
  return violations;
}

/**
 * Scan records to ensure UniqueName-style keys contain only [a-z0-9._-].
 */
function invalidUniqueNames(records, keyFn) {
  const SAFE = /^[a-z0-9._-]+$/;
  const violations = [];
  for (const r of records) {
    const val = r.UniqueName;
    if (typeof val !== 'string' || val === '') continue;
    if (!SAFE.test(val)) {
      violations.push(`[${r._file}] "${keyFn(r)}" — UniqueName: "${val}" contains invalid characters (allowed: a-z 0-9 . _ -)`);
    }
  }
  return violations;
}

// ─────────────────────────────────────────────
// 1. Non-ASCII characters in display name fields
// ─────────────────────────────────────────────
describe('Non-ASCII characters in name fields', () => {
  it('nations.Name must be ASCII', () => {
    expect(fmt(nonAsciiFields(db.nations, r => r.Name, 'Name'))).toBe('');
  });

  it('car_classes.Name must be ASCII', () => {
    expect(fmt(nonAsciiFields(db.carClasses, r => r.UniqueName, 'Name'))).toBe('');
  });

  it('vendors.Name must be ASCII', () => {
    expect(fmt(nonAsciiFields(db.vendors, r => r.UniqueName, 'Name'))).toBe('');
  });

  it('games.Name must be ASCII', () => {
    expect(fmt(nonAsciiFields(db.games, r => r.UniqueName, 'Name'))).toBe('');
  });

  it('circuits.CircuitName must be ASCII', () => {
    expect(fmt(nonAsciiFields(db.circuits, r => r.UniqueName, 'CircuitName', 'Name'))).toBe('');
  });

  it('cars.Name must be ASCII', () => {
    expect(fmt(nonAsciiFields(db.cars, r => r.UniqueName, 'Name'))).toBe('');
  });

  it('teams.Name must be ASCII', () => {
    expect(fmt(nonAsciiFields(db.teams, r => r.UniqueName, 'Name'))).toBe('');
  });

  it('drivers.Name must be ASCII', () => {
    expect(fmt(nonAsciiFields(db.drivers, r => r.Name, 'Name'))).toBe('');
  });

  it('championships.Name must be ASCII', () => {
    expect(fmt(nonAsciiFields(db.championships, r => r.UniqueName, 'Name'))).toBe('');
  });
});

// ─────────────────────────────────────────────
// 2. UniqueName keys must use [a-z0-9._-] only
// ─────────────────────────────────────────────
describe('UniqueName character set', () => {
  it('car_classes.UniqueName must use only [a-z0-9._-]', () => {
    expect(fmt(invalidUniqueNames(db.carClasses, r => r.UniqueName))).toBe('');
  });

  it('vendors.UniqueName must use only [a-z0-9._-]', () => {
    expect(fmt(invalidUniqueNames(db.vendors, r => r.UniqueName))).toBe('');
  });

  it('games.UniqueName must use only [a-z0-9._-]', () => {
    expect(fmt(invalidUniqueNames(db.games, r => r.UniqueName))).toBe('');
  });

  it('circuits.UniqueName must use only [a-z0-9._-]', () => {
    expect(fmt(invalidUniqueNames(db.circuits, r => r.UniqueName))).toBe('');
  });

  it('cars.UniqueName must use only [a-z0-9._-]', () => {
    expect(fmt(invalidUniqueNames(db.cars, r => r.UniqueName))).toBe('');
  });

  it('teams.UniqueName must use only [a-z0-9._-]', () => {
    expect(fmt(invalidUniqueNames(db.teams, r => r.UniqueName))).toBe('');
  });

  it('championships.UniqueName must use only [a-z0-9._-]', () => {
    expect(fmt(invalidUniqueNames(db.championships, r => r.UniqueName))).toBe('');
  });
});
