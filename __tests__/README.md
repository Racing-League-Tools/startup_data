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

All tests at once:
```bash
npm test
```

A specific test file:
```bash
npm test -- --testPathPattern=01-format
npm test -- --testPathPattern=02-uniqueness
npm test -- --testPathPattern=03-cross-refs
```

## VS Code extension

The **Jest** extension (`orta.vscode-jest`) is installed and provides:

```vscode-extensions
orta.vscode-jest
```

- run and browse test results directly in the editor (Testing panel)
- automatic test discovery via `jest.config.js`
- inline error highlighting

## Test suite overview

| File | What it checks |
|------|----------------|
| `01-format.test.js` | Every JSON file in `startup_data/` parses correctly (allowed: BOM, `//` comments, trailing commas) |
| `02-uniqueness.test.js` | Uniqueness of keys (e.g. `UniqueName`) across all files of a given collection |
| `03-cross-refs.test.js` | Cross-file referential integrity (foreign keys — e.g. a `Car` referenced in a lineup must exist in `cars.*`) |

JSON files are loaded by `helpers/loader.js`, which handles non-standard syntax (BOM, comments, trailing commas).
