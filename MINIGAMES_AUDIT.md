# Mini Games Full Code Audit Report

**Date:** 2026-05-30  
**Scope:** All 6 mini games, iframe integration layer, scoring contract compliance, Firebase/leaderboard infrastructure  
**Deliverable:** Audit report only — no code changes  

**Canonical references reviewed:**
- [`SCORING_GUIDE.md`](SCORING_GUIDE.md)
- [`MINIGAMES_GUIDE.md`](MINIGAMES_GUIDE.md)
- [`ARCADE_STYLE_GUIDE.md`](ARCADE_STYLE_GUIDE.md)

---

## 1. Executive Summary

Playto GAR ships **six standalone Canvas arcade games** as static HTML files in [`public/`](public/), loaded inside fullscreen iframes by the React shell in [`src/App.tsx`](src/App.tsx). Games communicate with the parent exclusively via `window.parent.postMessage` using three message types: `LEVEL_RESULT`, `NEXT_LEVEL`, and `EXIT_GAME`. All XP, stamina, star progression, and leaderboard writes are centralized in the parent's `creditResult` handler — games never touch Firebase directly.

The system is **functionally solid** following the April 2026 scoring audit migration documented in `SCORING_GUIDE.md` §9. Five of six games fully comply with the canonical scoring contract. One confirmed formula bug exists in Tiny Chef. The most significant systemic risk is a **Firestore rules mismatch**: runtime code writes to `users_v3` and `leaderboards_v3`, but checked-in [`firestore.rules`](firestore.rules) only defines rules for legacy `users/` and `leaderboards/` collections with an outdated schema.

### Architecture at a Glance

```
User → ArcadeMachine / PetStatusOverlay / MiniGameOverlay
     → App.tsx sets activeGameId + level
     → iframe: /{game-slug}.html?level=N&autoStart=true
     → game posts LEVEL_RESULT at round end
     → App.tsx creditResult: XP, stamina, gameProgress, leaderboards_v3
```

### Overall Health Grades

| Area | Grade | Notes |
|------|-------|-------|
| Scoring contract compliance | **B+** | 1 confirmed formula bug (Tiny Chef); otherwise aligned post-April audit |
| Architecture | **B** | Good iframe isolation; poor DRY and registry management |
| Security / data integrity | **C** | Firestore rules mismatch is the biggest risk |
| UX accuracy | **C** | Stale XP copy, DEBUG bypass, optimistic HUD previews |
| Maintainability | **C-** | 6 monolithic HTML files (~6,800 lines), no tests, triplicated metadata |
| Mobile / input | **B+** | Touch support in all games; gamepad only in world, not games |
| Documentation | **A-** | SCORING_GUIDE and MINIGAMES_GUIDE are thorough; UI/docs drift exists |

### Top 5 Action Items

1. **Audit deployed Firestore rules** against runtime `users_v3` / `leaderboards_v3` writes — add matching rules to the repo if missing in production.
2. **Fix Tiny Chef `starBonus`** in [`public/tiny-chef.html`](public/tiny-chef.html) — 1-star runs under-score by 50 points vs `SCORING_GUIDE.md` §3.
3. **Remove or gate the DEBUG toggle** in [`src/components/MiniGameOverlay.tsx`](src/components/MiniGameOverlay.tsx) — it bypasses all age and level locks in production.
4. **Update arcade UI XP copy** — replace all 6 stale `xpRule` strings with the actual `stars × 850` formula from `SCORING_GUIDE.md` §4.1.
5. **Consolidate game registry** into a single shared module to eliminate drift across `MiniGameOverlay.tsx`, `PetStatusOverlay.tsx`, and `App.tsx`.

---

## 2. Findings Table

| ID | Severity | Component | Description | Recommendation |
|----|----------|-----------|-------------|----------------|
| F-01 | **Critical** | [`firestore.rules`](firestore.rules) vs [`src/App.tsx`](src/App.tsx) | Runtime writes `users_v3` and `leaderboards_v3` with fields (`gameProgress`, `totalStars`, `stamina`, `coins`, cosmetics) not covered by checked-in rules, which only define `users/` and `leaderboards/` with an older schema. | Compare deployed Firebase console rules with repo. Add `users_v3` and `leaderboards_v3` match blocks matching the actual write schema. |
| F-02 | **High** | [`public/tiny-chef.html`](public/tiny-chef.html) | `starBonus()` returns `0` for 1-star clears; spec requires `stars × 50` (50 / 100 / 150). | Change to `return (stars \|\| 0) * 50;` |
| F-03 | **High** | [`src/components/MiniGameOverlay.tsx`](src/components/MiniGameOverlay.tsx) | All 6 `xpRule` strings describe per-action XP (e.g. "+5 XP per toy caught") but actual XP is `stars × 850` + bonuses, computed entirely in the parent. | Replace with accurate copy, e.g. "Up to 2,550 XP for 3 stars (+850 per star)". |
| F-04 | **High** | [`src/components/MiniGameOverlay.tsx`](src/components/MiniGameOverlay.tsx) | Visible **DEBUG** button bypasses pet age unlock gates and per-level star locks for all games. | Remove from production builds or gate behind env flag / dev-only route. |
| F-05 | **Medium** | `MiniGameOverlay.tsx`, `PetStatusOverlay.tsx`, `App.tsx` | Game metadata (ids, names, unlock ages, stamina, iframe URLs) is copy-pasted in 3+ places with no single source of truth. | Extract to `src/games/registry.ts` (or similar) consumed by all consumers. |
| F-06 | **Medium** | [`src/hooks/useLeaderboard.ts`](src/hooks/useLeaderboard.ts) | `submitScore()` is exported but never called. Uses older schema (no `totalStars`). | Remove dead export or mark deprecated; all writes must go through `App.tsx#creditResult`. |
| F-07 | **Medium** | All `public/*.html`, [`src/App.tsx`](src/App.tsx) | All `postMessage` calls use target `'*'`; parent handler does not validate `event.origin`. | Validate `event.origin === window.location.origin` before crediting. |
| F-08 | **Medium** | All `public/*.html` | Each game loads Tailwind CDN (runtime JIT) and Google Fonts at runtime — no version pinning, no offline support. | Pre-build Tailwind CSS per game or share a static arcade stylesheet in `public/`. |
| F-09 | **Medium** | Repo-wide | Zero automated tests for scoring contract, star thresholds, or level unlock logic. | Add unit tests for `creditResult` logic and per-game score/star pure functions. |
| F-10 | **Medium** | [`src/hooks/useLeaderboard.ts`](src/hooks/useLeaderboard.ts) | Firestore query uses `orderBy('score')` then client re-sorts by `(totalStars, score)`. High-`totalStars` / moderate-`score` players may be excluded from the top-25 fetch window. | Query by `totalStars` desc (with composite index) or fetch a larger window. |
| F-11 | **Low** | [`src/App.tsx`](src/App.tsx) | Legacy `GAME_OVER` message handler still credits XP/stars. All 6 games migrated to `LEVEL_RESULT`. | Remove shim after confirming no cached old HTML in the wild. |
| F-12 | **Low** | [`public/toy-bin-bonanza.html`](public/toy-bin-bonanza.html) | Per-level high scores stored in iframe `localStorage` (`toyBinHighScore_*`) — not synced to parent leaderboard. | Remove local-only HS or document as cosmetic-only HUD element. |
| F-13 | **Low** | [`public/hide-and-seek.html`](public/hide-and-seek.html) | Live HUD shows 2–3 preview stars based on elapsed time before all quests are complete. Final stars are correct at win time. | Gate preview stars on `questsCompleted >= questsRequired` or show 0 until cleared. |
| F-14 | **Low** | [`public/hide-and-seek.html`](public/hide-and-seek.html), [`MINIGAMES_GUIDE.md`](MINIGAMES_GUIDE.md) | Win requires returning to the door after completing quests ("EXIT THE ROOM!") — not documented in the design guide. | Add exit phase to MINIGAMES_GUIDE.md and/or in-game tutorial text. |
| F-15 | **Low** | [`public/bottle-rama.html`](public/bottle-rama.html) | Canvas is 400×400 vs 400×700 for all other games. | Document as intentional in ARCADE_STYLE_GUIDE or align dimensions. |
| F-16 | **Low** | [`dist/`](dist/) | Built game HTML and bundled JS/CSS tracked in git alongside `public/` source — risk of source/dist drift. | Add `dist/` to `.gitignore` or enforce build-in-CI only. |

---

## 3. Per-Game Compliance Scorecard

### Summary

| Game | File | Lines | Contract | Stars | Score | Input | Notes |
|------|------|-------|----------|-------|-------|-------|-------|
| Toy Bin Bonanza | `public/toy-bin-bonanza.html` | 704 | **PASS** | Compliant | Compliant | Touch + keyboard | Local HS in iframe storage |
| Swaddle-gami | `public/swaddle-gami.html` | 1,021 | **PASS** | Compliant | Compliant | Touch + mouse | 20-puzzle rotation |
| Naptime Runner | `public/naptime-runner.html` | 1,055 | **PASS** | Compliant | Compliant | Touch + keyboard | Posts result on fail |
| Hide & Sneak | `public/hide-and-seek.html` | 847 | **PASS** | Compliant | Compliant | Touch + on-screen buttons | Undocumented exit phase |
| Tiny Chef | `public/tiny-chef.html` | 1,989 | **FAIL** | Compliant | **Bug (F-02)** | Touch + mouse swipe | Most complex game |
| Bottle-Rama | `public/bottle-rama.html` | 1,184 | **PASS** | Compliant | Compliant | Click/tap stations | 400×400 canvas |

**Total inline game code:** ~6,800 lines across 6 files.

---

### 3.1 Toy Bin Bonanza (`toy_bin_bonanza`)

**Unlock:** 0 months | **Stamina:** +20

| Check | Status | Detail |
|-------|--------|--------|
| Level configs | Pass | L1–L5: 15/20/25/30/40 toys; spawn windows 28s/28s/38s/38s/43s match MINIGAMES_GUIDE |
| Star thresholds | Pass | `>= 50% / 80% / 100%` catch rate — correct for "at least" wording |
| Score formula | Pass | `score = caughtToys` |
| Messaging | Pass | `LEVEL_RESULT`, `NEXT_LEVEL`, `EXIT_GAME`; `resultPosted` dedup |
| Level clamp | Pass | `Math.min(5, Math.max(1, ...))` on `?level=` |
| Mobile input | Pass | Half-screen touch zones + arrow keys |

**Minor notes:**
- HTML `<title>` says "Retro Rabbit Arcade" vs display name "Toy Bin Bonanza".
- Iframe-local high scores in `localStorage` (F-12) — cosmetic only, not in leaderboard.

---

### 3.2 Swaddle-gami (`swaddle_gami`)

**Unlock:** 2 months | **Stamina:** +15

| Check | Status | Detail |
|-------|--------|--------|
| Puzzle counts | Pass | `puzzlesRequired = level + 1` → 2/3/4/5/6 |
| Time limit | Pass | `25s × puzzlesRequired` |
| Star thresholds | Pass | Strict `> 15s / > 30s` remaining on win |
| Score formula | Pass | `puzzlesSolved × 100 + floor(timeLeft / 1000)` |
| Messaging | Pass | Uses `postResult()` helper |
| Puzzle variety | Pass | 20 unique puzzles; `puzzleOffset` prevents repeats across L1→L5 |

**Minor notes:**
- Drag + FOLD/SPIN mechanics well-implemented with touch and mouse parity.

---

### 3.3 Naptime Runner (`naptime_runner`)

**Unlock:** 3 months | **Stamina:** +50

| Check | Status | Detail |
|-------|--------|--------|
| Target distance | Pass | `8000 + (level - 1) × 2000` m |
| Round time | Pass | `30s + (level - 1) × 5s` |
| Scroll speed | Pass | `0.35 + (level - 1) × 0.05` px/ms |
| Star thresholds | Pass | Strict `> 10s / > 20s` remaining |
| Score formula | Pass | `floor(distance / 10)` per-run, not cumulative |
| Fail handling | Pass | Posts `LEVEL_RESULT` with `stars: 0` on timeout |

**Minor notes:**
- Mid-round exit posts `EXIT_GAME` only (no credit) — correct per contract.
- Clock pickups (+3s) and obstacle hits (-5s) add strategic depth.

---

### 3.4 Hide & Sneak (`hide_and_seek`)

**Unlock:** 5 months | **Stamina:** +15

| Check | Status | Detail |
|-------|--------|--------|
| Quest counts | Pass | `questsRequired = level` → 1/2/3/4/5 |
| Star thresholds | Pass | `< 30s × quests` (2★), `< 15s × quests` (3★) |
| Score formula | Pass | `questsCompleted × 100 + max(0, 100 - floor(avgWakefulness))` |
| Fail conditions | Pass | Baby sees you or wakefulness hits 100 → `stars: 0` |
| Messaging | Pass | `postLevelResult()` on all outcomes via `triggerGameOver()` |

**Minor notes:**
- Win requires exiting to the door after quests (F-14) — functional but undocumented.
- HUD preview stars can show 2–3★ before quests complete (F-13).
- Game ID is `hide_and_seek`; file is `hide-and-seek.html`; display name is "Hide & Sneak".

---

### 3.5 Tiny Chef (`tiny_chef`) — FAIL

**Unlock:** 7 months | **Stamina:** +15

| Check | Status | Detail |
|-------|--------|--------|
| Dish counts | Pass | L1=2, L2=3, L3=2, L4=3, L5=4 |
| Star tolerances | Pass | 8% / 5% / 2% average error per dish |
| Score formula | **Fail** | `starBonus()` omits 50-point bonus for 1★ (F-02) |
| Food variety | Pass | 24 foods; Fisher-Yates rotation persisted in `localStorage` |
| Cut mechanics | Pass | Polyline cuts via Douglas-Peucker; shape-aware goal plate (v4) |
| Plate It! | Pass | Soft cuts budget with early submission when pattern matches |

**Bug detail (F-02):**

```javascript
// Current (wrong for 1★):
function starBonus(stars) {
    return stars === 3 ? 100 : stars === 2 ? 50 : 0;
}

// Spec (SCORING_GUIDE.md §3):
// starBonus = stars * 50  →  0 / 50 / 100 / 150
```

Example: 2 dishes, 1★ → posts `score: 200` instead of `250`. XP and star progression are unaffected (parent uses `stars` field).

---

### 3.6 Bottle-Rama (`bottle_rama`)

**Unlock:** 9 months | **Stamina:** +15

| Check | Status | Detail |
|-------|--------|--------|
| Order counts | Pass | 2/3/4/5/6 orders |
| Time limits | Pass | 60s (L1–L3), 50s (L4–L5) |
| Star thresholds | Pass | Strict `> 10s / > 20s` remaining |
| Score formula | Pass | `score = ordersServed` |
| Recipe tiers | Pass | Difficulty-scaled recipe pool per level |
| Canvas | Note | 400×400 vs 400×700 elsewhere (F-15) |

**Minor notes:**
- Multi-step workflow (wash → dry → ingredients → temp → mix → cap → serve) is the most UI-heavy game.

---

## 4. Integration & Infrastructure Review

### 4.1 Parent Message Handler (`App.tsx` ~941–1132)

The `creditResult` function is the single crediting path. Behavior verified against `SCORING_GUIDE.md`:

| Behavior | Compliant | Implementation |
|----------|-----------|----------------|
| Crediting only on `LEVEL_RESULT` | Yes | `NEXT_LEVEL` / `EXIT_GAME` never grant XP |
| Idempotency | Yes | 2s dedup cache on `(gameId, level, stars, score)` |
| XP formula | Yes | `stars × 850` + first-play (+200, gated on stars>0) + new-HS (+50) |
| Stamina | Yes | Per-game map matches SCORING_GUIDE §4.2 |
| Level unlock | Yes | `unlockedLevel = min(5, level + 1)` when `stars > 0` and `level === unlockedLevel` |
| Star persistence | Yes | `max(prevStars, newStars)` — worse re-runs cannot reduce stars |
| Empty row skip | Yes | `(score === 0 && stars === 0)` not written to leaderboard |
| totalStars sync | Yes | Merge `totalStars` on non-high-score runs with new stars (post-fix) |

**Legacy shim:** `GAME_OVER` with `stars` still triggers `creditResult` (F-11). No current game sends this message.

### 4.2 Iframe Mounting (`App.tsx` ~1710–1774)

Six nearly identical conditional blocks render one iframe each:

```
/{slug}.html?level={activeGameLevel}&autoStart={autoStartGame}
```

| gameId | HTML slug |
|--------|-----------|
| `bottle_rama` | `bottle-rama.html` |
| `naptime_runner` | `naptime-runner.html` |
| `toy_bin_bonanza` | `toy-bin-bonanza.html` |
| `tiny_chef` | `tiny-chef.html` |
| `hide_and_seek` | `hide-and-seek.html` |
| `swaddle_gami` | `swaddle-gami.html` |

Maintenance burden: adding a 7th game requires a new HTML file plus edits in 4+ locations (F-05).

### 4.3 Build Pipeline

| Component | Mechanism |
|-----------|-----------|
| Main SPA | Vite single entry: `index.html` → `src/main.tsx` |
| Mini games | Static files in `public/` copied verbatim to `dist/` on build |
| Game bundling | **None** — games are not Vite entry points; all JS is inline |

Games load Tailwind and fonts from CDNs at runtime (F-08). They are not part of the Vite bundle tree-shaking or dependency audit.

### 4.4 Firebase / Firestore

**Collections used at runtime:**

| Collection | Path | Written by |
|------------|------|------------|
| User progress | `users_v3/{uid}` | `App.tsx` sync effect, `creditResult`, cosmetics/chest handlers |
| Per-game leaderboard | `leaderboards_v3/{gameId}/entries/{uid}` | `App.tsx#creditResult` |
| Global rank | `users_v3` (read, ordered by `progression.age`) | `GlobalLeaderboardsOverlay`, `useGlobalRank` |

**Checked-in rules (`firestore.rules`) cover:**

| Collection | Schema in rules |
|------------|-----------------|
| `leaderboards/{gameId}/entries/{userId}` | `userId, gameId, score, playerName, animalId, createdAt` — no `stars`, no `totalStars` |
| `users/{userId}` | `selectedAnimalId, progression, petName` — progression limited to `{age, xp, hunger, happiness}` |

**Gap analysis (F-01):**

| Runtime field | In `users_v3` writes | Allowed by checked-in rules |
|---------------|---------------------|----------------------------|
| `gameProgress` | Yes | No (`users/` rules don't include it) |
| `unlockedCosmetics` | Yes | No |
| `equippedCosmetics` | Yes | No |
| `chests` | Yes | No |
| `progression.stamina` | Yes | No (rules expect `hunger`, `happiness`) |
| `progression.coins` | Yes | No |
| `leaderboards_v3` collection | Yes | No (rules only define `leaderboards/`) |
| `stars`, `totalStars` on leaderboard rows | Yes | No |

**Impact:** If deployed rules match the repo file, all `users_v3` and `leaderboards_v3` writes would be rejected. Errors are caught in try/catch blocks and logged to console — players would see local-only progress via `localStorage` but cloud sync would silently fail.

### 4.5 Leaderboard UI

[`Leaderboard.tsx`](src/components/Leaderboard.tsx) embeds in the arcade menu and shows top 3 entries per game.

[`useLeaderboard.ts`](src/hooks/useLeaderboard.ts):
- Reads from `leaderboards_v3/{gameId}/entries`
- Queries `orderBy('score', 'desc'), limit(25)`
- Client re-sorts by `(totalStars desc, score desc)` and slices to 3

Potential ranking gap (F-10): a player with 15 total stars and score 5 may rank above a player with 3 total stars and score 100, but won't appear if the Firestore query's top-25-by-score window excludes them.

[`useUserHighScores.ts`](src/hooks/useUserHighScores.ts) reads the current user's entry per game for `PetStatusOverlay` — works correctly for individual lookups.

### 4.6 Progress Persistence

Dual-write pattern:
1. **localStorage** — immediate, offline-capable (`gameProgress` key)
2. **Firestore** — `users_v3/{uid}.gameProgress` on every state change and after `creditResult`

On load, Firestore data overrides localStorage when present (`App.tsx` load effect ~760).

---

## 5. Documentation Drift

### 5.1 UI Copy vs SCORING_GUIDE

| Surface | What it says | What actually happens |
|---------|--------------|----------------------|
| `MiniGameOverlay` xpRule (×6) | Per-action XP ("+5 XP per toy", "+10 XP per puzzle", etc.) | `stars × 850` + bonuses in parent |
| `MiniGameOverlay` REWARD label | Implies action-based rewards | Star-based only |

**Fix:** Replace all 6 `xpRule` strings with star-based copy aligned to SCORING_GUIDE §4.1.

### 5.2 MINIGAMES_GUIDE Gaps

| Topic | Guide says | Code does |
|-------|-----------|-----------|
| Hide & Sneak win condition | "Complete all quests without waking the baby" | Also requires returning to the door (`bunny.x < 30`) |
| Hide & Sneak display name | "Hide & Sneak" | File is `hide-and-seek.html`; gameId is `hide_and_seek` |
| Toy Bin Bonanza title | "Toy Bin Bonanza" | HTML title: "Retro Rabbit Arcade" |
| Bottle-Rama canvas | Not specified | 400×400 (others are 400×700) |

### 5.3 SCORING_GUIDE Accuracy

The guide itself is accurate and well-maintained (v1, post-April 2026 audit). Migration log in §9 documents all recent fixes. The only code deviation found is Tiny Chef `starBonus` (F-02).

### 5.4 ARCADE_STYLE_GUIDE Compliance

All 6 games implement:
- `Press Start 2P` font
- CRT scanline overlay
- "Insert Coin" start screen
- 3-star HUD + final stars display
- Consistent game-over screen pattern

Deviations:
- Bottle-Rama 400×400 canvas (F-15)
- Toy Bin Bonanza HTML title mismatch

---

## 6. Technical Debt Inventory

### 6.1 Code Duplication

| Duplicated concern | Locations | Est. lines duplicated |
|--------------------|-----------|----------------------|
| Game registry (id, name, unlock) | `MiniGameOverlay.tsx`, `PetStatusOverlay.tsx`, `App.tsx` | ~60 |
| CRT CSS + arcade shell HTML | All 6 `public/*.html` | ~150 per game (~900 total) |
| postMessage helpers | All 6 games (naming varies: `postResult`, `postLevelResult`, inline) | ~30 per game (~180 total) |
| Star display update logic | All 6 games | ~20 per game (~120 total) |
| Iframe JSX blocks | `App.tsx` (6 conditional renders) | ~10 per game (~60 total) |

**Recommendation:** Extract a shared `public/arcade-runtime.js` (CRT CSS, message helpers, star UI, URL parsing) included by all games. Extract `src/games/registry.ts` for React-side metadata.

### 6.2 Dead Code

| Item | Location | Notes |
|------|----------|-------|
| `submitScore()` | `useLeaderboard.ts` | Never imported or called |
| `GAME_OVER` handler | `App.tsx` | No game sends this message anymore |
| `firebase-blueprint.json` legacy IDs | Repo root | References `carrot_catch`, `bunny_hop` — outdated |

### 6.3 Missing Test Coverage

No test files exist in the repository. High-value test targets:

| Target | What to assert |
|--------|----------------|
| `creditResult` XP math | `stars × 850`, first-play +200, new-HS +50 |
| Level unlock logic | Unlock on star; no downgrade on re-run |
| Per-game `canonicalScore()` | Extract and unit-test each formula |
| Per-game star thresholds | Boundary cases (exactly 50% catch, exactly 10s remaining) |
| `?level=` clamping | 0, -1, 6, NaN → clamped to 1–5 |
| Idempotency | Duplicate `LEVEL_RESULT` within 2s → single credit |

### 6.4 External Dependencies (per game iframe)

| Dependency | URL | Risk |
|------------|-----|------|
| Tailwind CSS CDN | `cdn.tailwindcss.com` | Runtime JIT, no pin, blocked offline |
| Press Start 2P | `fonts.googleapis.com` | External font load, FOUT |

### 6.5 Git / Build Hygiene

- `dist/` contains copies of game HTML and Vite bundles tracked in git (F-16)
- Game source of truth is `public/`; `dist/` can drift if build is not run after edits

---

## 7. Prioritized Recommendations

Recommendations are grouped by severity. No implementation is included in this report — these are action items for a future sprint.

### Critical (address immediately)

1. **F-01 — Firestore rules alignment**
   - Pull deployed rules from Firebase console and diff against [`firestore.rules`](firestore.rules).
   - Add `match /users_v3/{userId}` with allowed fields: `selectedAnimalId`, `petName`, `progression` (age, xp, stamina, coins), `gameProgress`, `unlockedCosmetics`, `equippedCosmetics`, `chests`.
   - Add `match /leaderboards_v3/{gameId}/entries/{userId}` with fields: `userId`, `gameId`, `score`, `stars`, `totalStars`, `playerName`, `animalId`, `createdAt`.
   - Deploy and verify writes succeed in browser devtools Network tab.

### High (next sprint)

2. **F-02 — Tiny Chef score fix**
   - One-line change: `return (stars || 0) * 50;` in `starBonus()`.

3. **F-03 — Accurate XP copy**
   - Update all 6 `xpRule` strings in `MiniGameOverlay.tsx` to reflect star-based XP.

4. **F-04 — Remove DEBUG toggle**
   - Delete or gate behind `import.meta.env.DEV` so production players cannot bypass progression.

### Medium (backlog)

5. **F-05 — Single game registry** — `src/games/registry.ts` consumed by overlay, status, and App.
6. **F-06 — Remove dead `submitScore`** — eliminate confusion and schema-corruption risk.
7. **F-07 — Origin validation** — `if (event.origin !== window.location.origin) return;` in message handler.
8. **F-08 — Self-host arcade CSS** — replace Tailwind CDN with a static built stylesheet.
9. **F-09 — Scoring contract tests** — Vitest suite for parent crediting and pure score functions.
10. **F-10 — Leaderboard query fix** — order by `totalStars` or increase fetch window.

### Low (nice to have)

11. **F-11** — Remove legacy `GAME_OVER` shim.
12. **F-12** — Clarify or remove Toy Bin local high scores.
13. **F-13** — Fix Hide & Sneak optimistic HUD stars.
14. **F-14** — Document exit-room phase in MINIGAMES_GUIDE.
15. **F-15** — Document or align Bottle-Rama canvas size.
16. **F-16** — Stop tracking `dist/` in git.

---

## Appendix A: Game Registry Reference

| # | Display Name | gameId | HTML File | Unlock (months) | Stamina |
|---|--------------|--------|-----------|-----------------|---------|
| 1 | Toy Bin Bonanza | `toy_bin_bonanza` | `toy-bin-bonanza.html` | 0 | 20 |
| 2 | Swaddle-gami | `swaddle_gami` | `swaddle-gami.html` | 2 | 15 |
| 3 | Naptime Runner | `naptime_runner` | `naptime-runner.html` | 3 | 50 |
| 4 | Hide & Sneak | `hide_and_seek` | `hide-and-seek.html` | 5 | 15 |
| 5 | Tiny Chef | `tiny_chef` | `tiny-chef.html` | 7 | 15 |
| 6 | Bottle-Rama | `bottle_rama` | `bottle-rama.html` | 9 | 15 |

## Appendix B: Messaging Contract Quick Reference

```typescript
// Crediting event — sent exactly once per round
{ type: 'LEVEL_RESULT', gameId, level: 1..5, stars: 0..3, score: number, outcome: 'win'|'fail' }

// Navigation only — no XP/stars
{ type: 'NEXT_LEVEL', gameId, level: number }
{ type: 'EXIT_GAME', gameId: string }
```

## Appendix C: Files Reviewed

| Category | Path |
|----------|------|
| Game sources | `public/toy-bin-bonanza.html`, `public/swaddle-gami.html`, `public/naptime-runner.html`, `public/hide-and-seek.html`, `public/tiny-chef.html`, `public/bottle-rama.html` |
| Parent shell | `src/App.tsx` |
| Arcade UI | `src/components/MiniGameOverlay.tsx`, `src/components/PetStatusOverlay.tsx`, `src/components/Leaderboard.tsx` |
| Hooks | `src/hooks/useLeaderboard.ts`, `src/hooks/useUserHighScores.ts`, `src/hooks/usePetProgression.ts` |
| Firebase | `src/firebase.ts`, `firestore.rules` |
| Docs | `SCORING_GUIDE.md`, `MINIGAMES_GUIDE.md`, `ARCADE_STYLE_GUIDE.md` |
| Build | `vite.config.ts`, `index.html` |

---

*End of audit report.*
