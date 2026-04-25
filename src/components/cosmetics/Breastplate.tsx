import React, { useMemo } from 'react';
import { Outlines } from '@react-three/drei';
import { ShirtProps } from './types';
import { createFabricBumpMap } from '../../utils/cosmetics';

// A polished steel breastplate with golden trim and rivets. Replaces the
// fabric-shirt body with a metallic chest piece.
export function Breastplate({
  color = '#a8b2bd',
  bodyScale = [1.08, 0.95, 1.08],
  bodyOffset = [0, -0.05, 0],
}: ShirtProps) {
  const bumpMap = useMemo(() => createFabricBumpMap(), []);
  const steel = color;
  const gold = '#fbbf24';
  const darkSteel = '#475569';

  return (
    <group scale={bodyScale} position={bodyOffset}>
      {/* Chest plate - same partial sphere as a shirt body */}
      <mesh castShadow receiveShadow>
        <sphereGeometry args={[0.66, 32, 32, 0, Math.PI * 2, 0.15 * Math.PI, 0.7 * Math.PI]} />
        <meshStandardMaterial
          color={steel}
          metalness={0.85}
          roughness={0.25}
          bumpMap={bumpMap}
          bumpScale={0.005}
        />
        <Outlines thickness={0.025} color="black" />
      </mesh>

      {/* Golden neckline trim */}
      <mesh position={[0, 0.55, 0]} rotation={[Math.PI / 2, 0, 0]} castShadow>
        <torusGeometry args={[0.34, 0.045, 16, 64]} />
        <meshStandardMaterial color={gold} metalness={0.95} roughness={0.2} />
        <Outlines thickness={0.015} color="black" />
      </mesh>

      {/* Shoulder pauldrons (left + right) */}
      {[-1, 1].map((side) => (
        <group key={`pauldron-${side}`} position={[side * 0.55, 0.35, 0]}>
          <mesh castShadow>
            <sphereGeometry args={[0.22, 16, 16, 0, Math.PI * 2, 0, Math.PI / 2]} />
            <meshStandardMaterial color={steel} metalness={0.85} roughness={0.25} />
            <Outlines thickness={0.025} color="black" />
          </mesh>
          {/* Pauldron golden rim */}
          <mesh position={[0, -0.005, 0]} rotation={[Math.PI / 2, 0, 0]}>
            <torusGeometry args={[0.22, 0.025, 12, 32]} />
            <meshStandardMaterial color={gold} metalness={0.95} roughness={0.2} />
          </mesh>
        </group>
      ))}

      {/* Rivets across chest */}
      {[
        [-0.35, 0.25],
        [0.35, 0.25],
        [-0.35, -0.2],
        [0.35, -0.2],
      ].map(([x, y], i) => (
        <mesh key={`rivet-${i}`} position={[x, y, 0.6]}>
          <sphereGeometry args={[0.03, 8, 8]} />
          <meshStandardMaterial color={gold} metalness={0.95} roughness={0.2} />
        </mesh>
      ))}
    </group>
  );
}
