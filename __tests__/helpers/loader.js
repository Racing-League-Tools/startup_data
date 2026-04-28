'use strict';

const fs = require('fs');
const path = require('path');

const DATA_DIR = path.resolve(__dirname, '../../startup_data');

/**
 * Strip // comments from JSON-like text, but only when outside string literals.
 * This avoids corrupting URLs like https://... that contain //.
 */
function stripComments(text) {
  let result = '';
  let i = 0;
  while (i < text.length) {
    const ch = text[i];
    if (ch === '"') {
      // Inside a string — copy verbatim, respecting escape sequences
      result += ch;
      i++;
      while (i < text.length) {
        const sc = text[i];
        result += sc;
        if (sc === '\\') {
          i++;
          if (i < text.length) result += text[i];
        } else if (sc === '"') {
          break;
        }
        i++;
      }
    } else if (ch === '/' && i + 1 < text.length && text[i + 1] === '/') {
      // Line comment outside a string — skip to end of line
      while (i < text.length && text[i] !== '\n') i++;
      continue;
    } else {
      result += ch;
    }
    i++;
  }
  return result;
}

/**
 * Parse a JSON file with relaxed settings (trailing commas, // comments).
 * Returns the parsed value or throws with the file path in the message.
 */
function parseRelaxed(filePath) {
  let raw = fs.readFileSync(filePath, 'utf8');

  // Strip UTF-8 BOM if present (C# handles this automatically)
  if (raw.charCodeAt(0) === 0xFEFF) raw = raw.slice(1);

  // Strip single-line comments respecting string literals
  raw = stripComments(raw);

  // Strip trailing commas before } or ]
  raw = raw.replace(/,(\s*[}\]])/g, '$1');

  try {
    return JSON.parse(raw);
  } catch (err) {
    throw new Error(`JSON parse error in ${filePath}: ${err.message}`);
  }
}

/**
 * Load all files matching a pattern like "nations*.json" from DATA_DIR.
 * Returns a flat array of all records across all matching files,
 * each record annotated with { _file: 'filename.json' }.
 */
function loadGlob(pattern) {
  const regex = globToRegex(pattern);
  const allFiles = fs.readdirSync(DATA_DIR);
  const matching = allFiles.filter(f => regex.test(f));

  const records = [];
  for (const file of matching) {
    const filePath = path.join(DATA_DIR, file);
    const data = parseRelaxed(filePath);
    if (!Array.isArray(data)) {
      throw new Error(`Expected JSON array in ${file}, got ${typeof data}`);
    }
    for (const record of data) {
      records.push({ ...record, _file: file });
    }
  }
  return records;
}

/**
 * Convert a glob pattern like "nations*.json" to a RegExp.
 */
function globToRegex(pattern) {
  const escaped = pattern.replace(/[.+^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '.*');
  return new RegExp(`^${escaped}$`, 'i');
}

/**
 * Build a Set of values from an array of records for a given field.
 */
function buildSet(records, field) {
  const set = new Set();
  for (const r of records) {
    if (r[field] != null && r[field] !== '') {
      set.add(r[field]);
    }
  }
  return set;
}

/**
 * Load everything and return a single object with all collections.
 * Each collection is an array of records (with _file annotation).
 * Each collection also exposes a pre-built Set / Map for fast lookup.
 */
function loadAll() {
  const nations       = loadGlob('nations*.json');
  const carClasses    = loadGlob('car_classes*.json');
  const vendors       = loadGlob('vendors*.json');
  const games         = loadGlob('games*.json');
  const circuits      = loadGlob('circuits*.json');
  const cars          = loadGlob('cars*.json');
  const teams         = loadGlob('teams*.json');
  const drivers       = loadGlob('drivers*.json');
  const championships = loadGlob('championships*.json');
  const lineups       = loadGlob('lineups*.json');
  const pointActions  = loadGlob('point_actions*.json');

  return {
    nations,
    carClasses,
    vendors,
    games,
    circuits,
    cars,
    teams,
    drivers,
    championships,
    lineups,
    pointActions,

    // Pre-built lookup sets (unique keys)
    nationNames:          buildSet(nations,       'Name'),
    carClassNames:        buildSet(carClasses,     'UniqueName'),
    vendorNames:          buildSet(vendors,        'UniqueName'),
    gameNames:            buildSet(games,          'UniqueName'),
    circuitNames:         buildSet(circuits,       'UniqueName'),
    carNames:             buildSet(cars,           'UniqueName'),
    teamNames:            buildSet(teams,          'UniqueName'),
    driverNames:          buildSet(drivers,        'Name'),
    championshipNames:    buildSet(championships,  'UniqueName'),

    // Combined set: valid championship references include both UniqueName and BaseChampionship.
    // PointAction.Championship can reference either (series-wide rules use BaseChampionship).
    championshipRefs: (() => {
      const refs = new Set();
      for (const c of championships) {
        if (c.UniqueName)        refs.add(c.UniqueName);
        if (c.BaseChampionship)  refs.add(c.BaseChampionship);
      }
      return refs;
    })(),
  };
}

/**
 * Format violations array into a compact failure message.
 * Shows up to `limit` examples, then a "...and N more" suffix.
 * Using this in `expect(fmt(violations)).toBe('')` produces readable output
 * in VS Code's Testing panel even for large violation sets.
 */
function fmt(violations, limit = 10) {
  if (violations.length === 0) return '';
  const shown = violations.slice(0, limit);
  const rest  = violations.length - shown.length;
  const tail  = rest > 0 ? `\n  ...and ${rest} more (${violations.length} total)` : ` (${violations.length} total)`;
  return shown.join('\n') + tail;
}

const IMAGES_DIR = path.resolve(__dirname, '../../images');

/**
 * Recursively list all .png files under a given directory.
 * Returns an array of objects { base, variants } where:
 *   base     — filename without extension and without __variant suffix
 *   variants — Set of variant suffixes found (e.g. 'dark', 'light', 'alternative')
 *              Empty set means no variants, just the plain file.
 *   rawName  — filename without extension (full, including __variant)
 *   relPath  — path relative to IMAGES_DIR (using forward slashes)
 */
function listImages(subDir) {
  const dir = path.join(IMAGES_DIR, subDir);
  const results = [];
  if (!fs.existsSync(dir)) return results;

  function walk(current) {
    for (const entry of fs.readdirSync(current, { withFileTypes: true })) {
      const full = path.join(current, entry.name);
      if (entry.isDirectory()) {
        walk(full);
      } else if (entry.name.endsWith('.png')) {
        const rawName = entry.name.slice(0, -4); // strip .png
        const relPath = path.relative(IMAGES_DIR, full).replace(/\\/g, '/');
        const dblIdx = rawName.indexOf('__');
        const base    = dblIdx === -1 ? rawName : rawName.slice(0, dblIdx);
        const variant = dblIdx === -1 ? null    : rawName.slice(dblIdx + 2);
        results.push({ base, variant, rawName, relPath });
      }
    }
  }
  walk(dir);
  return results;
}

module.exports = { loadAll, DATA_DIR, IMAGES_DIR, parseRelaxed, stripComments, fmt, listImages };
