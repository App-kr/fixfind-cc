export function normalizeSegment(s: string): string {
  return s
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function makeSlug(brand: string, model: string): string {
  return `${normalizeSegment(brand)}/${normalizeSegment(model)}`;
}

export function parseSlug(slug: string): { brand: string; model: string } | null {
  const m = /^([a-z0-9-]+)\/([a-z0-9-]+)$/.exec(slug);
  if (!m) return null;
  return { brand: m[1], model: m[2] };
}
