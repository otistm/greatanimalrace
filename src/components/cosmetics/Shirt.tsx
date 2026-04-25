import React, { useMemo } from 'react';
import { Outlines } from '@react-three/drei';
import { ShirtProps } from './types';
import { createFabricBumpMap } from '../../utils/cosmetics';

export function Shirt({ texture, bodyScale = [1.06, 0.95, 1.06], bodyOffset = [0, -0.05, 0] }: ShirtProps) {
  const bumpMap = useMemo(() => createFabricBumpMap(), []);
  if (!texture) return null;

  return (
    <group scale={bodyScale} position={bodyOffset}>
      {/* Main Body */}
      <mesh castShadow receiveShadow>
        <sphereGeometry args={[0.65, 32, 32, 0, Math.PI * 2, 0.15 * Math.PI, 0.7 * Math.PI]} />
        <meshPhysicalMaterial map={texture} bumpMap={bumpMap} bumpScale={0.02} roughness={0.9} />
        <Outlines thickness={0.02} color="black" />
      </mesh>
      
      {/* Collar */}
      <mesh position={[0, 0.6, 0]} rotation={[Math.PI/2, 0, 0]} castShadow>
        <torusGeometry args={[0.35, 0.05, 16, 64]} />
        <meshPhysicalMaterial map={texture} bumpMap={bumpMap} bumpScale={0.02} roughness={0.9} />
        <Outlines thickness={0.015} color="black" />
      </mesh>

      {/* Buttons Down the Front */}
      {Array.from({ length: 4 }).map((_, i) => (
        <mesh key={`button-${i}`} position={[0, 0.3 - (i * 0.15), 0.63]} rotation={[Math.PI/2, 0, 0]} castShadow>
          <cylinderGeometry args={[0.04, 0.04, 0.02, 16]} />
          <meshStandardMaterial color="#ffffff" roughness={0.5} />
          <Outlines thickness={0.01} color="black" />
        </mesh>
      ))}
    </group>
  );
}

export function Sleeve({ color = '#111827', texture, isLong = false, position = [0, 0.2, 0], scale = 1, rotation = [0, 0, 0] }: ShirtProps & { isLong?: boolean; position?: [number, number, number]; scale?: number; rotation?: [number, number, number] }) {
  const bumpMap = useMemo(() => createFabricBumpMap(), []);

  const matProps = texture ? { map: texture } : { color };

  // Sleeve geometry needs to extend above the arm capsule's top (local y ~ 0.325)
  // so it visually wraps over the shoulder cap. The default y-position of 0.2
  // pushes the capsule's upper hemisphere into the shoulder area.
  return (
    <group position={position} scale={scale} rotation={rotation}>
      <mesh castShadow receiveShadow>
        <capsuleGeometry args={[0.18, isLong ? 0.4 : 0.1, 16, 16]} />
        <meshPhysicalMaterial {...matProps} bumpMap={bumpMap} bumpScale={0.02} roughness={0.9} />
        <Outlines thickness={0.02} color="black" />
      </mesh>
      
      {/* Sleeve Cuff */}
    </group>
  );
}