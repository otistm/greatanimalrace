import React from 'react';
import { Outlines } from '@react-three/drei';
import { CosmeticProps } from './types';

// Pirate king's straw hat — wide woven brim, faceted cone-cylinder crown,
// red hatband, and a few stitch marks for that hand-sewn look. Modeled
// after the iconic captain's hat: brim sits on top of the bunny's head
// with a subtle jaunty tilt forward and to the side.
export function StrawHat({ animalType = 'bunny', headScale = 1, headOffset = [0, 0, 0] }: CosmeticProps) {
  const isUnicorn = animalType === 'unicorn';
  const posZ = isUnicorn ? -0.15 : 0;
  const baseRotX = isUnicorn ? -0.1 : 0;

  const strawColor = '#fcd04c';
  const bandColor = '#ed3536';
  const stitchColor = '#222222';

  // A scattering of stitches around the cone — mix of X-marks and short
  // line dashes. Positions are in hat-local space (crown center y≈0.36).
  const stitches: { pos: [number, number, number]; rotY: number; isX: boolean }[] = [
    { pos: [0.30, 0.45, 0.30], rotY: Math.PI / 4, isX: true },
    { pos: [-0.36, 0.32, 0.18], rotY: -Math.PI / 3, isX: false },
    { pos: [-0.18, 0.50, -0.32], rotY: Math.PI, isX: true },
    { pos: [0.38, 0.22, -0.10], rotY: Math.PI / 2, isX: false },
  ];

  return (
    <group position={headOffset} scale={headScale} rotation={[baseRotX, 0, 0]}>
      {/* Hat anchor on top of the head, with subtle jaunty tilt. */}
      <group position={[0, 0.55, posZ]} rotation={[-0.10, 0, 0.08]}>
        {/* Wide woven brim */}
        <mesh castShadow receiveShadow>
          <cylinderGeometry args={[0.95, 0.95, 0.06, 24]} />
          <meshStandardMaterial color={strawColor} flatShading roughness={0.85} />
          <Outlines thickness={0.02} color="black" />
        </mesh>

        {/* Red hatband sitting just above the brim */}
        <mesh position={[0, 0.085, 0]} castShadow>
          <cylinderGeometry args={[0.46, 0.46, 0.10, 16]} />
          <meshStandardMaterial color={bandColor} flatShading roughness={0.7} />
          <Outlines thickness={0.015} color="black" />
        </mesh>

        {/* Conical crown — narrower at the top, low segments for a faceted
            chunky-toy look like the reference. */}
        <mesh position={[0, 0.36, 0]} castShadow receiveShadow>
          <cylinderGeometry args={[0.32, 0.45, 0.45, 12]} />
          <meshStandardMaterial color={strawColor} flatShading roughness={0.85} />
          <Outlines thickness={0.02} color="black" />
        </mesh>

        {/* Decorative dark stitches around the crown. Each stitch group
            is rotated to roughly face outward from the cone surface. */}
        {stitches.map((s, i) => (
          <group key={`stitch-${i}`} position={s.pos} rotation={[-0.2, s.rotY, 0]}>
            <mesh rotation={[0, 0, s.isX ? Math.PI / 4 : 0]}>
              <boxGeometry args={[0.018, 0.10, 0.01]} />
              <meshStandardMaterial color={stitchColor} flatShading />
            </mesh>
            {s.isX && (
              <mesh rotation={[0, 0, -Math.PI / 4]}>
                <boxGeometry args={[0.018, 0.10, 0.01]} />
                <meshStandardMaterial color={stitchColor} flatShading />
              </mesh>
            )}
          </group>
        ))}
      </group>
    </group>
  );
}
