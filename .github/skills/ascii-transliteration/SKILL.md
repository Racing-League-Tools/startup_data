---
name: ascii-transliteration
description: "Transliterate non-ASCII / diacritic characters to plain ASCII in startup_data JSON files. Use when: replacing accented letters, fixing non-ASCII test failures, converting diacritics in CircuitName, CircuitFullName, LocationName, CircuitOrigin, Name, AliasesRaw fields, or any string field in the motorsport data files."
argument-hint: "Optional: target file or entity type (e.g. circuits, drivers, teams)"
---

# ASCII Transliteration for startup_data JSON files

## When to Use
- Jest test `04-encoding.test.js` reports non-ASCII character failures
- Adding new records with diacritic characters (Portuguese, Spanish, French, German, Turkish names)
- Reviewing any `startup_data/*.json` file for encoding compliance before committing

## Character Mapping

All string fields in every record must use only ASCII (codepoints <= U+007E), **except** fields listed in `SKIP_FIELDS` (`_file`, `OfficialLink`, `FlagFileName`).

| Char | U+     | -> ASCII | Examples                                                      |
|------|--------|----------|---------------------------------------------------------------|
| `à`  | U+00E0 | `a`      | Velo Città -> Velo Citta                                     |
| `á`  | U+00E1 | `a`      | Gálvez -> Galvez, Cabalén -> Cabalen, Jacarepaguá -> Jacarepagua, Cacá -> Caca |
| `Á`  | U+00C1 | `A`      | Ángel -> Angel                                               |
| `â`  | U+00E2 | `a`      | Goiânia -> Goiania, Câmara -> Camara                         |
| `ã`  | U+00E3 | `a`      | Tarumã -> Taruma, Galeão -> Galeao, Viamão -> Viamao         |
| `é`  | U+00E9 | `e`      | José -> Jose, Guaporé -> Guapore, Macéo -> Maceo, Léman -> Leman |
| `í`  | U+00ED | `i`      | Brasília -> Brasilia, Río -> Rio, Espírito -> Espirito       |
| `ó`  | U+00F3 | `o`      | Autódromo -> Autodromo, Córdoba -> Cordoba, Kartódromo -> Kartodromo |
| `ú`  | U+00FA | `u`      | Iguaçú -> Iguacu, Guaçú -> Guacu                            |
| `ç`  | U+00E7 | `c`      | Iguaçu -> Iguacu, François -> Francois, Yoluç -> Yoluc, Mogi Guaçu -> Mogi Guacu |
| `ü`  | U+00FC | `u`      | Südschleife -> Sudschleife (simple `u`, not German `ue`)     |
| `ï`  | U+00EF | `i`      | Loïc -> Loic                                                 |
| `ß`  | U+00DF | `ss`     | Straße -> Strasse (if encountered)                           |
| `–`  | U+2013 | `-`      | Jerez – Ángel Nieto -> Jerez - Angel Nieto                  |
| `—`  | U+2014 | `-`      | (em dash, if encountered)                                    |

## Procedure

1. Run `04-encoding.test.js` to get the current violation list — output shows file, record key, field name and offending glyphs
2. Apply substitutions from the table above to all string fields except `SKIP_FIELDS`
3. **Do NOT touch `UniqueName` fields** — they are identifiers constrained to `[a-z0-9.]`, tested separately by the "UniqueName character set" describe block
4. Re-run `04-encoding.test.js` — the "Non-ASCII characters in string fields" describe block must show 0 failures

## Known Affected Files (as of 2026-04-19)

| File | Violations | Fields affected |
|------|-----------|-----------------|
| `startup_data/circuits.json` | ~127 | `CircuitName`, `CircuitFullName`, `LocationName`, `CircuitOrigin` |
| `startup_data/drivers.endurance.json` | 5 | `Name` |
| `startup_data/teams.elms.2025.json` | 2 | `AliasesRaw` |

## Test Reference

File: `__tests__/04-encoding.test.js`  
Describe block: `'Non-ASCII characters in string fields'`  
Helper: `nonAsciiAll(records, keyFn)` — scans all string fields per record, skips `SKIP_FIELDS`
