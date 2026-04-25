import React, { useMemo } from 'react';
import * as THREE from 'three';
import { Decal, Outlines } from '@react-three/drei';
import { ShirtProps } from './types';
import { createFabricBumpMap } from '../../utils/cosmetics';

export interface MilestoneShirtProps extends ShirtProps {
  number?: number;
}

// Renders the milestone number into a transparent canvas texture so we can
// project it onto the curved shirt surface via <Decal>. This makes the
// number read as "printed on" the shirt instead of a floating flat label.
const createNumberDecalTexture = (label: string): THREE.Texture => {
  const size = 256;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;

  ctx.clearRect(0, 0, size, size);

  const fontPx = label.length >= 3 ? 130 : label.length === 2 ? 170 : 210;
  ctx.font = `900 ${fontPx}px "Inter", system-ui, -apple-system, sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  ctx.lineJoin = 'round';
  ctx.miterLimit = 2;
  ctx.lineWidth = Math.max(10, fontPx * 0.08);
  ctx.strokeStyle = '#000000';
  ctx.strokeText(label, size / 2, size / 2);

  ctx.fillStyle = '#ffffff';
  ctx.fillText(label, size / 2, size / 2);

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;
  tex.needsUpdate = true;
  return tex;
};

export function MilestoneShirt({
  texture,
  bodyScale = [1.06, 0.95, 1.06],
  bodyOffset = [0, -0.05, 0],
  number = 1,
}: MilestoneShirtProps) {
  const bumpMap = useMemo(() => createFabricBumpMap(), []);
  const label = String(number);
  const decalTexture = useMemo(() => createNumberDecalTexture(label), [label]);

  if (!texture) return null;

  // Decal scale controls how big the number prints on the chest. The shirt
  // sphere radius is 0.65 so a scale of ~0.55 gives a chest-sized graphic.
  const decalScale: [number, number, number] = label.length >= 3
    ? [0.6, 0.45, 0.5]
    : label.length === 2
    ? [0.5, 0.45, 0.5]
    : [0.42, 0.45, 0.5];

  return (
    <group scale={bodyScale} position={bodyOffset}>
      {/* Main short-sleeve tee body (no buttons, no pocket) */}
      <mesh castShadow receiveShadow>
        <sphereGeometry args={[0.65, 32, 32, 0, Math.PI * 2, 0.15 * Math.PI, 0.7 * Math.PI]} />
        <meshPhysicalMaterial map={texture} bumpMap={bumpMap} bumpScale={0.02} roughness={0.9} />
        <Outlines thickness={0.02} color="black" />

        {/* Printed milestone number projected onto the shirt surface */}
        <Decal
          position={[0, 0.05, 0.55]}
          rotation={[0, 0, 0]}
          scale={decalScale}
          map={decalTexture}
          polygonOffsetFactor={-10}
        />
      </mesh>

      {/* Round-neck collar */}
      <mesh position={[0, 0.55, 0]} rotation={[Math.PI / 2, 0, 0]} castShadow>
        <torusGeometry args={[0.32, 0.04, 16, 64]} />
        <meshPhysicalMaterial map={texture} bumpMap={bumpMap} bumpScale={0.02} roughness={0.9} />
        <Outlines thickness={0.015} color="black" />
      </mesh>
    </group>
  );
}
