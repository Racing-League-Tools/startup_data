'use strict';

const { loadAll, fmt } = require('./helpers/loader');

let db;
beforeAll(() => { db = loadAll(); });

// Fields that intentionally hold arbitrary text (URLs, file paths) — skip non-ASCII check.
const SKIP_FIELDS = new Set(['_file', 'OfficialLink', 'FlagFileName']);

/**
 * Scan ALL string fields in every record for non-ASCII characters.
 * Returns violation strings showing the file, record key, field name and offending glyphs.
 */
function nonAsciiAll(records, keyFn) {
  const violations = [];
  for (const r of records) {
    for (const [field, val] of Object.entries(r)) {
      if (SKIP_FIELDS.has(field)) continue;
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
  const SAFE = /^[a-z0-9.]+$/;
  const violations = [];
  for (const r of records) {
    const val = r.UniqueName;
    if (typeof val !== 'string' || val === '') continue;
    if (!SAFE.test(val)) {
      violations.push(`[${r._file}] "${keyFn(r)}" — UniqueName: "${val}" contains invalid characters (allowed: a-z 0-9 .)`);
    }
  }
  return violations;
}

// ─────────────────────────────────────────────
// 1. Non-ASCII characters in any string field
// ─────────────────────────────────────────────
describe('Non-ASCII characters in string fields', () => {
  it('nations — all string fields must be ASCII', () => {
    expect(fmt(nonAsciiAll(db.nations, r => r.Name))).toBe('');
  });

  it('car_classes — all string fields must be ASCII', () => {
    expect(fmt(nonAsciiAll(db.carClasses, r => r.UniqueName))).toBe('');
  });

  it('vendors — all string fields must be ASCII', () => {
    expect(fmt(nonAsciiAll(db.vendors, r => r.UniqueName))).toBe('');
  });

  it('games — all string fields must be ASCII', () => {
    expect(fmt(nonAsciiAll(db.games, r => r.UniqueName))).toBe('');
  });

  it('circuits — all string fields must be ASCII', () => {
    expect(fmt(nonAsciiAll(db.circuits, r => r.UniqueName))).toBe('');
  });

  it('cars — all string fields must be ASCII', () => {
    expect(fmt(nonAsciiAll(db.cars, r => r.UniqueName))).toBe('');
  });

  it('teams — all string fields must be ASCII', () => {
    expect(fmt(nonAsciiAll(db.teams, r => r.UniqueName))).toBe('');
  });

  it('drivers — all string fields must be ASCII', () => {
    expect(fmt(nonAsciiAll(db.drivers, r => r.Name))).toBe('');
  });

  it('championships — all string fields must be ASCII', () => {
    expect(fmt(nonAsciiAll(db.championships, r => r.UniqueName))).toBe('');
  });
});

// ─────────────────────────────────────────────
// 2. UniqueName keys must use [a-z0-9._-] only
// ─────────────────────────────────────────────
describe('UniqueName character set', () => {
  it('car_classes.UniqueName must use only [a-z0-9.]', () => {
    expect(fmt(invalidUniqueNames(db.carClasses, r => r.UniqueName))).toBe('');
  });

  it('vendors.UniqueName must use only [a-z0-9.]', () => {
    expect(fmt(invalidUniqueNames(db.vendors, r => r.UniqueName))).toBe('');
  });

  it('games.UniqueName must use only [a-z0-9.]', () => {
    expect(fmt(invalidUniqueNames(db.games, r => r.UniqueName))).toBe('');
  });

  it('circuits.UniqueName must use only [a-z0-9.]', () => {
    expect(fmt(invalidUniqueNames(db.circuits, r => r.UniqueName))).toBe('');
  });

  it('cars.UniqueName must use only [a-z0-9.]', () => {
    expect(fmt(invalidUniqueNames(db.cars, r => r.UniqueName))).toBe('');
  });

  it('teams.UniqueName must use only [a-z0-9.]', () => {
    expect(fmt(invalidUniqueNames(db.teams, r => r.UniqueName))).toBe('');
  });

  it('championships.UniqueName must use only [a-z0-9.]', () => {
    expect(fmt(invalidUniqueNames(db.championships, r => r.UniqueName))).toBe('');
  });
});
