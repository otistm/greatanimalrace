import React, { useMemo } from 'react';
import * as THREE from 'three';
import { Outlines } from '@react-three/drei';
import { CosmeticProps } from './types';

export function KnightMask({ color = '#9ba2a8', headScale = 1, headOffset = [0, 0, 0] }: CosmeticProps) {
  const plasticMatProps = {
    color: color,
    metalness: 0.2,
    roughness: 0.4,
    clearcoat: 1.0,
    clearcoatRoughness: 0.15,
    side: THREE.DoubleSide,
  };

  const goldPlasticMatProps = {
    color: '#ffaa00',
    metalness: 0.4,
    roughness: 0.3,
    clearcoat: 1.0,
    clearcoatRoughness: 0.1,
    side: THREE.DoubleSide,
  };

  const elasticMatProps = {
    color: '#111111',
    roughness: 0.9,
    metalness: 0.0,
  };

  // Face proportions. The face group is non-uniformly scaled so we have to
  // mirror the same scale on the band anchor positions to keep them aligned
  // with the (scaled) eyelet holes.
  const faceWidthScale = 1.18;
  const faceDepthScale = 1.3;

  // Elastic band curve
  const anchorAngle = 1.1;
  const anchorY = 0.0;
  const leftX = Math.sin(-anchorAngle) * 4.0 * faceWidthScale;
  const leftZ = Math.cos(-anchorAngle) * 4.0 * faceDepthScale;
  const rightX = Math.sin(anchorAngle) * 4.0 * faceWidthScale;
  const rightZ = Math.cos(anchorAngle) * 4.0 * faceDepthScale;

  const bandCurve = useMemo(() => {
    // Cubic Bezier with two side-pulled control points so the loop bows OUTWARD
    // around the bunny's head instead of pinching inward through it.
    // Bunny head is roughly a sphere of local-radius ~5.9 centered near origin,
    // so the controls sit at |x|=9, z=-12 to keep the path safely outside.
    const sideRadius = 9.0;
    const backDepth = -8.0;
    return new THREE.CubicBezierCurve3(
      new THREE.Vector3(leftX, anchorY, leftZ),
      new THREE.Vector3(-sideRadius, anchorY, backDepth),
      new THREE.Vector3(sideRadius, anchorY, backDepth),
      new THREE.Vector3(rightX, anchorY, rightZ)
    );
  }, [leftX, leftZ, rightX, rightZ, anchorY]);

  // We need to adjust the overall scale and position to fit the bunny's face.
  // The bunny's head is at y=0 relative to the head attachment point, radius ~1.
  const maskScale = 0.16;

  return (
    <group position={headOffset} scale={headScale}>
      <group scale={maskScale} position={[0, 0.2, 0.16]} rotation={[-0.1, 0, 0]}>
        {/* Face Group */}
        <group scale={[faceWidthScale, 1, faceDepthScale]}>
          {/* 1. Forehead Dome */}
          <mesh position={[0, 2.5, 0]} castShadow receiveShadow>
            <cylinderGeometry args={[3.8, 4.0, 3.5, 32, 1, true, -1.3, 2.6]} />
            <meshPhysicalMaterial {...plasticMatProps} />
            <Outlines thickness={0.05} color="black" />
          </mesh>

          {/* 2. Eye Level Gaps */}
          {/* Left cheek */}
          <mesh position={[0, 0.0, 0]} castShadow receiveShadow>
            <cylinderGeometry args={[4.0, 3.7, 1.5, 32, 1, true, -1.3, 0.8]} />
            <meshPhysicalMaterial {...plasticMatProps} />
            <Outlines thickness={0.05} color="black" />
          </mesh>
          {/* Right cheek */}
          <mesh position={[0, 0.0, 0]} castShadow receiveShadow>
            <cylinderGeometry args={[4.0, 3.7, 1.5, 32, 1, true, 0.5, 0.8]} />
            <meshPhysicalMaterial {...plasticMatProps} />
            <Outlines thickness={0.05} color="black" />
          </mesh>
          {/* Center Nose Bridge */}
          <mesh position={[0, 0.0, 0]} castShadow receiveShadow>
            <cylinderGeometry args={[4.0, 3.7, 1.5, 32, 1, true, -0.15, 0.3]} />
            <meshPhysicalMaterial {...plasticMatProps} />
            <Outlines thickness={0.05} color="black" />
          </mesh>

          {/* 3. Upper Lip / Snout Base */}
          <mesh position={[0, -1.25, 0]} castShadow receiveShadow>
            <cylinderGeometry args={[3.7, 3.5, 1.0, 32, 1, true, -1.1, 2.2]} />
            <meshPhysicalMaterial {...plasticMatProps} />
            <Outlines thickness={0.05} color="black" />
          </mesh>

          {/* 4. Breathing Grill */}
          {[-3, -2, -1, 0, 1, 2, 3].map((i) => {
            const angle = i * 0.28;
            return (
              <mesh key={`slat-${i}`} position={[0, -3.25, 0]} castShadow receiveShadow>
                <cylinderGeometry args={[3.5, 2.6, 3.0, 32, 1, true, angle - 0.08, 0.16]} />
                <meshPhysicalMaterial {...plasticMatProps} />
                <Outlines thickness={0.05} color="black" />
              </mesh>
            );
          })}

          {/* 5. Chin Rim */}
          <mesh position={[0, -5.0, 0]} castShadow receiveShadow>
            <cylinderGeometry args={[2.6, 2.5, 0.6, 32, 1, true, -0.9, 1.8]} />
            <meshPhysicalMaterial {...plasticMatProps} />
            <Outlines thickness={0.05} color="black" />
          </mesh>

          {/* Fake molded rivets */}
          {[-1.2, -0.8, -0.4, 0.4, 0.8, 1.2].map((i) => (
            <mesh key={`rivet-${i}`} position={[Math.sin(i) * 4.0, 1.0, Math.cos(i) * 4.0]}>
              <sphereGeometry args={[0.2, 16, 16]} />
              <meshPhysicalMaterial {...plasticMatProps} />
            </mesh>
          ))}

          {/* Fake painted Gold Crown */}
          <group position={[0, 2.5, 4.05]} rotation={[-0.1, 0, 0]}>
            {/* Central cross */}
            <mesh position={[0, 0, 0]}>
              <boxGeometry args={[0.3, 1.8, 0.1]} />
              <meshPhysicalMaterial {...goldPlasticMatProps} />
              <Outlines thickness={0.05} color="black" />
            </mesh>
            <mesh position={[0, 0.2, 0]}>
              <boxGeometry args={[1.2, 0.3, 0.1]} />
              <meshPhysicalMaterial {...goldPlasticMatProps} />
              <Outlines thickness={0.05} color="black" />
            </mesh>
            {/* Side arches */}
            <mesh position={[-0.6, -0.6, 0]} rotation={[0, 0, Math.PI / 2]}>
              <torusGeometry args={[0.6, 0.1, 8, 16, Math.PI]} />
              <meshPhysicalMaterial {...goldPlasticMatProps} />
              <Outlines thickness={0.05} color="black" />
            </mesh>
            <mesh position={[0.6, -0.6, 0]} rotation={[0, 0, -Math.PI / 2]}>
              <torusGeometry args={[0.6, 0.1, 8, 16, Math.PI]} />
              <meshPhysicalMaterial {...goldPlasticMatProps} />
              <Outlines thickness={0.05} color="black" />
            </mesh>
          </group>

          {/* Holes for elastic */}
          <mesh position={[Math.sin(-anchorAngle) * 4.0, anchorY, Math.cos(-anchorAngle) * 4.0]} rotation={[Math.PI / 2, -anchorAngle, 0]}>
            <cylinderGeometry args={[0.15, 0.15, 0.4, 16]} />
            <meshBasicMaterial color="#000000" />
          </mesh>
          <mesh position={[Math.sin(anchorAngle) * 4.0, anchorY, Math.cos(anchorAngle) * 4.0]} rotation={[Math.PI / 2, anchorAngle, 0]}>
            <cylinderGeometry args={[0.15, 0.15, 0.4, 16]} />
            <meshBasicMaterial color="#000000" />
          </mesh>
        </group>

        {/* Elastic Band — thick strap that hugs the back of the head */}
        <mesh>
          <tubeGeometry args={[bandCurve, 48, 0.22, 16, false]} />
          <meshStandardMaterial {...elasticMatProps} />
          <Outlines thickness={0.03} color="black" />
        </mesh>

        {/* Knots — sized to match the wider band */}
        <mesh position={[leftX, anchorY, leftZ + 0.2]}>
          <sphereGeometry args={[0.32, 16, 16]} />
          <meshStandardMaterial {...elasticMatProps} />
          <Outlines thickness={0.03} color="black" />
        </mesh>
        <mesh position={[rightX, anchorY, rightZ + 0.2]}>
          <sphereGeometry args={[0.32, 16, 16]} />
          <meshStandardMaterial {...elasticMatProps} />
          <Outlines thickness={0.03} color="black" />
        </mesh>
      </group>
    </group>
  );
}
