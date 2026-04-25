import React from 'react';
import { Outlines } from '@react-three/drei';
import { CosmeticProps } from './types';

// A medieval longsword with a steel blade, golden crossguard and pommel,
// brown leather grip. Pointing upward (positive Y) when held in the right hand.
export function Sword({ color = '#a8b2bd' }: CosmeticProps) {
  const steel = color;
  const gold = '#fbbf24';
  const grip = '#7c2d12';

  return (
    <group rotation={[0, 0, -Math.PI / 4]} position={[0, 0, -0.3]}>
      {/* Pommel (base) */}
      <mesh position={[0, -0.55, 0]} castShadow>
        <sphereGeometry args={[0.07, 16, 16]} />
        <meshStandardMaterial color={gold} metalness={0.95} roughness={0.25} />
        <Outlines thickness={0.02} color="black" />
      </mesh>

      {/* Grip (leather wrap) */}
      <mesh position={[0, -0.4, 0]} castShadow>
        <cylinderGeometry args={[0.045, 0.045, 0.25, 12]} />
        <meshStandardMaterial color={grip} roughness={0.85} />
        <Outlines thickness={0.02} color="black" />
      </mesh>

      {/* Crossguard */}
      <mesh position={[0, -0.25, 0]} castShadow>
        <boxGeometry args={[0.42, 0.06, 0.08]} />
        <meshStandardMaterial color={gold} metalness={0.95} roughness={0.25} />
        <Outlines thickness={0.02} color="black" />
      </mesh>

      {/* Crossguard finials */}
      {[-0.21, 0.21].map((x) => (
        <mesh key={`finial-${x}`} position={[x, -0.25, 0]} castShadow>
          <sphereGeometry args={[0.045, 12, 12]} />
          <meshStandardMaterial color={gold} metalness={0.95} roughness={0.25} />
        </mesh>
      ))}

      {/* Blade - flat tapered shape */}
      <mesh position={[0, 0.25, 0]} castShadow receiveShadow>
        <boxGeometry args={[0.11, 0.95, 0.025]} />
        <meshStandardMaterial color={steel} metalness={0.85} roughness={0.2} />
        <Outlines thickness={0.02} color="black" />
      </mesh>

      {/* Blade tip */}
      <mesh position={[0, 0.78, 0]} castShadow>
        <coneGeometry args={[0.055, 0.18, 4]} />
        <meshStandardMaterial color={steel} metalness={0.85} roughness={0.2} />
        <Outlines thickness={0.02} color="black" />
      </mesh>

      {/* Center fuller line for depth */}
      <mesh position={[0, 0.25, 0.014]}>
        <boxGeometry args={[0.025, 0.85, 0.005]} />
        <meshStandardMaterial color="#475569" metalness={0.7} roughness={0.4} />
      </mesh>
    </group>
  );
}
