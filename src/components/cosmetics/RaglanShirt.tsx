import React, { useMemo } from 'react';
import { Outlines } from '@react-three/drei';
import { ShirtProps } from './types';
import { createFabricBumpMap, getColor } from '../../utils/cosmetics';
import * as THREE from 'three';

export function RaglanShirt({ texture, color = '#111827', bodyScale = [1.06, 0.95, 1.06], bodyOffset = [0, -0.05, 0] }: ShirtProps) {
  const bumpMap = useMemo(() => createFabricBumpMap(), []);
  
  return (
    <group scale={bodyScale} position={bodyOffset}>
      {/* Main Body (White) */}
      <mesh castShadow receiveShadow>
        <sphereGeometry args={[0.65, 32, 32, 0, Math.PI * 2, 0.15 * Math.PI, 0.7 * Math.PI]} />
        <meshPhysicalMaterial color="#ffffff" bumpMap={bumpMap} bumpScale={0.02} roughness={0.9} />
        <Outlines thickness={0.02} color="black" />
      </mesh>
      
      {/* Collar (Colored like sleeves) */}
      <mesh position={[0, 0.6, 0]} rotation={[Math.PI/2, 0, 0]} castShadow>
        <torusGeometry args={[0.35, 0.05, 16, 64]} />
        <meshPhysicalMaterial color={color} bumpMap={bumpMap} bumpScale={0.02} roughness={0.9} />
        <Outlines thickness={0.015} color="black" />
      </mesh>

      {/* Bottom Hem */}
    </group>
  );
}

export function RaglanSleeve({ color = '#111827', position = [0, 0.11, 0], scale = 1, rotation = [0, 0, 0] }: ShirtProps & { position?: [number, number, number]; scale?: number; rotation?: [number, number, number] }) {
  const bumpMap = useMemo(() => createFabricBumpMap(), []);

  return (
    <group position={position} scale={scale} rotation={rotation}>
      <mesh castShadow receiveShadow>
        {/* Longer sleeve for raglan */}
        <capsuleGeometry args={[0.16, 0.35, 16, 16]} />
        <meshPhysicalMaterial color={color} bumpMap={bumpMap} bumpScale={0.02} roughness={0.9} />
        <Outlines thickness={0.02} color="black" />
      </mesh>
      
      {/* Sleeve Cuff */}
    </group>
  );
}