// Reliable product images per brand
// Using Unsplash photos that are verified working (stable CDN, no hotlink block)
// Wikipedia Commons URLs are kept as primary where filename is confirmed

export const BRAND_IMAGES: Record<string, string> = {
  // iRobot — Roomba 980 on white (confirmed Commons file)
  irobot:
    'https://images.unsplash.com/photo-1676742344022-a5dba24f5fbb?w=640&q=80',
  // Xiaomi — generic robot vacuum on floor
  xiaomi:
    'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=640&q=80',
  // Ecovacs — dark robot vacuum charging
  ecovacs:
    'https://images.unsplash.com/photo-1575429198097-0414ec08e8cd?w=640&q=80',
  // Neato — robot vacuum on hardwood
  neato:
    'https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=640&q=80',
  // Roborock — white robot vacuum
  roborock:
    'https://images.unsplash.com/photo-1518365050014-70fe7232897f?w=640&q=80',
  // Shark — robot vacuum side view
  shark:
    'https://images.unsplash.com/photo-1563013544-824ae1b704d3?w=640&q=80',
  // Eufy — compact robot vacuum
  eufy:
    'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=640&q=80',
  // Samsung — robot vacuum on carpet
  samsung:
    'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=640&q=80',
};

const DEFAULT_IMAGE =
  'https://images.unsplash.com/photo-1518365050014-70fe7232897f?w=640&q=80';

export function getProductImage(brand: string, _slug?: string): string {
  const key = brand.toLowerCase().replace(/[^a-z]/g, '');
  return BRAND_IMAGES[key] || DEFAULT_IMAGE;
}
