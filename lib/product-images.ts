export const BRAND_IMAGES: Record<string, string> = {
  irobot: 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/04/IRobot_Roomba_780.jpg/640px-IRobot_Roomba_780.jpg',
  xiaomi: 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/52/Xiaomi_Mi_Robot_Vacuum.jpg/640px-Xiaomi_Mi_Robot_Vacuum.jpg',
  ecovacs: 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/1f/Ecovacs_Deebot_Ozmo_950.jpg/640px-Ecovacs_Deebot_Ozmo_950.jpg',
  neato: 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a2/Neato_Robotics_BotVac_D80.jpg/640px-Neato_Robotics_BotVac_D80.jpg',
  roborock: 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/8e/Roborock_S6_Pure.jpg/640px-Roborock_S6_Pure.jpg',
  shark: 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/41/Shark_IQ_Robot_Vacuum.jpg/640px-Shark_IQ_Robot_Vacuum.jpg',
  eufy: 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/27/Eufy_RoboVac_11S.jpg/640px-Eufy_RoboVac_11S.jpg',
  samsung: 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b5/Samsung_POWERbot_Robot_Vacuum.jpg/640px-Samsung_POWERbot_Robot_Vacuum.jpg',
};

const FALLBACK_IMAGES: Record<string, string> = {
  irobot: 'https://images.unsplash.com/photo-1518365050014-70fe7232897f?w=640&q=80',
  xiaomi: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=640&q=80',
  ecovacs: 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=640&q=80',
  neato: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=640&q=80',
  roborock: 'https://images.unsplash.com/photo-1518365050014-70fe7232897f?w=640&q=80',
  shark: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=640&q=80',
  eufy: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=640&q=80',
  samsung: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=640&q=80',
};

export function getProductImage(brand: string, _slug?: string): string {
  const key = brand.toLowerCase().replace(/[^a-z]/g, '');
  return BRAND_IMAGES[key] || FALLBACK_IMAGES[key] || 'https://images.unsplash.com/photo-1518365050014-70fe7232897f?w=640&q=80';
}
