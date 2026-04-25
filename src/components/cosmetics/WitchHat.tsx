import React from 'react';
import { Outlines } from '@react-three/drei';
import { CosmeticProps } from './types';

export function WitchHat({ color = '#4f46e5', animalType = 'bunny', headScale = 1, headOffset = [0, 0, 0] }: CosmeticProps) {
  const isUnicorn = animalType === 'unicorn';
  const posZ = isUnicorn ? -0.15 : 0;
  const rotX = isUnicorn ? -0.1 : 0;

  return (
    <group position={headOffset} scale={headScale} rotation={[rotX, 0, 0]}>
      <group position={[0, 0.6, posZ]} scale={1.1}>
        {/* Brim */}
        <mesh position={[0, 0, 0]} castShadow>
          <cylinderGeometry args={[0.8, 0.8, 0.04, 32]} />
          <meshPhysicalMaterial color="#111827" roughness={0.9} clearcoat={0.1} />
          <Outlines thickness={0.02} color="black" />
        </mesh>
        
        {/* Brim Edge Torus */}
        <mesh position={[0, 0, 0]} rotation={[Math.PI / 2, 0, 0]} castShadow>
          <torusGeometry args={[0.8, 0.02, 16, 64]} />
          <meshPhysicalMaterial color="#111827" roughness={0.9} />
        </mesh>
        
        {/* Cone (Hat Top) — full cone tapering to a single point apex. */}
        <mesh position={[0, 0.55, 0]} rotation={[0, 0, -0.05]} castShadow>
          <coneGeometry args={[0.45, 1.1, 32]} />
          <meshPhysicalMaterial color="#111827" roughness={0.9} clearcoat={0.1} />
          <Outlines thickness={0.02} color="black" />
        </mesh>
        
        {/* Colored Band */}
        <mesh position={[0, 0.15, 0]} castShadow>
          <cylinderGeometry args={[0.42, 0.45, 0.15, 32]} />
          <meshPhysicalMaterial color={color} roughness={0.3} metalness={0.2} clearcoat={0.5} />
          <Outlines thickness={0.02} color="black" />
        </mesh>
        
        {/* Gold Buckle Outer */}
        <mesh position={[0, 0.15, 0.43]} rotation={[-0.1, 0, 0]} castShadow>
          <boxGeometry args={[0.15, 0.12, 0.02]} />
          <meshStandardMaterial color="#ffd700" metalness={1.0} roughness={0.2} />
          <Outlines thickness={0.01} color="black" />
        </mesh>
        
        {/* Gold Buckle Inner Hole */}
        <mesh position={[0, 0.15, 0.435]} rotation={[-0.1, 0, 0]}>
          <boxGeometry args={[0.09, 0.08, 0.02]} />
          <meshPhysicalMaterial color="#111827" roughness={0.9} />
        </mesh>
      </group>
    </group>
  );
}