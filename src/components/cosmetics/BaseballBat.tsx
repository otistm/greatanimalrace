import React from 'react';
import { Outlines } from '@react-three/drei';
import { CosmeticProps } from './types';

// A wooden baseball bat: tapered cylinder with a darker grip wrap at the
// handle end. Held vertically in the right hand.
export function BaseballBat({ color = '#a16207' }: CosmeticProps) {
  const wood = color;
  const grip = '#1f2937';
  const knob = '#7c2d12';

  return (
    <group>
      {/* Handle knob */}
      <mesh position={[0, -0.7, 0]} castShadow>
        <sphereGeometry args={[0.06, 16, 16]} />
        <meshStandardMaterial color={knob} roughness={0.7} />
        <Outlines thickness={0.02} color="black" />
      </mesh>

      {/* Grip wrap */}
      <mesh position={[0, -0.55, 0]} castShadow>
        <cylinderGeometry args={[0.045, 0.045, 0.25, 16]} />
        <meshStandardMaterial color={grip} roughness={0.85} />
        <Outlines thickness={0.02} color="black" />
      </mesh>

      {/* Handle taper */}
      <mesh position={[0, -0.27, 0]} castShadow>
        <cylinderGeometry args={[0.05, 0.045, 0.3, 16]} />
        <meshStandardMaterial color={wood} roughness={0.6} />
        <Outlines thickness={0.02} color="black" />
      </mesh>

      {/* Barrel */}
      <mesh position={[0, 0.18, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[0.085, 0.05, 0.6, 20]} />
        <meshStandardMaterial color={wood} roughness={0.5} />
        <Outlines thickness={0.02} color="black" />
      </mesh>

      {/* Rounded barrel top */}
      <mesh position={[0, 0.5, 0]} castShadow>
        <sphereGeometry args={[0.085, 16, 16]} />
        <meshStandardMaterial color={wood} roughness={0.5} />
        <Outlines thickness={0.02} color="black" />
      </mesh>

      {/* Subtle wood grain ring */}
      <mesh position={[0, 0.0, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.072, 0.003, 6, 24]} />
        <meshStandardMaterial color="#7c2d12" roughness={0.8} />
      </mesh>
    </group>
  );
}
