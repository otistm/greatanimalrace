import React, { useRef, useEffect, useState, useMemo } from 'react';
import { useFrame, ThreeEvent } from '@react-three/fiber';
import { Html, Outlines } from '@react-three/drei';
import { motion, AnimatePresence } from 'framer-motion';
import * as THREE from 'three';
import { getTerrainHeight } from '../utils/terrain';
import { CosmeticModel, useCosmeticsNodes } from './cosmetics/CosmeticModel';
import { getSpeciesConfig, SpeciesId } from '../utils/petSpecies';
import { createSpotsTexture, createStripesTexture } from '../utils/petTextures';
import { SpeciesFace } from './SpeciesFace';

// A single hand-placed paint-stroke stripe positioned on the surface of
// a parent sphere. Direction is the outward radial vector from the
// sphere's center; the stripe is oriented so its flat face lies tangent
// to the surface, with `twist` rotating it around the surface normal
// (twist=0 keeps the stripe oriented vertically in world space).
interface StripeSpec {
  dir: [number, number, number];
  len: number;     // length along the stripe's long axis
  width: number;   // width across the stripe
  twist?: number;  // rotation around the surface normal, radians
}

function buildStripeTransform(dir: [number, number, number], radius: number, twist: number) {
  const n = new THREE.Vector3(dir[0], dir[1], dir[2]).normalize();
  // Push the stripe just outside the sphere so it doesn't z-fight.
  const pos = n.clone().multiplyScalar(radius + 0.004);

  // Orthonormal basis with +Z aligned to the surface normal and +Y
  // pointing along the projection of world-up onto the tangent plane.
  const worldUp = new THREE.Vector3(0, 1, 0);
  let tangentY = worldUp.clone().sub(n.clone().multiplyScalar(worldUp.dot(n)));
  if (tangentY.lengthSq() < 1e-4) {
    // The stripe sits on the pole — fall back to +Z as the up reference.
    tangentY = new THREE.Vector3(0, 0, 1).sub(n.clone().multiplyScalar(n.z));
  }
  tangentY.normalize();
  const tangentX = new THREE.Vector3().crossVectors(tangentY, n).normalize();

  const basis = new THREE.Matrix4().makeBasis(tangentX, tangentY, n);
  const quat = new THREE.Quaternion().setFromRotationMatrix(basis);
  // Twist around the surface normal. We pre-multiply twist around the
  // mesh's native +Z axis so it composes correctly with the basis.
  const twistQuat = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 0, 1), twist);
  quat.multiply(twistQuat);

  return { pos, quat };
}

// Black paint-stroke stripes for the chibi tiger. Renders a list of
// flattened ellipsoid "decals" placed on the parent sphere's surface.
// Drop this *inside* the parent mesh so it inherits its scaling.
function TigerStripes({
  radius,
  stripes,
  color = '#1a1a1a',
}: {
  radius: number;
  stripes: StripeSpec[];
  color?: string;
}) {
  const items = useMemo(() => {
    return stripes.map((s, i) => {
      const { pos, quat } = buildStripeTransform(s.dir, radius, s.twist ?? 0);
      // Ellipsoid stripe — sphere flattened along the surface normal so
      // the silhouette stays soft and curves with the underlying body.
      return (
        <mesh
          key={i}
          position={[pos.x, pos.y, pos.z]}
          quaternion={[quat.x, quat.y, quat.z, quat.w]}
          scale={[s.width, s.len, 0.02]}
          renderOrder={1}
        >
          <sphereGeometry args={[1, 12, 12]} />
          <meshToonMaterial
            color={color}
            polygonOffset
            polygonOffsetFactor={-2}
            polygonOffsetUnits={-2}
          />
        </mesh>
      );
    });
  }, [radius, stripes, color]);
  return <>{items}</>;
}

// Stripe layouts for the tiger's head and body spheres. Tuned by hand
// to match the chibi tiger reference: a forehead column with a small
// "X" below, paired cheek slashes, and scattered back stripes.
const TIGER_HEAD_STRIPES: StripeSpec[] = [
  { dir: [0, 1, 0.25], len: 0.10, width: 0.05, twist: 0 },           // small tuft on top
  { dir: [0, 0.55, 0.85], len: 0.16, width: 0.05, twist: 0 },        // forehead column
  { dir: [-0.18, 0.35, 0.9], len: 0.10, width: 0.04, twist: 0.55 }, // forehead X (left)
  { dir: [0.18, 0.35, 0.9], len: 0.10, width: 0.04, twist: -0.55 }, // forehead X (right)
  { dir: [-0.85, 0.05, 0.45], len: 0.13, width: 0.045, twist: 0.55 }, // left cheek upper
  { dir: [-0.8, -0.18, 0.55], len: 0.10, width: 0.04, twist: 0.45 },  // left cheek lower
  { dir: [0.85, 0.05, 0.45], len: 0.13, width: 0.045, twist: -0.55 }, // right cheek upper
  { dir: [0.8, -0.18, 0.55], len: 0.10, width: 0.04, twist: -0.45 },  // right cheek lower
  { dir: [-0.7, 0.4, -0.2], len: 0.12, width: 0.04, twist: 0.3 },    // left side back
  { dir: [0.7, 0.4, -0.2], len: 0.12, width: 0.04, twist: -0.3 },    // right side back
];

// Half-torus "scallop" decoration placed on a parent sphere using the
// same surface-normal helper as the tiger stripes. Used for the chibi
// owl's belly feather rows.
interface ScallopSpec {
  dir: [number, number, number];
  size?: number; // torus ring radius (defaults to 0.055)
  tube?: number; // tube thickness (defaults to 0.012)
}

function OwlBellyFeathers({
  radius,
  scallops,
  color = '#8a6541',
}: {
  radius: number;
  scallops: ScallopSpec[];
  color?: string;
}) {
  const items = useMemo(() => {
    return scallops.map((s, i) => {
      // twist=PI flips the default upper-half torus to a lower-half
      // arc so each scallop reads as a U-shape (curve at the bottom,
      // opening upward) like the feather grooves on a chibi owl.
      const { pos, quat } = buildStripeTransform(s.dir, radius, Math.PI);
      const r = s.size ?? 0.055;
      const t = s.tube ?? 0.012;
      return (
        <mesh
          key={i}
          position={[pos.x, pos.y, pos.z]}
          quaternion={[quat.x, quat.y, quat.z, quat.w]}
          renderOrder={1}
        >
          <torusGeometry args={[r, t, 8, 24, Math.PI]} />
          <meshToonMaterial
            color={color}
            polygonOffset
            polygonOffsetFactor={-3}
            polygonOffsetUnits={-3}
          />
        </mesh>
      );
    });
  }, [radius, scallops, color]);
  return <>{items}</>;
}

// Three rows of belly feather grooves (top: 2, middle: 3, bottom: 2).
// Directions are normalized inside the helper so any reasonable scale
// works — kept human-readable here.
const OWL_BELLY_FEATHERS: ScallopSpec[] = [
  // Top row — pair near the upper chest
  { dir: [-0.18, 0.18, 0.6], size: 0.06 },
  { dir: [0.18, 0.18, 0.6],  size: 0.06 },
  // Middle row — three staggered scallops
  { dir: [-0.24, -0.04, 0.6], size: 0.055 },
  { dir: [0,     -0.04, 0.65], size: 0.055 },
  { dir: [0.24, -0.04, 0.6],  size: 0.055 },
  // Bottom row — pair near the lower belly
  { dir: [-0.16, -0.3, 0.55], size: 0.05 },
  { dir: [0.16, -0.3, 0.55],  size: 0.05 },
];

const TIGER_BODY_STRIPES: StripeSpec[] = [
  { dir: [0, 0.6, -0.85], len: 0.20, width: 0.055, twist: 0 },       // upper back center
  { dir: [-0.5, 0.45, -0.8], len: 0.18, width: 0.05, twist: 0.25 },  // upper back left
  { dir: [0.5, 0.45, -0.8], len: 0.18, width: 0.05, twist: -0.25 },  // upper back right
  { dir: [-0.55, -0.05, -0.85], len: 0.16, width: 0.05, twist: 0.2 },// mid back left
  { dir: [0.55, -0.05, -0.85], len: 0.16, width: 0.05, twist: -0.2 },// mid back right
  { dir: [-0.95, 0.1, 0.0], len: 0.16, width: 0.05, twist: 0.4 },    // left side
  { dir: [0.95, 0.1, 0.0], len: 0.16, width: 0.05, twist: -0.4 },    // right side
  { dir: [-0.6, -0.5, -0.6], len: 0.12, width: 0.04, twist: 0.3 },   // lower back left
  { dir: [0.6, -0.5, -0.6], len: 0.12, width: 0.04, twist: -0.3 },   // lower back right
];

export function PinkBunny({ 
  position = [0, 0, 0], 
  targetPosition,
  moveDirRef,
  movementBasisRef,
  bunnyPositionRef,
  onReachTarget,
  action,
  jumpNonce = 0,
  onChat,
  ageInMonths = 0,
  obstacles = [],
  equippedCosmetics = [],
  speciesId = 'bunny',
  remote
}: { 
  position?: [number, number, number], 
  targetPosition?: THREE.Vector3 | null,
  moveDirRef?: React.MutableRefObject<{x: number, z: number} | null>,
  movementBasisRef?: React.MutableRefObject<{ fx: number; fz: number; rx: number; rz: number } | null>,
  bunnyPositionRef?: React.MutableRefObject<THREE.Vector3>,
  onReachTarget?: () => void,
  action?: string,
  jumpNonce?: number,
  onChat?: () => void,
  ageInMonths?: number,
  obstacles?: {position: THREE.Vector3, radius: number}[],
  equippedCosmetics?: string[],
  speciesId?: SpeciesId | string,
  remote?: { x: number; y: number; z: number; yaw: number; action: string }
}) {
  const group = useRef<THREE.Group>(null);
  const headRef = useRef<THREE.Group>(null);
  const leftEarRef = useRef<THREE.Group>(null);
  const rightEarRef = useRef<THREE.Group>(null);
  const leftArmRef = useRef<THREE.Group>(null);
  const rightArmRef = useRef<THREE.Group>(null);
  const leftLegRef = useRef<THREE.Group>(null);
  const rightLegRef = useRef<THREE.Group>(null);
  const bodyRef = useRef<THREE.Mesh>(null);
  const bellyRef = useRef<THREE.Mesh>(null);
  const mouthRef = useRef<THREE.Mesh>(null);
  const leftEyeRef = useRef<THREE.Mesh>(null);
  const rightEyeRef = useRef<THREE.Mesh>(null);
  const heldCarrotRef = useRef<THREE.Group>(null);
  const biteParticlesRef = useRef<THREE.Group>(null);

  const species = useMemo(() => getSpeciesConfig(speciesId), [speciesId]);
  const isBunny = species.id === 'bunny';

  const biteParticles = useMemo(() => Array.from({ length: 20 }).map(() => ({
    vx: (Math.random() - 0.5) * 2,
    vy: (Math.random() - 0.5) * 2 - 1,
    vz: Math.random() * 2 + 1,
    scale: 0.02 + Math.random() * 0.04,
    color: Math.random() > 0.3 ? "#f48c06" : "#74c69d"
  })), []);

  const stateRef = useRef({
    position: new THREE.Vector3(...position),
    rotation: 0,
    isWalking: false,
    finalTarget: null as THREE.Vector3 | null,
    actionStartTime: 0,
    currentAction: 'idle',
  });

  const [isSpeaking, setIsSpeaking] = useState(false);
  const [speechText, setSpeechText] = useState('');
  const triggerSpeak = useRef(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const snoreAudioRef = useRef<HTMLAudioElement | null>(null);
  const singAudioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    // Initialize audio. The user should upload their sound file to the public folder and name it 'sound.mp3'
    audioRef.current = new Audio('/bunny_talk.mp3');
    
    snoreAudioRef.current = new Audio('/snore.mp3');
    snoreAudioRef.current.loop = true;
    snoreAudioRef.current.volume = 0.3;

    singAudioRef.current = new Audio('/bunny_sings.mp3');
    singAudioRef.current.loop = true;
    singAudioRef.current.volume = 0.5;
  }, []);

  const handleClick = (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation();
    if (e.delta > 2) return;
    
    const chars = '!@#$%^&*?~=+';
    let str = '';
    const len = Math.floor(Math.random() * 4) + 4;
    for (let i = 0; i < len; i++) {
      str += chars[Math.floor(Math.random() * chars.length)];
    }
    setSpeechText(str);
    setIsSpeaking(true);
    triggerSpeak.current = true;
    
    if (audioRef.current) {
      audioRef.current.currentTime = 0;
      audioRef.current.play().catch(err => console.error("Audio playback failed:", err));
    }

    onChat?.();

    setTimeout(() => {
      setIsSpeaking(false);
    }, 3000);
  };

  useEffect(() => {
    if (targetPosition) {
      stateRef.current.finalTarget = targetPosition.clone();
      stateRef.current.currentAction = 'idle';
    }
  }, [targetPosition]);

  useEffect(() => {
    if (action) {
      stateRef.current.currentAction = action;
      stateRef.current.actionStartTime = -1;
    }
  }, [action, jumpNonce]);

  useFrame((state, delta) => {
    const t = state.clock.getElapsedTime();
    const bunnyState = stateRef.current;

    // Reset rotations and positions
    if (headRef.current) { headRef.current.rotation.set(0, 0, 0); headRef.current.position.set(0, 1.4, 0); }
    if (leftEarRef.current) leftEarRef.current.rotation.set(0, 0, 0);
    if (rightEarRef.current) rightEarRef.current.rotation.set(0, 0, 0);
    if (leftArmRef.current) { leftArmRef.current.rotation.set(0, 0, 0); leftArmRef.current.position.set(-0.55, 0.85, 0); }
    if (rightArmRef.current) { rightArmRef.current.rotation.set(0, 0, 0); rightArmRef.current.position.set(0.55, 0.85, 0); }
    if (leftLegRef.current) leftLegRef.current.rotation.set(0, 0, 0);
    if (rightLegRef.current) rightLegRef.current.rotation.set(0, 0, 0);
    if (bodyRef.current) { bodyRef.current.scale.set(1, 1, 1); bodyRef.current.position.set(0, 0.7, 0); }
    // Mouth/eye scale animations are tuned for the bunny's bead-sized
    // mouth and beady eyes. Other species have their own face geometry
    // (frog wide grin, owl eye saucers, pig disc snout, etc.) so we
    // skip the scale overrides for them — their expression is baked
    // into the geometry itself.
    if (isBunny && mouthRef.current) {
      if (ageInMonths >= 1) {
        // Happy mouth
        mouthRef.current.scale.set(1, 1, 1);
        mouthRef.current.rotation.z = Math.PI; // Smile
      } else {
        // Baby mouth
        mouthRef.current.scale.set(1, 0.2, 1);
        mouthRef.current.rotation.z = 0;
      }
    }

    if (isBunny && leftEyeRef.current && rightEyeRef.current) {
      leftEyeRef.current.scale.set(1, 1, 1);
      rightEyeRef.current.scale.set(1, 1, 1);
    }

    if (remote) {
      bunnyState.position.set(remote.x, remote.y, remote.z);
      bunnyState.rotation = remote.yaw;
      bunnyState.currentAction = remote.action || 'idle';
      bunnyState.isWalking = false;
      bunnyState.finalTarget = null;
    } else {
      // Movement Logic
        const moveDir = moveDirRef?.current;
        if (moveDir) {
          bunnyState.isWalking = true;
          const speed = 4.0;
          const moveDist = speed * delta;

          let mx = moveDir.x;
          let mz = moveDir.z;
          const basis = movementBasisRef?.current;
          if (basis) {
            mx = moveDir.x * basis.rx + (-moveDir.z) * basis.fx;
            mz = moveDir.x * basis.rz + (-moveDir.z) * basis.fz;
          }

          const dir = new THREE.Vector2(mx, mz);
          if (dir.lengthSq() < 1e-10) {
            bunnyState.isWalking = false;
          } else {
            dir.normalize();
            let nextX = bunnyState.position.x + dir.x * moveDist;
            let nextZ = bunnyState.position.z + dir.y * moveDist;
        
            for (const obs of obstacles) {
              const dx = nextX - obs.position.x;
              const dz = nextZ - obs.position.z;
              const dist = Math.sqrt(dx*dx + dz*dz);
              if (dist < obs.radius) {
                const fixDir = new THREE.Vector2(dx, dz).normalize();
                nextX = obs.position.x + fixDir.x * obs.radius;
                nextZ = obs.position.z + fixDir.y * obs.radius;
              }
            }

            // Constrain to terrain bounds (500x500)
            bunnyState.position.x = Math.max(-240, Math.min(240, nextX));
            bunnyState.position.z = Math.max(-240, Math.min(240, nextZ));
        
            bunnyState.rotation = Math.atan2(dir.x, dir.y);
            bunnyState.finalTarget = null; // Cancel target movement
          }
        } else if (bunnyState.finalTarget) {
        const currentPos2D = new THREE.Vector2(bunnyState.position.x, bunnyState.position.z);
        const targetPos2D = new THREE.Vector2(bunnyState.finalTarget.x, bunnyState.finalTarget.z);
        const dist = currentPos2D.distanceTo(targetPos2D);

        if (dist > 0.05) {
          bunnyState.isWalking = true;
          const speed = 4.0;
          const moveDist = Math.min(speed * delta, dist);
          const dir = new THREE.Vector2().subVectors(targetPos2D, currentPos2D).normalize();
          
          let nextX = bunnyState.position.x + dir.x * moveDist;
          let nextZ = bunnyState.position.z + dir.y * moveDist;
          
          for (const obs of obstacles) {
              const dx = nextX - obs.position.x;
              const dz = nextZ - obs.position.z;
              const dist = Math.sqrt(dx*dx + dz*dz);
              if (dist < obs.radius) {
                  const fixDir = new THREE.Vector2(dx, dz).normalize();
                  nextX = obs.position.x + fixDir.x * obs.radius;
                  nextZ = obs.position.z + fixDir.y * obs.radius;
              }
          }

          // Constrain to terrain bounds (500x500)
          bunnyState.position.x = Math.max(-240, Math.min(240, nextX));
          bunnyState.position.z = Math.max(-240, Math.min(240, nextZ));
          
          bunnyState.rotation = Math.atan2(dir.x, dir.y);
        } else {
          bunnyState.isWalking = false;
          bunnyState.finalTarget = null;
          if (onReachTarget) onReachTarget();
        }
      } else {
        bunnyState.isWalking = false;
      }
    }

    const terrainY = getTerrainHeight(bunnyState.position.x, bunnyState.position.z);

    const currentAction = bunnyState.currentAction;

    if (currentAction === 'sleep' && !bunnyState.isWalking) {
      if (snoreAudioRef.current && snoreAudioRef.current.paused) {
        snoreAudioRef.current.play().catch(e => console.log("Snore audio blocked"));
      }
    } else {
      if (snoreAudioRef.current && !snoreAudioRef.current.paused) {
        snoreAudioRef.current.pause();
        snoreAudioRef.current.currentTime = 0;
      }
    }

    if (currentAction === 'sing' && !bunnyState.isWalking) {
      if (singAudioRef.current && singAudioRef.current.paused) {
        singAudioRef.current.play().catch(e => console.log("Sing audio blocked"));
      }
    } else {
      if (singAudioRef.current && !singAudioRef.current.paused) {
        singAudioRef.current.pause();
        singAudioRef.current.currentTime = 0;
      }
    }

    // Animation Logic
    if (bunnyState.isWalking) {
      const walkSpeed = 20;
      const walkCycle = t * walkSpeed;
      
      bunnyState.position.y = terrainY + Math.abs(Math.sin(walkCycle)) * 0.15;
      
      if (group.current) {
        // Align to heading
        const headingQuat = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), bunnyState.rotation);
        
        // Add the walk cycle wobble
        const wobbleQuat = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 0, 1), Math.sin(walkCycle) * 0.05);
        headingQuat.multiply(wobbleQuat);
        
        group.current.quaternion.slerp(headingQuat, 0.2);
      }
      
      if (leftArmRef.current) leftArmRef.current.rotation.x = Math.sin(walkCycle) * 0.5;
      if (rightArmRef.current) rightArmRef.current.rotation.x = -Math.sin(walkCycle) * 0.5;
      
      if (leftLegRef.current) leftLegRef.current.rotation.x = -Math.sin(walkCycle) * 0.6;
      if (rightLegRef.current) rightLegRef.current.rotation.x = Math.sin(walkCycle) * 0.6;
      
      if (leftEarRef.current) leftEarRef.current.rotation.x = Math.sin(walkCycle + Math.PI) * 0.1;
      if (rightEarRef.current) rightEarRef.current.rotation.x = Math.sin(walkCycle) * 0.1;
      
    } else {
      bunnyState.position.y = THREE.MathUtils.lerp(bunnyState.position.y, terrainY, 0.2);
      
      if (group.current) {
        group.current.scale.lerp(new THREE.Vector3(1, 1, 1), 0.15);
        
        // Align to heading
        const headingQuat = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), bunnyState.rotation);
        
        group.current.quaternion.slerp(headingQuat, 0.15);
      }

      if (bunnyState.actionStartTime === -1) {
        bunnyState.actionStartTime = t;
      }
      const actionElapsed = t - bunnyState.actionStartTime;
      const actionDuration =
        currentAction === 'sing' ? 5.0 : currentAction === 'jump' ? 0.52 : 2.5;

      if (currentAction !== 'idle' && currentAction !== 'sleep' && actionElapsed > actionDuration) {
        bunnyState.currentAction = 'idle';
      }

      if (triggerSpeak.current && !bunnyState.isWalking) {
        bunnyState.currentAction = 'speak';
        bunnyState.actionStartTime = t;
        triggerSpeak.current = false;
      } else if (!isSpeaking && bunnyState.currentAction === 'speak') {
        bunnyState.currentAction = 'idle';
      }

      switch (currentAction) {
          case 'idle': {
            const breath = Math.sin(t * 2.5);
            const breathDelayed = Math.sin(t * 2.5 - 0.5); // Overlapping action
            
            if (bodyRef.current) {
              bodyRef.current.scale.set(1 + breath * 0.02, 1 + breath * 0.04, 1 + breath * 0.02);
              bodyRef.current.position.y = 0.7 + breath * 0.01;
            }
            // belly is a child of the body mesh and inherits the body's
            // scale/position automatically — no per-belly animation needed.
            if (headRef.current) {
              headRef.current.position.y = 1.4 + breathDelayed * 0.02;
              headRef.current.rotation.x = breathDelayed * 0.02; // Slight nod
              headRef.current.rotation.y = Math.sin(t * 0.5) * 0.15; // Look around
            }
            if (leftArmRef.current) {
              leftArmRef.current.position.y = 0.85 + breath * 0.02;
              leftArmRef.current.rotation.z = 0.1 + breathDelayed * 0.05;
            }
            if (rightArmRef.current) {
              rightArmRef.current.position.y = 0.85 + breath * 0.02;
              rightArmRef.current.rotation.z = -0.1 - breathDelayed * 0.05;
            }

            const twitchL = Math.pow(Math.max(0, Math.sin(t * 1.5)), 40) * Math.sin(t * 30) * 0.2;
            const twitchR = Math.pow(Math.max(0, Math.sin(t * 1.2 + 2)), 40) * Math.sin(t * 35) * 0.2;
            if (leftEarRef.current) leftEarRef.current.rotation.x = breathDelayed * 0.05 + twitchL;
            if (rightEarRef.current) rightEarRef.current.rotation.x = breathDelayed * 0.05 + twitchR;
            break;
          }
          case 'eat': {
            const eatT = t - bunnyState.actionStartTime;
            if (headRef.current) {
              headRef.current.rotation.x = Math.sin(eatT * 20) * 0.1 + 0.1;
              headRef.current.position.y = 1.3;
            }
            if (leftArmRef.current) {
              leftArmRef.current.rotation.x = THREE.MathUtils.lerp(leftArmRef.current.rotation.x, -2.0, 0.2);
              leftArmRef.current.rotation.z = THREE.MathUtils.lerp(leftArmRef.current.rotation.z, -0.5, 0.2);
            }
            if (rightArmRef.current) {
              rightArmRef.current.rotation.x = THREE.MathUtils.lerp(rightArmRef.current.rotation.x, -2.0, 0.2);
              rightArmRef.current.rotation.z = THREE.MathUtils.lerp(rightArmRef.current.rotation.z, 0.5, 0.2);
            }
            if (heldCarrotRef.current) {
              heldCarrotRef.current.visible = true;
              const bites = Math.floor(eatT / (2.5 / 4));
              const scale = Math.max(0, 1 - bites * 0.25);
              heldCarrotRef.current.scale.setScalar(scale);
            }
            if (biteParticlesRef.current) {
              biteParticlesRef.current.visible = true;
              biteParticlesRef.current.children.forEach((child, i) => {
                const data = biteParticles[i];
                const pt = (eatT + i * 0.05) % 0.5;
                child.position.x = data.vx * pt;
                child.position.y = data.vy * pt - 0.5 * 5 * pt * pt;
                child.position.z = data.vz * pt;
                child.scale.setScalar(data.scale * (1 - pt / 0.5));
              });
            }
            break;
          }
          case 'sleep': {
            const breath = Math.sin(t * 1.5); // Slower, deeper breath for sleeping
            if (group.current) {
              const sleepQuat = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), Math.PI / 2);
              const headingQuat = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), bunnyState.rotation);
              headingQuat.multiply(sleepQuat);
              group.current.quaternion.slerp(headingQuat, 0.2);
              group.current.position.y = bunnyState.position.y - 0.5;
            }
            if (bodyRef.current) {
              bodyRef.current.scale.set(1 + breath * 0.03, 1 + breath * 0.05, 1 + breath * 0.03);
            }
            // belly inherits body scale (child mesh)
            if (headRef.current) headRef.current.rotation.x = Math.sin(t * 1.5) * 0.05;
            if (leftEarRef.current) leftEarRef.current.rotation.x = -0.5 + breath * 0.02;
            if (rightEarRef.current) rightEarRef.current.rotation.x = -0.5 + breath * 0.02;
            break;
          }
          case 'wake': {
            const wakeT = t - bunnyState.actionStartTime;
            
            if (group.current) {
              const headingQuat = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), bunnyState.rotation);
              group.current.quaternion.slerp(headingQuat, 0.1);
              group.current.position.y = THREE.MathUtils.lerp(group.current.position.y, terrainY, 0.1);
            }
            
            if (wakeT < 1.5) {
              // Stretch phase
              const stretchProgress = Math.min(1, wakeT / 1.5);
              const stretchAmount = Math.sin(stretchProgress * Math.PI); // 0 -> 1 -> 0
              
              if (bodyRef.current) {
                bodyRef.current.scale.set(1 - stretchAmount * 0.1, 1 + stretchAmount * 0.2, 1 - stretchAmount * 0.1);
              }
              // belly inherits body scale (child mesh)
              if (headRef.current) {
                headRef.current.position.y = 1.4 + stretchAmount * 0.2;
                headRef.current.rotation.x = -stretchAmount * 0.5;
              }
              if (leftArmRef.current) {
                leftArmRef.current.rotation.x = -stretchAmount * Math.PI * 0.8;
                leftArmRef.current.rotation.z = stretchAmount * 0.5;
              }
              if (rightArmRef.current) {
                rightArmRef.current.rotation.x = -stretchAmount * Math.PI * 0.8;
                rightArmRef.current.rotation.z = -stretchAmount * 0.5;
              }
              if (leftEarRef.current) {
                leftEarRef.current.rotation.x = -stretchAmount * 0.8;
              }
              if (rightEarRef.current) {
                rightEarRef.current.rotation.x = -stretchAmount * 0.8;
              }
            } else {
              // Shake head phase
              const shakeT = wakeT - 1.5;
              const shakeAmount = Math.max(0, 1 - shakeT * 2); // 1 -> 0
              if (headRef.current) {
                headRef.current.rotation.y = Math.sin(shakeT * 40) * 0.2 * shakeAmount;
              }
              if (leftEarRef.current) {
                leftEarRef.current.rotation.z = Math.sin(shakeT * 40) * 0.3 * shakeAmount;
              }
              if (rightEarRef.current) {
                rightEarRef.current.rotation.z = Math.sin(shakeT * 40) * 0.3 * shakeAmount;
              }
            }
            break;
          }
          case 'jump': {
            const jDur = 0.52;
            const jt = Math.min(jDur, t - bunnyState.actionStartTime);
            const u = jt / jDur;
            const hop = Math.sin(Math.PI * u);
            const hopH = 0.88;
            if (group.current) {
              const headingQuat = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), bunnyState.rotation);
              group.current.quaternion.slerp(headingQuat, 0.25);
              group.current.position.y = bunnyState.position.y + hop * hopH;
            }
            const squash = Math.max(0, 1 - u * 3) * 0.08;
            if (bodyRef.current) {
              bodyRef.current.scale.set(1 + squash, 1 - squash * 0.45, 1 + squash);
              bodyRef.current.position.y = 0.7 + squash * 0.06;
            }
            if (headRef.current) {
              headRef.current.position.y = 1.4 + hop * 0.12;
              headRef.current.rotation.x = -hop * 0.38;
            }
            if (leftArmRef.current) {
              leftArmRef.current.rotation.x = -hop * 1.15;
              leftArmRef.current.rotation.z = 0.22;
            }
            if (rightArmRef.current) {
              rightArmRef.current.rotation.x = -hop * 1.15;
              rightArmRef.current.rotation.z = -0.22;
            }
            if (leftLegRef.current) leftLegRef.current.rotation.x = hop * 0.4;
            if (rightLegRef.current) rightLegRef.current.rotation.x = hop * 0.4;
            if (leftEarRef.current) leftEarRef.current.rotation.x = -hop * 0.25;
            if (rightEarRef.current) rightEarRef.current.rotation.x = -hop * 0.25;
            break;
          }
          case 'play':
            if (group.current) {
              const playQuat = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), t * 5);
              const headingQuat = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), bunnyState.rotation);
              headingQuat.multiply(playQuat);
              group.current.quaternion.slerp(headingQuat, 0.3);
              group.current.position.y = bunnyState.position.y + Math.abs(Math.sin(t * 6)) * 0.5;
            }
            if (leftArmRef.current) leftArmRef.current.rotation.z = Math.sin(t * 12) * 0.5 + 0.5;
            if (rightArmRef.current) rightArmRef.current.rotation.z = -Math.sin(t * 12) * 0.5 - 0.5;
            break;
          case 'speak':
            if (headRef.current) {
              headRef.current.rotation.y = Math.sin(t * 5) * 0.2;
              headRef.current.rotation.x = Math.sin(t * 10) * 0.1;
            }
            if (leftArmRef.current) leftArmRef.current.rotation.x = Math.sin(t * 5) * 0.3;
            break;
          case 'sing':
            if (headRef.current) {
              headRef.current.rotation.x = -0.3 + Math.sin(t * 3) * 0.1;
              headRef.current.rotation.y = Math.sin(t * 2) * 0.2;
            }
            if (group.current) group.current.position.y = bunnyState.position.y + Math.abs(Math.sin(t * 2)) * 0.1;
            if (leftArmRef.current) leftArmRef.current.rotation.z = 0.5 + Math.sin(t * 4) * 0.2;
            if (rightArmRef.current) rightArmRef.current.rotation.z = -0.5 - Math.sin(t * 4) * 0.2;
            if (mouthRef.current) {
              if (ageInMonths >= 1) {
                mouthRef.current.scale.y = 1.0 + Math.abs(Math.sin(t * 8)) * 0.5;
                mouthRef.current.scale.x = 1.0;
              } else {
                mouthRef.current.scale.y = 0.5 + Math.abs(Math.sin(t * 8)) * 1.5;
                mouthRef.current.scale.x = 1.0 - Math.abs(Math.sin(t * 8)) * 0.2;
              }
            }
            break;
        }
    }

    if (bunnyState.currentAction !== 'eat') {
      if (heldCarrotRef.current) heldCarrotRef.current.visible = false;
      if (biteParticlesRef.current) biteParticlesRef.current.visible = false;
    }

    if (group.current) {
      if (!bunnyState.isWalking && ['sleep', 'play', 'sing', 'jump'].includes(bunnyState.currentAction)) {
        group.current.position.x = bunnyState.position.x;
        group.current.position.z = bunnyState.position.z;
      } else {
        group.current.position.copy(bunnyState.position);
      }
    }

    if (bunnyPositionRef) {
      bunnyPositionRef.current.copy(bunnyState.position);
    }
  });

  // Body / limb / face palette pulled from the species registry. Naming
  // is kept (`pink`, `cream`, etc.) for backward compatibility with the
  // existing JSX even though the actual colors vary per species.
  const pink = species.primary;
  const darkPink = species.nose;
  const cream = species.belly;
  const black = species.accent;
  const tailColor = species.tail;

  // Procedural body pattern (cow spots, tiger stripes). Applied to the
  // main body sphere AND head sphere so the texture wraps the silhouette.
  const bodyPatternTexture = useMemo(() => {
    if (!species.pattern) return null;
    const patternColor = species.patternColor || species.accent;
    if (species.pattern === 'spots') return createSpotsTexture(species.primary, patternColor);
    if (species.pattern === 'stripes') return createStripesTexture(species.primary, patternColor);
    return null;
  }, [species]);

  // Single-piece curled wolf tail geometry. The tube sweeps a smooth
  // CatmullRom curve that starts well inside the body so the base is
  // hidden, then arcs backward and up into a short curl. We also
  // compute the position + orientation for a cone cap at the tip so the
  // tail tapers to a point instead of ending in an open tube circle.
  const wolfTail = useMemo(() => {
    if (species.tailStyle !== 'wolf-bushy') return null;
    const curve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0, -0.15, 0.30),  // deep inside body — hidden
      new THREE.Vector3(0, 0.00, 0.10),   // emerging from body
      new THREE.Vector3(0, 0.10, -0.10),  // exits backward + up
      new THREE.Vector3(0, 0.25, -0.20),  // top of arc
      new THREE.Vector3(0, 0.36, -0.10),  // tip end
    ]);
    const tubeRadius = 0.15;
    const geometry = new THREE.TubeGeometry(curve, 40, tubeRadius, 16, false);

    // Cone tip aligned with the curve's tangent at the end.
    const endPoint = curve.getPointAt(1);
    const tangent = curve.getTangentAt(1).normalize();
    const tipHeight = 0.18;
    const tipPos = endPoint.clone().add(tangent.clone().multiplyScalar(tipHeight / 2));
    const tipQuat = new THREE.Quaternion().setFromUnitVectors(
      new THREE.Vector3(0, 1, 0),
      tangent,
    );
    return { geometry, tubeRadius, tipPos, tipQuat, tipHeight };
  }, [species.tailStyle]);

  const { head: headNodes, body: bodyNodes, leftArm: leftArmNodes, rightArm: rightArmNodes, heldLeft: heldLeftNodes, heldRight: heldRightNodes, back: backNodes } = useCosmeticsNodes(equippedCosmetics || [], 'bunny');

  const shirtCosmetic = equippedCosmetics?.find(c => {
    const s = c.toLowerCase();
    return s.includes('shirt') || s.includes('tee') || s.includes('crop top') || 
           s.includes('raglan') || s.includes('polo') || s.includes('robe');
  });
  const hatCosmetic = equippedCosmetics?.find(c => {
    const s = c.toLowerCase();
    return s.includes('hat') || s.includes('cap') || s.includes('beanie') || s.includes('crown');
  });
  const sunglassesCosmetic = equippedCosmetics?.find(c => {
    const s = c.toLowerCase();
    return s.includes('sunglass') || s.includes('shades') || s.includes('glass') || s.includes('rayban');
  });

  return (
    <group ref={group} position={position} onClick={handleClick}>
      <AnimatePresence>
        {isSpeaking && (
          <Html position={[0, 2.5, 0]} center zIndexRange={[100, 0]}>
            <motion.div
              initial={{ opacity: 0, scale: 0.5, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.5, y: 10 }}
              className="bg-white text-black px-4 py-2 rounded-2xl shadow-lg border-2 border-gray-200 flex items-center justify-center pointer-events-none"
              style={{ minWidth: '80px' }}
            >
              <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-4 h-4 bg-white border-b-2 border-r-2 border-gray-200 transform rotate-45"></div>
              <motion.div
                variants={{
                  hidden: { opacity: 0 },
                  show: {
                    opacity: 1,
                    transition: { staggerChildren: 0.1 }
                  }
                }}
                initial="hidden"
                animate="show"
                className="flex gap-1 text-xl font-bold relative z-10"
              >
                {speechText.split('').map((char, i) => (
                  <motion.span
                    key={i}
                    variants={{
                      hidden: { opacity: 0, y: 5, rotate: -10 },
                      show: { opacity: 1, y: 0, rotate: 0, transition: { type: 'spring', bounce: 0.6 } }
                    }}
                    className="inline-block"
                  >
                    {char}
                  </motion.span>
                ))}
              </motion.div>
            </motion.div>
          </Html>
        )}
        {action === 'sleep' && (
          <Html position={[0, 1.5, 0]} center zIndexRange={[100, 0]}>
            <motion.div
              initial={{ opacity: 0, y: 0, scale: 0.5 }}
              animate={{ opacity: [0, 1, 0], y: -40, scale: 1.5, x: [0, 15, -15, 0] }}
              transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
              className="text-2xl font-bold text-blue-400 drop-shadow-md select-none pointer-events-none"
              style={{ textShadow: '0 2px 4px rgba(0,0,0,0.2)' }}
            >
              Zzz
            </motion.div>
          </Html>
        )}
        {action === 'sing' && (
          <Html position={[0, 1.8, 0]} center zIndexRange={[100, 0]}>
            <motion.div
              initial={{ opacity: 0, y: 0, scale: 0.5 }}
              animate={{ opacity: [0, 1, 0], y: -50, scale: 1.5, x: [0, -20, 20, 0] }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
              className="text-3xl font-bold text-pink-500 drop-shadow-md select-none pointer-events-none"
              style={{ textShadow: '0 2px 4px rgba(0,0,0,0.2)' }}
            >
              ♪
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 0, scale: 0.5 }}
              animate={{ opacity: [0, 1, 0], y: -60, scale: 1.2, x: [0, 25, -15, 0] }}
              transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
              className="text-2xl font-bold text-purple-400 drop-shadow-md select-none pointer-events-none absolute top-0 left-4"
              style={{ textShadow: '0 2px 4px rgba(0,0,0,0.2)' }}
            >
              ♫
            </motion.div>
          </Html>
        )}
      </AnimatePresence>
      {/* Body */}
      <mesh ref={bodyRef} position={[0, 0.7, 0]} castShadow receiveShadow>
        <sphereGeometry args={[0.65, 32, 32]} />
        {bodyPatternTexture ? (
          <meshToonMaterial map={bodyPatternTexture} />
        ) : (
          <meshToonMaterial color={pink} />
        )}
        <Outlines thickness={0.02} color="black" />

        {/* Tiger paint-stroke stripes scattered across the back / sides
            of the body. Children of the body mesh so they inherit any
            transforms applied to it. */}
        {species.id === 'tiger' && (
          <TigerStripes radius={0.65} stripes={TIGER_BODY_STRIPES} />
        )}

        {/* Owl belly feather scallops — three staggered rows of small
            U-shaped grooves layered over the cream belly patch. */}
        {species.id === 'owl' && (
          <OwlBellyFeathers radius={0.65} scallops={OWL_BELLY_FEATHERS} />
        )}

        {/* Belly — a partial sphere that shares the body's center and
            curvature, rendered as a "decal" on the front-lower surface
            of the body. Because it follows the body's exact shape it
            reads as a colored chest region rather than a stuck-on disc.
            polygonOffset prevents z-fighting with the body surface.
            Skipped for species with hasBelly === false (e.g. frog). */}
        {species.hasBelly !== false && (
          <mesh ref={bellyRef} visible={!shirtCosmetic} castShadow receiveShadow>
            <sphereGeometry
              args={[
                0.651,                    // matches body radius (0.65) + tiny epsilon
                32, 24,                   // segments
                Math.PI / 2 - 0.85,       // phiStart — centered on +z (front)
                1.7,                      // phiLength — ~97° wide
                Math.PI / 2 - 0.35,       // thetaStart — just above equator
                1.15,                     // thetaLength — sweeps down to lower belly
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
        )}

        {/* Cosmetics on Body */}
        {bodyNodes}
      </mesh>

      {/* Cosmetics on Back (attached to root group, not body mesh, to avoid scaling issues) */}
      <group position={[0, 0.7, -0.75]} rotation={[0, Math.PI, 0]}>
        {backNodes}
      </group>

      {/* Head */}
      <group ref={headRef} position={[0, 1.4, 0]}>
        <mesh scale={[1.15, 0.95, 1.05]} castShadow receiveShadow>
          <sphereGeometry args={[0.7, 32, 32]} />
          {bodyPatternTexture ? (
            <meshToonMaterial map={bodyPatternTexture} />
          ) : (
            <meshToonMaterial color={pink} />
          )}
          <Outlines thickness={0.02} color="black" />

          {/* Tiger forehead column, "X" mark, and cheek slashes. Lives
              inside the head mesh so it inherits the head's non-uniform
              scaling and conforms to the elongated head silhouette. */}
          {species.id === 'tiger' && (
            <TigerStripes radius={0.7} stripes={TIGER_HEAD_STRIPES} />
          )}
        </mesh>

        {isBunny ? (
          <>
            {/* Muzzle */}
            <mesh position={[0, -0.12, 0.65]} scale={[2.4, 1.5, 0.8]} castShadow receiveShadow>
              <sphereGeometry args={[0.12, 32, 32]} />
              <meshToonMaterial color={cream} />
              <Outlines thickness={0.02} color="black" />
            </mesh>

            {/* Nose */}
            <mesh position={[0, -0.02, 0.75]} scale={[1.3, 0.8, 0.6]} rotation={[0.1, 0, 0]} castShadow receiveShadow>
              <sphereGeometry args={[0.04, 16, 16]} />
              <meshToonMaterial color={darkPink} />
              <Outlines thickness={0.02} color="black" />
            </mesh>

            {/* Mouth */}
            <mesh ref={mouthRef} position={[0, -0.15, 0.74]} scale={[1, 0.2, 1]} castShadow receiveShadow>
              {ageInMonths >= 1 ? (
                <torusGeometry args={[0.04, 0.015, 16, 32, Math.PI]} />
              ) : (
                <sphereGeometry args={[0.03, 16, 16]} />
              )}
              <meshToonMaterial color={darkPink} />
            </mesh>

            {/* Eyes */}
            <mesh ref={leftEyeRef} position={[-0.28, 0.12, 0.62]} castShadow receiveShadow>
              <sphereGeometry args={[0.07, 16, 16]} />
              <meshToonMaterial color={black} />
            </mesh>
            <mesh ref={rightEyeRef} position={[0.28, 0.12, 0.62]} castShadow receiveShadow>
              <sphereGeometry args={[0.07, 16, 16]} />
              <meshToonMaterial color={black} />
            </mesh>

            {/* Ears */}
            <group ref={leftEarRef} position={[-0.3, 0.5, 0]}>
              <mesh position={[0, 0.4, 0]} rotation={[0, 0, hatCosmetic ? 0.45 : 0.15]} castShadow receiveShadow>
                <capsuleGeometry args={[0.15, 0.8, 16, 16]} />
                <meshToonMaterial color={pink} />
                <Outlines thickness={0.02} color="black" />
              </mesh>
            </group>
            <group ref={rightEarRef} position={[0.3, 0.5, 0]}>
              <mesh position={[0, 0.4, 0]} rotation={[0, 0, hatCosmetic ? -0.45 : -0.15]} castShadow receiveShadow>
                <capsuleGeometry args={[0.15, 0.8, 16, 16]} />
                <meshToonMaterial color={pink} />
                <Outlines thickness={0.02} color="black" />
              </mesh>
            </group>
          </>
        ) : (
          <SpeciesFace
            species={species}
            hatCosmetic={hatCosmetic}
            ageInMonths={ageInMonths}
            leftEarRef={leftEarRef}
            rightEarRef={rightEarRef}
            mouthRef={mouthRef}
            leftEyeRef={leftEyeRef}
            rightEyeRef={rightEyeRef}
          />
        )}

        {/* Bite Particles */}
        <group ref={biteParticlesRef} position={[0, -0.1, 0.7]} visible={false}>
          {biteParticles.map((data, i) => (
            <mesh key={i}>
              <boxGeometry args={[1, 1, 1]} />
              <meshBasicMaterial color={data.color} />
            </mesh>
          ))}
        </group>

        {/* Cosmetics on Head */}
        {headNodes}
      </group>

      {/* Arms */}
      <group ref={leftArmRef} position={[-0.55, 0.85, 0]}>
        <group position={[-0.1, -0.2, 0]} rotation={[0, 0, -0.4]}>
          <mesh castShadow receiveShadow>
            <capsuleGeometry args={[0.15, 0.35, 16, 16]} />
            {bodyPatternTexture ? (
              <meshToonMaterial map={bodyPatternTexture} />
            ) : (
              <meshToonMaterial color={pink} />
            )}
            <Outlines thickness={0.02} color="black" />
          </mesh>
          {leftArmNodes}
        </group>

        {/* Held cosmetic in left hand (e.g. shield) */}
        <group position={[-0.15, -0.4, 0.1]} rotation={[0, 0, 0.2]}>
          {heldLeftNodes}
        </group>
      </group>
      <group ref={rightArmRef} position={[0.55, 0.85, 0]}>
        <group position={[0.1, -0.2, 0]} rotation={[0, 0, 0.4]}>
          <mesh castShadow receiveShadow>
            <capsuleGeometry args={[0.15, 0.35, 16, 16]} />
            {bodyPatternTexture ? (
              <meshToonMaterial map={bodyPatternTexture} />
            ) : (
              <meshToonMaterial color={pink} />
            )}
            <Outlines thickness={0.02} color="black" />
          </mesh>
          {rightArmNodes}
        </group>

        {/* Held cosmetic in right hand (scepter, sword, bat, raygun) */}
        <group position={[0.15, -0.4, 0.1]} rotation={[0, 0, -0.2]}>
          {heldRightNodes}
        </group>

        {/* Held Carrot */}
        <group ref={heldCarrotRef} position={[0.1, -0.4, 0]} rotation={[Math.PI, 0, 0]} visible={false}>
          <mesh position={[0, -0.2, 0]} castShadow receiveShadow>
            <coneGeometry args={[0.15, 0.6, 6]} />
            <meshToonMaterial color="#f48c06" />
            <Outlines thickness={0.02} color="black" />
          </mesh>
          <mesh position={[0, 0.2, 0]} castShadow receiveShadow>
            <coneGeometry args={[0.1, 0.4, 4]} />
            <meshToonMaterial color="#74c69d" />
            <Outlines thickness={0.02} color="black" />
          </mesh>
        </group>
      </group>

      {/* Legs */}
      <group ref={leftLegRef} position={[-0.25, 0.3, 0]}>
        <mesh position={[0, 0.03, 0]} rotation={[0, 0, 0]} castShadow receiveShadow>
          <capsuleGeometry args={[0.18, 0.3, 16, 16]} />
          {bodyPatternTexture ? (
            <meshToonMaterial map={bodyPatternTexture} />
          ) : (
            <meshToonMaterial color={pink} />
          )}
          <Outlines thickness={0.02} color="black" />
        </mesh>
      </group>
      <group ref={rightLegRef} position={[0.25, 0.3, 0]}>
        <mesh position={[0, 0.03, 0]} rotation={[0, 0, 0]} castShadow receiveShadow>
          <capsuleGeometry args={[0.18, 0.3, 16, 16]} />
          {bodyPatternTexture ? (
            <meshToonMaterial map={bodyPatternTexture} />
          ) : (
            <meshToonMaterial color={pink} />
          )}
          <Outlines thickness={0.02} color="black" />
        </mesh>
      </group>

      {/* Tail — skipped for species with hasTail === false (e.g. cow). */}
      {species.hasTail !== false && (
        species.tailStyle === 'wolf-bushy' && wolfTail ? (
          // Single short curled wolf tail — tube swept along a smooth
          // curve that starts deep inside the body (hidden) and arcs
          // backward + up. A cone aligned with the end-tangent caps
          // the open tube so the tail tapers to a point.
          <group position={[0, 0.45, -0.6]}>
            <mesh geometry={wolfTail.geometry} castShadow receiveShadow>
              <meshToonMaterial color={tailColor} />
              <Outlines thickness={0.02} color="black" />
            </mesh>
            <mesh
              position={wolfTail.tipPos}
              quaternion={wolfTail.tipQuat}
              castShadow
              receiveShadow
            >
              <coneGeometry args={[wolfTail.tubeRadius, wolfTail.tipHeight, 16]} />
              <meshToonMaterial color={tailColor} />
              <Outlines thickness={0.02} color="black" />
            </mesh>
          </group>
        ) : (
          <mesh position={[0, 0.4, -0.6]} castShadow receiveShadow>
            <sphereGeometry args={[0.2, 16, 16]} />
            <meshToonMaterial color={tailColor} />
            <Outlines thickness={0.02} color="black" />
          </mesh>
        )
      )}
    </group>
  );
}
