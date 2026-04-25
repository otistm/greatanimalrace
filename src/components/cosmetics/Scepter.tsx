import React from 'react';
import { Outlines } from '@react-three/drei';
import { CosmeticProps } from './types';

// A regal staff held in the right hand: tall golden shaft topped with a
// jeweled orb. Designed to read clearly at small icon sizes too.
export function Scepter({ color = '#fbbf24' }: CosmeticProps) {
  const gold = color;
  const rubyColor = '#d90036';

  const goldMatProps = { color: gold, metalness: 1.0, roughness: 0.25 };
  const rubyMatProps = { color: rubyColor, metalness: 0.1, roughness: 0.1, transmission: 0.9, ior: 1.76, thickness: 1.5, clearcoat: 1 };

  return (
    <group position={[0, -0.2, 0]}>
      {/* Main Handle */}
      <mesh position={[0, 0, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[0.025, 0.015, 1.4, 16]} />
        <meshStandardMaterial {...goldMatProps} />
        <Outlines thickness={0.015} color="black" />
      </mesh>

      {/* Bottom Point */}
      <mesh position={[0, -0.75, 0]} rotation={[Math.PI, 0, 0]} castShadow>
        <coneGeometry args={[0.025, 0.15, 16]} />
        <meshStandardMaterial {...goldMatProps} />
        <Outlines thickness={0.015} color="black" />
      </mesh>

      {/* Handle Rings */}
      {[-0.35, 0, 0.35].map((y, i) => (
        <mesh key={`ring-${i}`} position={[0, y, 0]} rotation={[Math.PI / 2, 0, 0]} castShadow>
          <torusGeometry args={[0.03, 0.01, 16, 32]} />
          <meshStandardMaterial {...goldMatProps} />
        </mesh>
      ))}

      {/* Top Head Base */}
      <mesh position={[0, 0.75, 0]} castShadow>
        <cylinderGeometry args={[0.07, 0.025, 0.15, 16]} />
        <meshStandardMaterial {...goldMatProps} />
        <Outlines thickness={0.015} color="black" />
      </mesh>

      {/* The Giant Orb (Ruby) */}
      <mesh position={[0, 0.95, 0]} castShadow>
        <sphereGeometry args={[0.16, 32, 32]} />
        <meshPhysicalMaterial {...rubyMatProps} />
      </mesh>

      {/* Orb Crown/Holder */}
      <mesh position={[0, 0.95, 0]} rotation={[Math.PI / 2, 0, 0]} castShadow>
        <torusGeometry args={[0.165, 0.015, 16, 64]} />
        <meshStandardMaterial {...goldMatProps} />
        <Outlines thickness={0.015} color="black" />
      </mesh>

      {/* Top Cross */}
      <group position={[0, 1.2, 0]}>
        <mesh castShadow>
          <boxGeometry args={[0.03, 0.18, 0.03]} />
          <meshStandardMaterial {...goldMatProps} />
          <Outlines thickness={0.01} color="black" />
        </mesh>
        <mesh position={[0, 0.03, 0]} castShadow>
          <boxGeometry args={[0.12, 0.03, 0.03]} />
          <meshStandardMaterial {...goldMatProps} />
          <Outlines thickness={0.01} color="black" />
        </mesh>
      </group>
    </group>
  );
}
