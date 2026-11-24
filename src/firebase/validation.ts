import blueprint from '../../firebase-blueprint.json';

const competitorProps = blueprint.entities.Competitor.properties;
const userProps = blueprint.entities.UserProgress.properties;

export const MAX_COMPETITOR_ID_LENGTH = competitorProps.id.maxLength;
export const MAX_NAME_LENGTH = competitorProps.name.maxLength;
export const ID_PATTERN = new RegExp(competitorProps.id.pattern);
export const DATE_KEY_PATTERN = new RegExp(
  competitorProps.lastDailyChallengeDate.pattern
);
export const MAX_STARS = 100000;
export const MAX_COMPLETED_COUNT = 500;
export const MAX_COMPLETED_IDS = 200;
export const MAX_ADHKAR_KEYS = 20;
export const MAX_USER_NAME_LENGTH = userProps.childName.maxLength;

export function sanitizeCompetitorName(rawName: string, fallback = 'البطل الصغير'): string {
  const trimmed = rawName.trim().slice(0, MAX_NAME_LENGTH);
  return trimmed.length > 0 ? trimmed : fallback.slice(0, MAX_NAME_LENGTH);
}

export function sanitizeId(rawId: string): string {
  const cleaned = rawId.replace(/[^a-zA-Z0-9_\-]/g, '_').slice(0, MAX_COMPETITOR_ID_LENGTH);
  return ID_PATTERN.test(cleaned) ? cleaned : `id_${Date.now()}`;
}

export function clampStars(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(MAX_STARS, Math.round(value)));
}

export function clampCompletedCount(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(MAX_COMPLETED_COUNT, Math.round(value)));
}

export function sanitizeDateKey(value: string | null | undefined): string {
  if (!value) return '';
  return DATE_KEY_PATTERN.test(value) ? value : '';
}

export function sanitizeCompletedIds(ids: string[]): string[] {
  return Array.from(new Set(ids))
    .filter((id) => typeof id === 'string' && id.length > 0)
    .map((id) => id.slice(0, 64))
    .slice(0, MAX_COMPLETED_IDS);
}

export function sanitizeAdhkarProgress(
  map: Record<string, number>
): Record<string, number> {
  const safe: Record<string, number> = {};
  const entries = Object.entries(map).slice(0, MAX_ADHKAR_KEYS);
  for (const [k, v] of entries) {
    if (typeof k === 'string' && k.length > 0 && k.length <= 64 && Number.isFinite(v)) {
      safe[k] = Math.max(0, Math.min(1000, Math.round(v)));
    }
  }
  return safe;
}
