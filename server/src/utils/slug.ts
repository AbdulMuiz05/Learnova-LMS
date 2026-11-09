import { Model } from 'mongoose';

export function slugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

export async function ensureUniqueSlug(
  model: Model<any>,
  value: string,
  excludeId?: string
): Promise<string> {
  const base = slugify(value) || 'item';
  let candidate = base;
  let counter = 2;

  // Loop is bounded in practice; slugs are short and collisions are rare.
  // eslint-disable-next-line no-constant-condition
  while (true) {
    const query: Record<string, unknown> = { slug: candidate };
    if (excludeId) query._id = { $ne: excludeId };
    const exists = await model.exists(query);
    if (!exists) return candidate;
    candidate = `${base}-${counter}`;
    counter += 1;
  }
}
