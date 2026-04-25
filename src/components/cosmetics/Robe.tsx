import React, { useMemo } from 'react';
import * as THREE from 'three';
import { Outlines } from '@react-three/drei';
import { ShirtProps } from './types';
import { createFabricBumpMap } from '../../utils/cosmetics';

export function Robe({ texture, color = '#c11b22', bodyScale = [1.08, 1.05, 1.08], bodyOffset = [0, -0.1, 0] }: ShirtProps) {
  const bumpMap = useMemo(() => createFabricBumpMap(), []);
  
  const { geometry, hemCurve, leftTrimCurve, rightTrimCurve } = useMemo(() => {
    const radialSegments = 64;
    const heightSegments = 30;
    const vertices = [];
    const indices = [];
    
    const hemPathPoints = [];
    const leftPathPoints = [];
    const rightPathPoints = [];

    for (let y = 0; y <= heightSegments; y++) {
      const t = y / heightSegments; // 0 to 1
      const yPos = 0.5 - t * 0.9; // Top to bottom (shortened and lowered)
      const radius = 0.66 + Math.pow(t, 1.4) * 0.4;
      
      const gapHalfAngle = t * 0.25 * Math.PI;
      
      const phiStart = Math.PI * 0.5 + gapHalfAngle;
      const phiEnd = Math.PI * 2.5 - gapHalfAngle;
      const phiLength = phiEnd - phiStart;

      for (let x = 0; x <= radialSegments; x++) {
        const u = x / radialSegments;
        const phi = phiStart + u * phiLength;
        const vx = radius * Math.cos(phi);
        const vz = radius * Math.sin(phi);
        vertices.push(vx, yPos, vz);
        
        if (y === heightSegments) {
          hemPathPoints.push(new THREE.Vector3(vx, yPos, vz));
        }
      }
      
      leftPathPoints.push(new THREE.Vector3(radius * Math.cos(phiStart), yPos, radius * Math.sin(phiStart)));
      rightPathPoints.push(new THREE.Vector3(radius * Math.cos(phiEnd), yPos, radius * Math.sin(phiEnd)));
    }

    for (let y = 0; y < heightSegments; y++) {
      for (let x = 0; x < radialSegments; x++) {
        const a = y * (radialSegments + 1) + x;
        const b = y * (radialSegments + 1) + x + 1;
        const c = (y + 1) * (radialSegments + 1) + x;
        const d = (y + 1) * (radialSegments + 1) + x + 1;
        indices.push(a, b, d);
        indices.push(a, d, c);
      }
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
    geo.setIndex(indices);
    geo.computeVertexNormals();

    return { 
      geometry: geo, 
      hemCurve: new THREE.CatmullRomCurve3(hemPathPoints),
      leftTrimCurve: new THREE.CatmullRomCurve3(leftPathPoints),
      rightTrimCurve: new THREE.CatmullRomCurve3(rightPathPoints)
    };
  }, []);

  const toyGoldMatProps = { color: '#ffcc00', metalness: 0.2, roughness: 0.3 };
  const rubyMatProps = { color: '#d90036', metalness: 0.1, roughness: 0.1, transmission: 0.9, ior: 1.76, thickness: 1.5 };

  return (
    <group scale={bodyScale} position={bodyOffset}>
      <mesh geometry={geometry} castShadow receiveShadow>
        <meshPhysicalMaterial 
          color={texture ? undefined : color} 
          map={texture || undefined} 
          bumpMap={bumpMap} 
          bumpScale={0.03} 
          roughness={0.9} 
          side={THREE.DoubleSide} 
        />
        <Outlines thickness={0.02} color="black" />
      </mesh>

      {/* Bottom Hem Trim */}
      <mesh castShadow>
        <tubeGeometry args={[hemCurve, 64, 0.04, 16, false]} />
        <meshStandardMaterial {...toyGoldMatProps} />
      </mesh>

      {/* Neck Collar Trim */}
      <mesh position={[0, 0.5, 0]} rotation={[Math.PI / 2, 0, 0]} castShadow>
        <torusGeometry args={[0.66, 0.04, 16, 64]} />
        <meshStandardMaterial {...toyGoldMatProps} />
      </mesh>

      {/* Front Opening Trim */}
      <mesh castShadow>
        <tubeGeometry args={[leftTrimCurve, 32, 0.04, 16, false]} />
        <meshStandardMaterial {...toyGoldMatProps} />
      </mesh>
      <mesh castShadow>
        <tubeGeometry args={[rightTrimCurve, 32, 0.04, 16, false]} />
        <meshStandardMaterial {...toyGoldMatProps} />
      </mesh>

      {/* Center Clasp Gem */}
      <group position={[0, 0.45, 0.68]} rotation={[-0.2, 0, 0]}>
        <mesh castShadow>
          <torusGeometry args={[0.06, 0.02, 16, 32]} />
          <meshStandardMaterial {...toyGoldMatProps} />
        </mesh>
        <mesh castShadow>
          <sphereGeometry args={[0.05, 32, 32]} />
          <meshPhysicalMaterial {...rubyMatProps} />
        </mesh>
      </group>
    </group>
  );
}
