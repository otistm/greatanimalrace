# Firebase — Great Animal Race

Project: **great-animal-race** (see [`src/firebase.ts`](src/firebase.ts) or `.env`).

## Deploy rules and indexes

Prerequisites: [Firebase CLI](https://firebase.google.com/docs/cli) via this repo (`npm install` installs `firebase-tools`).

```bash
# One-time login (opens browser — run in your terminal, not CI)
npm run firebase:login

# Deploy Firestore rules + indexes and RTDB rules
npm run firebase:deploy
```

Files deployed:

| File | Target |
|------|--------|
| [`firestore.rules`](firestore.rules) | Firestore security rules |
| [`firestore.indexes.json`](firestore.indexes.json) | Composite / collection indexes |
| [`database.rules.json`](database.rules.json) | Realtime Database rules |

## Environment variables

Copy [`.env.example`](.env.example) to `.env.local` and fill in values from Firebase Console → Project settings → Your apps.

Production builds **require** all `VITE_FIREBASE_*` variables (no hardcoded fallbacks).

## Verification checklist (Console vs repo)

After deploy, confirm in [Firebase Console](https://console.firebase.google.com/project/great-animal-race):

### Firestore rules

- [ ] Rules tab shows `users_v3`, `leaderboards_v3`, `chat_world`, `chat_dms` match blocks
- [ ] Legacy `users/` and `leaderboards/` paths are **not** present (removed from repo)
- [ ] `users_v3` progression allows `{ age, xp, coins }` only, with upper bounds
- [ ] `equippedCosmetics` validated as **list** (not map)

### Firestore indexes

- [ ] Indexes tab includes `users_v3` → `progression.age` (desc)
- [ ] `chat_world` → `createdAt` (desc)
- [ ] `chat_dms` → `participants` array-contains

Or run locally:

```bash
firebase firestore:indexes
```

### Realtime Database rules

- [ ] RTDB Rules tab matches [`database.rules.json`](database.rules.json)
- [ ] `/presence/$uid` — read: authenticated; write: own uid only
- [ ] Presence payload validates `online`, `lastSeen`, `petName` (≤40), `animalId` (≤40), `equippedCosmetics`
- [ ] `/positions/$uid` — reserved for Phase 2 live movement (same uid write gate)

### Client ↔ rules alignment

| Client path | Rules path | Notes |
|-------------|------------|-------|
| `users_v3/{uid}` | `match /users_v3/{userId}` | [`App.tsx`](src/App.tsx) load/save |
| `leaderboards_v3/{gameId}/entries/{uid}` | `match /leaderboards_v3/...` | Scoring in `creditResult` |
| `chat_world` | append-only | [`messaging.ts`](src/utils/messaging.ts) |
| `chat_dms/{id}/messages` | participant-gated | DMs |
| RTDB `presence/{uid}` | [`database.rules.json`](database.rules.json) | [`multiplayer.ts`](src/utils/multiplayer.ts) |

### Smoke test (manual)

1. Open the app signed in (anonymous auth auto-runs).
2. Complete welcome flow — `users_v3/{uid}` document should appear in Firestore.
3. Play a minigame — `leaderboards_v3/{gameId}/entries/{uid}` updates.
4. Send world chat message — new doc in `chat_world`.
5. Two clients — both should write `/presence/{uid}` without permission errors.

## Troubleshooting

| Symptom | Likely cause |
|---------|----------------|
| `permission-denied` on save | Rules not deployed or schema mismatch (check Console) |
| Index error in console | Run `npm run firebase:deploy` or create index from error link |
| RTDB write fails | RTDB not enabled or rules not deployed |
| Prod build crashes on load | Missing `VITE_FIREBASE_*` in CI/deploy env |
