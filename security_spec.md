# Firestore Security Specification (Phase 0)

## 1. Data Invariants
1. **Competitor Identity Integrity**: A document in `/competitors/{competitorId}` must have `id == competitorId`, `ownerUid == request.auth.uid`, `isPublic == true`, and `kind` restricted to `'primary'` or `'companion'`.
2. **Verified Writer Mandate**: Unauthenticated or unverified (`email_verified != true`) clients cannot create, update, or delete any document in `/competitors` or `/users`.
3. **Immutable Ownership & Timestamps**: `id`, `ownerUid`, `kind`, `isPublic`, and `createdAt` are immutable after creation. Both `createdAt` (on create) and `updatedAt` (on create/update) must equal `request.time`.
4. **No PII in Public Leaderboard**: `/competitors` stores only display `name` (max 32 chars), `stars` (0..100000), `completedCount` (0..500), and `lastDailyChallengeDate` (`YYYY-MM-DD` or `""`). No email, phone, or private data is allowed.
5. **Strict User Isolation**: `/users/{userId}` is strictly private (`uid == userId == request.auth.uid`). Non-owners cannot `get`, `list`, `create`, `update`, or `delete`.

## 2. The "Dirty Dozen" Attack Payloads
1. **Unauthenticated Competitor Create**: `{ auth: null }` creating `/competitors/c1` -> `PERMISSION_DENIED`.
2. **Unverified Email Create**: `{ auth: { uid: 'u1', token: { email_verified: false } } }` creating `/competitors/c1` -> `PERMISSION_DENIED`.
3. **Identity Spoofing on Create**: User `u1` creating `/competitors/c1` with `ownerUid: 'u2'` -> `PERMISSION_DENIED`.
4. **Ghost Field / Shadow Update**: User `u1` updating `/competitors/c1` with extra key `isAdmin: true` -> `PERMISSION_DENIED`.
5. **Cross-Owner Competitor Hijack**: User `u2` updating `/competitors/c1` owned by `u1` -> `PERMISSION_DENIED`.
6. **Oversized Name Poisoning**: Creating `/competitors/c1` with 200-char `name` (> 32) -> `PERMISSION_DENIED`.
7. **Invalid Date Format**: Setting `lastDailyChallengeDate: "today-hack"` -> `PERMISSION_DENIED`.
8. **Negative or Overflow Stars**: Updating `stars: -50` or `stars: 9999999` -> `PERMISSION_DENIED`.
9. **Client-Spoofed Timestamp**: Setting `updatedAt` to a past timestamp instead of `request.time` -> `PERMISSION_DENIED`.
10. **ID Poisoning on Path**: Writing to `/competitors/bad$id!!` -> `PERMISSION_DENIED`.
11. **Private User Progress Read Leak**: User `u2` attempting `get` or `list` on `/users/u1` -> `PERMISSION_DENIED`.
12. **Unbounded Array Attack**: User `u1` writing `/users/u1` with 250 `completedIds` (> 200) -> `PERMISSION_DENIED`.
