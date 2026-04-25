# Scoring Guide

This document is the **single source of truth** for stars, XP, scoring, leaderboards, and the messaging contract between minigame iframes and the parent React app.

When this document and `MINIGAMES_GUIDE.md` disagree on level structure or star thresholds, `MINIGAMES_GUIDE.md` is the design spec and code is fixed to match it. When this document and code disagree on the messaging contract, **this document wins** — code must be updated.

> Status: **v1** (canonical contract, post-audit). See migration log at the bottom.

---

## 1. Messaging Contract (iframe → parent)

Every minigame `iframe` communicates with the parent via `window.parent.postMessage(payload, '*')`. There are exactly **three** message types. Anything else is ignored by the parent.

### 1.1 `LEVEL_RESULT` — the only crediting event

Sent **exactly once** at the end of every round (whether the player won or failed). Contains the authoritative score and stars for that run. The parent uses this and only this to award XP, update star progression, and write the leaderboard.

```ts
type LevelResult = {
  type: 'LEVEL_RESULT';
  gameId:
    | 'toy_bin_bonanza'
    | 'bottle_rama'
    | 'naptime_runner'
    | 'hide_and_seek'
    | 'tiny_chef'
    | 'swaddle_gami';
  level: 1 | 2 | 3 | 4 | 5;
  stars: 0 | 1 | 2 | 3;       // 0 = failed
  score: number;              // per-game canonical formula (see §3)
  outcome: 'win' | 'fail';
};
```

### 1.2 `NEXT_LEVEL` — navigation only

Sent when the player clicks the "Next Level" button. Carries no score or stars. The parent advances `activeGameLevel` and reloads the iframe with `?level=N+1&autoStart=true`.

```ts
type NextLevel = {
  type: 'NEXT_LEVEL';
  gameId: string;
  level: number; // the level just completed
};
```

### 1.3 `EXIT_GAME` — navigation only

Sent when the player taps any "Exit"/"Back" button. The parent closes the iframe and returns to the arcade menu. Carries no score or stars.

```ts
type ExitGame = {
  type: 'EXIT_GAME';
  gameId: string;
};
```

### 1.4 Rules the parent enforces

- **Crediting happens only on `LEVEL_RESULT`.** `NEXT_LEVEL` and `EXIT_GAME` never grant XP, stars, or leaderboard rows.
- **Idempotency.** The parent caches the last `(gameId, level, stars, score)` it credited for ~2 seconds and silently drops duplicates.
- **No empty rows.** A `LEVEL_RESULT` with `score === 0 && stars === 0` is **not** persisted to the leaderboard.
- **First-play bonus** (`+200 XP`) is granted only when `stars > 0` AND there is no prior leaderboard entry for that user/game.
- **New high-score bonus** (`+50 XP`) is granted when the new `score` is strictly greater than the previously stored high score for that user/game.

> The first-play and new-HS bonus values are intentionally small relative to the per-star reward (see §4.1) — they exist to add a little flourish to milestones, not to drive primary progression. Stars are the progression engine.

---

## 2. Star Logic Per Game

These are the canonical thresholds (mirrors `MINIGAMES_GUIDE.md`). Code uses **strict `>`** wherever the guide says "greater than".

| Game | 1★ | 2★ | 3★ |
|------|----|----|----|
| Toy Bin Bonanza | catch ≥ 50% of spawned toys | catch ≥ 80% | catch 100% |
| Bottle-Rama | finish all orders before time | `> 10s` remaining | `> 20s` remaining |
| Naptime Runner | reach target distance before time | `> 10s` remaining | `> 20s` remaining |
| Swaddle-gami | finish all puzzles before time | `> 15s` remaining | `> 30s` remaining |
| Hide & Sneak | clear all quests without waking the baby | total time `< 30s × quests` | total time `< 15s × quests` |
| Tiny Chef | every dish within 8% per-slice error | average dish error `< 5%` | average dish error `< 2%` |

Any failure (timeout, baby wakes, etc.) yields `stars: 0` and `outcome: 'fail'`.

**Naptime Runner specifics:** round time = `30s + (level-1) * 5s`, target distance = `8000 + (level-1) * 2000` px, base scroll speed = `0.35 + (level-1) * 0.05` px/ms. The +5s/level bonus exists to keep levels 3–5 winnable as the world scrolls faster.

---

## 3. Canonical `score` Formula Per Game

The `score` field on `LEVEL_RESULT` is what the leaderboard sorts on. It must be calculated identically every time a game ends and may not be cumulative across rounds.

| Game | `score` formula |
|------|-----------------|
| Toy Bin Bonanza | `caughtToys` (integer 0..targetToys) |
| Bottle-Rama | `ordersServed` (integer 0..targetOrders) |
| Naptime Runner | `floor(distance / 10)` for the current run only — **not cumulative** |
| Swaddle-gami | `puzzlesSolved * 100 + secondsRemaining` (where `secondsRemaining = floor(timeLeft / 1000)` on win, `0` on timeout) |
| Hide & Sneak | `questsCompleted * 100 + max(0, 100 - floor(avgWakefulness))` |
| Tiny Chef | `dishesPassed * 100 + starBonus` where `starBonus = stars * 50` (0/50/100/150) |

`score` is always a non-negative integer.

---

## 4. XP, Stamina, and Coins

### 4.1 XP from minigames

```
xp = stars * 850
   + (firstEverPlay && stars > 0 ? 200 : 0)
   + (newHighScore                ? 50  : 0)
```

| Stars | Base XP |
|-------|---------|
| 0 | 0 |
| 1★ | 850 |
| 2★ | 1,700 |
| 3★ | 2,550 |

#### Calibration: why 850 XP per star?

The per-star reward is sized so that an **average player who 2-stars every level of every game** reaches the **12-month milestone**.

- Pet leveling curve: `requiredXp(age) = 500 + 300·age + 50·age²`.
- Total XP to reach age 12 from age 0: `Σ_{a=0..11} requiredXp(a) = 51,100 XP`.
- Total stars available at full clear: `6 games × 5 levels × 2 stars = 60 stars`.
- Expected bonus XP at full clear: `6 × 200 (first-play) + ~24 × 50 (new-HS) ≈ 2,400 XP`.
- Solving `60 × xpPerStar + 2,400 ≈ 51,100` → `xpPerStar ≈ 812`.
- Rounded to **850** for clean per-star math, total expected XP at 2-star clear is **~53,400 XP** — a ~4.5% buffer over the milestone, which covers the occasional missed high-score bump.

Implications for difficulty bands:
- A player who only **1-stars** every level: `60 × 850 / 2 + 2,400 ≈ 27,900 XP`, lands them around age 9 (Bottle-Rama unlock). They will need a few replays / 2-stars to push to age 12.
- A player who **3-stars** every level: `60 × 850 × 1.5 + 2,400 ≈ 78,900 XP`, well past age 12 — comfortably into age 13–14.
- Early-game pacing is fast by design: a single 2-star clear of any L1 yields ~1,950 XP (`850×2 + 200 first-play + 50 new-HS`), more than enough to hit age 2 (need 1,350 XP) and unlock Swaddle-gami immediately.

### 4.2 Stamina recovery from minigames

Granted by the parent on every `LEVEL_RESULT` (regardless of stars):

| Game | Stamina restored |
|------|------------------|
| Toy Bin Bonanza | +20 |
| Naptime Runner | +50 |
| Hide & Sneak | +15 |
| Swaddle-gami | +15 |
| Tiny Chef | +15 |
| Bottle-Rama | +15 |

### 4.3 Coins

Minigames do not grant coins directly. Coins are earned only from world coin pickups (`+1` coin and `+10` XP per coin in `App.tsx#handleCoinCollide`).

### 4.4 Other XP sources (world)

| Action | XP |
|--------|----|
| Walk to a non-carrot target | +10 |
| Open a treasure chest | +30 |
| Talk to your pet | +5 |
| Tap to sleep | +5 |
| Coin pickup | +10 |
| Idle joystick movement | up to +1 every ~5s (random) |

### 4.5 Pet leveling

`requiredXp(age) = 500 + age*300 + age*age*50`. Excess XP rolls over into the next age band.

---

## 5. Level Unlock Rule

For each game, `gameProgress[gameId]` is `{ unlockedLevel: 1..5, stars: { [level]: 0..3 } }`.

- The player starts with `unlockedLevel = 1` for every game.
- On a `LEVEL_RESULT` where `stars > 0` AND `level === unlockedLevel`, set `unlockedLevel = min(5, level + 1)`.
- `stars[level]` is updated to `max(prev, newStars)` so a worse re-run can never reduce the saved star count.

The arcade `MiniGameOverlay` shows level buttons L1–L5; locked levels are visually disabled. Per-level stars are rendered from `progress.stars[level]`.

---

## 6. URL Contract for Iframe Games

```
/<game>.html?level=1..5&autoStart=true
```

- `level` must parse as an integer in `[1, 5]`. Invalid, missing, `0`, negative, or `> 5` values are clamped to `1` (start screen) or to `5` (autoStart) — see each game's source. **Never** index `LEVEL_CONFIGS[level - 1]` without clamping.
- `autoStart=true` (case-sensitive) skips the "Insert Coin" screen and begins the round immediately. Any other value (or absence) shows the start screen.

---

## 7. Leaderboard Storage and Sort

### 7.1 Per-game leaderboards (`leaderboards_v3/{gameId}/entries/{uid}`)

Schema:
```ts
{
  userId: string,
  gameId: string,
  score: number,        // canonical formula (§3)
  stars: number,        // 0..3, the stars earned on the high-score run
  totalStars: number,   // sum of best stars across L1..L5 for this game
  playerName: string,
  animalId: string,
  createdAt: serverTimestamp
}
```

Sort order in UI: `(totalStars desc, score desc, createdAt asc)`.

Row creation/update rules (parent-side, on every `LEVEL_RESULT`):

- **No row at all** when the result is `(score === 0, stars === 0)`. (Empty rows would clutter the board.)
- **Create / replace the full row** (`score`, `stars`, `totalStars`, `playerName`, `animalId`, `createdAt`) when `score > prevHigh`. This is the "new high score" path.
- **Sync `totalStars` onto the existing row** when `score <= prevHigh` but the player has earned more stars on some other level since the last write. The high-score `score`/`stars`/`createdAt` fields are preserved, but `totalStars`, `playerName`, and `animalId` are updated via a merge so leaderboard ranking and the `★N` badge always reflect the player's current best stars across L1..L5.

This second rule is necessary because a player can 3-star a later level whose canonical score is lower than their existing high score (e.g. 3-starring Bottle-Rama L2 with `score = 2` after already posting `score = 12` on L1). Without the sync, their leaderboard `totalStars` would freeze at the value from their high-score run.

### 7.2 Global "oldest pet" board (`users_v3` ordered by `progression.age`)

Untouched by this audit. Lives in `GlobalLeaderboardsOverlay`.

---

## 8. UI Surfaces That Show Stars / Score

| Surface | Shows |
|---------|-------|
| `MiniGameOverlay` (arcade level select) | Per-level stars (0–3) for the chosen game, plus the top-3 leaderboard. |
| `PetStatusOverlay` | Per-game total stars (e.g. `9/15`) + top score, for every unlocked game. |
| `Leaderboard` (per-game, embedded in `MiniGameOverlay`) | Top 3 by `(totalStars, score)`. |
| `GlobalLeaderboardsOverlay` | Global oldest-pet ranking (unrelated to minigame stars). |

---

## 9. Migration Log

| Date | Change |
|------|--------|
| 2026-04-23 | v1 of `SCORING_GUIDE.md` written. All 6 games migrated to single `LEVEL_RESULT` event. Parent handler now credits exactly once with idempotency. Tiny Chef tolerances changed `15/10/5%` → `8/5/2%` to match `MINIGAMES_GUIDE.md`. Star thresholds switched from `>=` to strict `>` in Bottle-Rama, Naptime Runner, and Swaddle-gami. Naptime Runner score made per-run instead of cumulative. Toy Bin Bonanza HUD label renamed from "SCORE" to "CAUGHT". `?level=` clamped 1..5 in every game. HUD 3-star flash removed everywhere. Hide & Sneak dead `#next-level-screen` and `levelIdx++` ReferenceError removed. Naptime Runner dead `if (index < 0)` star branch fixed. Leaderboard now stores `totalStars` and sorts by `(totalStars, score)`. Empty `(score=0, stars=0)` rows no longer persisted. `+200` first-play XP gated on `stars > 0`. Phantom XP from `EXIT_GAME` (`floor(score/10)` fallback) removed. |
| 2026-04-23 | Swaddle-gami puzzle library expanded from 4 → 20 unique tangram-inspired puzzles (added CAT, SAILBOAT, ARROW, TREE, BOWTIE, BIRD, CRYSTAL, CASTLE, CRAB, ROBOT, UMBRELLA, WHALE, FLOWER, HOURGLASS, SWAN, FORTRESS). Each level now draws a non-overlapping slice via `puzzleOffset` so no puzzle repeats across a full L1→L5 play-through (2+3+4+5+6 = 20). |
| 2026-04-23 | XP per star recalibrated `50` → `850` so 2-starring every level of every game (60 stars) lands the player at the 12-month milestone (51,100 XP). See §4.1 derivation. First-play (+200) and new-HS (+50) bonuses unchanged; they now act as flavor on top of the star-driven progression. |
| 2026-04-23 | Tiny Chef food library expanded from 3 → 24 unique foods (added APPLE, TOMATO, CHEESE, CUCUMBER, BANANA, PIZZA, CAKE, PIE, KIWI, LEMON, MUSHROOM, STRAWBERRY, DONUT, COOKIE, SUSHI, WAFFLE, PANCAKE, PEPPER, CHOCOLATE, AVOCADO, EGG alongside the original ORANGE, WATERMELON, BREAD). `SERVICES` no longer hard-codes a `shape`; each dish slot pulls the next food from a Fisher-Yates-shuffled rotation of all 24 foods. The rotation is persisted in `localStorage` (`tinyChefFoodCycle_v1`) and survives every iframe reload (level transitions, Play Again, Try Again), so a food only ever repeats AFTER the player has cycled through every other food in the library. When a rotation exhausts, the next one is reshuffled and guarantees the first slot ≠ the previous final slot, preventing back-to-back same-food. |
| 2026-04-23 | Tiny Chef cut intricacy rebalanced. Old `SERVICES` was dominated by 1-cut halves and repeated 2-cut quarter patterns. New recipes mix 1/2/3-cut dishes within every level and introduce intricate fractions (1/3, 2/3, 1/6, 3/8, 1/8, 0.2, 0.3, 0.4) so the player can't just bisect down the middle. Dish counts per level (2/3/2/3/4) and the canonical score curve (§3) are unchanged. |
| 2026-04-23 | Tiny Chef freeform / angle cuts. The old swipe model only honoured the start and end points of a stroke (one straight infinite-line cut per swipe). The new model captures the full pointer path during a drag, simplifies it via Douglas-Peucker (8 px tolerance) so finger jitter doesn't register, and treats the result as a polyline cut. **Number of cuts the swipe consumes from the budget = number of straight segments after simplification** (a straight swipe still costs 1; an L-shape costs 2; a zig-zag with three bends costs 4). The polyline carves each piece along its actual shape using a recursive entry/exit-strand polygon-clip that handles simple non-convex polygons, so wedges produced by an angle cut can themselves be cut on subsequent swipes. The first and last segments of the polyline are extended outward (~2000 px) so a swipe can start and end *inside* the food and still cleave through. While dragging, the HUD overlays a bright simplified preview with yellow dots on each bend point and a `N CUTS` badge near the cursor — the badge turns red if the segment count would exceed `cutsLeft`, and a swipe drawn while red is rejected (no cuts consumed, no pieces split). Dish recipes (`SERVICES.cuts` budgets) are unchanged; this is purely an additive UX upgrade that lets the player carve more intricate shapes in fewer strokes. |
| 2026-04-23 | Tiny Chef goal-plate, third pass — **horizontal strips on a circular plate**. First pass (original) was pie wedges radiating from the center: visually fun, easy to eyeball the proportion against round food, but implied wedge / angle cuts and so broke 1-cut dishes like `[1/3, 2/3]`. Second pass was a rectangular stacked bar with explicit fraction labels (`1/2`, `1/3`, `3/8`, `0.4`, …): unambiguous and bypassed the angle-cut trap, but turned the game into proportion-math homework, lost the "estimate-by-eye" feel, and was *drastically harder* to portion correctly because a horizontal bar doesn't map to a round food. Third pass kept the visual / geometric estimation game from the first pass but fixed the angle-cut trap: still a circle, divided into **horizontal colored strips whose AREAS (not heights) equal the goal fractions**, with chord positions placed by bisection on the circular-cap area formula `A(y) = r²·acos(y/r) − y·√(r²−y²)`. Worked great on circular foods (donut, apple, pie, avocado) but broke for non-round foods: on the v3 plate the `[1/3, 2/3]` divider sat at ~37% of the plate's vertical height, and a player who copied that "37% from top" cut onto a triangular watermelon got ~14% area on top (vs. the 33% goal) — exceeding the 8% tolerance every time and producing the "impossible to complete the 1/3, 2/3 puzzles" failure mode. **Superseded by v4 (next row).** |
| 2026-04-23 | Tiny Chef goal-plate, fourth pass — **shape-aware strips: the plate adopts the current dish's food shape**. The plate now renders the actual food polygon (orange = circle, watermelon = triangle, bread = square, pepper = hexagon, …) at small scale, and the area-proportional chord positions are computed by bisecting `splitPolygon()` on *that* polygon. New helpers `_polyBBox`, `_scalePolyToBox`, `_findHorizCutY` (28-iteration bisection on `splitPolygon`'s `right`-side area), `_polyHorizIntersect` (sorted x-intercepts of a horizontal line through the convex polygon, used to clip the divider line at the silhouette edge), `_getPlateData` (memoized per `(foodId, goals, cx, cy)` in `_plateCache`), and `_tracePoly` (shared canvas-path tracer). The plate now *literally previews the cut* — copying the divider position from the plate onto the food produces the goal area split for any food shape, so a `[1/3, 2/3]` dish on a triangular watermelon now shows a tall narrow apex slice (matching the actual area-1/3 cut), and the "impossible to complete" failure mode disappears. Strips are still colored from `PLATE_PALETTE`, dividers are still 2-px dark lines clipped to the silhouette, the rim is the polygon outline drawn last so it sits above the strips. No fraction text appears anywhere. Evaluation logic, recipes, tolerances and scoring are unchanged. |
| 2026-04-23 | Leaderboard `totalStars` staleness fix. Previously the leaderboard row was only written when `score > prevHigh`, so if a player 3-starred a later level whose canonical score didn't beat their existing high score (very common in Bottle-Rama, Naptime Runner, Hide & Sneak), the row's `totalStars` froze at the value from the high-score run — under-counting the player's actual progress and pushing them down the `(totalStars desc, score desc)` ranking. Parent now always recomputes `totalStars` from the freshly-credited `gameProgress`. On a new high score the full row is replaced as before; on a non-high-score run with stars, only `totalStars` (plus `playerName` / `animalId`, in case the user renamed their pet or switched animals since their last high) is merged into the existing row, leaving `score`, `stars`, and `createdAt` untouched. The visible per-level star badges in `MiniGameOverlay` were already correct (they read from local `gameProgress`); the bug was only the `★NN` badge inside the embedded `Leaderboard`. |
| 2026-04-23 | Tiny Chef soft cuts budget + **Plate It!** button. With freeform cuts the cuts budget became hazardous: a player could (a) over-spend the budget on an unintentional bent swipe, (b) achieve the goal pattern in fewer cuts than the recipe expected, or (c) take a sub-optimal first cut that left them unable to reach the goal with the remaining budget — and in every case the old "evaluate only when `cutsLeft === 0`" rule forced the player to spend additional cuts that could only break their pattern further. The cuts budget is now **soft**: after at least one cut has been made (`cutsLeft < currentLevel.cuts`), a green **Plate It!** button in the HUD evaluates the current piece state immediately. The button glows + pulses (`.plate-ready` CSS class) when `goalMatches()` reports the current piece areas already match every goal fraction within the dish's pass tolerance (`ERROR_TOLERANCE = 0.08`), giving a clear "submit now" cue. Evaluation logic in `evaluateCuts()` is unchanged — early submission can still pass or fail based on actual error, and stars are derived from the same average-error formula in §3. Cut budgets in `SERVICES` are unchanged; the recipe still tells the player roughly how many strokes the dish *expects*, but doesn't force them to spend every one. |
