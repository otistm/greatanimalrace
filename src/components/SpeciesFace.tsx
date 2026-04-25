import React from 'react';
import { Outlines } from '@react-three/drei';
import * as THREE from 'three';
import { SpeciesConfig } from '../utils/petSpecies';

// All face features for a non-unicorn species. Renders inside the
// existing head <group> in PinkBunny so the head sphere itself, sleep
// timers, cosmetics, etc. stay in the parent component. The face
// renderer only swaps: ears, snout/muzzle, nose, mouth, eyes, and
// optional decorations (horns, mane, beak, big eyes).

interface SpeciesFaceProps {
  species: SpeciesConfig;
  hatCosmetic?: string;
  ageInMonths: number;
  stamina: number;
  leftEarRef: React.MutableRefObject<THREE.Group | null>;
  rightEarRef: React.MutableRefObject<THREE.Group | null>;
  mouthRef: React.MutableRefObject<THREE.Mesh | null>;
  leftEyeRef: React.MutableRefObject<THREE.Mesh | null>;
  rightEyeRef: React.MutableRefObject<THREE.Mesh | null>;
}

function Ears({ species, hatCosmetic, leftEarRef, rightEarRef }: {
  species: SpeciesConfig;
  hatCosmetic?: string;
  leftEarRef: React.MutableRefObject<THREE.Group | null>;
  rightEarRef: React.MutableRefObject<THREE.Group | null>;
}) {
  const ear = species.ears;
  const earColor = species.earColor || species.primary;
  const inner = species.earInner || species.belly;

  // Frog has no ears — return empty groups so the refs still resolve.
  if (ear === 'none') {
    return (
      <>
        <group ref={leftEarRef} position={[-0.3, 0.5, 0]} />
        <group ref={rightEarRef} position={[0.3, 0.5, 0]} />
      </>
    );
  }

  const tilt = hatCosmetic ? 0.45 : 0.15;

  if (ear === 'long-bunny') {
    return (
      <>
        <group ref={leftEarRef} position={[-0.3, 0.5, 0]}>
          <mesh position={[0, 0.4, 0]} rotation={[0, 0, tilt]} castShadow receiveShadow>
            <capsuleGeometry args={[0.15, 0.8, 16, 16]} />
            <meshToonMaterial color={earColor} />
            <Outlines thickness={0.02} color="black" />
          </mesh>
        </group>
        <group ref={rightEarRef} position={[0.3, 0.5, 0]}>
          <mesh position={[0, 0.4, 0]} rotation={[0, 0, -tilt]} castShadow receiveShadow>
            <capsuleGeometry args={[0.15, 0.8, 16, 16]} />
            <meshToonMaterial color={earColor} />
            <Outlines thickness={0.02} color="black" />
          </mesh>
        </group>
      </>
    );
  }

  if (ear === 'cow-flap') {
    // Wide rounded flap ears that stick out sideways like the chibi
    // reference cow. Each ear is a flattened sphere tilted outward
    // with a soft pink inner cup.
    return (
      <>
        <group ref={leftEarRef} position={[-0.46, 0.42, 0.02]} rotation={[0, 0, 1.2]}>
          <mesh position={[0, 0.02, 0]} scale={[1.6, 0.7, 0.55]} castShadow receiveShadow>
            <sphereGeometry args={[0.18, 24, 24]} />
            <meshToonMaterial color={earColor} />
            <Outlines thickness={0.02} color="black" />
          </mesh>
          <mesh position={[0, 0.0, 0.04]} scale={[1.1, 0.45, 0.25]} castShadow>
            <sphereGeometry args={[0.18, 20, 20]} />
            <meshToonMaterial color={inner} />
          </mesh>
        </group>
        <group ref={rightEarRef} position={[0.46, 0.42, 0.02]} rotation={[0, 0, -1.2]}>
          <mesh position={[0, 0.02, 0]} scale={[1.6, 0.7, 0.55]} castShadow receiveShadow>
            <sphereGeometry args={[0.18, 24, 24]} />
            <meshToonMaterial color={earColor} />
            <Outlines thickness={0.02} color="black" />
          </mesh>
          <mesh position={[0, 0.0, 0.04]} scale={[1.1, 0.45, 0.25]} castShadow>
            <sphereGeometry args={[0.18, 20, 20]} />
            <meshToonMaterial color={inner} />
          </mesh>
        </group>
      </>
    );
  }

  if (ear === 'horse-flap') {
    // Upright rounded flap ears that point UP rather than sideways.
    // Tall vertical ellipsoid with a smaller darker inner cup tucked
    // in front. Slight outward tilt so they read clearly from the
    // front and don't sit perfectly parallel.
    return (
      <>
        <group ref={leftEarRef} position={[-0.32, 0.55, 0.02]} rotation={[0, 0, 0.18]}>
          <mesh position={[0, 0.18, 0]} scale={[0.7, 1.5, 0.55]} castShadow receiveShadow>
            <sphereGeometry args={[0.18, 24, 24]} />
            <meshToonMaterial color={earColor} />
            <Outlines thickness={0.02} color="black" />
          </mesh>
          <mesh position={[0, 0.18, 0.04]} scale={[0.45, 1.2, 0.25]} castShadow>
            <sphereGeometry args={[0.18, 20, 20]} />
            <meshToonMaterial color={inner} />
          </mesh>
        </group>
        <group ref={rightEarRef} position={[0.32, 0.55, 0.02]} rotation={[0, 0, -0.18]}>
          <mesh position={[0, 0.18, 0]} scale={[0.7, 1.5, 0.55]} castShadow receiveShadow>
            <sphereGeometry args={[0.18, 24, 24]} />
            <meshToonMaterial color={earColor} />
            <Outlines thickness={0.02} color="black" />
          </mesh>
          <mesh position={[0, 0.18, 0.04]} scale={[0.45, 1.2, 0.25]} castShadow>
            <sphereGeometry args={[0.18, 20, 20]} />
            <meshToonMaterial color={inner} />
          </mesh>
        </group>
      </>
    );
  }

  if (ear === 'cone-small') {
    // Small upright cones (cow, horse). Slight outward tilt.
    return (
      <>
        <group ref={leftEarRef} position={[-0.42, 0.32, 0]} rotation={[0, 0, 0.6]}>
          <mesh position={[0, 0.12, 0]} castShadow receiveShadow>
            <coneGeometry args={[0.13, 0.28, 12]} />
            <meshToonMaterial color={earColor} />
            <Outlines thickness={0.02} color="black" />
          </mesh>
          <mesh position={[0, 0.05, 0.05]} scale={[0.6, 0.6, 0.4]} castShadow>
            <coneGeometry args={[0.1, 0.18, 12]} />
            <meshToonMaterial color={inner} />
          </mesh>
        </group>
        <group ref={rightEarRef} position={[0.42, 0.32, 0]} rotation={[0, 0, -0.6]}>
          <mesh position={[0, 0.12, 0]} castShadow receiveShadow>
            <coneGeometry args={[0.13, 0.28, 12]} />
            <meshToonMaterial color={earColor} />
            <Outlines thickness={0.02} color="black" />
          </mesh>
          <mesh position={[0, 0.05, 0.05]} scale={[0.6, 0.6, 0.4]} castShadow>
            <coneGeometry args={[0.1, 0.18, 12]} />
            <meshToonMaterial color={inner} />
          </mesh>
        </group>
      </>
    );
  }

  if (ear === 'cat') {
    // Rounded "triangle" tiger ears — a tall flattened sphere reads as
    // a soft chibi ear with no sharp tip. Inner cup is a smaller darker
    // ellipsoid layered just in front of the outer shell.
    return (
      <>
        <group ref={leftEarRef} position={[-0.34, 0.46, 0]} rotation={[0, 0, 0.22]}>
          <mesh position={[0, 0.14, 0]} scale={[1.0, 1.6, 0.55]} castShadow receiveShadow>
            <sphereGeometry args={[0.13, 24, 24]} />
            <meshToonMaterial color={earColor} />
            <Outlines thickness={0.02} color="black" />
          </mesh>
          <mesh position={[0, 0.13, 0.04]} scale={[0.55, 1.25, 0.35]} castShadow>
            <sphereGeometry args={[0.13, 20, 20]} />
            <meshToonMaterial color={inner} />
          </mesh>
        </group>
        <group ref={rightEarRef} position={[0.34, 0.46, 0]} rotation={[0, 0, -0.22]}>
          <mesh position={[0, 0.14, 0]} scale={[1.0, 1.6, 0.55]} castShadow receiveShadow>
            <sphereGeometry args={[0.13, 24, 24]} />
            <meshToonMaterial color={earColor} />
            <Outlines thickness={0.02} color="black" />
          </mesh>
          <mesh position={[0, 0.13, 0.04]} scale={[0.55, 1.25, 0.35]} castShadow>
            <sphereGeometry args={[0.13, 20, 20]} />
            <meshToonMaterial color={inner} />
          </mesh>
        </group>
      </>
    );
  }

  if (ear === 'wolf-pointed') {
    // Larger, narrow pointed ears tilted forward.
    return (
      <>
        <group ref={leftEarRef} position={[-0.4, 0.5, 0]} rotation={[0.1, 0, 0.18]}>
          <mesh position={[0, 0.24, 0]} castShadow receiveShadow>
            <coneGeometry args={[0.15, 0.55, 10]} />
            <meshToonMaterial color={earColor} />
            <Outlines thickness={0.02} color="black" />
          </mesh>
          <mesh position={[0, 0.16, 0.06]} scale={[0.55, 0.75, 0.3]} castShadow>
            <coneGeometry args={[0.15, 0.46, 10]} />
            <meshToonMaterial color={inner} />
          </mesh>
        </group>
        <group ref={rightEarRef} position={[0.4, 0.5, 0]} rotation={[0.1, 0, -0.18]}>
          <mesh position={[0, 0.24, 0]} castShadow receiveShadow>
            <coneGeometry args={[0.15, 0.55, 10]} />
            <meshToonMaterial color={earColor} />
            <Outlines thickness={0.02} color="black" />
          </mesh>
          <mesh position={[0, 0.16, 0.06]} scale={[0.55, 0.75, 0.3]} castShadow>
            <coneGeometry args={[0.15, 0.46, 10]} />
            <meshToonMaterial color={inner} />
          </mesh>
        </group>
      </>
    );
  }

  if (ear === 'round-bear') {
    // Short half-sphere ears (bear, lion).
    return (
      <>
        <group ref={leftEarRef} position={[-0.4, 0.4, 0]}>
          <mesh castShadow receiveShadow>
            <sphereGeometry args={[0.13, 16, 16]} />
            <meshToonMaterial color={earColor} />
            <Outlines thickness={0.02} color="black" />
          </mesh>
          <mesh position={[0, 0, 0.06]} scale={[0.6, 0.6, 0.3]} castShadow>
            <sphereGeometry args={[0.13, 16, 16]} />
            <meshToonMaterial color={inner} />
          </mesh>
        </group>
        <group ref={rightEarRef} position={[0.4, 0.4, 0]}>
          <mesh castShadow receiveShadow>
            <sphereGeometry args={[0.13, 16, 16]} />
            <meshToonMaterial color={earColor} />
            <Outlines thickness={0.02} color="black" />
          </mesh>
          <mesh position={[0, 0, 0.06]} scale={[0.6, 0.6, 0.3]} castShadow>
            <sphereGeometry args={[0.13, 16, 16]} />
            <meshToonMaterial color={inner} />
          </mesh>
        </group>
      </>
    );
  }

  if (ear === 'pig-floppy') {
    // Triangular ears that flop forward over the forehead.
    return (
      <>
        <group ref={leftEarRef} position={[-0.36, 0.42, 0.05]} rotation={[0.7, 0, 0.4]}>
          <mesh position={[0, -0.05, 0]} castShadow receiveShadow>
            <coneGeometry args={[0.16, 0.3, 4]} />
            <meshToonMaterial color={earColor} />
            <Outlines thickness={0.02} color="black" />
          </mesh>
        </group>
        <group ref={rightEarRef} position={[0.36, 0.42, 0.05]} rotation={[0.7, 0, -0.4]}>
          <mesh position={[0, -0.05, 0]} castShadow receiveShadow>
            <coneGeometry args={[0.16, 0.3, 4]} />
            <meshToonMaterial color={earColor} />
            <Outlines thickness={0.02} color="black" />
          </mesh>
        </group>
      </>
    );
  }

  if (ear === 'owl-tufts') {
    // Small upward tufts on the corners of the head (horned owl).
    return (
      <>
        <group ref={leftEarRef} position={[-0.34, 0.4, 0]} rotation={[0, 0, 0.3]}>
          <mesh position={[0, 0.14, 0]} castShadow receiveShadow>
            <coneGeometry args={[0.09, 0.26, 6]} />
            <meshToonMaterial color={earColor} />
            <Outlines thickness={0.02} color="black" />
          </mesh>
        </group>
        <group ref={rightEarRef} position={[0.34, 0.4, 0]} rotation={[0, 0, -0.3]}>
          <mesh position={[0, 0.14, 0]} castShadow receiveShadow>
            <coneGeometry args={[0.09, 0.26, 6]} />
            <meshToonMaterial color={earColor} />
            <Outlines thickness={0.02} color="black" />
          </mesh>
        </group>
      </>
    );
  }

  return null;
}

function Snout({ species }: { species: SpeciesConfig }) {
  const s = species.snout;
  const muzzle = species.belly;
  const accent = species.accent;

  if (s === 'oval-bunny') {
    return (
      <mesh position={[0, -0.12, 0.65]} scale={[2.4, 1.5, 0.8]} castShadow receiveShadow>
        <sphereGeometry args={[0.12, 32, 32]} />
        <meshToonMaterial color={muzzle} />
        <Outlines thickness={0.02} color="black" />
      </mesh>
    );
  }

  if (s === 'wolf-snout') {
    // Slightly elongated rounded snout — chibi wolf style. Stretched
    // along the z-axis so the muzzle protrudes a bit further forward
    // than a basic bump.
    return (
      <mesh position={[0, -0.18, 0.7]} scale={[1.6, 1.4, 1.7]} castShadow receiveShadow>
        <sphereGeometry args={[0.14, 32, 32]} />
        <meshToonMaterial color={muzzle} />
        <Outlines thickness={0.02} color="black" />
      </mesh>
    );
  }

  if (s === 'horse-snout') {
    // Short rounded horse muzzle — sits high on the face. Two soft
    // nostrils sit built into the front of the muzzle. The light cream
    // blaze (rendered separately) flows up from this muzzle.
    return (
      <group>
        <mesh position={[0, -0.08, 0.7]} scale={[1.5, 1.4, 1.5]} castShadow receiveShadow>
          <sphereGeometry args={[0.14, 32, 32]} />
          <meshToonMaterial color={muzzle} />
          <Outlines thickness={0.02} color="black" />
        </mesh>
        {/* Two dark nostrils embedded near the tip of the snout */}
        <mesh position={[-0.06, -0.11, 0.9]} scale={[1, 1.4, 0.6]} castShadow>
          <sphereGeometry args={[0.025, 16, 16]} />
          <meshToonMaterial color={accent} />
        </mesh>
        <mesh position={[0.06, -0.11, 0.9]} scale={[1, 1.4, 0.6]} castShadow>
          <sphereGeometry args={[0.025, 16, 16]} />
          <meshToonMaterial color={accent} />
        </mesh>
      </group>
    );
  }

  if (s === 'cow-large') {
    // Wide flat pink muzzle with two dark oval nostrils.
    return (
      <group>
        <mesh position={[0, -0.16, 0.65]} scale={[2.6, 1.8, 1.0]} castShadow receiveShadow>
          <sphereGeometry args={[0.14, 32, 32]} />
          <meshToonMaterial color={muzzle} />
          <Outlines thickness={0.02} color="black" />
        </mesh>
        {/* Nostrils — two dark ovals sitting on the front of the muzzle */}
        <mesh position={[-0.09, -0.12, 0.78]} scale={[1, 1.4, 0.6]} castShadow>
          <sphereGeometry args={[0.028, 16, 16]} />
          <meshToonMaterial color={accent} />
        </mesh>
        <mesh position={[0.09, -0.12, 0.78]} scale={[1, 1.4, 0.6]} castShadow>
          <sphereGeometry args={[0.028, 16, 16]} />
          <meshToonMaterial color={accent} />
        </mesh>
      </group>
    );
  }

  if (s === 'pig-disc') {
    // Flat circular snout sticking straight forward.
    return (
      <group position={[0, -0.05, 0.78]} rotation={[Math.PI / 2, 0, 0]}>
        <mesh castShadow receiveShadow>
          <cylinderGeometry args={[0.16, 0.16, 0.08, 24]} />
          <meshToonMaterial color={species.nose} />
          <Outlines thickness={0.02} color="black" />
        </mesh>
        {/* Nostrils */}
        <mesh position={[-0.06, 0.041, 0]} rotation={[0, 0, 0]} castShadow>
          <cylinderGeometry args={[0.025, 0.025, 0.02, 12]} />
          <meshToonMaterial color={accent} />
        </mesh>
        <mesh position={[0.06, 0.041, 0]} rotation={[0, 0, 0]} castShadow>
          <cylinderGeometry args={[0.025, 0.025, 0.02, 12]} />
          <meshToonMaterial color={accent} />
        </mesh>
      </group>
    );
  }

  if (s === 'cat-small') {
    // Tiny rounded muzzle (tiger, lion).
    return (
      <mesh position={[0, -0.1, 0.66]} scale={[1.8, 1.3, 0.7]} castShadow receiveShadow>
        <sphereGeometry args={[0.12, 32, 32]} />
        <meshToonMaterial color={muzzle} />
        <Outlines thickness={0.02} color="black" />
      </mesh>
    );
  }

  if (s === 'beak') {
    // Owl beak — long downward-pointing diamond. Extended along the
    // cone's local Y so the tip protrudes further forward beyond the
    // cream face mask rather than sitting flush with it.
    return (
      <group position={[0, -0.02, 0.7]} rotation={[Math.PI / 2 + 0.3, 0, 0]}>
        <mesh castShadow receiveShadow>
          <coneGeometry args={[0.11, 0.4, 4]} />
          <meshToonMaterial color={species.nose} />
          <Outlines thickness={0.02} color="black" />
        </mesh>
      </group>
    );
  }

  if (s === 'frog-wide') {
    // Soft rounded bulge across the lower face — reads as a continuous
    // curve from the head into the muzzle area rather than a stretched
    // wide slit. Anchors the smile + nostrils + cheek blush.
    return (
      <group position={[0, -0.1, 0.66]}>
        <mesh scale={[2.4, 0.95, 0.75]} castShadow>
          <sphereGeometry args={[0.18, 32, 32]} />
          <meshToonMaterial color={muzzle} />
          <Outlines thickness={0.02} color="black" />
        </mesh>
      </group>
    );
  }

  if (s === 'bear-round') {
    return (
      <mesh position={[0, -0.14, 0.66]} scale={[2.2, 1.6, 0.9]} castShadow receiveShadow>
        <sphereGeometry args={[0.13, 32, 32]} />
        <meshToonMaterial color={muzzle} />
        <Outlines thickness={0.02} color="black" />
      </mesh>
    );
  }

  return null;
}

function Nose({ species }: { species: SpeciesConfig }) {
  const s = species.snout;
  const noseColor = species.nose;
  const accent = species.accent;

  // The nose mesh sits in front of the muzzle. For some species the
  // nose is "baked into" the snout (pig disc, owl beak, cow muzzle
  // with nostrils, horse muzzle with nostrils) so we skip it.
  if (s === 'pig-disc' || s === 'beak' || s === 'cow-large' || s === 'horse-snout') return null;

  if (s === 'frog-wide') {
    // Frog gets two tiny black dot nostrils close together near the
    // front-top of the snout, just above the smile.
    return (
      <>
        <mesh position={[-0.045, 0.02, 0.82]} castShadow>
          <sphereGeometry args={[0.018, 12, 12]} />
          <meshToonMaterial color={accent} />
        </mesh>
        <mesh position={[0.045, 0.02, 0.82]} castShadow>
          <sphereGeometry args={[0.018, 12, 12]} />
          <meshToonMaterial color={accent} />
        </mesh>
      </>
    );
  }

  if (s === 'wolf-snout') {
    // Small rounded nose sitting at the tip of the elongated snout.
    return (
      <mesh position={[0, -0.13, 0.92]} scale={[1.3, 0.95, 0.7]} rotation={[0.1, 0, 0]} castShadow receiveShadow>
        <sphereGeometry args={[0.055, 16, 16]} />
        <meshToonMaterial color={noseColor} />
        <Outlines thickness={0.02} color="black" />
      </mesh>
    );
  }

  if (s === 'cow-large') {
    return (
      <mesh position={[0, -0.06, 0.78]} scale={[1.6, 1.0, 0.5]} rotation={[0.1, 0, 0]} castShadow receiveShadow>
        <sphereGeometry args={[0.05, 16, 16]} />
        <meshToonMaterial color={noseColor} />
        <Outlines thickness={0.02} color="black" />
      </mesh>
    );
  }

  // Default small triangular nose at the tip of the muzzle (bunny / cat / bear).
  return (
    <mesh position={[0, -0.02, 0.75]} scale={[1.3, 0.8, 0.6]} rotation={[0.1, 0, 0]} castShadow receiveShadow>
      <sphereGeometry args={[0.04, 16, 16]} />
      <meshToonMaterial color={noseColor} />
      <Outlines thickness={0.02} color="black" />
    </mesh>
  );
}

function Mouth({
  species,
  ageInMonths,
  stamina,
  mouthRef,
}: {
  species: SpeciesConfig;
  ageInMonths: number;
  stamina: number;
  mouthRef: React.MutableRefObject<THREE.Mesh | null>;
}) {
  const s = species.snout;
  // Mouth color follows the nose tint so cow/wolf get a dark mouth,
  // pig/tiger get a pink mouth, frog gets a dark green mouth, etc.
  const accent = species.nose;
  const showSmile = ageInMonths >= 1 || stamina < 30;

  if (s === 'beak' || s === 'pig-disc' || s === 'horse-snout') {
    // Mouth is part of the beak / disc snout, or omitted entirely on
    // the chibi horse muzzle. Bind the ref to a hidden placeholder so
    // animation code that touches mouthRef doesn't crash.
    return (
      <mesh ref={mouthRef} position={[0, -0.4, 0.7]} visible={false}>
        <sphereGeometry args={[0.001, 4, 4]} />
        <meshBasicMaterial transparent opacity={0} />
      </mesh>
    );
  }

  if (s === 'frog-wide') {
    // Thin clean curved smile across the lower snout. Always smiling.
    return (
      <mesh ref={mouthRef} position={[0, -0.18, 0.78]} scale={[2.6, 0.45, 1]}>
        <torusGeometry args={[0.08, 0.011, 16, 32, Math.PI]} />
        <meshToonMaterial color={accent} />
      </mesh>
    );
  }

  if (s === 'wolf-snout') {
    // Small mouth tucked just below the snout tip.
    return (
      <mesh ref={mouthRef} position={[0, -0.24, 0.86]} scale={[1.2, 0.4, 1]}>
        {showSmile ? (
          <torusGeometry args={[0.05, 0.014, 16, 32, Math.PI]} />
        ) : (
          <sphereGeometry args={[0.025, 16, 16]} />
        )}
        <meshToonMaterial color={accent} />
      </mesh>
    );
  }

  return (
    <mesh ref={mouthRef} position={[0, -0.15, 0.74]} scale={[1, 0.2, 1]}>
      {showSmile ? (
        <torusGeometry args={[0.04, 0.015, 16, 32, Math.PI]} />
      ) : (
        <sphereGeometry args={[0.03, 16, 16]} />
      )}
      <meshToonMaterial color={accent} />
    </mesh>
  );
}

function Eyes({
  species,
  leftEyeRef,
  rightEyeRef,
}: {
  species: SpeciesConfig;
  leftEyeRef: React.MutableRefObject<THREE.Mesh | null>;
  rightEyeRef: React.MutableRefObject<THREE.Mesh | null>;
}) {
  const e = species.eyes;
  const accent = species.accent;

  if (e === 'large-disc') {
    // Owl: big round white eye saucers with black pupils.
    return (
      <>
        <group position={[-0.22, 0.1, 0.6]}>
          <mesh castShadow receiveShadow>
            <sphereGeometry args={[0.16, 24, 24]} />
            <meshToonMaterial color="#ffffff" />
            <Outlines thickness={0.02} color="black" />
          </mesh>
          <mesh ref={leftEyeRef} position={[0, 0, 0.12]} castShadow>
            <sphereGeometry args={[0.07, 16, 16]} />
            <meshToonMaterial color={accent} />
          </mesh>
        </group>
        <group position={[0.22, 0.1, 0.6]}>
          <mesh castShadow receiveShadow>
            <sphereGeometry args={[0.16, 24, 24]} />
            <meshToonMaterial color="#ffffff" />
            <Outlines thickness={0.02} color="black" />
          </mesh>
          <mesh ref={rightEyeRef} position={[0, 0, 0.12]} castShadow>
            <sphereGeometry args={[0.07, 16, 16]} />
            <meshToonMaterial color={accent} />
          </mesh>
        </group>
      </>
    );
  }

  if (e === 'frog-bulge') {
    // Frog: prominent bulgy white eye domes mounted on top of the head,
    // each with a small round black pupil. Cream-white sclera so the
    // eyes pop clearly against the green head (matches reference).
    const sclera = '#fdf4e3';
    return (
      <>
        <group position={[-0.22, 0.42, 0.18]}>
          <mesh castShadow receiveShadow>
            <sphereGeometry args={[0.16, 24, 24]} />
            <meshToonMaterial color={sclera} />
            <Outlines thickness={0.02} color="black" />
          </mesh>
          <mesh ref={leftEyeRef} position={[0, 0, 0.12]} castShadow>
            <sphereGeometry args={[0.07, 16, 16]} />
            <meshToonMaterial color={accent} />
          </mesh>
        </group>
        <group position={[0.22, 0.42, 0.18]}>
          <mesh castShadow receiveShadow>
            <sphereGeometry args={[0.16, 24, 24]} />
            <meshToonMaterial color={sclera} />
            <Outlines thickness={0.02} color="black" />
          </mesh>
          <mesh ref={rightEyeRef} position={[0, 0, 0.12]} castShadow>
            <sphereGeometry args={[0.07, 16, 16]} />
            <meshToonMaterial color={accent} />
          </mesh>
        </group>
      </>
    );
  }

  // Standard small bead eyes (default for most species). polygonOffset
  // is more negative than the cream face mask's offset so the eyes
  // render in front of the mask on species that have one (owl) without
  // changing their position from the bunny default.
  return (
    <>
      <mesh ref={leftEyeRef} position={[-0.28, 0.12, 0.62]} castShadow receiveShadow>
        <sphereGeometry args={[0.07, 16, 16]} />
        <meshToonMaterial
          color={accent}
          polygonOffset
          polygonOffsetFactor={-5}
          polygonOffsetUnits={-5}
        />
      </mesh>
      <mesh ref={rightEyeRef} position={[0.28, 0.12, 0.62]} castShadow receiveShadow>
        <sphereGeometry args={[0.07, 16, 16]} />
        <meshToonMaterial
          color={accent}
          polygonOffset
          polygonOffsetFactor={-5}
          polygonOffsetUnits={-5}
        />
      </mesh>
    </>
  );
}

function Horns({ species }: { species: SpeciesConfig }) {
  if (species.horns !== 'cow') return null;
  // Short, rounded chibi horns sitting between the ears. Built from a
  // squashed sphere base and a small rounded tip so they look stubby
  // and soft rather than a sharp cone.
  const hornColor = '#f3dcb0';
  return (
    <>
      <group position={[-0.34, 0.55, 0.08]} rotation={[-0.15, 0, -0.4]}>
        <mesh position={[0, 0.05, 0]} scale={[1, 1.4, 1]} castShadow receiveShadow>
          <sphereGeometry args={[0.09, 20, 20]} />
          <meshToonMaterial color={hornColor} />
          <Outlines thickness={0.02} color="black" />
        </mesh>
        <mesh position={[0, 0.17, 0]} scale={[0.7, 0.8, 0.7]} castShadow receiveShadow>
          <sphereGeometry args={[0.075, 16, 16]} />
          <meshToonMaterial color={hornColor} />
          <Outlines thickness={0.02} color="black" />
        </mesh>
      </group>
      <group position={[0.34, 0.55, 0.08]} rotation={[-0.15, 0, 0.4]}>
        <mesh position={[0, 0.05, 0]} scale={[1, 1.4, 1]} castShadow receiveShadow>
          <sphereGeometry args={[0.09, 20, 20]} />
          <meshToonMaterial color={hornColor} />
          <Outlines thickness={0.02} color="black" />
        </mesh>
        <mesh position={[0, 0.17, 0]} scale={[0.7, 0.8, 0.7]} castShadow receiveShadow>
          <sphereGeometry args={[0.075, 16, 16]} />
          <meshToonMaterial color={hornColor} />
          <Outlines thickness={0.02} color="black" />
        </mesh>
      </group>
    </>
  );
}

function FrogFace({ species }: { species: SpeciesConfig }) {
  // Composite frog face decoration: two soft pink cheek blush patches
  // flanking the mouth, sitting flat on the front of the head.
  if (species.id !== 'frog') return null;
  const cheek = '#f3a8a8';
  return (
    <group>
      <mesh position={[-0.34, -0.04, 0.5]} scale={[0.9, 1.0, 0.25]} castShadow={false} receiveShadow={false}>
        <sphereGeometry args={[0.13, 20, 20]} />
        <meshToonMaterial
          color={cheek}
          polygonOffset
          polygonOffsetFactor={-2}
          polygonOffsetUnits={-2}
        />
      </mesh>
      <mesh position={[0.34, -0.04, 0.5]} scale={[0.9, 1.0, 0.25]} castShadow={false} receiveShadow={false}>
        <sphereGeometry args={[0.13, 20, 20]} />
        <meshToonMaterial
          color={cheek}
          polygonOffset
          polygonOffsetFactor={-2}
          polygonOffsetUnits={-2}
        />
      </mesh>
    </group>
  );
}

function OwlFace({ species }: { species: SpeciesConfig }) {
  // Composite owl face decoration: a wide cream face mask hugging the
  // front of the head, a small brown wedge between the eyes that reads
  // as the crown dipping down (heart shape), and two soft pink cheek
  // blush patches under the eyes.
  if (species.id !== 'owl') return null;
  const cream = species.belly;
  const brow = species.primary;
  const cheek = '#f3a8a8';
  return (
    <group>
      {/* Cream face mask — partial sphere following the head curvature.
          Matches the head's non-uniform scale so it conforms to the
          ellipsoid silhouette. The top sits just below the crown so
          the brown crown remains visible above. */}
      <mesh scale={[1.15, 0.95, 1.05]} castShadow={false} receiveShadow={false}>
        <sphereGeometry
          args={[
            0.704,                 // sit just outside the head shell
            32, 24,
            Math.PI / 2 - 0.7,     // phiStart — wide arc centered on +Z front
            1.4,                   // phiLength — ~80° wide
            0.55,                  // thetaStart — just below the crown apex
            1.55,                  // thetaLength — sweeps down past the chin
          ]}
        />
        <meshToonMaterial
          color={cream}
          side={THREE.DoubleSide}
          polygonOffset
          polygonOffsetFactor={-2}
          polygonOffsetUnits={-2}
        />
      </mesh>
      {/* Brow peak — narrow brown patch rendered on the SAME shell as
          the cream mask (radius 0.704, head scale). It overlaps the
          top of the mask, dipping down into the cream area, and sits
          on the same surface so it reads as a region of the mask
          rather than a separate stuck-on element. */}
      <mesh scale={[1.15, 0.95, 1.05]} castShadow={false} receiveShadow={false}>
        <sphereGeometry
          args={[
            0.704,
            16, 16,
            Math.PI / 2 - 0.13,    // narrow phi span centered on +Z front
            0.26,
            0.42,                  // start above the cream mask top edge
            0.45,                  // sweep down into the cream area
          ]}
        />
        <meshToonMaterial
          color={brow}
          side={THREE.DoubleSide}
          polygonOffset
          polygonOffsetFactor={-3}
          polygonOffsetUnits={-3}
        />
      </mesh>
      {/* Cheek blush — pink patches on the SAME mask shell, one per
          cheek, positioned with spherical coords matching the cream
          mask radius so they integrate with the mask surface. */}
      <mesh scale={[1.15, 0.95, 1.05]} castShadow={false} receiveShadow={false}>
        <sphereGeometry
          args={[
            0.704,
            16, 16,
            1.846,                 // phiStart — left cheek (~113° around +X)
            0.3,                   // ~17° wide patch
            1.5,                   // thetaStart — just below the equator
            0.3,                   // ~17° tall patch
          ]}
        />
        <meshToonMaterial
          color={cheek}
          side={THREE.DoubleSide}
          polygonOffset
          polygonOffsetFactor={-4}
          polygonOffsetUnits={-4}
        />
      </mesh>
      <mesh scale={[1.15, 0.95, 1.05]} castShadow={false} receiveShadow={false}>
        <sphereGeometry
          args={[
            0.704,
            16, 16,
            0.996,                 // phiStart — right cheek (mirror of left)
            0.3,
            1.5,
            0.3,
          ]}
        />
        <meshToonMaterial
          color={cheek}
          side={THREE.DoubleSide}
          polygonOffset
          polygonOffsetFactor={-4}
          polygonOffsetUnits={-4}
        />
      </mesh>
    </group>
  );
}

function Blaze({ species }: { species: SpeciesConfig }) {
  // A vertical light-colored stripe running down the center of the
  // face from the forehead to where the muzzle attaches. Common chibi
  // horse marking — currently only horse uses it.
  if (species.id !== 'horse') return null;
  return (
    <mesh scale={[1.15, 0.95, 1.05]} castShadow={false} receiveShadow={false}>
      <sphereGeometry
        args={[
          0.704,                // sit just outside the head shell (head r=0.7)
          32, 24,
          Math.PI / 2 - 0.1,    // phiStart — narrow band centered on +Z front
          0.2,                  // phiLength — ~11° wide
          0.78,                 // thetaStart — just above eye level
          0.95,                 // thetaLength — sweeps down to muzzle base
        ]}
      />
      <meshToonMaterial
        color={species.belly}
        side={THREE.DoubleSide}
        polygonOffset
        polygonOffsetFactor={-2}
        polygonOffsetUnits={-2}
      />
    </mesh>
  );
}

function Mane({ species }: { species: SpeciesConfig }) {
  if (!species.hasMane) return null;
  const color = species.maneColor || species.primary;

  if (species.id === 'horse') {
    // Horse mane: a row of soft rounded tufts arcing from between the
    // ears down the back of the neck. Each tuft is a stretched
    // ellipsoid that tilts further backward as you move down, giving
    // the mane a flowing, plush feel without sharp points.
    const tufts: { pos: [number, number, number]; rotX: number; scale: number }[] = [
      { pos: [0, 0.6, 0.05],  rotX: 0.35, scale: 1.0 },  // front (between ears)
      { pos: [0, 0.7, -0.15], rotX: 0.0,  scale: 1.15 }, // top
      { pos: [0, 0.65, -0.4], rotX: -0.5, scale: 1.1 },  // upper back
      { pos: [0, 0.4, -0.6],  rotX: -0.9, scale: 1.0 },  // mid back
      { pos: [0, 0.1, -0.7],  rotX: -1.3, scale: 0.9 },  // lower back / neck
    ];
    return (
      <group>
        {tufts.map((t, i) => (
          <mesh
            key={i}
            position={t.pos}
            rotation={[t.rotX, 0, 0]}
            scale={[t.scale, t.scale * 1.55, t.scale * 0.95]}
            castShadow
            receiveShadow
          >
            <sphereGeometry args={[0.13, 20, 20]} />
            <meshToonMaterial color={color} />
            <Outlines thickness={0.02} color="black" />
          </mesh>
        ))}
      </group>
    );
  }

  // Lion mane — ring of fluffy spheres encircling the head.
  const segments = 14;
  const ring: React.ReactNode[] = [];
  const radius = 0.62;
  for (let i = 0; i < segments; i++) {
    const a = (i / segments) * Math.PI * 2;
    const x = Math.cos(a) * radius;
    const y = Math.sin(a) * radius;
    ring.push(
      <mesh key={i} position={[x, y, -0.05]} castShadow receiveShadow>
        <sphereGeometry args={[0.18, 16, 16]} />
        <meshToonMaterial color={color} />
        <Outlines thickness={0.02} color="black" />
      </mesh>
    );
  }
  return <group position={[0, 0, -0.05]}>{ring}</group>;
}

export function SpeciesFace({
  species,
  hatCosmetic,
  ageInMonths,
  stamina,
  leftEarRef,
  rightEarRef,
  mouthRef,
  leftEyeRef,
  rightEyeRef,
}: SpeciesFaceProps) {
  return (
    <>
      <Mane species={species} />
      <Blaze species={species} />
      <OwlFace species={species} />
      <FrogFace species={species} />
      <Snout species={species} />
      <Nose species={species} />
      <Mouth species={species} ageInMonths={ageInMonths} stamina={stamina} mouthRef={mouthRef} />
      <Eyes species={species} leftEyeRef={leftEyeRef} rightEyeRef={rightEyeRef} />
      <Ears species={species} hatCosmetic={hatCosmetic} leftEarRef={leftEarRef} rightEarRef={rightEarRef} />
      <Horns species={species} />
    </>
  );
}
