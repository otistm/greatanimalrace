import React, { useMemo } from 'react';
import * as THREE from 'three';
import { Decal, Outlines } from '@react-three/drei';
import { CosmeticProps } from './types';

interface CapProps extends CosmeticProps {
  texture?: THREE.Texture | null;
}

// Renders a circular baseball emblem (white ball with red figure-8 stitching)
// into a transparent canvas. The transparent background means we can project
// it onto the cap dome via <Decal> and have the dome's pinstripes show
// through everywhere except inside the emblem disc.
const createBaseballEmblemTexture = (): THREE.Texture => {
  const size = 256;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;

  ctx.clearRect(0, 0, size, size);

  const cx = size / 2;
  const cy = size / 2;
  const r = size * 0.42;

  // White ball disc with a thin black outline so the emblem reads
  // against any cap color/pattern.
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#000000';
  ctx.lineWidth = 4;
  ctx.stroke();

  // Two arcing red seams (the classic baseball figure-8 read from the
  // front). Each seam bows inward toward the ball's center.
  ctx.strokeStyle = '#dc2626';
  ctx.lineWidth = 5;
  ctx.lineCap = 'round';

  const seamOffset = r * 0.55;
  const topY = cy - r * 0.85;
  const botY = cy + r * 0.85;

  // Left seam.
  const lStartX = cx - seamOffset;
  const lCtrlX = cx - r * 0.1;
  ctx.beginPath();
  ctx.moveTo(lStartX, topY);
  ctx.quadraticCurveTo(lCtrlX, cy, lStartX, botY);
  ctx.stroke();

  // Right seam.
  const rStartX = cx + seamOffset;
  const rCtrlX = cx + r * 0.1;
  ctx.beginPath();
  ctx.moveTo(rStartX, topY);
  ctx.quadraticCurveTo(rCtrlX, cy, rStartX, botY);
  ctx.stroke();

  // Short perpendicular dashes along each seam to read as stitches.
  ctx.lineWidth = 2.5;
  for (let i = 1; i <= 9; i++) {
    const t = i / 10;
    const ly = (1 - t) * (1 - t) * topY + 2 * (1 - t) * t * cy + t * t * botY;

    // Left seam.
    const lx = (1 - t) * (1 - t) * lStartX + 2 * (1 - t) * t * lCtrlX + t * t * lStartX;
    ctx.beginPath();
    ctx.moveTo(lx - 8, ly - 3);
    ctx.lineTo(lx + 8, ly + 3);
    ctx.stroke();

    // Right seam.
    const rx = (1 - t) * (1 - t) * rStartX + 2 * (1 - t) * t * rCtrlX + t * t * rStartX;
    ctx.beginPath();
    ctx.moveTo(rx - 8, ly - 3);
    ctx.lineTo(rx + 8, ly + 3);
    ctx.stroke();
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;
  tex.needsUpdate = true;
  return tex;
};

export function Cap({ color = '#ef4444', animalType = 'bunny', headScale = 1, headOffset = [0, 0, 0], texture }: CapProps) {
  const isUnicorn = animalType === 'unicorn';
  const posZ = isUnicorn ? -0.3 : 0;
  const posY = isUnicorn ? 0.6 : 0.5;
  const forwardTilt = (5 * Math.PI) / 180;
  const rotX = (isUnicorn ? -0.10 : 0) + forwardTilt;

  // The Slugger Cap is the only Cap variant that ships with a texture
  // (pinstripes), so we use the texture's presence as the signal to
  // project a baseball emblem onto the dome via Decal.
  const isSlugger = !!texture;

  // Pinstripe / patterned cap: dome and brim use the texture; the top button
  // and brim hem stay solid color so the silhouette still reads cleanly.
  const domeMatProps = texture ? { map: texture, color: '#ffffff' } : { color };
  const brimMatProps = texture ? { map: texture, color: '#ffffff' } : { color };

  const baseballEmblem = useMemo(() => (isSlugger ? createBaseballEmblemTexture() : null), [isSlugger]);

  return (
    <group position={headOffset} scale={headScale} rotation={[rotX, 0, 0]}>
      <group position={[0, posY, posZ]}>
        {/* Main Dome */}
        <mesh position={[0, 0.1, 0]} castShadow>
          <sphereGeometry args={[0.45, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2]} />
          <meshPhysicalMaterial {...domeMatProps} roughness={0.9} />
          <Outlines thickness={0.02} color="black" />

          {/* Slugger Cap baseball emblem — projected onto the front of
              the dome so it follows the curve and reads as part of the
              cap, not a floating prop. Position is in dome-local space
              (dome center at origin, radius 0.45). */}
          {baseballEmblem && (
            <Decal
              position={[0, 0.18, 0.35]}
              rotation={[-0.4, 0, 0]}
              scale={[0.22, 0.22, 0.4]}
              map={baseballEmblem}
              polygonOffsetFactor={-10}
            />
          )}
        </mesh>
        
        {/* Dome Bottom Hem */}
        <mesh position={[0, 0.1, 0]} rotation={[Math.PI / 2, 0, 0]} castShadow>
          <torusGeometry args={[0.45, 0.02, 16, 64]} />
          <meshPhysicalMaterial color={color} roughness={0.9} />
          <Outlines thickness={0.02} color="black" />
        </mesh>
        
        {/* Brim */}
        <mesh position={[0, 0.05, 0.15]} rotation={[-0.1, 0, 0]} scale={[1.02, 1, 1.1]} castShadow>
          <cylinderGeometry args={[0.45, 0.45, 0.05, 32]} />
          <meshPhysicalMaterial {...brimMatProps} roughness={0.9} />
          <Outlines thickness={0.02} color="black" />
        </mesh>
        
        {/* Top Button */}
        <mesh position={[0, 0.55, 0]} castShadow>
          <sphereGeometry args={[0.08, 16, 16]} />
          <meshPhysicalMaterial color={color} roughness={0.9} metalness={0.2} />
          <Outlines thickness={0.015} color="black" />
        </mesh>

        {/* Generic (non-slugger) Cap front patch with a colored logo plate. */}
        {!isSlugger && (
          <group position={[0, 0.35, 0.38]} rotation={[-0.3, 0, 0]}>
            <mesh castShadow>
              <boxGeometry args={[0.3, 0.2, 0.02]} />
              <meshPhysicalMaterial color="#ffffff" roughness={1.0} />
              <Outlines thickness={0.015} color="black" />
            </mesh>
            <mesh position={[0, 0, 0.015]}>
              <planeGeometry args={[0.2, 0.1]} />
              <meshBasicMaterial color={color} />
            </mesh>
          </group>
        )}
      </group>
    </group>
  );
}
