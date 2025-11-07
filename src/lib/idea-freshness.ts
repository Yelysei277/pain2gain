import type { ProductIdea } from '@/types/ideas';

const TWENTY_FOUR_HOURS_IN_MS = 24 * 60 * 60 * 1000;
const FALLBACK_NEW_COUNT = 3;

function normalizeTimestamp(raw?: string): { iso?: string; value: number | null } {
  if (!raw) {
    return { value: null };
  }

  const parsed = Date.parse(raw);
  if (Number.isNaN(parsed)) {
    return { value: null };
  }

  return { iso: new Date(parsed).toISOString(), value: parsed };
}

export function isIdeaNew(createdAt?: string, now: Date = new Date()): boolean {
  const { value } = normalizeTimestamp(createdAt);
  if (value === null) {
    return false;
  }

  return now.getTime() - value <= TWENTY_FOUR_HOURS_IN_MS;
}

export function applyIdeaFreshness(
  ideas: ProductIdea[],
  now: Date = new Date()
): ProductIdea[] {
  if (ideas.length === 0) {
    return ideas;
  }

  const enriched = ideas.map((idea) => {
    const { iso, value } = normalizeTimestamp(idea.createdAt);
    const createdAt = iso ?? idea.createdAt;
    const isNew = value !== null && now.getTime() - value <= TWENTY_FOUR_HOURS_IN_MS;

    return {
      idea: {
        ...idea,
        createdAt,
        isNew,
      },
      timestamp: value,
    };
  });

  const hasAnyTimestamp = enriched.some((entry) => entry.timestamp !== null);

  if (!hasAnyTimestamp) {
    const fallbackCount = Math.min(FALLBACK_NEW_COUNT, enriched.length);
    for (let i = 0; i < fallbackCount; i += 1) {
      enriched[i].idea.isNew = true;
    }
  }

  return enriched.map((entry) => entry.idea);
}


