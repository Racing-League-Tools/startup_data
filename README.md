# startup_data

Reference data for the RLT application — championships, teams, cars, drivers, circuits, and related entities in JSON format.

The application loads all files from `startup_data/` at startup using wildcard globs (`teams*.json`, `circuits*.json`, etc.). Multiple files per entity type are supported, which allows splitting data by series or season. See [`startup-data.md`](startup-data.md) for the full schema reference.

---

## Repository structure

```
startup_data/          # JSON data files consumed by the application
  circuits.json
  teams.f1.2025.json
  lineups.wec.2025.json
  ...
__tests__/             # Jest validation test suite
  01-format.test.js
  02-uniqueness.test.js
  03-cross-refs.test.js
  04-encoding.test.js
  helpers/loader.js
.github/
  workflows/ci.yml     # Runs tests on every PR and push to main
  skills/              # Copilot agent skills (encoding rules, etc.)
.vscode/
  extensions.json      # Recommends orta.vscode-jest
  schemas/             # JSON schemas for IntelliSense in data files
startup-data.md        # Full entity schema reference
```

---

## Contributing workflow

### 1. Create a branch

```bash
git switch -c my-branch
```

Never commit directly to `main`.

### 2. Edit data files

- All files live in `startup_data/`.
- Follow the naming convention `<type>.<series>[.<year>].json` (e.g. `teams.f1.2026.json`).
- Every file must be a UTF-8 JSON array `[ ... ]`. Trailing commas and `//` comments are allowed.
- String fields must use **plain ASCII only** — transliterate diacritics before committing (see [encoding rules](#encoding-rules) below).
- `UniqueName` fields must match `^[a-z0-9.]+$`.

JSON schemas in `.vscode/schemas/` provide IntelliSense and field-level validation directly in the editor.

### 3. Fix test failures as you go

Install the recommended **Jest** extension (`orta.vscode-jest`) — VS Code will prompt you automatically.

Open the **Testing** panel (flask icon in the Activity Bar). Tests re-run on save and highlight failures inline. All four suites must pass before opening a PR:

| Suite | What it checks |
|-------|----------------|
| `01-format` | JSON parses correctly; required fields present; color format; lineup seat logic |
| `02-uniqueness` | Unique keys within each entity type; lineup uniqueness per file |
| `03-cross-refs` | Foreign key integrity (e.g. every `LineUp.Driver` must exist in `drivers.*`) |
| `04-encoding` | All string fields are ASCII; `UniqueName` matches `^[a-z0-9.]+$` |

See [`__tests__/README.md`](__tests__/README.md) for full details and terminal commands.

### 4. Open a Pull Request

Push your branch and open a PR against `main`. The CI workflow (`.github/workflows/ci.yml`) runs the full Jest suite on GitHub Actions. Test results are published as a check directly on the PR — a failing check blocks merge.

### 5. Merge

Once all checks are green and the PR is reviewed, merge into `main`.

---

## Encoding rules

All user-visible string fields must be plain ASCII. When entering names that contain diacritics, transliterate using the following mapping (see also `.github/skills/ascii-transliteration/SKILL.md`):

| Characters | → | Examples |
|------------|---|---------|
| à á â ã | a | Autódromo → Autodromo, Goiânia → Goiania, Tarumã → Taruma |
| Á | A | Ángel → Angel |
| é | e | José → Jose, Macéo → Maceo, Léman → Leman |
| í | i | Brasília → Brasilia, Río → Rio |
| ó | o | Córdoba → Cordoba, Kartódromo → Kartodromo |
| ú | u | Iguaçú → Iguacu |
| ç | c | Iguaçu → Iguacu, François → Francois |
| ü | u | Südschleife → Sudschleife |
| ï | i | Loïc → Loic |
| ß | ss | Straße → Strasse |
| – — | - | Jerez – Ángel → Jerez - Angel |

Fields that are intentionally exempt (URLs, file paths): `OfficialLink`, `FlagFileName`.

---

## Setup

Requires **Node.js** 20.x or later.

```bash
npm install
```

Then open VS Code — it will prompt you to install the Jest extension if not already present.
