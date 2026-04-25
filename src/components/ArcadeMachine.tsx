import React, { useRef, useMemo } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';

export function ArcadeMachine(props: any) {
  const { onClick, ...rest } = props;
  const screenMatRef = useRef<THREE.MeshStandardMaterial>(null);

  useFrame((state) => {
    if (screenMatRef.current) {
      // Small pulse effect on the screen to grab attention
      const hue = (state.clock.elapsedTime * 0.2) % 1;
      screenMatRef.current.emissive.setHSL(hue, 0.8, 0.4);
    }
  });

  return (
    <group {...rest} onClick={(e) => {
      e.stopPropagation();
      if (onClick) onClick();
    }}>
      {/* Base / Bottom part */}
      <mesh position={[0, 1.5, 0]} castShadow receiveShadow>
        <boxGeometry args={[2, 3, 2]} />
        <meshStandardMaterial color="#dc2626" roughness={0.7} />
      </mesh>
      
      {/* Control Panel (slanted) & Controls Group */}
      <group position={[0, 3.15, 0.85]} rotation={[Math.PI / 8, 0, 0]}>
        {/* Panel itself */}
        <mesh castShadow receiveShadow>
          <boxGeometry args={[2.2, 0.3, 1.2]} />
          <meshStandardMaterial color="#b91c1c" roughness={0.6} />
        </mesh>
        
        {/* Joystick base */}
        <mesh position={[-0.5, 0.175, 0.2]} castShadow>
          <cylinderGeometry args={[0.15, 0.2, 0.05, 16]} />
          <meshStandardMaterial color="#111827" />
        </mesh>
        {/* Joystick stick */}
        <mesh position={[-0.5, 0.375, 0.2]} castShadow>
          <cylinderGeometry args={[0.03, 0.03, 0.4, 8]} />
          <meshStandardMaterial color="#9ca3af" metalness={0.8} roughness={0.2} />
        </mesh>
        {/* Joystick ball */}
        <mesh position={[-0.5, 0.6, 0.2]} castShadow>
          <sphereGeometry args={[0.12, 16, 16]} />
          <meshStandardMaterial color="#ef4444" roughness={0.2} />
        </mesh>

        {/* Button 1 (Blue) */}
        <mesh position={[0.3, 0.19, 0.3]} castShadow>
          <cylinderGeometry args={[0.08, 0.08, 0.08, 16]} />
          <meshStandardMaterial color="#3b82f6" roughness={0.4} />
        </mesh>
        {/* Button 2 (Green) */}
        <mesh position={[0.6, 0.19, 0.2]} castShadow>
          <cylinderGeometry args={[0.08, 0.08, 0.08, 16]} />
          <meshStandardMaterial color="#10b981" roughness={0.4} />
        </mesh>
        {/* Button 3 (Yellow) */}
        <mesh position={[0.45, 0.19, 0.0]} castShadow>
          <cylinderGeometry args={[0.08, 0.08, 0.08, 16]} />
          <meshStandardMaterial color="#f59e0b" roughness={0.4} />
        </mesh>
      </group>
      
      {/* Screen backing / Cabinet top */}
      <mesh position={[0, 4.25, -0.2]} castShadow receiveShadow>
        <boxGeometry args={[2, 2.0, 1.6]} />
        <meshStandardMaterial color="#dc2626" roughness={0.7} />
      </mesh>

      {/* Side Panels */}
      <mesh position={[-1.05, 3.5, 0.1]} castShadow receiveShadow>
        <boxGeometry args={[0.1, 4, 2.2]} />
        <meshStandardMaterial color="#991b1b" />
      </mesh>
      <mesh position={[1.05, 3.5, 0.1]} castShadow receiveShadow>
        <boxGeometry args={[0.1, 4, 2.2]} />
        <meshStandardMaterial color="#991b1b" />
      </mesh>
      
      {/* Screen */}
      <mesh position={[0, 4.1, 0.61]} rotation={[-Math.PI / 16, 0, 0]}>
        <planeGeometry args={[1.6, 1.4]} />
        <meshStandardMaterial 
          ref={screenMatRef}
          color="#000000" 
          emissive="#3b82f6" 
          emissiveIntensity={0.8} 
        />
      </mesh>

      {/* Marquee (Top Title Area) */}
      <mesh position={[0, 5.4, 0.2]} castShadow receiveShadow>
        <boxGeometry args={[2, 0.8, 1.6]} />
        <meshStandardMaterial color="#b91c1c" roughness={0.6} />
      </mesh>
      
      {/* Marquee light */}
      <mesh position={[0, 5.4, 1.01]}>
        <planeGeometry args={[1.8, 0.6]} />
        <meshStandardMaterial color="#fcd34d" emissive="#fcd34d" emissiveIntensity={0.6} />
      </mesh>

      {/* Coin Slots */}
      <mesh position={[-0.4, 1.5, 1.01]}>
        <boxGeometry args={[0.2, 0.4, 0.05]} />
        <meshStandardMaterial color="#374151" metalness={0.8} />
      </mesh>
      <mesh position={[-0.4, 1.5, 1.04]}>
        <boxGeometry args={[0.02, 0.2, 0.02]} />
        <meshStandardMaterial color="#000000" />
      </mesh>

      <mesh position={[0.4, 1.5, 1.01]}>
        <boxGeometry args={[0.2, 0.4, 0.05]} />
        <meshStandardMaterial color="#374151" metalness={0.8} />
      </mesh>
      <mesh position={[0.4, 1.5, 1.04]}>
        <boxGeometry args={[0.02, 0.2, 0.02]} />
        <meshStandardMaterial color="#000000" />
      </mesh>

      {/* Stickers */}
      {/* Star Sticker */}
      <mesh position={[-0.8, 2.2, 1.01]} rotation={[0, 0, 0.2]}>
        <planeGeometry args={[0.4, 0.4]} />
        <meshStandardMaterial color="#fbbf24" roughness={0.9} />
      </mesh>
      {/* Blue Logo Sticker */}
      <mesh position={[0.6, 2.0, 1.01]} rotation={[0, 0, -0.3]}>
        <planeGeometry args={[0.5, 0.3]} />
        <meshStandardMaterial color="#3b82f6" roughness={0.9} />
      </mesh>
      {/* Tiny Pink Sticker */}
      <mesh position={[0.1, 2.6, 1.01]} rotation={[0, 0, 0.1]}>
        <planeGeometry args={[0.2, 0.2]} />
        <meshStandardMaterial color="#ec4899" roughness={0.9} />
      </mesh>
      
      {/* Side Stickers */}
      <mesh position={[-1.11, 4.5, 0]} rotation={[0, -Math.PI / 2, 0.1]}>
        <planeGeometry args={[1.2, 0.5]} />
        <meshStandardMaterial color="#10b981" roughness={0.9} />
      </mesh>
      <mesh position={[1.11, 4.2, 0]} rotation={[0, Math.PI / 2, -0.2]}>
        <planeGeometry args={[0.8, 0.8]} />
        <meshStandardMaterial color="#f59e0b" roughness={0.9} />
      </mesh>

      {/* Base shadow/ambient occlusion fake */}
      <mesh position={[0, 0.01, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[2.5, 2.5]} />
        <meshBasicMaterial color="#000000" transparent opacity={0.5} />
      </mesh>
    </group>
  );
}
