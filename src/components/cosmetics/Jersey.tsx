import React, { useMemo } from 'react';
import * as THREE from 'three';
import { Decal, Outlines } from '@react-three/drei';
import { ShirtProps } from './types';
import { createFabricBumpMap } from '../../utils/cosmetics';

// Build a tall, narrow decal that paints the white button-down placket
// directly onto the jersey body. Drawn into a transparent canvas so it
// projects only the placket strip plus its buttons; the rest of the
// decal box stays clear and the underlying jersey shows through.
const createPlacketDecalTexture = (): THREE.Texture => {
  const w = 80;
  const h = 320;
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d')!;

  ctx.clearRect(0, 0, w, h);

  // The placket itself — a vertical white strip spanning most of the
  // canvas height, leaving a small clear margin at top and bottom so
  // the strip ends cleanly.
  ctx.fillStyle = '#ffffff';
  const stripeWidth = 36;
  const stripeX = (w - stripeWidth) / 2;
  ctx.fillRect(stripeX, 16, stripeWidth, h - 32);

  // Subtle outline so the placket reads against any jersey color.
  ctx.strokeStyle = 'rgba(0,0,0,0.35)';
  ctx.lineWidth = 2;
  ctx.strokeRect(stripeX, 16, stripeWidth, h - 32);

  // Four buttons evenly spaced down the placket.
  ctx.fillStyle = '#d1d5db';
  ctx.strokeStyle = 'rgba(0,0,0,0.5)';
  ctx.lineWidth = 1.5;
  const cx = w / 2;
  const buttonRadius = 6;
  const buttonYs = [80, 140, 200, 260];
  for (const cy of buttonYs) {
    ctx.beginPath();
    ctx.arc(cx, cy, buttonRadius, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;
  tex.needsUpdate = true;
  return tex;
};

// A baseball-style jersey: button-down placket painted onto the body via
// a Decal so it follows the shirt's curvature, white V-yoke at the neck,
// and an optional pinstripe texture for themed sets.
export function Jersey({
  color = '#dc2626',
  bodyScale = [1.14, 1.15, 1.14],
  bodyOffset = [0, -0.05, 0],
  texture,
}: ShirtProps) {
  const bumpMap = useMemo(() => createFabricBumpMap(), []);
  const placketDecal = useMemo(() => createPlacketDecalTexture(), []);
  const main = color;
  const trim = '#ffffff';

  // When a pattern texture is supplied (e.g. pinstripes for the Slugger
  // Jersey) the body uses the texture as a color map; otherwise we render
  // a flat color.
  const bodyMatProps = texture ? { map: texture, color: '#ffffff' } : { color: main };

  // Wrap the upper body but stop above the bunny's legs. The bunny's
  // legs are visible (poking out beyond the body sphere) roughly at
  // world y < 0.2; phi 0.08π..0.70π ends the jersey hem at about world
  // y≈0.21, so the legs read clearly underneath the shirt.
  return (
    <group scale={bodyScale} position={bodyOffset}>
      {/* Main jersey body */}
      <mesh castShadow receiveShadow>
        <sphereGeometry args={[0.65, 32, 32, 0, Math.PI * 2, 0.08 * Math.PI, 0.62 * Math.PI]} />
        <meshPhysicalMaterial {...bodyMatProps} bumpMap={bumpMap} bumpScale={0.025} roughness={0.85} />
        <Outlines thickness={0.02} color="black" />

        {/* Placket + buttons projected onto the front of the jersey
            body. The decal's projection box is narrow horizontally and
            tall vertically so the white strip wraps the chest curve
            from collar to mid-belly. Depth (Z scale) is large enough
            that the decal reaches the sphere surface from in front. */}
        <Decal
          position={[0, 0.05, 0.55]}
          rotation={[0, 0, 0]}
          scale={[0.18, 0.55, 0.45]}
          map={placketDecal}
          polygonOffsetFactor={-10}
        />
      </mesh>

      {/* White collar/yoke — sits on the upper chest, well below the
          bunny's mouth (world y≈1.26). At jersey-local y=0.45 the collar
          rides world y≈1.17 with extent ±0.05, so it can't intrude on
          the face. Main radius matches the jersey body radius at that
          height so the torus hugs the shirt. */}
      <mesh position={[0, 0.45, 0]} rotation={[Math.PI / 2, 0, 0]} castShadow>
        <torusGeometry args={[0.47, 0.04, 16, 64]} />
        <meshPhysicalMaterial color={trim} bumpMap={bumpMap} bumpScale={0.02} roughness={0.85} />
        <Outlines thickness={0.015} color="black" />
      </mesh>
    </group>
  );
}
