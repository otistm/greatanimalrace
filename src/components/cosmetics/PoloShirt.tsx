import React, { useMemo } from 'react';
import * as THREE from 'three';
import { Decal, Outlines } from '@react-three/drei';
import { ShirtProps } from './types';
import { createFabricBumpMap } from '../../utils/cosmetics';

// Builds a transparent canvas containing just the pocket outline + top
// opening seam. Projected onto the polo body via <Decal> so it follows
// the shirt's curvature instead of floating in front of it.
const createPocketDecalTexture = (): THREE.Texture => {
  const w = 160;
  const h = 180;
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d')!;
  ctx.clearRect(0, 0, w, h);

  const pad = 14;
  const x = pad;
  const y = pad;
  const rectW = w - pad * 2;
  const rectH = h - pad * 2;

  // Three-sided pocket outline (left, bottom, right) — the top edge is
  // drawn separately as a thicker "opening" seam.
  ctx.strokeStyle = 'rgba(0,0,0,0.85)';
  ctx.lineWidth = 5;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(x, y + 6);
  ctx.lineTo(x, y + rectH);
  ctx.lineTo(x + rectW, y + rectH);
  ctx.lineTo(x + rectW, y + 6);
  ctx.stroke();

  // Top opening seam — slightly thicker, clean horizontal stroke.
  ctx.strokeStyle = 'rgba(0,0,0,0.95)';
  ctx.lineWidth = 7;
  ctx.beginPath();
  ctx.moveTo(x - 2, y);
  ctx.lineTo(x + rectW + 2, y);
  ctx.stroke();

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;
  tex.needsUpdate = true;
  return tex;
};

export function PoloShirt({ texture, bodyScale = [1.06, 0.95, 1.06], bodyOffset = [0, -0.05, 0] }: ShirtProps) {
  const bumpMap = useMemo(() => createFabricBumpMap(), []);
  const pocketDecal = useMemo(() => createPocketDecalTexture(), []);
  if (!texture) return null;

  return (
    <group scale={bodyScale} position={bodyOffset}>
      {/* Main Body */}
      <mesh castShadow receiveShadow>
        <sphereGeometry args={[0.65, 32, 32, 0, Math.PI * 2, 0.15 * Math.PI, 0.7 * Math.PI]} />
        <meshPhysicalMaterial map={texture} bumpMap={bumpMap} bumpScale={0.02} roughness={0.9} />
        <Outlines thickness={0.02} color="black" />

        {/* Chest pocket — projected onto the body sphere so it reads as
            part of the shirt fabric. Position sits in front of the
            bunny's left chest; Y-rotation aims the projection toward
            the body center so the decal wraps the side curve. */}
        <Decal
          position={[-0.25, 0.18, 0.5]}
          rotation={[0, -0.4, 0]}
          scale={[0.22, 0.22, 0.4]}
          map={pocketDecal}
          polygonOffsetFactor={-10}
        />
      </mesh>

      {/* Polo Collar — flat torus around the neck opening, matching the
          proven Shirt-collar pattern that stays visible above the body
          (the head sphere occludes anything tilted up from here). The
          polo distinction now comes from the buttoned placket and the
          chest pocket below. */}
      <mesh position={[0, 0.6, 0]} rotation={[Math.PI/2, 0, 0]} castShadow>
        <torusGeometry args={[0.35, 0.06, 16, 64]} />
        <meshPhysicalMaterial map={texture} bumpMap={bumpMap} bumpScale={0.02} roughness={0.9} />
        <Outlines thickness={0.015} color="black" />
      </mesh>

      {/* Placket (Button strip) — short vertical strip hugging the body
          surface so the buttons read as part of the shirt rather than
          floating in front. */}
      <mesh position={[0, 0.21, 0.6]} rotation={[-0.2, 0, 0]} castShadow>
        <boxGeometry args={[0.13, 0.28, 0.02]} />
        <meshPhysicalMaterial map={texture} bumpMap={bumpMap} bumpScale={0.02} roughness={0.9} />
        <Outlines thickness={0.01} color="black" />
      </mesh>

      {/* Buttons */}
      {Array.from({ length: 2 }).map((_, i) => (
        <mesh key={`button-${i}`} position={[0, 0.31 - (i * 0.14), 0.63]} rotation={[Math.PI/2, 0, 0]} castShadow>
          <cylinderGeometry args={[0.03, 0.03, 0.02, 16]} />
          <meshStandardMaterial color="#ffffff" roughness={0.5} />
          <Outlines thickness={0.01} color="black" />
        </mesh>
      ))}

    </group>
  );
}