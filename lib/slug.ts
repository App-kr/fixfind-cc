export function normalizeSegment(s: string): string {
  return s
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/**
 * Slug = brand/model[-error-slug]
 * e.g.  irobot/roomba-675-error-5
 *        irobot/roomba-675-not-charging
 *        irobot/roomba-675          ← when no error_code
 *
 * This lets each (model, error) pair get its own SEO page.
 */
export function makeSlug(brand: string, model: string, errorCode?: string): string {
  const brandSeg = normalizeSegment(brand);
  const modelSeg = normalizeSegment(model);
  if (!errorCode || !errorCode.trim()) {
    return `${brandSeg}/${modelSeg}`;
  }
  const errSeg = normalizeSegment(errorCode);
  // Avoid double-stamping if model already ends with the same error suffix
  if (modelSeg.endsWith(errSeg)) {
    return `${brandSeg}/${modelSeg}`;
  }
  return `${brandSeg}/${modelSeg}-${errSeg}`;
}

export function parseSlug(slug: string): { brand: string; model: string } | null {
  const m = /^([a-z0-9-]+)\/([a-z0-9-]+)$/.exec(slug);
  if (!m) return null;
  return { brand: m[1], model: m[2] };
}
