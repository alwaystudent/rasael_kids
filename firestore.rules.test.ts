export interface DirtyDozenScenario {
  id: number;
  name: string;
  targetPath: string;
  operation: 'get' | 'list' | 'create' | 'update' | 'delete';
  expectedResult: 'PERMISSION_DENIED';
  payload: Record<string, unknown>;
}

export const DIRTY_DOZEN_TESTS: DirtyDozenScenario[] = [
  {
    id: 1,
    name: 'Unauthenticated Competitor Create',
    targetPath: '/competitors/c1',
    operation: 'create',
    expectedResult: 'PERMISSION_DENIED',
    payload: { id: 'c1', name: 'سالم', stars: 10, isPublic: true },
  },
  {
    id: 2,
    name: 'Unverified Email Create',
    targetPath: '/competitors/c1',
    operation: 'create',
    expectedResult: 'PERMISSION_DENIED',
    payload: { email_verified: false, ownerUid: 'u1' },
  },
  {
    id: 3,
    name: 'Identity Spoofing on Create',
    targetPath: '/competitors/c1',
    operation: 'create',
    expectedResult: 'PERMISSION_DENIED',
    payload: { authUid: 'u1', ownerUid: 'u2' },
  },
  {
    id: 4,
    name: 'Shadow Update Ghost Field',
    targetPath: '/competitors/c1',
    operation: 'update',
    expectedResult: 'PERMISSION_DENIED',
    payload: { name: 'سالم', isAdmin: true },
  },
  {
    id: 5,
    name: 'Cross-Owner Competitor Update',
    targetPath: '/competitors/c1',
    operation: 'update',
    expectedResult: 'PERMISSION_DENIED',
    payload: { authUid: 'u2', existingOwnerUid: 'u1', stars: 999 },
  },
  {
    id: 6,
    name: 'Oversized Name Poisoning',
    targetPath: '/competitors/c1',
    operation: 'create',
    expectedResult: 'PERMISSION_DENIED',
    payload: { name: 'أ'.repeat(120) },
  },
  {
    id: 7,
    name: 'Invalid Daily Challenge Date Pattern',
    targetPath: '/competitors/c1',
    operation: 'update',
    expectedResult: 'PERMISSION_DENIED',
    payload: { lastDailyChallengeDate: 'invalid-date' },
  },
  {
    id: 8,
    name: 'Out-of-Bounds Stars Integer',
    targetPath: '/competitors/c1',
    operation: 'update',
    expectedResult: 'PERMISSION_DENIED',
    payload: { stars: -10 },
  },
  {
    id: 9,
    name: 'Client-Forged Timestamp',
    targetPath: '/competitors/c1',
    operation: 'update',
    expectedResult: 'PERMISSION_DENIED',
    payload: { updatedAt: '2020-01-01T00:00:00Z' },
  },
  {
    id: 10,
    name: 'ID Poisoning on Path',
    targetPath: '/competitors/bad$id!!',
    operation: 'create',
    expectedResult: 'PERMISSION_DENIED',
    payload: { id: 'bad$id!!' },
  },
  {
    id: 11,
    name: 'Cross-User Private Progress Read',
    targetPath: '/users/u1',
    operation: 'get',
    expectedResult: 'PERMISSION_DENIED',
    payload: { authUid: 'u2', targetUid: 'u1' },
  },
  {
    id: 12,
    name: 'Unbounded CompletedIds Array Attack',
    targetPath: '/users/u1',
    operation: 'update',
    expectedResult: 'PERMISSION_DENIED',
    payload: { completedIdsCount: 250 },
  },
];
