import React, { useMemo } from 'react';
import { Outlines } from '@react-three/drei';
import { ShirtProps } from './types';
import { createFabricBumpMap } from '../../utils/cosmetics';

export function CropTop({ texture, bodyScale = [1.06, 0.85, 1.06], bodyOffset = [0, 0.05, 0] }: ShirtProps) {
  const bumpMap = useMemo(() => createFabricBumpMap(), []);
  if (!texture) return null;

  return (
    <group scale={bodyScale} position={bodyOffset}>
      {/* Main Body (Shorter) */}
      <mesh castShadow receiveShadow>
        {/* Use a sphere but cut off the bottom and top to avoid pinching */}
        <sphereGeometry args={[0.65, 32, 32, 0, Math.PI * 2, 0.15 * Math.PI, 0.3 * Math.PI]} />
        <meshPhysicalMaterial map={texture} bumpMap={bumpMap} bumpScale={0.02} roughness={0.9} />
        <Outlines thickness={0.02} color="black" />
      </mesh>
      
      {/* Collar */}
      <mesh position={[0, 0.6, 0]} rotation={[Math.PI/2, 0, 0]} castShadow>
        <torusGeometry args={[0.35, 0.04, 16, 64]} />
        <meshPhysicalMaterial map={texture} bumpMap={bumpMap} bumpScale={0.02} roughness={0.9} />
        <Outlines thickness={0.015} color="black" />
      </mesh>

      {/* Bottom Hem */}
    </group>
  );
}