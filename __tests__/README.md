# startup_data Validation Tests

These tests verify the integrity of JSON files in the `startup_data/` folder.

## Requirements

- **Node.js** (LTS recommended, e.g. 20.x or 22.x)
- **npm** (bundled with Node.js)

## Install dependencies

```bash
npm install
```

Installs:
- `jest` — test framework
- `glob` — file discovery helper

## Running tests

The recommended way is the **Jest** VS Code extension (`orta.vscode-jest`).  
It is listed in `.vscode/extensions.json` — VS Code will prompt you to install it when you open this workspace.

Once installed:
- open the **Testing** panel (flask icon in the Activity Bar)
- tests are discovered automatically via `jest.config.js`
- run all, a single suite, or a single test with one click
- failures are highlighted inline in the editor

### Running from the terminal

```bash
npm test                                            # all tests
npm test -- --testPathPattern=01-format            # single suite
npm test -- --testPathPattern=02-uniqueness
npm test -- --testPathPattern=03-cross-refs
npm test -- --testPathPattern=04-encoding
```

## Test suite overview

| File | What it checks |
|------|----------------|
| `01-format.test.js` | Every JSON file in `startup_data/` parses correctly (allowed: BOM, `//` comments, trailing commas); required fields present; color field format; lineup seat logic |
| `02-uniqueness.test.js` | Uniqueness of keys (e.g. `UniqueName`) across all files of a given collection; lineup uniqueness per file |
| `03-cross-refs.test.js` | Cross-file referential integrity (foreign keys — e.g. a `Car` referenced in a lineup must exist in `cars.*`) |
| `04-encoding.test.js` | (1) All string fields in every record contain only ASCII characters (codepoints ≤ U+007E); skips `OfficialLink`, `FlagFileName`. (2) `UniqueName` fields match `^[a-z0-9.]+$` |

JSON files are loaded by `helpers/loader.js`, which handles non-standard syntax (BOM, comments, trailing commas).

## Non-ASCII character policy

All user-visible string fields must use plain ASCII. Diacritics are transliterated according to the mapping in `.github/skills/ascii-transliteration/SKILL.md`:

| Char | → | Example |
|------|---|---------|
| à á â ã | a | Autódromo → Autodromo, Goiânia → Goiania |
| Á | A | Ángel → Angel |
| é | e | José → Jose, Macéo → Maceo |
| í | i | Brasília → Brasilia |
| ó | o | Autódromo → Autodromo, Córdoba → Cordoba |
| ú | u | Iguaçú → Iguacu |
| ç | c | Iguaçu → Iguacu, François → Francois |
| ü | u | Südschleife → Sudschleife |
| ï | i | Loïc → Loic |
| ß | ss | Straße → Strasse |
| – — | - | Jerez – Ángel → Jerez - Angel |
