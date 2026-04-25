import * as THREE from 'three';
import { createNoise2D } from 'simplex-noise';

export const TERRAIN_SIZE = 500;
export const TERRAIN_SEGMENTS = 100;
const SEGMENT_SIZE = TERRAIN_SIZE / TERRAIN_SEGMENTS;

// Deterministic PRNG so terrain is identical across reloads.
function hashString(str: string): number {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return function () {
    a = (a + 0x6D2B79F5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const noise2D = createNoise2D(mulberry32(hashString('gar-world-v1')));

export const getContinuousTerrainHeight = (x: number, z: number) => {
  let y = 2 * noise2D(x / 50, z / 50);
  y += 4 * noise2D(x / 100, z / 100);
  y += 0.2 * noise2D(x / 10, z / 10);
  
  const dist = Math.sqrt(x * x + z * z);
  // Keep the center flat-ish for the spawn area (radius 40)
  if (dist < 40) {
    y *= Math.max(0, (dist - 15) / 25);
  }
  
  return y;
};

export const getTerrainHeight = (x: number, z: number) => {
  // Map x and z to grid coordinates (0 to TERRAIN_SEGMENTS)
  const u = (x + TERRAIN_SIZE / 2) / SEGMENT_SIZE;
  const v = (z + TERRAIN_SIZE / 2) / SEGMENT_SIZE;

  const ix = Math.floor(u);
  const iy = Math.floor(v);

  // Fractional parts
  const fu = u - ix;
  const fv = v - iy;

  // Get heights of the 4 corners of the current grid cell
  const x0 = ix * SEGMENT_SIZE - TERRAIN_SIZE / 2;
  const z0 = iy * SEGMENT_SIZE - TERRAIN_SIZE / 2;
  const x1 = (ix + 1) * SEGMENT_SIZE - TERRAIN_SIZE / 2;
  const z1 = (iy + 1) * SEGMENT_SIZE - TERRAIN_SIZE / 2;

  const h_a = getContinuousTerrainHeight(x0, z0); // Top-left (ix, iy)
  const h_b = getContinuousTerrainHeight(x0, z1); // Bottom-left (ix, iy+1)
  const h_c = getContinuousTerrainHeight(x1, z1); // Bottom-right (ix+1, iy+1)
  const h_d = getContinuousTerrainHeight(x1, z0); // Top-right (ix+1, iy)

  // PlaneGeometry splits the quad into two triangles: (a, b, d) and (b, c, d)
  if (fu + fv <= 1) {
    // Triangle (a, b, d)
    return h_a + fu * (h_d - h_a) + fv * (h_b - h_a);
  } else {
    // Triangle (b, c, d)
    return h_c + (1 - fu) * (h_b - h_c) + (1 - fv) * (h_d - h_c);
  }
};

export const getTerrainNormal = (x: number, z: number): THREE.Vector3 => {
  const u = (x + TERRAIN_SIZE / 2) / SEGMENT_SIZE;
  const v = (z + TERRAIN_SIZE / 2) / SEGMENT_SIZE;

  const ix = Math.floor(u);
  const iy = Math.floor(v);

  const fu = u - ix;
  const fv = v - iy;

  const x0 = ix * SEGMENT_SIZE - TERRAIN_SIZE / 2;
  const z0 = iy * SEGMENT_SIZE - TERRAIN_SIZE / 2;
  const x1 = (ix + 1) * SEGMENT_SIZE - TERRAIN_SIZE / 2;
  const z1 = (iy + 1) * SEGMENT_SIZE - TERRAIN_SIZE / 2;

  const h_a = getContinuousTerrainHeight(x0, z0);
  const h_b = getContinuousTerrainHeight(x0, z1);
  const h_c = getContinuousTerrainHeight(x1, z1);
  const h_d = getContinuousTerrainHeight(x1, z0);

  const normal = new THREE.Vector3();

  if (fu + fv <= 1) {
    // Triangle (a, b, d)
    normal.set(
      -SEGMENT_SIZE * (h_d - h_a),
      SEGMENT_SIZE * SEGMENT_SIZE,
      -SEGMENT_SIZE * (h_b - h_a)
    );
  } else {
    // Triangle (b, c, d)
    normal.set(
      -SEGMENT_SIZE * (h_b - h_c),
      SEGMENT_SIZE * SEGMENT_SIZE,
      -SEGMENT_SIZE * (h_d - h_c)
    );
  }
  
  return normal.normalize();
};
