import React from 'react';
import { Outlines } from '@react-three/drei';
import { CosmeticProps } from './types';

// A heater-style knight's shield with a steel face, golden border, and a red
// cross emblem. Held flat against the left arm.
export function Shield({ color = '#a8b2bd' }: CosmeticProps) {
  const steel = color;
  const gold = '#fbbf24';
  const cross = '#dc2626';

  return (
    <group rotation={[0, 0, 0]} scale={2.5} position={[0, 0, -0.2]}>
      {/* Main shield body - tapered using a stretched octahedron-like box */}
      <mesh castShadow receiveShadow>
        <boxGeometry args={[0.5, 0.6, 0.06]} />
        <meshStandardMaterial color={steel} metalness={0.7} roughness={0.35} />
        <Outlines thickness={0.025} color="black" />
      </mesh>

      {/* Bottom point of the heater shield */}
      <mesh position={[0, -0.36, 0]} rotation={[0, 0, Math.PI]} castShadow>
        <coneGeometry args={[0.25, 0.18, 4]} />
        <meshStandardMaterial color={steel} metalness={0.7} roughness={0.35} />
        <Outlines thickness={0.025} color="black" />
      </mesh>

      {/* Golden border - top */}
      <mesh position={[0, 0.32, 0.035]}>
        <boxGeometry args={[0.5, 0.05, 0.005]} />
        <meshStandardMaterial color={gold} metalness={0.95} roughness={0.2} />
      </mesh>

      {/* Golden border - left */}
      <mesh position={[-0.235, 0, 0.035]}>
        <boxGeometry args={[0.05, 0.6, 0.005]} />
        <meshStandardMaterial color={gold} metalness={0.95} roughness={0.2} />
      </mesh>

      {/* Golden border - right */}
      <mesh position={[0.235, 0, 0.035]}>
        <boxGeometry args={[0.05, 0.6, 0.005]} />
        <meshStandardMaterial color={gold} metalness={0.95} roughness={0.2} />
      </mesh>

      {/* Red cross emblem - vertical bar */}
      <mesh position={[0, 0, 0.04]}>
        <boxGeometry args={[0.08, 0.4, 0.005]} />
        <meshStandardMaterial color={cross} roughness={0.5} />
      </mesh>

      {/* Red cross emblem - horizontal bar */}
      <mesh position={[0, 0.05, 0.04]}>
        <boxGeometry args={[0.3, 0.08, 0.005]} />
        <meshStandardMaterial color={cross} roughness={0.5} />
      </mesh>

      {/* Center boss */}
      <mesh position={[0, 0.05, 0.06]} castShadow>
        <sphereGeometry args={[0.05, 16, 16]} />
        <meshStandardMaterial color={gold} metalness={0.95} roughness={0.2} />
        <Outlines thickness={0.015} color="black" />
      </mesh>
    </group>
  );
}
