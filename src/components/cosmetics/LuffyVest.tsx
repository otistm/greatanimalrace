import React, { useMemo } from 'react';
import * as THREE from 'three';
import { Outlines } from '@react-three/drei';
import { ShirtProps } from './types';
import { createFabricBumpMap } from '../../utils/cosmetics';

// Open-front red captain's vest with gold buttons running down one edge.
// Sleeveless — the bunny's bare arms show through, matching the iconic
// pirate king look. Pairs with the Straw Hat in the Luffy Set.
export function LuffyVest({ bodyScale = [1, 1, 1], bodyOffset = [0, 0, 0] }: ShirtProps) {
  const bumpMap = useMemo(() => createFabricBumpMap(), []);

  const vestRed = '#ed3536';
  const buttonGold = '#f5b942';

  // The vest wraps 270° around the body, leaving a 90° gap centered on +Z
  // (front of bunny). thetaStart = π/4 puts one edge of the opening on
  // the bunny's front-right side.
  const thetaStart = Math.PI * 0.25;
  const thetaLength = Math.PI * 1.5;

  // Vest geometry params used both for the mesh and to compute matching
  // button positions on the right opening edge.
  const radiusTop = 0.66;
  const radiusBottom = 0.78;
  const vestHeight = 0.80;
  const halfHeight = vestHeight / 2;

  const buttonAngle = thetaStart;
  const buttonYs = [0.32, 0.14, -0.04, -0.22];

  return (
    <group scale={bodyScale} position={bodyOffset}>
      {/* Vest body — slightly conical so it flares at the hem. Hem sits
          above the bunny's legs (world y ≈ 0.30) so the legs read
          clearly under the vest. */}
      <mesh castShadow receiveShadow>
        <cylinderGeometry
          args={[radiusTop, radiusBottom, vestHeight, 28, 1, false, thetaStart, thetaLength]}
        />
        <meshPhysicalMaterial
          color={vestRed}
          bumpMap={bumpMap}
          bumpScale={0.025}
          roughness={0.85}
          side={THREE.DoubleSide}
        />
        <Outlines thickness={0.02} color="black" />
      </mesh>

      {/* Gold buttons running down the right edge of the open front.
          Each button is parented to a group rotated to face radially
          outward from the cylinder, then the inner mesh is laid flat
          like a coin so the button's face points outward. */}
      {buttonYs.map((y, i) => {
        // Interpolate the vest's radius at this height (radiusTop at the
        // top, radiusBottom at the bottom) so each button sits flush on
        // the cone surface, with a tiny outward offset to read clearly.
        const t = (halfHeight - y) / vestHeight;
        const r = radiusTop + t * (radiusBottom - radiusTop) + 0.012;
        const x = Math.sin(buttonAngle) * r;
        const z = Math.cos(buttonAngle) * r;
        return (
          <group key={`btn-${i}`} position={[x, y, z]} rotation={[0, buttonAngle, 0]}>
            <mesh rotation={[Math.PI / 2, 0, 0]} castShadow>
              <cylinderGeometry args={[0.038, 0.038, 0.022, 16]} />
              <meshStandardMaterial color={buttonGold} metalness={0.55} roughness={0.3} />
              <Outlines thickness={0.01} color="black" />
            </mesh>
          </group>
        );
      })}
    </group>
  );
}
