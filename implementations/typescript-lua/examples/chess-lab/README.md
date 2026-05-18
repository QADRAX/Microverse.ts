# Chess Lab

Browser demo: **one** `MicroverseLua` Wasm sandbox and **two** `ChessEngine` script instances (White / Black) alternate on a **shared** board. Rules and move validation live in TypeScript (`chess.js`); each engine picks moves in Lua via `board`, `play`, `viz`, and `game` bridges.

## Run

```bash
pnpm install
pnpm --filter @microverse.ts/chess-lab dev
```

## Test (Node + Wasm)

```bash
pnpm --filter @microverse.ts/chess-lab test
```

## Lua stubs

```bash
pnpm --filter @microverse.ts/chess-lab run codegen
```

Open `lua/*.lua` with LuaLS using this package’s `.luarc.json` and `generated/`.

## Engines (v1)

| scriptId | Behavior |
|----------|----------|
| `random_move` | Random legal move |
| `first_legal` | First legal move (deterministic) |
| `capture_first` | Random capture, else random |
| `greedy_material` | Highest-value capture, else random |
| `prefer_checks` | Prefer check, else capture/random |
| `avoid_hanging` | Avoid moving to attacked squares when possible |
| `minimax_depth1` | One-ply minimax on material |
| `minimax_depth2` | Two-ply minimax (`board:searchScore`) |
| `capture_highest_safe` | Best safe capture (`board:isMoveSafe`) |
| `center_control` | Heuristic central squares |
| `develop_knights` | Knight development toward center |
| `opening_book_starter` | Short opening book → depth 2 |
| `hybrid_aggressive` | Checks → safe captures → depth 2 |

**v2 bridges** (host simulation, no illegal apply): `board:searchScore`, `board:isMoveSafe`, `board:evaluatePosition`.

Each engine has a **description** in `chessScriptCatalog.ts` (shown in the UI panels) and a header comment in `lua/<id>.lua`.

Piece **slide animation** on the canvas follows each move; duration scales with **Play delay (ms)** (~75% of the delay, clamped 120–600 ms).

## Layout

| Path | Role |
|------|------|
| `src/engine/chessSurface.ts` | Bridges and `ChessEngine` profile |
| `src/engine/chessRules.ts` | `chess.js` wrapper |
| `lua/*.lua` | One script per engine |
| `src/main.ts` | UI (board canvas + dual script panels) |
