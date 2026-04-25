import React, { useMemo, useState, useRef, useEffect } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { Outlines, useTexture } from '@react-three/drei';
import { getTerrainHeight, getContinuousTerrainHeight, TERRAIN_SEGMENTS, TERRAIN_SIZE } from '../utils/terrain';
import Grass from './Grass';

export function LowPolyEnvironment({ 
  onGroundClick,
  onCarrotClick,
  onCoinCollide,
  eatenCarrots = new Set(),
  collectedCoins = new Set(),
  bunnyPositionRef
}: { 
  onGroundClick?: (point: THREE.Vector3) => void,
  onCarrotClick?: (point: THREE.Vector3, id: number) => void,
  onCoinCollide?: (id: number) => void,
  eatenCarrots?: Set<number>,
  collectedCoins?: Set<number>,
  bunnyPositionRef?: React.MutableRefObject<THREE.Vector3>
}) {
  const carrotPositions = useMemo(() => {
    return Array.from({ length: 40 }).map(() => {
      const x = (Math.random() - 0.5) * 400;
      const z = (Math.random() - 0.5) * 400;
      return [x, getTerrainHeight(x, z), z] as [number, number, number];
    });
  }, []);

  // Total coins scattered across the 400x400 world. Sized so that a player
  // can earn enough to buy all sets in the cosmetic shop by exploring.
  const COIN_COUNT = 200;

  const coinPositions = useMemo(() => {
    return Array.from({ length: COIN_COUNT }).map(() => {
      const x = (Math.random() - 0.5) * 400;
      const z = (Math.random() - 0.5) * 400;
      return [x, getTerrainHeight(x, z) + 0.8, z] as [number, number, number];
    });
  }, []);

  const frameCount = useRef(0);
  const activeCoinsRef = useRef<number[]>([]);

  useEffect(() => {
    activeCoinsRef.current = Array.from({ length: COIN_COUNT }, (_, i) => i)
      .filter(i => !collectedCoins.has(i));
  }, [collectedCoins]);

  useFrame(() => {
    frameCount.current++;
    if (frameCount.current % 4 !== 0) return; // Only check ~15 times a second

    if (!bunnyPositionRef?.current) return;
    const bunnyPos = bunnyPositionRef.current;
    const hitCoins: number[] = [];

    activeCoinsRef.current.forEach((i) => {
      const pos = coinPositions[i];
      const dx = pos[0] - bunnyPos.x;
      const dy = pos[1] - bunnyPos.y;
      const dz = pos[2] - bunnyPos.z;
      const distSq = dx * dx + dy * dy + dz * dz;
      if (distSq < 2.25) { // 1.5 units radius
        hitCoins.push(i);
      }
    });

    if (hitCoins.length > 0) {
      activeCoinsRef.current = activeCoinsRef.current.filter(i => !hitCoins.includes(i));
      hitCoins.forEach(i => onCoinCollide?.(i));
    }
  });

  const flowers = useMemo(() => {
    const colors = ['#6495ED', '#4169E1', '#B0C4DE', '#FFA500', '#FFD700', '#FFFFFF'];
    return Array.from({ length: 100 }).map(() => {
      const angle = Math.random() * Math.PI * 2;
      const radius = 2 + Math.random() * 100; // Between 2 and 102
      const x = Math.cos(angle) * radius;
      const z = Math.sin(angle) * radius;
      const scale = 0.5 + Math.random() * 0.8;
      const color = colors[Math.floor(Math.random() * colors.length)];
      return { position: [x, getTerrainHeight(x, z), z] as [number, number, number], scale, color };
    });
  }, []);

  return (
    <group>
      {/* Ground */}
      <Grass 
        width={TERRAIN_SIZE} 
        instances={100000} 
        options={{ bW: 0.2, bH: 1, joints: 5 }}
      />

      {/* Flowers */}
      {flowers.map((flower, i) => (
        <Flower key={`flower-${i}`} position={flower.position} scale={flower.scale} color={flower.color} />
      ))}

      {/* Carrots */}
      {carrotPositions.map((pos, i) => (
        <Carrot 
          key={`carrot-${i}`} 
          id={i}
          position={pos} 
          onHarvestedClick={onCarrotClick}
          isEaten={eatenCarrots.has(i)}
        />
      ))}

      {/* Coins */}
      {coinPositions.map((pos, i) => (
        <Coin 
          key={`coin-${i}`} 
          id={i}
          position={pos} 
          isCollected={collectedCoins.has(i)}
        />
      ))}
    </group>
  );
}

function Flower({ position, scale = 1, color = "#4169e1" }: { position: [number, number, number], scale?: number, color?: string }) {
  return (
    <group position={position} scale={[scale, scale, scale]}>
      {/* Stem */}
      <mesh position={[0, 0.5, 0]}>
        <cylinderGeometry args={[0.03, 0.03, 1, 5]} />
        <meshToonMaterial color="#2d6a4f" />
      </mesh>
      {/* Petals */}
      <mesh position={[0, 1, 0]}>
        <dodecahedronGeometry args={[0.25, 0]} />
        <meshToonMaterial color={color} />
      </mesh>
      {/* Center */}
      <mesh position={[0, 1.1, 0]}>
        <sphereGeometry args={[0.1, 8, 8]} />
        <meshToonMaterial color="#f4a261" />
      </mesh>
    </group>
  );
}

function Carrot({ position, id, onHarvestedClick, isEaten }: { position: [number, number, number], id: number, onHarvestedClick?: (pos: THREE.Vector3, id: number) => void, isEaten: boolean }) {
  const [state, setState] = useState<'buried' | 'springing' | 'harvested'>('buried');
  const groupRef = useRef<THREE.Group>(null);
  const particlesRef = useRef<THREE.Group>(null);
  const springStartTime = useRef<number | null>(null);

  // Randomize rotation slightly
  const rotX = useMemo(() => (Math.random() - 0.5) * 0.2, []);
  const rotZ = useMemo(() => (Math.random() - 0.5) * 0.2, []);
  
  const dirtParticles = useMemo(() => Array.from({ length: 15 }).map(() => ({
    vx: (Math.random() - 0.5) * 4,
    vy: Math.random() * 4 + 3,
    vz: (Math.random() - 0.5) * 4,
    rx: Math.random() * Math.PI,
    ry: Math.random() * Math.PI,
    rz: Math.random() * Math.PI,
    scale: 0.05 + Math.random() * 0.12,
  })), []);
  
  useFrame((threeState) => {
    if (state === 'springing') {
      if (springStartTime.current === null) {
        springStartTime.current = threeState.clock.getElapsedTime();
      }
      const t = threeState.clock.getElapsedTime() - springStartTime.current;
      const duration = 0.5;
      
      if (t < duration) {
        const p = t / duration;
        const height = Math.sin(p * Math.PI) * 2; // Jump up
        if (groupRef.current) {
          groupRef.current.position.y = position[1] + height;
          groupRef.current.rotation.z = rotZ + p * Math.PI * 4; // spin
        }
        if (particlesRef.current) {
           particlesRef.current.children.forEach((child, i) => {
             const data = dirtParticles[i];
             child.position.x = data.vx * t;
             child.position.y = data.vy * t - 0.5 * 15 * t * t; // gravity
             child.position.z = data.vz * t;
             child.rotation.x = data.rx + t * 5;
             child.rotation.y = data.ry + t * 5;
             const s = Math.max(0, 1 - p) * data.scale;
             child.scale.setScalar(s);
           });
        }
      } else {
        setState('harvested');
        if (groupRef.current) {
          groupRef.current.position.y = position[1] + 0.1;
          groupRef.current.rotation.z = Math.PI / 2;
          groupRef.current.rotation.x = 0;
        }
      }
    }
  });

  if (isEaten) return null;

  return (
    <group>
      <group 
        ref={groupRef} 
        position={position} 
        rotation={[rotX, 0, rotZ]}
        onClick={(e) => {
          e.stopPropagation();
          if (state === 'buried') {
            setState('springing');
          } else if (state === 'harvested') {
            const worldPos = new THREE.Vector3();
            groupRef.current?.getWorldPosition(worldPos);
            onHarvestedClick?.(worldPos, id);
          }
        }}
        onPointerOver={(e) => {
          e.stopPropagation();
          document.body.style.cursor = 'pointer';
        }}
        onPointerOut={(e) => {
          e.stopPropagation();
          document.body.style.cursor = 'auto';
        }}
      >
        {/* Carrot body (mostly buried) */}
        <mesh position={[0, -0.2, 0]}>
          <coneGeometry args={[0.15, 0.6, 6]} />
          <meshStandardMaterial color="#f48c06" roughness={0.7} />
        </mesh>
        {/* Carrot leaves */}
        <mesh position={[0, 0.2, 0]}>
          <coneGeometry args={[0.1, 0.4, 4]} />
          <meshStandardMaterial color="#74c69d" roughness={0.9} />
        </mesh>
        <mesh position={[0.05, 0.15, 0.05]} rotation={[0.2, 0, -0.2]}>
          <coneGeometry args={[0.08, 0.3, 4]} />
          <meshStandardMaterial color="#52b788" roughness={0.9} />
        </mesh>
        <mesh position={[-0.05, 0.15, -0.05]} rotation={[-0.2, 0, 0.2]}>
          <coneGeometry args={[0.08, 0.3, 4]} />
          <meshStandardMaterial color="#40916c" roughness={0.9} />
        </mesh>
      </group>
      
      {state === 'springing' && (
        <group ref={particlesRef} position={position}>
          {dirtParticles.map((_, i) => (
            <mesh key={i} position={[0, 0, 0]}>
              <boxGeometry args={[1, 1, 1]} />
              <meshStandardMaterial color="#5c4033" />
            </mesh>
          ))}
        </group>
      )}
    </group>
  );
}

const COIN_PARTICLE_GEO = new THREE.OctahedronGeometry(0.08, 0);
const COIN_PARTICLE_COUNT = 18;
const COIN_PARTICLE_LIFETIME = 0.9; // seconds

function Coin({ position, id, isCollected }: { position: [number, number, number], id: number, isCollected: boolean }) {
  const groupRef = useRef<THREE.Group>(null);
  const particlesGroupRef = useRef<THREE.Group>(null);
  const texture = useTexture('/unicorn_coin.png');

  // Disintegration state. When isCollected flips true, we play a short particle burst, then unmount.
  const [phase, setPhase] = useState<'idle' | 'burst' | 'gone'>('idle');
  const burstStartRef = useRef<number | null>(null);
  const burstOriginRef = useRef<[number, number, number]>(position);

  // Pre-compute deterministic per-particle velocities so the look is stable across frames.
  const particles = useMemo(() => {
    const arr: { vx: number; vy: number; vz: number; rotX: number; rotY: number; rotZ: number; spinX: number; spinY: number; scale: number }[] = [];
    for (let i = 0; i < COIN_PARTICLE_COUNT; i++) {
      const theta = Math.random() * Math.PI * 2;
      const speed = 1.5 + Math.random() * 2.0;
      arr.push({
        vx: Math.cos(theta) * speed,
        vy: 1.5 + Math.random() * 2.5,
        vz: Math.sin(theta) * speed,
        rotX: Math.random() * Math.PI * 2,
        rotY: Math.random() * Math.PI * 2,
        rotZ: Math.random() * Math.PI * 2,
        spinX: (Math.random() - 0.5) * 10,
        spinY: (Math.random() - 0.5) * 10,
        scale: 0.6 + Math.random() * 0.6,
      });
    }
    return arr;
  }, []);

  useEffect(() => {
    if (isCollected && phase === 'idle') {
      // Capture the current floating position as the burst origin (so particles fly from where the coin actually was).
      if (groupRef.current) {
        const p = groupRef.current.position;
        burstOriginRef.current = [p.x, p.y, p.z];
      } else {
        burstOriginRef.current = position;
      }
      burstStartRef.current = null; // set on first useFrame tick
      setPhase('burst');
    }
  }, [isCollected, phase, position]);

  useFrame((state) => {
    if (phase === 'idle') {
      if (groupRef.current) {
        groupRef.current.rotation.y += 0.05;
        groupRef.current.position.y = position[1] + Math.sin(state.clock.elapsedTime * 3 + id) * 0.2;
      }
      return;
    }

    if (phase === 'burst') {
      if (burstStartRef.current === null) burstStartRef.current = state.clock.elapsedTime;
      const elapsed = state.clock.elapsedTime - burstStartRef.current;
      const t = Math.min(elapsed / COIN_PARTICLE_LIFETIME, 1);

      const group = particlesGroupRef.current;
      if (group) {
        const fade = 1 - t;
        for (let i = 0; i < group.children.length; i++) {
          const child = group.children[i] as THREE.Mesh;
          const data = particles[i];
          // Ballistic motion with gravity
          child.position.x = data.vx * elapsed;
          child.position.y = data.vy * elapsed - 0.5 * 6.0 * elapsed * elapsed;
          child.position.z = data.vz * elapsed;
          child.rotation.x = data.rotX + data.spinX * elapsed;
          child.rotation.y = data.rotY + data.spinY * elapsed;
          child.scale.setScalar(data.scale * (0.9 + 0.4 * fade));
          const mat = child.material as THREE.MeshStandardMaterial;
          if (mat) mat.opacity = fade;
        }
      }

      if (t >= 1) {
        setPhase('gone');
      }
    }
  });

  if (phase === 'gone') return null;

  if (phase === 'burst') {
    const [bx, by, bz] = burstOriginRef.current;
    return (
      <group position={[bx, by, bz]} scale={[2, 2, 2]}>
        <group ref={particlesGroupRef}>
          {particles.map((_, i) => (
            <mesh key={`p-${i}`} geometry={COIN_PARTICLE_GEO}>
              <meshStandardMaterial
                color="#FFD700"
                emissive="#FFB000"
                emissiveIntensity={0.8}
                metalness={0.9}
                roughness={0.25}
                transparent
                opacity={1}
              />
            </mesh>
          ))}
        </group>
      </group>
    );
  }

  return (
    <group ref={groupRef} position={position} scale={[2, 2, 2]}>
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.3, 0.3, 0.05, 16]} />
        <meshStandardMaterial 
          color="#FFD700" 
          metalness={0.8} 
          roughness={0.2} 
          emissive="#FFD700"
          emissiveIntensity={0.2}
        />
      </mesh>
      {/* Front face */}
      <mesh position={[0, 0, 0.026]}>
        <circleGeometry args={[0.25, 32]} />
        <meshStandardMaterial map={texture} transparent alphaTest={0.5} />
      </mesh>
      {/* Back face */}
      <mesh position={[0, 0, -0.026]} rotation={[0, Math.PI, 0]}>
        <circleGeometry args={[0.25, 32]} />
        <meshStandardMaterial map={texture} transparent alphaTest={0.5} />
      </mesh>
    </group>
  );
}