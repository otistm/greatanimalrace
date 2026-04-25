import React from 'react';
import { Outlines } from '@react-three/drei';
import { CosmeticProps } from './types';

export function TopHat({ color = '#4f46e5', animalType = 'bunny', headScale = 1, headOffset = [0, 0, 0] }: CosmeticProps) {
  const isUnicorn = animalType === 'unicorn';
  const posZ = isUnicorn ? -0.15 : 0;
  const rotX = isUnicorn ? -0.1 : 0;

  return (
    <group position={headOffset} scale={headScale} rotation={[rotX, 0, 0]}>
      <group position={[0, 0.55, posZ]} scale={1.1}>
        {/* Brim */}
        <mesh position={[0, 0, 0]} castShadow>
          <cylinderGeometry args={[0.55, 0.55, 0.04, 32]} />
          <meshPhysicalMaterial color={color} roughness={0.9} clearcoat={0.1} />
          <Outlines thickness={0.02} color="black" />
        </mesh>
        {/* Brim Edge Torus */}
        <mesh position={[0, 0, 0]} rotation={[Math.PI / 2, 0, 0]} castShadow>
          <torusGeometry args={[0.55, 0.02, 16, 64]} />
          <meshPhysicalMaterial color={color} roughness={0.9} />
        </mesh>
        
        {/* Top Dome/Cylinder */}
        <mesh position={[0, 0.35, 0]} castShadow>
          <cylinderGeometry args={[0.35, 0.35, 0.7, 32]} />
          <meshPhysicalMaterial color={color} roughness={0.9} clearcoat={0.1} />
          <Outlines thickness={0.02} color="black" />
        </mesh>
        {/* Top Edge Torus */}
        <mesh position={[0, 0.7, 0]} rotation={[Math.PI / 2, 0, 0]} castShadow>
          <torusGeometry args={[0.35, 0.02, 16, 32]} />
          <meshPhysicalMaterial color={color} roughness={0.9} />
        </mesh>
        
        {/* Satin Band */}
        <mesh position={[0, 0.1, 0]} castShadow>
          <cylinderGeometry args={[0.36, 0.36, 0.15, 32]} />
          <meshPhysicalMaterial color="#111827" roughness={0.3} metalness={0.1} clearcoat={0.5} />
          <Outlines thickness={0.02} color="black" />
        </mesh>
        
        {/* Gold Buckle Outer */}
        <mesh position={[0, 0.1, 0.36]} castShadow>
          <boxGeometry args={[0.15, 0.1, 0.02]} />
          <meshStandardMaterial color="#ffd700" metalness={1.0} roughness={0.2} />
          <Outlines thickness={0.01} color="black" />
        </mesh>
        {/* Gold Buckle Inner Hole */}
        <mesh position={[0, 0.1, 0.365]}>
          <boxGeometry args={[0.09, 0.06, 0.02]} />
          <meshPhysicalMaterial color="#111827" roughness={0.3} metalness={0.1} clearcoat={0.5} />
        </mesh>
      </group>
    </group>
  );
}