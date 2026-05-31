# Minigames Guide

This document outlines the **design rules** (level structure, goals, star thresholds) for all 6 minigames in Playto GAR.

> For everything else — the messaging contract between iframes and the parent, XP/coin rewards, the canonical `score` formula per game, leaderboard storage, and the URL contract — see [`SCORING_GUIDE.md`](./SCORING_GUIDE.md). When the two documents disagree on level structure or star thresholds, **this** document is the spec; when they disagree on the contract or scoring math, **`SCORING_GUIDE.md` is the spec**.

## Global Progression System
All minigames are standardized to a **5-Level System**.
* Players start at Level 1 and unlock subsequent levels by earning at least **1 Star** on the current level.
* Each level provides up to **3 Stars** based on the player's performance.
* See [`SCORING_GUIDE.md` §4](./SCORING_GUIDE.md#4-xp-stamina-and-coins) for the XP-per-star table and bonus rules.
* You can access your unlocked levels from the main menu and try to improve your star rating.

---

## 1. Bottle-Rama
**Goal:** Serve a sequence of baby formulas, milk, and water to the baby before time runs out.

**Levels:**
- **Level 1:** Serve 2 Orders (60s)
- **Level 2:** Serve 3 Orders (60s)
- **Level 3:** Serve 4 Orders (60s)
- **Level 4:** Serve 5 Orders (50s)
- **Level 5:** Serve 6 Orders (50s)

**Star Logic (Based on Time Remaining):**
- ⭐ **1 Star:** Pass the level (complete all orders before time runs out).
- ⭐⭐ **2 Stars:** Finish with >10 seconds remaining.
- ⭐⭐⭐ **3 Stars:** Finish with >20 seconds remaining.

---

## 2. Hide & Sneak
**Goal:** Sneak around a dark nursery and complete quests (e.g. pat the baby, retrieve a bottle) without waking the baby as fast as possible. After all quests are done, return to the door to exit the room.

**Levels:**
- **Level 1:** Complete 1 quest.
- **Level 2:** Complete 2 quests.
- **Level 3:** Complete 3 quests.
- **Level 4:** Complete 4 quests.
- **Level 5:** Complete 5 quests.

**Star Logic (Based on Time Taken):**
- ⭐ **1 Star:** Complete all quests without waking the baby.
- ⭐⭐ **2 Stars:** Complete all quests in under 30 seconds per quest (e.g., Level 1 = 30s).
- ⭐⭐⭐ **3 Stars:** Complete all quests in under 15 seconds per quest (e.g., Level 1 = 15s).

---

## 3. Naptime Runner
**Goal:** Jump over obstacles and collect clocks to reach home before naptime (time limit) hits zero.

**Levels:**
- **Level 1:** 8,000m target distance.
- **Level 2:** 10,000m target distance.
- **Level 3:** 12,000m target distance.
- **Level 4:** 14,000m target distance.
- **Level 5:** 16,000m target distance.
*(Base speed and obstacle frequency scale up with each level)*

**Star Logic (Based on Time Remaining):**
- ⭐ **1 Star:** Reach the target distance before time runs out.
- ⭐⭐ **2 Stars:** Finish with >10 seconds remaining.
- ⭐⭐⭐ **3 Stars:** Finish with >20 seconds remaining.

---

## 4. Swaddle-gami
**Goal:** Fold and rotate origami paper to perfectly match the target shapes and swaddle the baby.

**Levels:**
- **Level 1:** Solve 2 puzzles.
- **Level 2:** Solve 3 puzzles.
- **Level 3:** Solve 4 puzzles.
- **Level 4:** Solve 5 puzzles.
- **Level 5:** Solve 6 puzzles.

**Star Logic (Based on Time Remaining):**
*(Note: Each level gives a base of 25 seconds per puzzle required)*
- ⭐ **1 Star:** Complete all puzzles before time runs out.
- ⭐⭐ **2 Stars:** Finish with >15 seconds remaining.
- ⭐⭐⭐ **3 Stars:** Finish with >30 seconds remaining.

---

## 5. Tiny Chef
**Goal:** Swipe to cut food into precise fractions that match the compartments of the baby's plate.

**Levels:**
- **Level 1:** 2 simple dishes.
- **Level 2:** 3 simple dishes.
- **Level 3:** 2 complex dishes.
- **Level 4:** 3 complex dishes.
- **Level 5:** 4 very complex dishes.

**Star Logic (Based on Precision Error):**
- ⭐ **1 Star:** Pass the level (all cuts fit the plate within 8% error margin).
- ⭐⭐ **2 Stars:** Pass with <5% average error margin per dish.
- ⭐⭐⭐ **3 Stars:** Pass with <2% average error margin per dish (near perfect precision).

---

## 6. Toy Bin Bonanza
**Goal:** Catch falling toys in the toy bin. Don't let them hit the floor!

**Levels:**
- **Level 1:** 15 Toys (Spawned over 28s).
- **Level 2:** 20 Toys (Spawned over 28s).
- **Level 3:** 25 Toys (Spawned over 38s).
- **Level 4:** 30 Toys (Spawned over 38s).
- **Level 5:** 40 Toys (Spawned over 43s).

**Star Logic (Based on Catch Percentage):**
- ⭐ **1 Star:** Catch at least 50% of the spawned toys.
- ⭐⭐ **2 Stars:** Catch at least 80% of the spawned toys.
- ⭐⭐⭐ **3 Stars:** Catch 100% of the spawned toys (flawless, no drops).
