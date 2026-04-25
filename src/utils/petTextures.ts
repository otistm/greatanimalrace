import * as THREE from 'three';

// Pattern textures used by the species renderer for cow spots, tiger
// stripes, etc. Generated procedurally so we don't ship image assets.
// Each texture is meant to be applied as the `map` of a meshToonMaterial
// alongside the species' base color via material.color tinting.

const TEXTURE_CACHE = new Map<string, THREE.Texture>();

function makeCanvas(w: number, h: number): { canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D } {
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d')!;
  return { canvas, ctx };
}

function finalize(canvas: HTMLCanvasElement): THREE.Texture {
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.needsUpdate = true;
  return tex;
}

// Cow-style irregular dark spots scattered on a base color.
export function createSpotsTexture(baseColor: string, spotColor: string): THREE.Texture {
  const key = `spots:${baseColor}:${spotColor}`;
  const cached = TEXTURE_CACHE.get(key);
  if (cached) return cached;

  const w = 512;
  const h = 256;
  const { canvas, ctx } = makeCanvas(w, h);
  ctx.fillStyle = baseColor;
  ctx.fillRect(0, 0, w, h);

  ctx.fillStyle = spotColor;
  // Deterministic-ish layout using a simple seeded loop so cows look
  // consistent run to run (no real seeding, just enough variety).
  const spots = [
    { x: 80, y: 60, r: 38 },
    { x: 200, y: 120, r: 52 },
    { x: 340, y: 70, r: 44 },
    { x: 440, y: 150, r: 36 },
    { x: 110, y: 200, r: 30 },
    { x: 260, y: 200, r: 42 },
    { x: 400, y: 220, r: 28 },
    { x: 60, y: 130, r: 24 },
  ];
  for (const s of spots) {
    ctx.beginPath();
    // Wobbly outline for organic spot shapes.
    const segments = 18;
    for (let i = 0; i <= segments; i++) {
      const a = (i / segments) * Math.PI * 2;
      const wobble = 0.78 + ((Math.sin(a * 3 + s.x) + 1) * 0.18);
      const px = s.x + Math.cos(a) * s.r * wobble;
      const py = s.y + Math.sin(a) * s.r * wobble;
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.closePath();
    ctx.fill();
  }

  const tex = finalize(canvas);
  TEXTURE_CACHE.set(key, tex);
  return tex;
}

// Tiger-style vertical stripes that wrap around the body sphere when
// the texture is mapped (UV V along the vertical axis of the body).
export function createStripesTexture(baseColor: string, stripeColor: string): THREE.Texture {
  const key = `stripes:${baseColor}:${stripeColor}`;
  const cached = TEXTURE_CACHE.get(key);
  if (cached) return cached;

  const w = 512;
  const h = 256;
  const { canvas, ctx } = makeCanvas(w, h);
  ctx.fillStyle = baseColor;
  ctx.fillRect(0, 0, w, h);

  ctx.fillStyle = stripeColor;
  const stripes = 14;
  for (let i = 0; i < stripes; i++) {
    const cx = (i + 0.5) * (w / stripes) + Math.sin(i * 1.7) * 6;
    const baseWidth = 14 + (i % 3) * 4;
    // Each stripe is a slightly tapered vertical band; we paint two
    // segments (top and bottom) so they don't all look identical.
    ctx.beginPath();
    const segments = 12;
    for (let s = 0; s <= segments; s++) {
      const t = s / segments;
      const y = t * h;
      const taper = Math.sin(t * Math.PI) * 0.6 + 0.4; // 0.4..1.0
      const x = cx - (baseWidth * taper) / 2;
      if (s === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    for (let s = segments; s >= 0; s--) {
      const t = s / segments;
      const y = t * h;
      const taper = Math.sin(t * Math.PI) * 0.6 + 0.4;
      const x = cx + (baseWidth * taper) / 2;
      ctx.lineTo(x, y);
    }
    ctx.closePath();
    ctx.fill();
  }

  const tex = finalize(canvas);
  TEXTURE_CACHE.set(key, tex);
  return tex;
}
