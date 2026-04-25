import React, { useMemo } from 'react';
import * as THREE from 'three';
import { Outlines } from '@react-three/drei';
import { CosmeticProps } from './types';

export function Crown({ color = '#ffd700', animalType = 'bunny', headScale = 1, headOffset = [0, 0, 0] }: CosmeticProps) {
  const isUnicorn = animalType === 'unicorn';
  const posZ = isUnicorn ? -0.15 : 0;
  const rotX = isUnicorn ? -0.1 : 0;

  const gemColors = ['#ff0033', '#00cc44', '#0044ff', '#ffffff'];

  // Base Jewels
  const baseJewels = Array.from({ length: 8 }).map((_, i) => {
    const angle = (i / 8) * Math.PI * 2;
    return {
      index: i,
      color: gemColors[i % 4],
      position: [Math.cos(angle) * 2.05, 0.6, Math.sin(angle) * 2.05] as [number, number, number],
    };
  });

  // Pearls (top and bottom)
  const pearls = Array.from({ length: 32 }).map((_, i) => {
    const angle = (i / 32) * Math.PI * 2;
    return {
      x: Math.cos(angle) * 2.05,
      z: Math.sin(angle) * 2.05,
    };
  });

  // Arch Diamonds
  const archDiamonds = useMemo(() => {
    const diamonds: { position: [number, number, number] }[] = [];
    for (let i = 0; i < 4; i++) {
      for (let j = 1; j < 8; j++) {
        if (j === 4) continue;
        const dAngle = (j / 8) * Math.PI;
        const dx = Math.cos(dAngle) * 1.9;
        const dy = Math.sin(dAngle) * 1.9;
        const rotY = (i * Math.PI) / 4;
        const fx = dx * Math.cos(rotY);
        const fz = dx * -Math.sin(rotY);
        diamonds.push({ position: [fx, 1.0 + dy, fz] });
      }
    }
    return diamonds;
  }, []);

  // Orb pearls
  const orbPearls = Array.from({ length: 12 }).map((_, i) => {
    const a = (i / 12) * Math.PI * 2;
    return [Math.cos(a) * 0.36, 3.2, Math.sin(a) * 0.36] as [number, number, number];
  });

  const getGemMaterial = (colorHex: string) => (
    <meshPhysicalMaterial
      color={colorHex}
      metalness={0.1}
      roughness={0.05}
      transmission={0.8}
      thickness={0.5}
      ior={2.4}
      clearcoat={1.0}
      clearcoatRoughness={0.1}
    />
  );

  return (
    <group position={headOffset} scale={headScale} rotation={[rotX, 0, 0]}>
      <group position={[0, 0.35, posZ]} scale={0.3}>
        {/* Base */}
        <mesh position={[0, 0.6, 0]} castShadow>
          <cylinderGeometry args={[2, 2, 0.8, 64]} />
          <meshStandardMaterial color={color} metalness={1.0} roughness={0.15} />
          <Outlines thickness={0.05} color="black" />
        </mesh>

        {/* Top Rim */}
        <mesh position={[0, 1.0, 0]} rotation={[Math.PI / 2, 0, 0]} castShadow>
          <torusGeometry args={[2, 0.12, 16, 64]} />
          <meshStandardMaterial color={color} metalness={1.0} roughness={0.15} />
          <Outlines thickness={0.05} color="black" />
        </mesh>

        {/* Bottom Rim */}
        <mesh position={[0, 0.2, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[2, 0.12, 16, 64]} />
          <meshStandardMaterial color={color} metalness={1.0} roughness={0.15} />
          <Outlines thickness={0.05} color="black" />
        </mesh>

        {/* Inner Velvet Dome */}
        <mesh position={[0, 0.6, 0]} scale={[1, 1.1, 1]}>
          <sphereGeometry args={[1.95, 64, 32, 0, Math.PI * 2, 0, Math.PI / 2]} />
          <meshStandardMaterial color="#800020" roughness={0.9} metalness={0.1} />
        </mesh>

        {/* Base Jewels & Bezels */}
        {baseJewels.map((jewel) => (
          <group key={`jewel-group-${jewel.index}`}>
            <mesh 
              position={jewel.position} 
              scale={[1, 1, 0.4]} 
              onUpdate={(self) => self.lookAt(0, 0.6, 0)}
            >
              <octahedronGeometry args={[0.3, 0]} />
              {getGemMaterial(jewel.color)}
              <Outlines thickness={0.02} color="black" />
            </mesh>
            <mesh 
              position={jewel.position} 
              onUpdate={(self) => self.lookAt(0, 0.6, 0)}
            >
              <torusGeometry args={[0.28, 0.05, 8, 24]} />
              <meshStandardMaterial color={color} metalness={1.0} roughness={0.15} />
              <Outlines thickness={0.05} color="black" />
            </mesh>
          </group>
        ))}

        {/* Pearls Top & Bottom */}
        {pearls.map((p, i) => (
          <React.Fragment key={`pearl-pair-${i}`}>
            <mesh position={[p.x, 1.15, p.z]}>
              <sphereGeometry args={[0.08, 16, 16]} />
              <meshStandardMaterial color="#ffffff" roughness={0.2} metalness={0.1} clearcoat={1.0} />
            </mesh>
            <mesh position={[p.x, 0.05, p.z]}>
              <sphereGeometry args={[0.08, 16, 16]} />
              <meshStandardMaterial color="#ffffff" roughness={0.2} metalness={0.1} clearcoat={1.0} />
            </mesh>
          </React.Fragment>
        ))}

        {/* Arches */}
        {Array.from({ length: 4 }).map((_, i) => (
          <mesh key={`arch-${i}`} position={[0, 1.0, 0]} rotation={[0, (i * Math.PI) / 4, 0]} castShadow>
            <torusGeometry args={[1.9, 0.15, 16, 64, Math.PI]} />
            <meshStandardMaterial color={color} metalness={1.0} roughness={0.15} />
            <Outlines thickness={0.05} color="black" />
          </mesh>
        ))}

        {/* Arch Diamonds */}
        {archDiamonds.map((d, i) => (
          <mesh 
            key={`arch-diamond-${i}`} 
            position={d.position} 
            scale={[1, 1, 0.5]} 
            onUpdate={(self) => self.lookAt(0, 1.0, 0)}
          >
            <octahedronGeometry args={[0.12, 0]} />
            {getGemMaterial('#ffffff')}
          </mesh>
        ))}

        {/* Orb */}
        <mesh position={[0, 3.2, 0]} castShadow>
          <sphereGeometry args={[0.35, 32, 32]} />
          <meshStandardMaterial color={color} metalness={1.0} roughness={0.15} />
          <Outlines thickness={0.05} color="black" />
        </mesh>

        {/* Orb Pearls */}
        {orbPearls.map((pos, i) => (
          <mesh key={`orb-pearl-${i}`} position={pos} scale={[0.6, 0.6, 0.6]}>
            <sphereGeometry args={[0.08, 16, 16]} />
            <meshStandardMaterial color="#ffffff" roughness={0.2} metalness={0.1} clearcoat={1.0} />
          </mesh>
        ))}

        {/* Cross */}
        <group position={[0, 3.75, 0]}>
          <mesh>
            <boxGeometry args={[0.12, 0.6, 0.12]} />
            <meshStandardMaterial color={color} metalness={1.0} roughness={0.15} />
            <Outlines thickness={0.05} color="black" />
          </mesh>
          <mesh position={[0, 0.1, 0]}>
            <boxGeometry args={[0.5, 0.12, 0.12]} />
            <meshStandardMaterial color={color} metalness={1.0} roughness={0.15} />
            <Outlines thickness={0.05} color="black" />
          </mesh>
          {/* Cross Rubies */}
          <mesh position={[0, 0.1, 0.08]} scale={[0.6, 0.6, 0.3]}>
            <octahedronGeometry args={[0.3, 0]} />
            {getGemMaterial('#ff0033')}
          </mesh>
          <mesh position={[0, 0.1, -0.08]} scale={[0.6, 0.6, 0.3]}>
            <octahedronGeometry args={[0.3, 0]} />
            {getGemMaterial('#ff0033')}
          </mesh>
        </group>
      </group>
    </group>
  );
}
