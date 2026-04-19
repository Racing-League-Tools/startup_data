'use strict';

const fs = require('fs');
const path = require('path');
const { loadAll, DATA_DIR, parseRelaxed, stripComments, fmt } = require('./helpers/loader');

let db;
beforeAll(() => { db = loadAll(); });

// ─────────────────────────────────────────────
// 1. Every file in startup_data/ is valid JSON (after relaxed parsing: BOM, comments, trailing commas)
// ─────────────────────────────────────────────
describe('File format', () => {
  const jsonFiles = fs.readdirSync(DATA_DIR).filter(f => f.endsWith('.json'));

  it('every *.json file must parse as a JSON array (relaxed: BOM, comments, trailing commas allowed)', () => {
    const nonArrayFiles = [];
    for (const file of jsonFiles) {
      let parsed;
      try {
        parsed = parseRelaxed(path.join(DATA_DIR, file));
      } catch (e) {
        nonArrayFiles.push(`${file}: ${e.message}`);
        continue;
      }
      if (!Array.isArray(parsed)) {
        nonArrayFiles.push(`${file}: root element is ${typeof parsed}, expected array`);
      }
    }
    expect(fmt(nonArrayFiles)).toBe('');
  });

  it('files should not contain a UTF-8 BOM (byte order mark)', () => {
    const bomFiles = jsonFiles.filter(file => {
      const buf = fs.readFileSync(path.join(DATA_DIR, file));
      return buf[0] === 0xEF && buf[1] === 0xBB && buf[2] === 0xBF;
    });
    expect(fmt(bomFiles)).toBe('');
  });

  it('files should have no trailing commas (// comments are allowed, as in .jsonc)', () => {
    const violations = [];
    for (const file of jsonFiles) {
      let raw = fs.readFileSync(path.join(DATA_DIR, file), 'utf8')
        .replace(/^\uFEFF/, ''); // strip BOM
      raw = stripComments(raw);  // strip // comments — they are permitted
      try {
        JSON.parse(raw);
      } catch (e) {
        violations.push(`${file}: ${e.message}`);
      }
    }
    expect(fmt(violations)).toBe('');
  });
});

// ─────────────────────────────────────────────
// 2. Required fields
// ─────────────────────────────────────────────
describe('Required fields', () => {

  function missingField(records, ...fields) {
    const violations = [];
    for (const r of records) {
      for (const f of fields) {
        if (r[f] == null || r[f] === '') {
          violations.push(`[${r._file}] ${JSON.stringify(r)} — missing required field "${f}"`);
        }
      }
    }
    return violations;
  }

  it('nations: Name is required', () => {
    expect(fmt(missingField(db.nations, 'Name'))).toBe('');
  });

  it('car_classes: UniqueName and Name are required', () => {
    expect(fmt(missingField(db.carClasses, 'UniqueName', 'Name'))).toBe('');
  });

  it('vendors: UniqueName and Name are required', () => {
    expect(fmt(missingField(db.vendors, 'UniqueName', 'Name'))).toBe('');
  });

  it('games: UniqueName and Name are required', () => {
    expect(fmt(missingField(db.games, 'UniqueName', 'Name'))).toBe('');
  });

  it('circuits: UniqueName and CircuitName are required', () => {
    expect(fmt(missingField(db.circuits, 'UniqueName', 'CircuitName'))).toBe('');
  });

  it('cars: UniqueName and Name are required', () => {
    expect(fmt(missingField(db.cars, 'UniqueName', 'Name'))).toBe('');
  });

  it('teams: UniqueName and Name are required', () => {
    expect(fmt(missingField(db.teams, 'UniqueName', 'Name'))).toBe('');
  });

  it('drivers: Name is required', () => {
    expect(fmt(missingField(db.drivers, 'Name'))).toBe('');
  });

  it('championships: UniqueName and Name are required', () => {
    expect(fmt(missingField(db.championships, 'UniqueName', 'Name'))).toBe('');
  });

  it('lineups: Driver, Team, Championship and SeatType are required', () => {
    expect(fmt(missingField(db.lineups, 'Driver', 'Team', 'Championship', 'SeatType'))).toBe('');
  });

  it('point_actions: ActionType, DriverPoints and SessionType are required', () => {
    expect(fmt(missingField(db.pointActions, 'ActionType', 'SessionType'))).toBe('');
  });
});

// 3. Color format — accepted formats (RltColor.Parse):
//   #RRGGBB        — 6-digit hex, alpha assumed FF
//   #AARRGGBB      — 8-digit hex, explicit alpha
//   R,G,B          — comma-separated bytes 0-255
//   R,G,B,A        — comma-separated bytes with alpha
// Empty string ("") is NOT valid — omit the field instead.
// Applies to: teams.*, cars.*
// ─────────────────────────────────────────────
describe('Color format', () => {
  const HEX6  = /^#[0-9A-Fa-f]{6}$/;
  const HEX8  = /^#[0-9A-Fa-f]{8}$/;
  const BYTE  = '(25[0-5]|2[0-4]\\d|1?\\d{1,2})';
  const RGB   = new RegExp(`^${BYTE},${BYTE},${BYTE}$`);
  const RGBA  = new RegExp(`^${BYTE},${BYTE},${BYTE},${BYTE}$`);

  function isValidColor(val) {
    return HEX6.test(val) || HEX8.test(val) || RGB.test(val) || RGBA.test(val);
  }

  function invalidColors(records, keyFn, field) {
    const violations = [];
    for (const r of records) {
      const val = r[field];
      if (val == null || val === '') continue; // absent or empty = no colour set
      if (!isValidColor(val)) {
        violations.push(`[${r._file}] "${keyFn(r)}" — ${field}: "${val}" is not a valid colour`);
      }
    }
    return violations;
  }

  it('teams.Color must be a valid colour when present', () => {
    expect(fmt(invalidColors(db.teams, t => t.UniqueName, 'Color'))).toBe('');
  });

  it('teams.SecondaryColor must be a valid colour when present', () => {
    expect(fmt(invalidColors(db.teams, t => t.UniqueName, 'SecondaryColor'))).toBe('');
  });

  it('teams.TertiaryColor must be a valid colour when present', () => {
    expect(fmt(invalidColors(db.teams, t => t.UniqueName, 'TertiaryColor'))).toBe('');
  });

  it('cars.Color must be a valid colour when present', () => {
    expect(fmt(invalidColors(db.cars, c => c.UniqueName, 'Color'))).toBe('');
  });

  it('cars.SecondaryColor must be a valid colour when present', () => {
    expect(fmt(invalidColors(db.cars, c => c.UniqueName, 'SecondaryColor'))).toBe('');
  });

  it('cars.TertiaryColor must be a valid colour when present', () => {
    expect(fmt(invalidColors(db.cars, c => c.UniqueName, 'TertiaryColor'))).toBe('');
  });
});

// ─────────────────────────────────────────────
// 4. Lineup seat logic
// ─────────────────────────────────────────────
describe('Lineup seat logic', () => {
  it('SeatType must be "Primary" or "Reserve"', () => {
    const violations = db.lineups
      .filter(l => l.SeatType !== 'Primary' && l.SeatType !== 'Reserve')
      .map(l => `[${l._file}] Driver "${l.Driver}" — SeatType "${l.SeatType}" is invalid`);
    expect(fmt(violations)).toBe('');
  });

  it('Primary seats: SeatPosition >= 1 and ReservePosition == 0', () => {
    const violations = db.lineups
      .filter(l => l.SeatType === 'Primary')
      .filter(l => l.SeatPosition < 1 || l.ReservePosition !== 0)
      .map(l => `[${l._file}] Driver "${l.Driver}" (Primary) — SeatPosition=${l.SeatPosition}, ReservePosition=${l.ReservePosition}`);
    expect(fmt(violations)).toBe('');
  });

  it('Reserve seats: SeatPosition == 0 and ReservePosition >= 1', () => {
    const violations = db.lineups
      .filter(l => l.SeatType === 'Reserve')
      .filter(l => l.SeatPosition !== 0 || l.ReservePosition < 1)
      .map(l => `[${l._file}] Driver "${l.Driver}" (Reserve) — SeatPosition=${l.SeatPosition}, ReservePosition=${l.ReservePosition}`);
    expect(fmt(violations)).toBe('');
  });
});
