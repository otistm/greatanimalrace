import React from 'react';
import { Outlines } from '@react-three/drei';
import { CosmeticProps } from './types';

export function Glasses({ 
  color = '#111827', 
  animalType = 'bunny', 
  headScale = 1, 
  headOffset = [0, 0, 0], 
  lensType = 'dark',
  shape = 'circle'
}: CosmeticProps & { lensType?: 'dark' | 'clear', shape?: 'circle' | 'rectangle' }) {
  const isUnicorn = animalType === 'unicorn';
  const posZ = isUnicorn ? 0.68 : 0.65; 

  const frameColor = color;
  const isClear = lensType === 'clear';
  const lensColor = isClear ? '#ffffff' : '#000000';
  const isCircle = shape === 'circle';
  
  return (
    <group position={headOffset} scale={headScale}>
      <group position={[0, 0.12, posZ]} scale={1.1}>
        {/* Left Frame */}
        <mesh position={[-0.24, 0, 0.05]} rotation={[0, -0.15, 0]} castShadow={isCircle}>
          {isCircle ? (
            <torusGeometry args={[0.16, 0.025, 16, 64]} />
          ) : (
            <boxGeometry args={[0.3, 0.12, 0.05]} />
          )}
          <meshPhysicalMaterial color={frameColor} metalness={isCircle ? 0.8 : 0.5} roughness={isCircle ? 0.2 : 0.3} clearcoat={1.0} />
          <Outlines thickness={0.015} color="black" />
        </mesh>
        
        {/* Left Lens */}
        <group position={[-0.24, 0, isCircle ? 0.05 : 0.06]} rotation={[0, -0.15, 0]}>
          <mesh rotation={isCircle ? [Math.PI/2, 0, 0] : [0, 0, 0]}>
            {isCircle ? (
              <cylinderGeometry args={[0.15, 0.15, 0.02, 32]} />
            ) : (
              <boxGeometry args={[0.26, 0.08, 0.05]} />
            )}
            <meshPhysicalMaterial 
              color={lensColor} 
              transmission={isClear ? 1.0 : 0.9} 
              opacity={isClear ? 0.3 : 1} 
              transparent={isClear}
              metalness={isClear ? 0.1 : 0.9} 
              roughness={0.0} 
              ior={1.5}
              thickness={0.05}
              clearcoat={1.0}
            />
          </mesh>
        </group>
        
        {/* Right Frame */}
        <mesh position={[0.24, 0, 0.05]} rotation={[0, 0.15, 0]} castShadow={isCircle}>
          {isCircle ? (
            <torusGeometry args={[0.16, 0.025, 16, 64]} />
          ) : (
            <boxGeometry args={[0.3, 0.12, 0.05]} />
          )}
          <meshPhysicalMaterial color={frameColor} metalness={isCircle ? 0.8 : 0.5} roughness={isCircle ? 0.2 : 0.3} clearcoat={1.0} />
          <Outlines thickness={0.015} color="black" />
        </mesh>
        
        {/* Right Lens */}
        <group position={[0.24, 0, isCircle ? 0.05 : 0.06]} rotation={[0, 0.15, 0]}>
          <mesh rotation={isCircle ? [Math.PI/2, 0, 0] : [0, 0, 0]}>
            {isCircle ? (
              <cylinderGeometry args={[0.15, 0.15, 0.02, 32]} />
            ) : (
              <boxGeometry args={[0.26, 0.08, 0.05]} />
            )}
            <meshPhysicalMaterial 
              color={lensColor} 
              transmission={isClear ? 1.0 : 0.9} 
              opacity={isClear ? 0.3 : 1} 
              transparent={isClear}
              metalness={isClear ? 0.1 : 0.9} 
              roughness={0.0} 
              ior={1.5}
              thickness={0.05}
              clearcoat={1.0}
            />
          </mesh>
        </group>

        {/* Bridge */}
        <group position={[0, isCircle ? 0.05 : 0.0, 0.08]} rotation={[0, 0, 0]}>
          <mesh rotation={isCircle ? [0, 0, Math.PI/2] : [0, 0, 0]}>
            {isCircle ? (
              <cylinderGeometry args={[0.015, 0.015, 0.2, 16]} />
            ) : (
              <boxGeometry args={[0.2, 0.04, 0.04]} />
            )}
            <meshPhysicalMaterial color={frameColor} metalness={isCircle ? 0.8 : 0.5} roughness={isCircle ? 0.2 : 0.3} clearcoat={1.0} />
            <Outlines thickness={0.015} color="black" />
          </mesh>
        </group>

        {/* Arms */}
        <group position={[-0.4, 0, -0.15]} rotation={[0, -0.05, 0]}>
          <mesh rotation={isCircle ? [Math.PI/2, 0, 0] : [0, 0, 0]}>
            {isCircle ? (
              <cylinderGeometry args={[0.015, 0.015, 0.4, 16]} />
            ) : (
              <boxGeometry args={[0.04, 0.04, 0.4]} />
            )}
            <meshPhysicalMaterial color={frameColor} metalness={isCircle ? 0.8 : 0.5} roughness={isCircle ? 0.2 : 0.3} clearcoat={1.0} />
            <Outlines thickness={0.015} color="black" />
          </mesh>
        </group>
        <group position={[0.4, 0, -0.15]} rotation={[0, 0.05, 0]}>
          <mesh rotation={isCircle ? [Math.PI/2, 0, 0] : [0, 0, 0]}>
            {isCircle ? (
              <cylinderGeometry args={[0.015, 0.015, 0.4, 16]} />
            ) : (
              <boxGeometry args={[0.04, 0.04, 0.4]} />
            )}
            <meshPhysicalMaterial color={frameColor} metalness={isCircle ? 0.8 : 0.5} roughness={isCircle ? 0.2 : 0.3} clearcoat={1.0} />
            <Outlines thickness={0.015} color="black" />
          </mesh>
        </group>
      </group>
    </group>
  );
}