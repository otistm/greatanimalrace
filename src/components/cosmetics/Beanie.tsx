import React from 'react';
import { Outlines } from '@react-three/drei';
import { CosmeticProps } from './types';

export function Beanie({ color = '#ef4444', animalType = 'bunny', headScale = 1, headOffset = [0, 0, 0] }: CosmeticProps) {
  const isUnicorn = animalType === 'unicorn';
  const posZ = isUnicorn ? -0.15 : 0;
  const rotX = isUnicorn ? -0.1 : 0;

  return (
    <group position={headOffset} scale={headScale} rotation={[rotX, 0, 0]}>
      <group position={[0, 0.45, posZ]}>
        {/* Dome */}
        <mesh position={[0, 0.1, 0]} castShadow>
          <sphereGeometry args={[0.46, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2]} />
          <meshPhysicalMaterial color={color} roughness={1.0} clearcoat={0} />
          <Outlines thickness={0.02} color="black" />
        </mesh>
        
        {/* Folded Brim Base */}
        <mesh position={[0, 0.05, 0]} rotation={[Math.PI / 2, 0, 0]} castShadow>
          <torusGeometry args={[0.47, 0.12, 16, 64]} />
          <meshPhysicalMaterial color={color} roughness={1.0} />
          <Outlines thickness={0.02} color="black" />
        </mesh>

        {/* Pom Pom (Clustered Spheres for fluffiness) */}
        <group position={[0, 0.65, 0]}>
          <mesh castShadow>
            <sphereGeometry args={[0.18, 16, 16]} />
            <meshPhysicalMaterial color="#ffffff" roughness={1.0} />
            <Outlines thickness={0.02} color="black" />
          </mesh>
          {Array.from({ length: 8 }).map((_, i) => (
            <mesh key={`fluff-${i}`} position={[
              (Math.random() - 0.5) * 0.15,
              (Math.random() - 0.5) * 0.15,
              (Math.random() - 0.5) * 0.15
            ]}>
              <sphereGeometry args={[0.1, 8, 8]} />
              <meshPhysicalMaterial color="#ffffff" roughness={1.0} />
            </mesh>
          ))}
        </group>
        
        {/* Brand Tag */}
        <mesh position={[0, 0.05, 0.6]} rotation={[-0.1, 0, 0]} castShadow>
          <boxGeometry args={[0.15, 0.1, 0.02]} />
          <meshPhysicalMaterial color="#ffffff" roughness={1.0} />
          <Outlines thickness={0.01} color="black" />
        </mesh>
      </group>
    </group>
  );
}