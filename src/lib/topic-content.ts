import type { Prisma } from "@/generated/prisma/client";

export const RESOURCE_TYPES = [
  "Documentation",
  "Tutorial",
  "Guide",
  "Video",
  "Interactive Course",
] as const;

export type LearningResourceType = (typeof RESOURCE_TYPES)[number];

export interface KeyConcept {
  title: string;
  description?: string;
}

export interface LearningResource {
  title: string;
  url: string;
  type: LearningResourceType;
  description: string;
  beginnerValue?: string;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function asNonEmptyString(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function normalizeResourceUrl(value: unknown): string | null {
  const url = asNonEmptyString(value);
  if (!url) return null;

  const markdownMatch = /^\[(https?:\/\/[^\]]+)\]\((https?:\/\/[^)]+)\)$/.exec(url);
  const normalized = markdownMatch ? markdownMatch[1] : url;

  try {
    const parsed = new URL(normalized);
    return /^https?:$/.test(parsed.protocol) ? parsed.toString() : null;
  } catch {
    return null;
  }
}

export function parseKeyConcepts(value: Prisma.JsonValue | null | undefined): KeyConcept[] {
  if (!Array.isArray(value)) return [];

  return value.flatMap((entry) => {
    if (!isRecord(entry)) return [];

    const title = asNonEmptyString(entry.title);
    if (!title) return [];

    const description = asNonEmptyString(entry.description) ?? undefined;
    return [{ title, description }];
  });
}

export function parseLearningResources(
  value: Prisma.JsonValue | null | undefined
): LearningResource[] {
  if (!Array.isArray(value)) return [];

  return value.flatMap((entry) => {
    if (!isRecord(entry)) return [];

    const title = asNonEmptyString(entry.title);
    const url = normalizeResourceUrl(entry.url);
    const description = asNonEmptyString(entry.description);
    const type = asNonEmptyString(entry.type);

    if (!title || !url || !description || !type) return [];
    if (!RESOURCE_TYPES.includes(type as LearningResourceType)) return [];

    const beginnerValue = asNonEmptyString(entry.beginnerValue) ?? undefined;

    return [
      {
        title,
        url,
        type: type as LearningResourceType,
        description,
        beginnerValue,
      },
    ];
  });
}
