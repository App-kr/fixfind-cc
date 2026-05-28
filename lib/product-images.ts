// Robot vacuum image pool — verified Unsplash CDN (stable, no hotlink block)
const ROBOT_IMAGES: string[] = [
  'https://images.unsplash.com/photo-1518365050014-70fe7232897f?w=800&q=80',
  'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&q=80',
  'https://images.unsplash.com/photo-1575429198097-0414ec08e8cd?w=800&q=80',
  'https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=800&q=80',
  'https://images.unsplash.com/photo-1676742344022-a5dba24f5fbb?w=800&q=80',
  'https://images.unsplash.com/photo-1563013544-824ae1b704d3?w=800&q=80',
  'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=800&q=80',
  'https://images.unsplash.com/photo-1605493725784-9a7c52f23b16?w=800&q=80',
  'https://images.unsplash.com/photo-1616348436168-de43ad0db179?w=800&q=80',
  'https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=800&q=80',
  'https://images.unsplash.com/photo-1583418855340-39bace2a64d3?w=800&q=80',
  'https://images.unsplash.com/photo-1484704849700-f032a568e944?w=800&q=80',
  'https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?w=800&q=80',
  'https://images.unsplash.com/photo-1543486958-d783bfbf7f8e?w=800&q=80',
  'https://images.unsplash.com/photo-1625602812206-5ec545ca1231?w=800&q=80',
];

// Brand-specific hero images (primary, shown first)
const BRAND_HERO: Record<string, string> = {
  irobot:   'https://images.unsplash.com/photo-1676742344022-a5dba24f5fbb?w=800&q=80',
  roborock: 'https://images.unsplash.com/photo-1518365050014-70fe7232897f?w=800&q=80',
  ecovacs:  'https://images.unsplash.com/photo-1575429198097-0414ec08e8cd?w=800&q=80',
  xiaomi:   'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&q=80',
  samsung:  'https://images.unsplash.com/photo-1605493725784-9a7c52f23b16?w=800&q=80',
  lg:       'https://images.unsplash.com/photo-1616348436168-de43ad0db179?w=800&q=80',
  dreame:   'https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=800&q=80',
  narwal:   'https://images.unsplash.com/photo-1583418855340-39bace2a64d3?w=800&q=80',
  eufy:     'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=800&q=80',
  shark:    'https://images.unsplash.com/photo-1563013544-824ae1b704d3?w=800&q=80',
  neato:    'https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=800&q=80',
};

function slugHash(slug: string): number {
  let h = 0;
  for (let i = 0; i < slug.length; i++) {
    h = Math.imul(31, h) + slug.charCodeAt(i) | 0;
  }
  return Math.abs(h);
}

export function getProductImage(brand: string, slug?: string): string {
  const key = brand.toLowerCase().replace(/[^a-z]/g, '');
  // Brand hero first; if slug provided pick a deterministic "random" from pool
  const hero = BRAND_HERO[key];
  if (!slug) return hero || ROBOT_IMAGES[0];
  // Use slug hash to pick from pool — always same image per page, looks "random" across pages
  const idx = slugHash(slug) % ROBOT_IMAGES.length;
  return ROBOT_IMAGES[idx];
}

// Extra images for article gallery (secondary shots)
export function getGalleryImages(brand: string, slug: string): string[] {
  const base = slugHash(slug);
  const out: string[] = [];
  for (let i = 0; i < 2; i++) {
    out.push(ROBOT_IMAGES[(base + i + 1) % ROBOT_IMAGES.length]);
  }
  return out;
}
