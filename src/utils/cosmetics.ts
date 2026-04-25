import * as THREE from 'three';

// Map a single color token (the prefix word in an equipped cosmetic string,
// e.g. "Ruby" in "Ruby Striped Shirt") to its hex value.
const COLOR_TOKEN_HEX: Record<string, string> = {
  // Canonical 4
  ruby: '#ef4444',
  ocean: '#3b82f6',
  emerald: '#22c55e',
  golden: '#fbbf24',
  // Themed-set fixed colors
  royal: '#7e22ce',
  steel: '#a8b2bd',
  wood: '#a16207',
  eden: '#1f2937',
  brown: '#92400e',
  pink: '#ec4899',
  navy: '#0c2340', // NY Yankees navy
  straw: '#fcd04c', // Luffy Set straw hat
  pirate: '#ed3536', // Luffy Set red vest
  // Legacy / fallback tokens that historical save data may still contain
  rose: '#ec4899',
  red: '#ef4444',
  amethyst: '#a855f7',
  purple: '#a855f7',
  blue: '#3b82f6',
  cyan: '#22d3ee',
  diamond: '#22d3ee',
  ice: '#22d3ee',
  green: '#22c55e',
  lime: '#84cc16',
  neon: '#84cc16',
  silver: '#9ca3af',
  platinum: '#9ca3af',
  gray: '#9ca3af',
  yellow: '#fbbf24',
  gold: '#fbbf24',
  black: '#1f2937',
  obsidian: '#1f2937',
};

export const getColor = (cosmeticString?: string, defaultColor = '#ef4444') => {
  if (!cosmeticString) return defaultColor;
  // Prefer the explicit color prefix (first word) so themed cosmetic names
  // like "Royal Crown" don't accidentally inherit a color from
  // a substring match on the cosmetic name itself.
  const first = cosmeticString.split(' ', 1)[0]?.toLowerCase();
  if (first && COLOR_TOKEN_HEX[first]) return COLOR_TOKEN_HEX[first];
  // Fallback: scan whole string for any token (legacy callers pass raw words
  // without a prefix, e.g. "blue").
  const s = cosmeticString.toLowerCase();
  for (const [token, hex] of Object.entries(COLOR_TOKEN_HEX)) {
    if (s.includes(token)) return hex;
  }
  return defaultColor;
};

const textureCache: Record<string, THREE.Texture> = {};

const drawHeart = (ctx: CanvasRenderingContext2D, cx: number, cy: number, size: number) => {
  const d = size;
  ctx.save();
  ctx.translate(cx, cy - d / 2);
  ctx.beginPath();
  ctx.moveTo(0, d / 4);
  ctx.bezierCurveTo(0, 0, -d / 2, 0, -d / 2, d / 4);
  ctx.bezierCurveTo(-d / 2, d / 2, 0, d * 0.75, 0, d);
  ctx.bezierCurveTo(0, d * 0.75, d / 2, d / 2, d / 2, d / 4);
  ctx.bezierCurveTo(d / 2, 0, 0, 0, 0, d / 4);
  ctx.fill();
  ctx.restore();
};

const drawStar = (ctx: CanvasRenderingContext2D, cx: number, cy: number, outerR: number) => {
  const innerR = outerR * 0.5;
  const spikes = 5;
  ctx.save();
  ctx.translate(cx, cy);
  ctx.beginPath();
  for (let i = 0; i < spikes * 2; i++) {
    const radius = i % 2 === 0 ? outerR : innerR;
    const angle = (i * Math.PI) / spikes - Math.PI / 2;
    if (i === 0) ctx.moveTo(Math.cos(angle) * radius, Math.sin(angle) * radius);
    else ctx.lineTo(Math.cos(angle) * radius, Math.sin(angle) * radius);
  }
  ctx.closePath();
  ctx.fill();
  ctx.restore();
};

// Aspect ratio of the rendered surface (circumference / vertical span) for each cosmetic type.
// We use this to set texture.repeat so motifs appear square on the 3D mesh.
const getSurfaceAspect = (sLower: string): number => {
  if (sLower.includes('crop top')) return 7;   // Sphere with very short vertical arc
  if (sLower.includes('robe')) return 3;        // Mid cylinder
  if (sLower.includes('jersey')) return 3;      // Sphere with short vertical arc
  if (sLower.includes('cap')) return 3;         // Hemisphere dome
  return 3;                                     // Standard sphere shirt (Shirt, Polo, Tank, Raglan)
};

export const createCosmeticTexture = (cosmeticString?: string) => {
  if (!cosmeticString) return null;
  const sLower = cosmeticString.toLowerCase();
  
  // Return null if it's not a clothing item that needs a texture
  const isClothing = sLower.includes('shirt') || sLower.includes('tee') || 
                     sLower.includes('crop top') || sLower.includes('raglan') || 
                     sLower.includes('polo') || sLower.includes('robe') || 
                     sLower.includes('jersey') || sLower.includes('slugger');
                     
  if (!isClothing) return null;

  if (textureCache[sLower]) return textureCache[sLower];

  // Use a small 128x128 unit cell that we'll tile across the surface
  const canvas = document.createElement('canvas');
  canvas.width = 128;
  canvas.height = 128;
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;

  const baseColor = getColor(cosmeticString, '#ef4444');
  ctx.fillStyle = baseColor;
  ctx.fillRect(0, 0, 128, 128);
  
  ctx.fillStyle = '#ffffff';
  ctx.strokeStyle = '#ffffff';

  const isPinstripe = sLower.includes('slugger');

  // Draw a single motif tile (we let texture.repeat handle the tiling on the surface)
  if (isPinstripe) {
    // Thin white vertical pinstripes on the navy base. The texture is tiled
    // many times around the body so a single narrow stripe per tile reads
    // as a fine pinstripe over the whole garment.
    ctx.fillRect(60, 0, 8, 128);
  } else if (sLower.includes('polka-dot')) {
    ctx.beginPath();
    ctx.arc(64, 64, 28, 0, Math.PI * 2);
    ctx.fill();
  } else if (sLower.includes('striped')) {
    // For shirts (sphere), draw horizontal stripes so they wrap around the belly
    // We use 50% height for even alternating stripes
    ctx.fillRect(0, 64, 128, 64);
  } else if (sLower.includes('heart')) {
    drawHeart(ctx, 64, 64, 90);
  } else if (sLower.includes('star')) {
    drawStar(ctx, 64, 64, 50);
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;

  // Compensate for surface stretching: the horizontal direction wraps around the
  // entire body, so we need to repeat the U axis more times than the V axis to
  // keep motifs from getting stretched horizontally.
  const aspect = getSurfaceAspect(sLower);
  const isStriped = sLower.includes('striped');
  const hasMotif = sLower.includes('polka-dot') || sLower.includes('heart') || sLower.includes('star');

  if (isPinstripe) {
    // Tile horizontally many times around the body for a true pinstripe look.
    // The cap is much smaller than the jersey so it gets fewer repeats.
    if (sLower.includes('cap')) {
      texture.repeat.set(8, 1);
    } else {
      texture.repeat.set(16, 1);
    }
  } else if (isStriped) {
    // Shirts: stripes need high vertical tiling for a persistent pattern
    texture.repeat.set(1, 8);
  } else if (hasMotif) {
    // Choose a vertical repeat count that gives a pleasing density, then scale U by aspect.
    // Polka dots get a higher tile count so the dots end up smaller and packed
    // closer together rather than spaced far apart on the shirt.
    const isCropTop = sLower.includes('crop top');
    const isPolkaDot = sLower.includes('polka-dot');
    const vRepeat = isPolkaDot ? 5 : isCropTop ? 3 : 2;
    texture.repeat.set(vRepeat * aspect, vRepeat);
  }
  
  textureCache[sLower] = texture;
  return texture;
};

let cachedFabricBumpMap: THREE.Texture | null = null;
export const createFabricBumpMap = () => {
  if (cachedFabricBumpMap) return cachedFabricBumpMap;
  const canvas = document.createElement('canvas');
  canvas.width = 128;
  canvas.height = 128;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    ctx.fillStyle = '#808080';
    ctx.fillRect(0, 0, 128, 128);
    for (let x = 0; x < 128; x++) {
      for (let y = 0; y < 128; y++) {
        // procedural woven pattern
        const val1 = Math.sin(x * 0.8) * Math.sin(y * 0.8);
        const val2 = Math.random() * 0.2;
        const noise = val1 * 0.4 + val2 + 0.5;
        const c = Math.floor(noise * 255);
        ctx.fillStyle = `rgb(${c},${c},${c})`;
        ctx.fillRect(x, y, 1, 1);
      }
    }
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(8, 8);
  cachedFabricBumpMap = texture;
  return texture;
};
