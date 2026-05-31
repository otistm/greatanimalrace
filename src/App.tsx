/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect, Suspense, useCallback } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import { ArrowUp, ArrowDown, ArrowLeft, ArrowRight, Rabbit, Moon, Sun, Gamepad2, Carrot, Shirt, Coins, MessageCircle, User } from 'lucide-react';
import * as THREE from 'three';
import { motion, AnimatePresence } from 'framer-motion';
import { PinkBunny } from './components/PinkBunny';
import { Unicorn } from './components/Unicorn';
import { LowPolyEnvironment } from './components/LowPolyEnvironment';
import { MiniGameOverlay } from './components/MiniGameOverlay';
import { MiniGameIframe } from './components/MiniGameIframe';
import { GAME_IDS } from './games/registry';
import { TreasureChest } from './components/TreasureChest';
import { GlobalMessageOverlay, GlobalMessage } from './components/GlobalMessageOverlay';
import { usePetProgression } from './hooks/usePetProgression';
import { PetStatusOverlay } from './components/PetStatusOverlay';
import { SlotMachineOverlay } from './components/SlotMachineOverlay';
import { TunnelTransition } from './components/TunnelTransition';
import { NamePromptOverlay } from './components/NamePromptOverlay';
import { GlobalLeaderboardsOverlay } from './components/GlobalLeaderboardsOverlay';
import { MessagesOverlay, PendingDmTarget } from './components/MessagesOverlay';
import { useUnreadCounts } from './hooks/useChat';
import { CosmeticsOverlay } from './components/CosmeticsOverlay';
import { ArcadeMachine } from './components/ArcadeMachine';
import { FPSMeter } from './components/FPSMeter';
import { useAuth } from './contexts/AuthContext';
import { BASE_COSMETIC_TYPES, COSMETIC_REGISTRY, canonicalizeEquippedString, getCosmeticData, matchesBaseName, type CosmeticSet } from './utils/cosmeticsRegistry';
import { db, auth } from './firebase';
import { doc, getDoc, setDoc, deleteDoc, serverTimestamp } from 'firebase/firestore';
import { handleFirestoreError, OperationType } from './utils/firestoreErrorHandler';
import { getTerrainHeight } from './utils/terrain';
import { useRemotePlayers } from './hooks/useRemotePlayers';
import { RemotePlayer } from './components/RemotePlayer';
import { publishPresence, tryClaimSlot, clearPresence } from './utils/multiplayer';
import { useGamepadWorldInput } from './hooks/useGamepadWorldInput';
import { TouchCameraControls, type CameraTouchInput } from './components/TouchCameraControls';

const MIN_CAMERA_DIST = 4;
const MAX_CAMERA_DIST = 45;

function combineMoveDirs(
  a: { x: number; z: number } | null,
  b: { x: number; z: number } | null
): { x: number; z: number } | null {
  if (!a && !b) return null;
  if (!a) return b;
  if (!b) return a;
  const x = a.x + b.x;
  const z = a.z + b.z;
  const m = Math.hypot(x, z);
  if (m < 1e-5) return null;
  if (m > 1) return { x: x / m, z: z / m };
  return { x, z };
}

export interface ChestData {
  id: number;
  x: number;
  y: number;
  z: number;
  opened: boolean;
  looted: boolean;
  cosmetic: string;
}

const ARCADE_POS = new THREE.Vector3(8, getTerrainHeight(8, -12), -12);
const WORLD_UP = new THREE.Vector3(0, 1, 0);

/** Horizontal camera basis for stick movement: forward = into the view, right = stick-right. */
type MovementBasisXZ = { fx: number; fz: number; rx: number; rz: number };

export const generateInitialChests = (): ChestData[] => {
  const newChests: ChestData[] = [];
  const MIN_DIST = 30; // Minimum distance between chests
  const AREA_SIZE = 400; // Spread across a 400x400 area (-200 to 200)

  for (let i = 0; i < BASE_COSMETIC_TYPES.length; i++) {
    let x = 0, z = 0, y = 0;
    let attempts = 0;
    let valid = false;
    
    while (!valid && attempts < 100) {
      x = (Math.random() - 0.5) * AREA_SIZE;
      z = (Math.random() - 0.5) * AREA_SIZE;
      y = getTerrainHeight(x, z);
      
      valid = true;
      for (const existing of newChests) {
        const dx = existing.x - x;
        const dz = existing.z - z;
        if (Math.sqrt(dx*dx + dz*dz) < MIN_DIST) {
          valid = false;
          break;
        }
      }
      attempts++;
    }
    
    const baseType = BASE_COSMETIC_TYPES[i];
    newChests.push({ id: i, x, y, z, opened: false, looted: false, cosmetic: baseType });
  }
  return newChests;
};

function AnimatedSky() {
  const materialRef = useRef<THREE.ShaderMaterial>(null);
  
  useFrame((state) => {
    if (materialRef.current) {
      materialRef.current.uniforms.time.value = state.clock.elapsedTime;
    }
  });

  return (
    <group>
      <mesh>
        <sphereGeometry args={[500, 32, 32]} />
        <shaderMaterial
          ref={materialRef}
          side={THREE.BackSide}
          uniforms={{
            time: { value: 0 },
            color1: { value: new THREE.Color('#87CEEB') }, // Light blue
            color2: { value: new THREE.Color('#1E90FF') }, // Dodger blue
            color3: { value: new THREE.Color('#00BFFF') }, // Deep sky blue
          }}
          vertexShader={`
            varying vec2 vUv;
            varying vec3 vPosition;
            void main() {
              vUv = uv;
              vPosition = position;
              gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
            }
          `}
          fragmentShader={`
            uniform float time;
            uniform vec3 color1;
            uniform vec3 color2;
            uniform vec3 color3;
            varying vec2 vUv;
            varying vec3 vPosition;

            void main() {
              vec3 pos = normalize(vPosition);
              // Use lightweight sine waves instead of expensive 3D simplex noise
              float n = sin(pos.x * 2.0 + time * 0.1) * sin(pos.y * 2.0 + time * 0.15) * 0.5 + 0.5;
              
              vec3 finalColor = mix(color1, color2, vUv.y + n * 0.2);
              finalColor = mix(finalColor, color3, sin(time * 0.1 + pos.x) * 0.5 + 0.5);
              
              gl_FragColor = vec4(finalColor, 1.0);
            }
          `}
        />
      </mesh>
    </group>
  );
}

function TargetIndicator({ position }: { position: THREE.Vector3 }) {
  const groupRef = useRef<THREE.Group>(null);
  const ring1Ref = useRef<THREE.Mesh>(null);
  const mat1Ref = useRef<THREE.MeshBasicMaterial>(null);
  const ring2Ref = useRef<THREE.Mesh>(null);
  const mat2Ref = useRef<THREE.MeshBasicMaterial>(null);
  const markerMatRef = useRef<THREE.MeshBasicMaterial>(null);
  
  const startTimeRef = useRef(performance.now());

  useEffect(() => {
    startTimeRef.current = performance.now();
  }, [position]);

  useFrame(() => {
    const elapsed = (performance.now() - startTimeRef.current) / 1000;
    const duration = 2.0;
    
    if (elapsed < duration) {
      if (groupRef.current) groupRef.current.visible = true;
      
      const p1 = Math.min(elapsed / 1.2, 1);
      if (ring1Ref.current && mat1Ref.current) {
        const scale1 = 0.1 + p1 * 2.5;
        ring1Ref.current.scale.set(scale1, scale1, scale1);
        mat1Ref.current.opacity = 0.6 * (1 - p1);
      }

      const p2 = Math.max(0, Math.min((elapsed - 0.3) / 1.2, 1));
      if (ring2Ref.current && mat2Ref.current) {
        const scale2 = 0.1 + p2 * 2.5;
        ring2Ref.current.scale.set(scale2, scale2, scale2);
        mat2Ref.current.opacity = 0.4 * (1 - p2);
      }

      if (markerMatRef.current) {
        const p3 = Math.max(0, Math.min((elapsed - 1.5) / 0.5, 1));
        markerMatRef.current.opacity = 0.5 * (1 - p3);
      }
    } else {
      if (groupRef.current) groupRef.current.visible = false;
    }
  });

  return (
    <group ref={groupRef} position={[position.x, 0.02, position.z]} rotation={[-Math.PI / 2, 0, 0]}>
      <mesh ref={ring1Ref}>
        <ringGeometry args={[0.8, 1, 32]} />
        <meshBasicMaterial ref={mat1Ref} color="#ffffff" transparent opacity={0} depthWrite={false} />
      </mesh>
      <mesh ref={ring2Ref}>
        <ringGeometry args={[0.8, 1, 32]} />
        <meshBasicMaterial ref={mat2Ref} color="#ffffff" transparent opacity={0} depthWrite={false} />
      </mesh>
      <mesh>
        <circleGeometry args={[0.15, 32]} />
        <meshBasicMaterial ref={markerMatRef} color="#ffffff" transparent opacity={0.5} depthWrite={false} />
      </mesh>
    </group>
  );
}

function CameraController({
  bunnyPositionRef,
  stage,
  cameraStickRef,
  cameraTouchRef,
  movementBasisRef,
}: {
  bunnyPositionRef: React.MutableRefObject<THREE.Vector3>;
  stage: string;
  cameraStickRef: React.MutableRefObject<{ x: number; y: number } | null>;
  cameraTouchRef: React.MutableRefObject<CameraTouchInput | null>;
  movementBasisRef: React.MutableRefObject<MovementBasisXZ | null>;
}) {
  const currentTarget = useRef(new THREE.Vector3(0, 1, 0));
  const offsetScratch = useRef(new THREE.Vector3());
  const axisScratch = useRef(new THREE.Vector3());
  const basisForwardScratch = useRef(new THREE.Vector3());
  const basisRightScratch = useRef(new THREE.Vector3());

  useFrame((state, delta) => {
    if (stage === 'animal') {
      const desiredTarget = bunnyPositionRef.current.clone();
      desiredTarget.y += 0.5; // Look slightly above the bunny's feet

      // Smoothly interpolate the target
      const lerpFactor = 1 - Math.exp(-5 * delta);
      const previousTarget = currentTarget.current.clone();
      currentTarget.current.lerp(desiredTarget, lerpFactor);

      {
        const f = basisForwardScratch.current.subVectors(currentTarget.current, state.camera.position);
        f.y = 0;
        if (f.lengthSq() < 1e-8) {
          movementBasisRef.current = null;
        } else {
          f.normalize();
          const r = basisRightScratch.current.crossVectors(f, WORLD_UP);
          r.normalize();
          movementBasisRef.current = { fx: f.x, fz: f.z, rx: r.x, rz: r.z };
        }
      }

      // Calculate how much the target moved this frame
      const diff = new THREE.Vector3().subVectors(currentTarget.current, previousTarget);

      // Move the camera by the exact same amount to maintain relative distance/rotation
      state.camera.position.add(diff);

      const stick = cameraStickRef.current;
      if (stick && (Math.abs(stick.x) > 1e-4 || Math.abs(stick.y) > 1e-4)) {
        const target = currentTarget.current;
        const cam = state.camera.position;
        const offset = offsetScratch.current;
        offset.copy(cam).sub(target);
        const dist = offset.length();
        if (dist > 0.25) {
          const yawSpeed = 2.35;
          const pitchSpeed = 1.7;
          const yawDelta = -stick.x * yawSpeed * delta;
          const pitchDelta = -stick.y * pitchSpeed * delta;

          offset.applyAxisAngle(WORLD_UP, yawDelta);

          const axis = axisScratch.current;
          axis.copy(WORLD_UP).cross(offset);
          if (axis.lengthSq() < 1e-10) {
            axis.set(1, 0, 0);
          } else {
            axis.normalize();
          }
          offset.applyAxisAngle(axis, pitchDelta);

          offset.normalize().multiplyScalar(dist);

          cam.copy(target).add(offset);
          const minCamY = target.y + 0.65;
          if (cam.y < minCamY) {
            cam.y = minCamY;
          }
        }
      }

      const touch = cameraTouchRef.current;
      if (touch && (touch.yaw !== 0 || touch.pitch !== 0 || touch.zoom !== 1)) {
        const target = currentTarget.current;
        const cam = state.camera.position;
        const offset = offsetScratch.current.copy(cam).sub(target);
        let dist = offset.length();

        if (dist > 0.25 && (touch.yaw !== 0 || touch.pitch !== 0)) {
          offset.applyAxisAngle(WORLD_UP, touch.yaw);
          const axis = axisScratch.current.copy(WORLD_UP).cross(offset);
          if (axis.lengthSq() < 1e-10) {
            axis.set(1, 0, 0);
          } else {
            axis.normalize();
          }
          offset.applyAxisAngle(axis, touch.pitch);
        }

        dist = THREE.MathUtils.clamp(dist * touch.zoom, MIN_CAMERA_DIST, MAX_CAMERA_DIST);
        if (dist > 0.25) {
          offset.normalize().multiplyScalar(dist);
          cam.copy(target).add(offset);
          const minCamY = target.y + 0.65;
          if (cam.y < minCamY) {
            cam.y = minCamY;
          }
        }

        cameraTouchRef.current = null;
      }

      state.camera.lookAt(currentTarget.current);
    } else {
      state.camera.lookAt(0, 1, 0);
    }
  });
  return null;
}

function StaticLight() {
  const lightRef = useRef<THREE.DirectionalLight>(null);

  useEffect(() => {
    if (lightRef.current) {
      lightRef.current.target.position.set(0, 0, 0);
      lightRef.current.target.updateMatrixWorld();
    }
  }, []);

  return (
    <directionalLight
      ref={lightRef}
      position={[100, 200, 100]}
      castShadow
      intensity={2.0}
      shadow-mapSize={[1024, 1024]}
      shadow-bias={-0.0001}
      shadow-normalBias={0.02}
    >
      <orthographicCamera attach="shadow-camera" args={[-350, 350, 350, -350, 0.1, 1000]} />
    </directionalLight>
  );
}

function ActionButton({ icon, onClick, active, className }: { icon: React.ReactNode, onClick: () => void, active?: boolean, className?: string }) {
  return (
    <button 
      onClick={onClick}
      className={`${className || 'w-14 h-14 md:w-16 md:h-16'} rounded-full flex items-center justify-center transition-all shadow-xl ${
        active 
          ? 'bg-[#FF6B6B] text-white scale-110' 
          : 'bg-white text-zinc-900 hover:bg-gray-50'
      }`}
    >
      <div className={`${active ? 'animate-bounce' : ''}`}>
        {icon}
      </div>
    </button>
  );
}

function Joystick({ onChange, onEnd }: { onChange: (dir: {x: number, z: number}) => void, onEnd: () => void }) {
  const [active, setActive] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  const handleMove = useCallback((e: PointerEvent) => {
    if (!active || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    
    let dx = e.clientX - centerX;
    let dy = e.clientY - centerY;
    
    const maxDist = rect.width / 2 - 24;
    const dist = Math.sqrt(dx * dx + dy * dy);
    
    if (dist > maxDist) {
      dx = (dx / dist) * maxDist;
      dy = (dy / dist) * maxDist;
    }
    
    setPosition({ x: dx, y: dy });
    onChange({ x: dx / maxDist, z: dy / maxDist });
  }, [active, onChange]);

  const handleUp = useCallback(() => {
    setActive(false);
    setPosition({ x: 0, y: 0 });
    onEnd();
  }, [onEnd]);

  useEffect(() => {
    if (active) {
      window.addEventListener('pointermove', handleMove);
      window.addEventListener('pointerup', handleUp);
      return () => {
        window.removeEventListener('pointermove', handleMove);
        window.removeEventListener('pointerup', handleUp);
      };
    }
  }, [active, handleMove, handleUp]);

  return (
    <div 
      ref={containerRef}
      className="w-32 h-32 md:w-36 md:h-36 bg-white/90 backdrop-blur-md rounded-full shadow-xl relative touch-none flex items-center justify-center border border-gray-100"
      onPointerDown={(e) => {
        setActive(true);
        const rect = e.currentTarget.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        let dx = e.clientX - centerX;
        let dy = e.clientY - centerY;
        const maxDist = rect.width / 2 - 24;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist > maxDist) {
          dx = (dx / dist) * maxDist;
          dy = (dy / dist) * maxDist;
        }
        setPosition({ x: dx, y: dy });
        onChange({ x: dx / maxDist, z: dy / maxDist });
      }}
    >
      <div 
        className="w-14 h-14 md:w-16 md:h-16 bg-zinc-900 rounded-full shadow-md absolute"
        style={{ transform: `translate(${position.x}px, ${position.y}px)` }}
      />
    </div>
  );
}

const MIGRATION_MAP: Record<string, string> = {
  "a cool new hat!": "Ruby Top Hat",
  "a stylish shirt!": "Ruby Striped Shirt",
  "a cool new hat": "Ruby Top Hat",
  "a stylish shirt": "Ruby Striped Shirt",
  "a red striped shirt!": "Ruby Striped Shirt",
  "a blue striped shirt!": "Ocean Striped Shirt",
  "a green striped shirt!": "Emerald Striped Shirt",
  "a pink striped shirt!": "Ruby Striped Shirt",
  "a purple striped shirt!": "Ruby Striped Shirt",
  "a red polka-dot shirt!": "Ruby Polka-Dot Shirt",
  "a blue polka-dot shirt!": "Ocean Polka-Dot Shirt",
  "a green polka-dot shirt!": "Emerald Polka-Dot Shirt",
  "a pink polka-dot shirt!": "Ruby Polka-Dot Shirt",
  "a purple polka-dot shirt!": "Ruby Polka-Dot Shirt",
  "a red hat!": "Ruby Top Hat",
  "a blue hat!": "Ocean Cap",
  "a green hat!": "Emerald Beanie",
  "a pink hat!": "Ruby Crown",
  "a purple hat!": "Ruby Top Hat",
  "some red sunglasses!": "Ruby Rectangle Sunglasses",
  "some blue sunglasses!": "Ocean Rectangle Sunglasses",
  "some green sunglasses!": "Emerald Rectangle Sunglasses",
  "some pink sunglasses!": "Ruby Rectangle Sunglasses",
  "some purple sunglasses!": "Ruby Rectangle Sunglasses",
  "Ruby Striped Tee": "Ruby Striped Shirt",
  "Ocean Striped Tee": "Ocean Striped Shirt",
  "Emerald Striped Tee": "Emerald Striped Shirt",
  "Rose Striped Tee": "Ruby Striped Shirt",
  "Amethyst Striped Tee": "Ruby Striped Shirt",
  "Ruby Polka-Dot Tee": "Ruby Polka-Dot Shirt",
  "Ocean Polka-Dot Tee": "Ocean Polka-Dot Shirt",
  "Emerald Polka-Dot Tee": "Emerald Polka-Dot Shirt",
  "Rose Polka-Dot Tee": "Ruby Polka-Dot Shirt",
  "Amethyst Polka-Dot Tee": "Ruby Polka-Dot Shirt",
  "Ruby Shades": "Ruby Rectangle Sunglasses",
  "Ocean Shades": "Ocean Rectangle Sunglasses",
  "Emerald Shades": "Emerald Rectangle Sunglasses",
  "Rose Shades": "Ruby Rectangle Sunglasses",
  "Amethyst Shades": "Ruby Rectangle Sunglasses",
  "Rose Crown": "Ruby Crown",
  "Amethyst Top Hat": "Ruby Top Hat"
};

export default function App() {
  // Temporary migration to clear old data
  useEffect(() => {
    if (!localStorage.getItem('db_v4_migrated')) {
      localStorage.clear();
      localStorage.setItem('db_v4_migrated', 'true');
      window.location.reload();
    }
  }, []);

  const [targetPosition, setTargetPosition] = useState<THREE.Vector3 | null>(null);
  const moveDirRef = useRef<{x: number, z: number} | null>(null);
  const joystickDirRef = useRef<{ x: number; z: number } | null>(null);
  const gamepadDirRef = useRef<{ x: number; z: number } | null>(null);
  const cameraStickRef = useRef<{ x: number; y: number } | null>(null);
  const cameraTouchRef = useRef<CameraTouchInput | null>(null);
  const movementBasisRef = useRef<MovementBasisXZ | null>(null);
  const bunnyActionRef = useRef<string>('idle');
  const worldInputEnabledRef = useRef(false);
  const flushMoveRef = useRef<() => void>(() => {});
  const gamepadAButtonRef = useRef<(() => void) | null>(null);
  const gamepadBButtonRef = useRef<(() => void) | null>(null);
  const [bunnyAction, setBunnyAction] = useState<string>('idle');
  const [jumpNonce, setJumpNonce] = useState(0);
  const [activeCarrotId, setActiveCarrotId] = useState<number | null>(null);
  const [eatenCarrots, setEatenCarrots] = useState<Set<number>>(new Set());
  const collectedCoinsRef = useRef<Set<number>>(new Set());
  const [collectedCoins, setCollectedCoins] = useState<Set<number>>(new Set());
  const bunnyPositionRef = useRef(new THREE.Vector3(0, 0, 0));
  
  const targetPositionRef = useRef<THREE.Vector3 | null>(null);

  const [chests, setChests] = useState<ChestData[]>(() => {
    try {
      const saved = localStorage.getItem('chests');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && parsed.length > 0) {
          return (parsed as ChestData[]).map(c => ({
            ...c,
            y: getTerrainHeight(c.x, c.z),
          }));
        }
      }
    } catch {}
    return generateInitialChests();
  });

  const [globalMessage, setGlobalMessage] = useState<GlobalMessage | null>(null);

  const [selectedAnimalId, setSelectedAnimalId] = useState<string>(() => localStorage.getItem('selectedAnimalId') || 'bunny');
  const [petName, setPetName] = useState<string>(() => localStorage.getItem('petName') || '');

  const [miniGameState, setMiniGameState] = useState<'inactive' | 'menu' | 'playing'>('inactive');
  const [activeGameId, setActiveGameId] = useState<string | null>(null);
  const [activeGameLevel, setActiveGameLevel] = useState<number>(1);
  const [autoStartGame, setAutoStartGame] = useState<boolean>(false);

  interface GameProgress {
    unlockedLevel: number;
    stars: Record<number, number>;
  }
  const [gameProgress, setGameProgress] = useState<Record<string, GameProgress>>(() => {
    try {
      const saved = localStorage.getItem('gameProgress');
      if (saved) return JSON.parse(saved);
    } catch {}
    return {};
  });

  const { ageInMonths, currentXp, requiredXp, addXp: originalAddXp, coins, updateCoins, loadState, resetState } = usePetProgression();
  const [isStatusOpen, setIsStatusOpen] = useState(false);
  const [isLeaderboardsOpen, setIsLeaderboardsOpen] = useState(false);
  const [isMessagesOpen, setIsMessagesOpen] = useState(false);
  const [pendingDmTarget, setPendingDmTarget] = useState<PendingDmTarget | null>(null);
  const unreadChat = useUnreadCounts();
  const totalUnread = unreadChat.world + Object.keys(unreadChat.dms).length;
  
  const remotePlayers = useRemotePlayers(10);
  const [worldIsFull, setWorldIsFull] = useState(false);
  const [isCosmeticsOpen, setIsCosmeticsOpen] = useState(false);
  const [unlockedCosmetics, setUnlockedCosmetics] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('unlockedCosmetics');
      if (saved) {
        const parsed = JSON.parse(saved) as string[];
        const migrated = parsed.map(c => {
          const mapped = MIGRATION_MAP[c] || c;
          if (!COSMETIC_REGISTRY[mapped]) {
            return mapped.split(' ').slice(1).join(' ') || mapped;
          }
          return mapped;
        });
        return Array.from(new Set(migrated)).filter(c => !c.toLowerCase().includes('bow tie'));
      }
      return [];
    } catch {
      return [];
    }
  });
  const [equippedCosmetics, setEquippedCosmetics] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('equippedCosmetics');
      if (saved) {
        const parsed = JSON.parse(saved) as string[];
        return Array.from(new Set(
          parsed
            .map(c => MIGRATION_MAP[c] || c)
            .map(canonicalizeEquippedString)
        )).filter(c => !c.toLowerCase().includes('bow tie'));
      }
      return [];
    } catch {
      return [];
    }
  });
  const [xpPopup, setXpPopup] = useState<{amount: number, visible: boolean}>({ amount: 0, visible: false });
  const xpTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  // Web Audio API based coin SFX. Using AudioContext + AudioBuffer instead of
  // HTMLAudioElement avoids the iOS unlock-burst issue (where priming a pool
  // of <audio> elements via .play() would briefly emit sound on the first
  // user gesture even when muted=true / volume=0, because iOS Safari ignores
  // those properties on a freshly-created element). The AudioContext only
  // needs to be resume()'d once on a user gesture — that is silent.
  const coinAudioCtxRef = useRef<AudioContext | null>(null);
  const coinBufferRef = useRef<AudioBuffer | null>(null);
  // Persistent ambient audio element. Held in a ref so that switching into /
  // out of a mini-game can pause/resume the same instance (instead of
  // recreating it and losing the iOS unlock).
  const ambientAudioRef = useRef<HTMLAudioElement | null>(null);
  // Idempotency cache: silently drop duplicate LEVEL_RESULT events for the same
  // (gameId, level, stars, score) within a short window. See SCORING_GUIDE.md §1.4.
  const lastCreditedRef = useRef<{ gameId: string, level: number, stars: number, score: number, ts: number } | null>(null);

  useEffect(() => {
    let cancelled = false;
    const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    coinAudioCtxRef.current = ctx;

    fetch('/coin.mp3')
      .then(r => r.arrayBuffer())
      .then(buf => new Promise<AudioBuffer>((resolve, reject) => {
        // decodeAudioData callback form for broader Safari support.
        ctx.decodeAudioData(buf, resolve, reject);
      }))
      .then(decoded => {
        if (!cancelled) coinBufferRef.current = decoded;
      })
      .catch(e => console.log("Coin audio decode failed", e));

    return () => {
      cancelled = true;
      ctx.close().catch(() => {});
      coinAudioCtxRef.current = null;
      coinBufferRef.current = null;
    };
  }, []);

  const playCoinSfx = useCallback(() => {
    const ctx = coinAudioCtxRef.current;
    const buffer = coinBufferRef.current;
    if (!ctx || !buffer) return;
    if (ctx.state === 'suspended') {
      // If we somehow get here before the gesture-driven resume, bail
      // silently rather than queueing playback.
      ctx.resume().catch(() => {});
      return;
    }
    const source = ctx.createBufferSource();
    source.buffer = buffer;
    const gain = ctx.createGain();
    gain.gain.value = 0.5;
    source.connect(gain).connect(ctx.destination);
    source.start(0);
  }, []);
  
  const [showWelcomeOverlay, setShowWelcomeOverlay] = useState(!localStorage.getItem('hasCompletedWelcome'));
  const [showTransitionVideo, setShowTransitionVideo] = useState(false);
  
  useEffect(() => {
    bunnyActionRef.current = bunnyAction;
  }, [bunnyAction]);

  useEffect(() => {
    if (bunnyAction !== 'jump') return;
    const id = window.setTimeout(() => {
      setBunnyAction((a) => (a === 'jump' ? 'idle' : a));
    }, 580);
    return () => clearTimeout(id);
  }, [bunnyAction]);

  useEffect(() => {
    worldInputEnabledRef.current =
      !showWelcomeOverlay &&
      !showTransitionVideo &&
      miniGameState !== 'playing';
  }, [showWelcomeOverlay, showTransitionVideo, miniGameState]);

  const { user, signIn } = useAuth();

  const handleResetGame = useCallback(async () => {
    localStorage.removeItem('selectedAnimalId');
    localStorage.removeItem('petName');
    localStorage.removeItem('hasCompletedWelcome');
    localStorage.removeItem('petProgression');
    localStorage.removeItem('petHunger');
    localStorage.removeItem('petHappiness');
    localStorage.removeItem('unlockedCosmetics');
    localStorage.removeItem('equippedCosmetics');
    localStorage.removeItem('chests');
    localStorage.removeItem('gameProgress');

    if (user) {
      try {
        await deleteDoc(doc(db, 'users_v3', user.uid));
        
        const gameIds = GAME_IDS;
        for (const gId of gameIds) {
          try {
            await deleteDoc(doc(db, 'leaderboards_v3', gId, 'entries', user.uid));
          } catch (e) {
             // Silently ignore if it doesn't exist or errors out individually
          }
        }
      } catch (error) {
        try {
          handleFirestoreError(error, OperationType.DELETE, `users/${user.uid}`, auth);
        } catch (e) {
          console.error(e);
        }
      }
    }

    resetState();
    setSelectedAnimalId('bunny');
    setPetName('');
    setUnlockedCosmetics([]);
    setEquippedCosmetics([]);
    setChests(generateInitialChests());
    setGameProgress({});
    setShowWelcomeOverlay(true);
    setIsStatusOpen(false);
  }, [user, resetState]);

  // Load user data from Firebase when authenticated
  useEffect(() => {
    if (user) {
      const fetchUserData = async () => {
        try {
          const docRef = doc(db, 'users_v3', user.uid);
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
            const data = docSnap.data();
            if (data.selectedAnimalId) {
              setSelectedAnimalId(data.selectedAnimalId);
              localStorage.setItem('selectedAnimalId', data.selectedAnimalId);
            }
            if (data.petName) {
              setPetName(data.petName);
              localStorage.setItem('petName', data.petName);
            }
            if (data.selectedAnimalId || data.petName || data.progression) {
              setShowWelcomeOverlay(false);
              localStorage.setItem('hasCompletedWelcome', 'true');
            }
            if (data.progression) {
               loadState(data.progression);
            }
            if (data.unlockedCosmetics) {
              const parsed = data.unlockedCosmetics as string[];
              const migrated = parsed.map(c => {
                const mapped = MIGRATION_MAP[c] || c;
                if (!COSMETIC_REGISTRY[mapped]) {
                  return mapped.split(' ').slice(1).join(' ') || mapped;
                }
                return mapped;
              });
              const unique = Array.from(new Set(migrated)).filter(c => !c.toLowerCase().includes('bow tie'));
              setUnlockedCosmetics(unique);
              localStorage.setItem('unlockedCosmetics', JSON.stringify(unique));
            }
            if (data.equippedCosmetics) {
              const unique = Array.from(new Set(
                (data.equippedCosmetics as string[])
                  .map(c => MIGRATION_MAP[c] || c)
                  .map(canonicalizeEquippedString)
              )).filter(c => !c.toLowerCase().includes('bow tie'));
              setEquippedCosmetics(unique);
              localStorage.setItem('equippedCosmetics', JSON.stringify(unique));
            }
            if (data.gameProgress) {
              setGameProgress(data.gameProgress);
              localStorage.setItem('gameProgress', JSON.stringify(data.gameProgress));
            }
            if (data.chests) {
              const rehydrated = (data.chests as ChestData[]).map(c => ({
                ...c,
                y: getTerrainHeight(c.x, c.z),
              }));
              setChests(rehydrated);
              localStorage.setItem('chests', JSON.stringify(rehydrated));
            }
          } else {
            // User authenticated but no document exists (e.g. deleted from Firebase)
            // We should clear local storage and reset to a clean state so they get a fresh pet and chests
            localStorage.removeItem('selectedAnimalId');
            localStorage.removeItem('petName');
            localStorage.removeItem('hasCompletedWelcome');
            localStorage.removeItem('petProgression');
            localStorage.removeItem('petHunger');
            localStorage.removeItem('petHappiness');
            localStorage.removeItem('unlockedCosmetics');
            localStorage.removeItem('equippedCosmetics');
            localStorage.removeItem('chests');
            
            resetState();
            setSelectedAnimalId('bunny');
            setPetName('');
            setUnlockedCosmetics([]);
            setEquippedCosmetics([]);
            setChests(generateInitialChests());
            setShowWelcomeOverlay(true);
            setIsStatusOpen(false);
          }
        } catch (error) {
          handleFirestoreError(error, OperationType.GET, `users/${user.uid}`, auth);
        }
      };
      // To prevent overwriting right on load when localStorage conflicts, we load from DB.
      fetchUserData();
    }
  }, [user, loadState]);

  // Persist current state to localStorage and Firebase
  useEffect(() => {
    if (showWelcomeOverlay === false) {
      localStorage.setItem('selectedAnimalId', selectedAnimalId);
      localStorage.setItem('petName', petName);
      localStorage.setItem('hasCompletedWelcome', 'true');
      localStorage.setItem('chests', JSON.stringify(chests));
      localStorage.setItem('gameProgress', JSON.stringify(gameProgress));
      
      if (user) {
        const docRef = doc(db, 'users_v3', user.uid);
        setDoc(docRef, {
          selectedAnimalId,
          petName,
          unlockedCosmetics,
          equippedCosmetics,
          chests,
          gameProgress,
          progression: {
            age: ageInMonths,
            xp: currentXp,
            coins
          }
        }, { merge: true }).catch(error => {
          console.error("Failed to sync progression to Firebase:", error);
        });
      }
    }
  }, [selectedAnimalId, petName, showWelcomeOverlay, ageInMonths, currentXp, coins, unlockedCosmetics, equippedCosmetics, chests, gameProgress, user]);

  useEffect(() => {
    let timeout: NodeJS.Timeout;
    if (showTransitionVideo) {
      // Fallback: if video gets stuck or fails to end, close it after 8 seconds
      timeout = setTimeout(() => {
        setShowTransitionVideo(false);
      }, 8000);
    }
    return () => clearTimeout(timeout);
  }, [showTransitionVideo]);
  const prevAgeRef = useRef(ageInMonths);
  useEffect(() => {
    // Award milestone shirts for every month reached (also back-fills for
    // existing players whose age is loaded from save).
    if (ageInMonths >= 1) {
      const missing: string[] = [];
      for (let m = 1; m <= ageInMonths; m++) {
        const id = `Milestone Shirt ${m}`;
        if (!unlockedCosmetics.includes(id)) missing.push(id);
      }
      if (missing.length > 0) {
        setUnlockedCosmetics(prev => {
          const set = new Set(prev);
          missing.forEach(s => set.add(s));
          const next = Array.from(set);
          localStorage.setItem('unlockedCosmetics', JSON.stringify(next));
          if (user) {
            setDoc(doc(db, 'users_v3', user.uid), { unlockedCosmetics: next }, { merge: true }).catch(e => console.error("Failed to sync milestone shirts", e));
          }
          return next;
        });
      }
    }

    if (ageInMonths > prevAgeRef.current) {
      // Award coins for every milestone month the pet just crossed into. Sized
      // so a player can comfortably afford every shop set just from milestones
      // (4 sets x 100 coins = 400) over the first few months.
      const MILESTONE_COIN_REWARD = 100;
      const monthsGained = ageInMonths - prevAgeRef.current;
      const coinReward = MILESTONE_COIN_REWARD * monthsGained;
      updateCoins(coinReward);

      const earnedShirt = `Month ${ageInMonths} Tee`;
      setGlobalMessage({
        text: "Level Up!",
        subtext: `Your ${petName || selectedAnimalId} is now ${ageInMonths} month${ageInMonths !== 1 ? 's' : ''} old!\nYou earned the ${earnedShirt} and ${coinReward} coins!`,
        primaryActionLabel: "View Status",
        onPrimaryAction: () => {
          setIsStatusOpen(true);
        },
        secondaryActionLabel: "Dismiss",
        onSecondaryAction: () => {},
        showCloseButton: true
      });
    }
    prevAgeRef.current = ageInMonths;
  }, [ageInMonths, petName, selectedAnimalId, unlockedCosmetics, user, updateCoins]);

  const handleNameChange = useCallback(async (newName: string) => {
    setPetName(newName);
    if (user) {
      const gameIds = GAME_IDS;
      for (const gId of gameIds) {
        try {
          const entryRef = doc(db, 'leaderboards_v3', gId, 'entries', user.uid);
          const snap = await getDoc(entryRef);
          if (snap.exists()) {
            await setDoc(entryRef, { playerName: newName }, { merge: true });
          }
        } catch (error) {
          try {
            handleFirestoreError(error, OperationType.WRITE, `leaderboards/${gId}/entries/${user.uid}`, auth);
          } catch (e) {
            console.error(e);
          }
        }
      }
    }
  }, [user]);

  const handleAddXp = useCallback((amount: number) => {
    originalAddXp(amount);
    setXpPopup(prev => ({
      amount: prev.visible ? prev.amount + amount : amount,
      visible: true
    }));
    
    if (xpTimeoutRef.current) {
      clearTimeout(xpTimeoutRef.current);
    }
    
    xpTimeoutRef.current = setTimeout(() => {
      setXpPopup(prev => ({ ...prev, visible: false }));
    }, 2000);
  }, [originalAddXp]);

  // Award 1 XP for every 5 seconds of continuous walking (joystick or tap-to-move).
  useEffect(() => {
    targetPositionRef.current = targetPosition;
  }, [targetPosition]);

  useEffect(() => {
    const interval = setInterval(() => {
      if (miniGameState === 'playing') return;
      if (bunnyActionRef.current === 'sleep') return;
      const isWalking = moveDirRef.current !== null || targetPositionRef.current !== null;
      if (isWalking) {
        handleAddXp(1);
      }
    }, 5000);
    return () => clearInterval(interval);
  }, [handleAddXp, miniGameState]);

  useEffect(() => {
    const creditResult = async (
      gameId: string,
      level: number,
      stars: number,
      score: number
    ) => {
      // Idempotency: drop duplicate credit attempts for the same outcome within 2s.
      const now = Date.now();
      const last = lastCreditedRef.current;
      if (
        last &&
        last.gameId === gameId &&
        last.level === level &&
        last.stars === stars &&
        last.score === score &&
        now - last.ts < 2000
      ) {
        return;
      }
      lastCreditedRef.current = { gameId, level, stars, score, ts: now };

      // XP per star is calibrated so that 2-starring every level of every
      // game (60 stars total) plus the existing first-play and new-HS bonuses
      // delivers ≈53,400 XP — enough to reach the 12-month milestone (51,100
      // XP). See SCORING_GUIDE.md §4.1 for the derivation.
      let xpToAward = stars * 850;

      // Persist per-level stars + unlock next level on any star earned.
      let updatedProgress: Record<string, GameProgress> | null = null;
      if (stars > 0) {
        setGameProgress(prev => {
          const currentProgress = prev[gameId] || { unlockedLevel: 1, stars: {} };
          const currentStars = currentProgress.stars[level] || 0;
          const newStars = Math.max(currentStars, stars);

          let nextLevel = currentProgress.unlockedLevel;
          if (level === currentProgress.unlockedLevel) {
            nextLevel = Math.min(5, level + 1);
          }

          const nextProgress: Record<string, GameProgress> = {
            ...prev,
            [gameId]: {
              unlockedLevel: nextLevel,
              stars: { ...currentProgress.stars, [level]: newStars },
            },
          };

          updatedProgress = nextProgress;
          localStorage.setItem('gameProgress', JSON.stringify(nextProgress));
          if (user) {
            setDoc(doc(db, 'users_v3', user.uid), { gameProgress: nextProgress }, { merge: true }).catch(e =>
              console.error('Failed to sync gameProgress', e)
            );
          }
          return nextProgress;
        });
      }

      // Leaderboard write + bonus XP. Skip empty (0,0) rows entirely.
      if (user && !(score === 0 && stars === 0)) {
        try {
          const entryRef = doc(db, 'leaderboards_v3', gameId, 'entries', user.uid);
          const entrySnap = await getDoc(entryRef);
          const exists = entrySnap.exists();
          const currentHighScore = exists ? (entrySnap.data().score as number) : -1;

          // First-play bonus only when the player actually scored at least 1 star.
          if (!exists && stars > 0) {
            xpToAward += 200;
          } else if (exists && score > currentHighScore) {
            xpToAward += 50;
          }

          // Compute totalStars from the LATEST progress (post-credit). Per
          // SCORING_GUIDE.md §7.1, totalStars on the leaderboard row must
          // always reflect the player's current best stars across L1..L5,
          // even when the new run didn't beat their per-game high score.
          const progressForGame =
            (updatedProgress && updatedProgress[gameId]) ||
            gameProgress[gameId] ||
            { unlockedLevel: 1, stars: {} as Record<number, number> };
          const totalStars = [1, 2, 3, 4, 5].reduce(
            (sum, lv) => sum + (progressForGame.stars[lv] || 0),
            0
          );

          if (score > currentHighScore) {
            // New high score — write/replace the full row.
            await setDoc(entryRef, {
              userId: user.uid,
              gameId,
              score,
              stars,
              totalStars,
              playerName: petName || user.displayName || 'Anonymous Player',
              animalId: selectedAnimalId,
              createdAt: serverTimestamp(),
            });
          } else if (exists) {
            // Score didn't beat the existing high, but the player may have
            // earned new stars on a different level. Sync totalStars (and
            // the player's display info) onto the existing row so leaderboard
            // ranking and the ★N badge stay accurate.
            const prevTotalStars = (entrySnap.data().totalStars as number | undefined) ?? 0;
            const prevPlayerName = entrySnap.data().playerName as string | undefined;
            const prevAnimalId = entrySnap.data().animalId as string | undefined;
            const newPlayerName = petName || user.displayName || 'Anonymous Player';
            const needsStarSync = totalStars !== prevTotalStars;
            const needsIdentitySync =
              prevPlayerName !== newPlayerName || prevAnimalId !== selectedAnimalId;
            if (needsStarSync || needsIdentitySync) {
              await setDoc(
                entryRef,
                {
                  totalStars,
                  playerName: newPlayerName,
                  animalId: selectedAnimalId,
                },
                { merge: true }
              );
            }
          }
        } catch (error) {
          handleFirestoreError(
            error,
            OperationType.WRITE,
            `leaderboards/${gameId}/entries/${user.uid}`,
            auth
          );
        }
      }

      if (xpToAward > 0) handleAddXp(xpToAward);
    };

    const handleMessage = async (event: MessageEvent) => {
      if (event.origin !== window.location.origin) return;
      const msg = event.data;
      if (!msg || typeof msg !== 'object') return;

      // Resolve which game/level this message refers to. Prefer the payload's
      // own gameId/level so legacy senders that race with state updates still
      // credit the correct row.
      const gameId: string | null = msg.gameId || activeGameId;
      const level: number = Number(msg.level) || activeGameLevel;

      if (msg.type === 'LEVEL_RESULT' && gameId) {
        const stars = Math.max(0, Math.min(3, Number(msg.stars) || 0));
        const score = Math.max(0, Math.floor(Number(msg.score) || 0));
        await creditResult(gameId, level, stars, score);
        return;
      }

      if (msg.type === 'EXIT_GAME') {
        setMiniGameState('menu');
        setAutoStartGame(false);
        return;
      }

      if (msg.type === 'NEXT_LEVEL') {
        setActiveGameLevel(prev => Math.min(5, prev + 1));
        setAutoStartGame(true);
        return;
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [handleAddXp, activeGameId, activeGameLevel, gameProgress, user, selectedAnimalId, petName]);

  const handleCoinCollide = useCallback((id: number) => {
    if (collectedCoinsRef.current.has(id)) return;
    
    collectedCoinsRef.current.add(id);
    setCollectedCoins(new Set(collectedCoinsRef.current));
    
    handleAddXp(10);
    updateCoins(1);
    playCoinSfx();
  }, [handleAddXp, updateCoins, playCoinSfx]);

  const handleReachTarget = () => {
    if (activeCarrotId !== null) {
      setBunnyAction('eat');
      setEatenCarrots(prev => {
        const next = new Set(prev);
        next.add(activeCarrotId!);
        return next;
      });
      setActiveCarrotId(null);
      setTimeout(() => {
        setBunnyAction(prev => prev !== 'sleep' ? 'idle' : prev);
      }, 2500);
    } else {
      setTargetPosition(null);
      setBunnyAction('idle');
    }
  };

  const handleChestOpen = useCallback((chestId: number) => {
    const chest = chests.find(c => c.id === chestId);
    if (!chest || chest.opened) return;
    
    setChests(prev => prev.map(c => c.id === chestId ? { ...c, opened: true } : c));
    
    let baseType = chest.cosmetic;
    if (!COSMETIC_REGISTRY[baseType]) {
      baseType = baseType.split(' ').slice(1).join(' ') || baseType;
    }
    
    setUnlockedCosmetics(prev => {
      if (prev.includes(baseType)) return prev;
      
      const next = [...prev, baseType];
      localStorage.setItem('unlockedCosmetics', JSON.stringify(next));
      if (user) {
        setDoc(doc(db, 'users_v3', user.uid), { unlockedCosmetics: next }, { merge: true }).catch(e => console.error("Failed to sync cosmetics", e));
      }
      return next;
    });
    
    setGlobalMessage({
      text: `You found the ${baseType}!`,
      showCloseButton: true,
      onClose: () => {}
    });

    setTimeout(() => {
      setGlobalMessage(null);
      setChests(prev => prev.map(c => c.id === chestId ? { ...c, looted: true } : c));
      
      setBunnyAction('sing');
      handleAddXp(30);
      
      setTimeout(() => {
         setBunnyAction(prev => prev !== 'sleep' ? 'idle' : prev);
      }, 2500);
    }, 2000);
  }, [chests, handleAddXp, user]);

  const applyMoveDirection = useCallback((dir: { x: number; z: number } | null) => {
    if (!dir) {
      moveDirRef.current = null;
      return;
    }
    const action = bunnyActionRef.current;
    if (action === 'sleep') {
      setBunnyAction('wake');
      bunnyActionRef.current = 'wake';
      return;
    }
    if (action !== 'idle') {
      setBunnyAction('idle');
      bunnyActionRef.current = 'idle';
    }
    moveDirRef.current = dir;
  }, []);

  const flushCombinedMoveDir = useCallback(() => {
    const combined = combineMoveDirs(joystickDirRef.current, gamepadDirRef.current);
    applyMoveDirection(combined);
  }, [applyMoveDirection]);

  flushMoveRef.current = flushCombinedMoveDir;

  const onGamepadJump = useCallback(() => {
    if (!worldInputEnabledRef.current) return;
    if (bunnyActionRef.current === 'sleep') return;
    setJumpNonce((n) => n + 1);
    setBunnyAction('jump');
    bunnyActionRef.current = 'jump';
  }, []);

  const onGamepadSleepToggle = useCallback(() => {
    if (!worldInputEnabledRef.current) return;
    const action = bunnyActionRef.current;
    if (action === 'sleep') {
      setBunnyAction('wake');
      bunnyActionRef.current = 'wake';
    } else {
      setBunnyAction('sleep');
      bunnyActionRef.current = 'sleep';
      handleAddXp(5);
    }
  }, [handleAddXp]);

  gamepadAButtonRef.current = onGamepadJump;
  gamepadBButtonRef.current = onGamepadSleepToggle;

  useGamepadWorldInput(
    worldInputEnabledRef,
    gamepadDirRef,
    cameraStickRef,
    flushMoveRef,
    gamepadAButtonRef,
    gamepadBButtonRef
  );

  const handleJoystickMove = useCallback((dir: {x: number, z: number}) => {
    joystickDirRef.current = dir;
    flushCombinedMoveDir();
  }, [flushCombinedMoveDir]);

  const stopDir = useCallback(() => {
    joystickDirRef.current = null;
    flushCombinedMoveDir();
  }, [flushCombinedMoveDir]);

  useEffect(() => {
    if (showWelcomeOverlay || showTransitionVideo) return;

    // Lazily create the ambient audio element exactly once and persist it on
    // a ref so subsequent effects (e.g. mini-game pause/resume) operate on the
    // same instance.
    if (!ambientAudioRef.current) {
      const a = new Audio('/meadow.wav');
      a.loop = true;
      a.volume = 0.3;
      ambientAudioRef.current = a;
    }
    const audio = ambientAudioRef.current;

    // Resume the Web Audio context for coin SFX. This is silent on iOS — it
    // simply transitions the AudioContext from "suspended" to "running" so
    // future buffer-source playback can fire immediately.
    const resumeCoinCtx = () => {
      const ctx = coinAudioCtxRef.current;
      if (ctx && ctx.state === 'suspended') {
        ctx.resume().catch(() => {});
      }
    };

    const playAudio = () => {
      // Skip playback if the tab is hidden, OR if a mini-game is currently
      // active — mini-games have their own audio and the meadow loop should
      // step out of the way.
      if (!document.hidden && miniGameStateRef.current !== 'playing') {
        audio.play().catch(e => console.log("Audio autoplay blocked until user interaction"));
      }
      // The coin SFX context can (and should) be resumed regardless — it's
      // silent and we want it primed for the mini-game itself.
      resumeCoinCtx();
    };
    
    playAudio();
    
    // Add event listeners to play on first interaction if blocked
    window.addEventListener('click', playAudio, { once: true });
    window.addEventListener('touchstart', playAudio, { once: true });
    
    const handleVisibilityChange = () => {
      if (document.hidden) {
        audio.pause();
      } else if (miniGameStateRef.current !== 'playing') {
        audio.play().catch(e => console.log("Audio play blocked on visibility change"));
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      window.removeEventListener('click', playAudio);
      window.removeEventListener('touchstart', playAudio);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [showWelcomeOverlay, showTransitionVideo]);

  // Single source of truth for whether ambient audio should be playing right
  // now. Pauses while a mini-game is active (so its audio takes the stage),
  // while the welcome overlay or transition video are showing, and while the
  // tab is hidden. Resumes otherwise.
  const miniGameStateRef = useRef(miniGameState);
  useEffect(() => {
    miniGameStateRef.current = miniGameState;
    const audio = ambientAudioRef.current;
    if (!audio) return;
    const shouldPlay =
      miniGameState !== 'playing' &&
      !showWelcomeOverlay &&
      !showTransitionVideo &&
      !document.hidden;
    if (shouldPlay) {
      audio.play().catch(() => {});
    } else {
      audio.pause();
    }
  }, [miniGameState, showWelcomeOverlay, showTransitionVideo]);

  const handleBuySet = useCallback((set: CosmeticSet) => {
    const allOwned = set.pieces.every(p => unlockedCosmetics.includes(p));
    if (coins < set.price || allOwned) return;

    updateCoins(-set.price);

    // Unlock every piece in the set (skip duplicates).
    setUnlockedCosmetics(prev => {
      const next = [...prev];
      for (const piece of set.pieces) {
        if (!next.includes(piece)) next.push(piece);
      }
      localStorage.setItem('unlockedCosmetics', JSON.stringify(next));
      if (user) {
        setDoc(doc(db, 'users_v3', user.uid), {
          unlockedCosmetics: next,
          'progression.coins': coins - set.price,
        }, { merge: true }).catch(e => console.error("Failed to sync cosmetics", e));
      }
      return next;
    });

    // Auto-equip the full outfit. Each piece replaces anything currently
    // equipped on the same body part so the set always shows together.
    setEquippedCosmetics(prev => {
      const setPartsByPiece = set.pieces
        .map(p => ({ piece: p, data: getCosmeticData(p) }))
        .filter((x): x is { piece: string; data: NonNullable<ReturnType<typeof getCosmeticData>> } => !!x.data);
      const occupiedParts = new Set(setPartsByPiece.map(x => x.data.part));

      // Drop anything currently equipped in a part the new set will fill.
      const filtered = prev.filter(c => {
        let cBase = c;
        let cData = getCosmeticData(cBase);
        if (!cData) {
          cBase = c.split(' ').slice(1).join(' ') || c;
          cData = getCosmeticData(cBase);
        }
        return cData ? !occupiedParts.has(cData.part) : true;
      });

      const newlyEquipped = setPartsByPiece.map(({ piece, data }) =>
        `${data.colors[0]} ${piece}`
      );
      const next = [...filtered, ...newlyEquipped];

      localStorage.setItem('equippedCosmetics', JSON.stringify(next));
      if (user) {
        setDoc(doc(db, 'users_v3', user.uid), { equippedCosmetics: next }, { merge: true })
          .catch(e => console.error(e));
      }
      return next;
    });

    setGlobalMessage({
      text: `You bought the ${set.name}!`,
      showCloseButton: true,
      onClose: () => {},
    });
    setTimeout(() => setGlobalMessage(null), 2000);
  }, [coins, unlockedCosmetics, updateCoins, user]);

  useEffect(() => {
    if (!user || showWelcomeOverlay) return;
    let mounted = true;
    let slotInterval: NodeJS.Timeout | null = null;

    const attemptJoin = async () => {
      try {
        const allowed = await tryClaimSlot(user.uid);
        if (!mounted) return;
        if (allowed) {
          setWorldIsFull(false);
          if (slotInterval) {
            clearInterval(slotInterval);
            slotInterval = null;
          }
          await publishPresence(user.uid, {
            petName,
            animalId: selectedAnimalId,
            equippedCosmetics
          });
          console.log('[attemptJoin] successfully published presence');
        } else {
          setWorldIsFull(true);
          if (!slotInterval) {
            slotInterval = setInterval(attemptJoin, 15000);
          }
        }
      } catch (err) {
        console.error('[attemptJoin] failed to publish presence:', err);
      }
    };

    attemptJoin();

    return () => {
      mounted = false;
      if (slotInterval) clearInterval(slotInterval);
    };
  }, [user, petName, selectedAnimalId, equippedCosmetics, showWelcomeOverlay]);

  return (
    <div className="fixed inset-0 w-full h-[100dvh] bg-sky-500 overflow-hidden select-none touch-none">
      <FPSMeter />
      {worldIsFull && (
        <div className="absolute top-24 left-1/2 -translate-x-1/2 bg-yellow-500 text-white font-bold px-5 py-3 rounded-2xl shadow-xl z-50 animate-pulse text-center border-2 border-yellow-400">
          World is full right now.<br/>
          <span className="text-xs font-normal">Waiting for an open slot...</span>
        </div>
      )}
      {!showWelcomeOverlay && (
        <>
          <Canvas 
            frameloop={miniGameState === 'playing' ? 'demand' : 'always'}
            shadows={{ type: THREE.PCFSoftShadowMap }} 
            camera={{ position: [0, 7, 13.5], fov: 45, far: 1000 }}
            dpr={[1, 1.5]}
          >
        <fog attach="fog" args={['#0ea5e9', 30, 250]} />
        <CameraController
          bunnyPositionRef={bunnyPositionRef}
          stage={'animal'}
          cameraStickRef={cameraStickRef}
          cameraTouchRef={cameraTouchRef}
          movementBasisRef={movementBasisRef}
        />
        <TouchCameraControls
          cameraTouchRef={cameraTouchRef}
          enabledRef={worldInputEnabledRef}
        />
        <AnimatedSky />
        <ambientLight intensity={0.15} />
        <StaticLight />

        <Suspense fallback={null}>
          <LowPolyEnvironment 
            onGroundClick={(point) => {
              // Tap to move disabled
            }}
            onCarrotClick={(point, id) => {
              if (bunnyAction === 'sleep') {
                setBunnyAction('wake');
                return;
              }
              setTargetPosition(point);
              setActiveCarrotId(id);
              setBunnyAction('idle');
            }}
            onCoinCollide={handleCoinCollide}
            eatenCarrots={eatenCarrots}
            collectedCoins={collectedCoins}
            bunnyPositionRef={bunnyPositionRef}
          />

          <>
            {remotePlayers.map((p) => (
              <RemotePlayer 
                key={p.uid} 
                player={p} 
                onMessageUser={(uid, petName, animalId) => {
                  setPendingDmTarget({ uid, petName, animalId });
                  setIsMessagesOpen(true);
                }} 
              />
            ))}
            {selectedAnimalId === 'unicorn' ? (
              <Unicorn 
                position={[0, 0, 0]} 
                targetPosition={targetPosition}
                moveDirRef={moveDirRef}
                movementBasisRef={movementBasisRef}
                bunnyPositionRef={bunnyPositionRef}
                onReachTarget={handleReachTarget}
                action={bunnyAction}
                jumpNonce={jumpNonce}
                onChat={() => {
                  handleAddXp(5);
                }}
                ageInMonths={ageInMonths}
                obstacles={[
                  ...chests.map(chest => ({ position: new THREE.Vector3(chest.x, getTerrainHeight(chest.x, chest.z), chest.z), radius: 2.0 })),
                  { position: ARCADE_POS, radius: 2.5 }
                ]}
                equippedCosmetics={equippedCosmetics}
              />
            ) : (
              <PinkBunny 
                position={[0, 0, 0]} 
                targetPosition={targetPosition}
                moveDirRef={moveDirRef}
                movementBasisRef={movementBasisRef}
                bunnyPositionRef={bunnyPositionRef}
                onReachTarget={handleReachTarget}
                action={bunnyAction}
                jumpNonce={jumpNonce}
                onChat={() => {
                  handleAddXp(5);
                }}
                ageInMonths={ageInMonths}
                obstacles={[
                  ...chests.map(chest => ({ position: new THREE.Vector3(chest.x, getTerrainHeight(chest.x, chest.z), chest.z), radius: 2.0 })),
                  { position: ARCADE_POS, radius: 2.5 }
                ]}
                equippedCosmetics={equippedCosmetics}
                speciesId={selectedAnimalId}
              />
            )}
            {targetPosition && <TargetIndicator position={targetPosition} />}
            <ArcadeMachine 
              position={ARCADE_POS} 
              rotation={[0, -Math.PI / 6, 0]} 
              scale={[0.75, 0.75, 0.75]}
              onClick={() => {
                setActiveGameId(null);
                setMiniGameState('menu');
              }}
            />
            {chests.map((chest) => (
              <TreasureChest 
                key={`chest-${chest.id}`}
                position={new THREE.Vector3(chest.x, getTerrainHeight(chest.x, chest.z), chest.z)} 
                rotation={[0, (chest.id % 4) * Math.PI / 4, 0]} 
                scale={[0.4, 0.4, 0.4]} 
                isOpen={chest.opened}
                isLooted={chest.looted}
                onOpen={() => handleChestOpen(chest.id)}
              />
            ))}
          </>
        </Suspense>
      </Canvas>

      {/* UI Overlay */}
      <div className="absolute inset-0 pointer-events-none flex justify-center">
          <GlobalMessageOverlay 
            message={globalMessage} 
            onClose={() => setGlobalMessage(null)} 
          />

          <div className="w-full h-full max-w-7xl relative">
            <div className="absolute top-6 left-6 md:top-8 md:left-8 lg:top-10 lg:left-10 z-20 flex flex-row gap-3 pointer-events-auto">
              <button
                type="button"
                onClick={() => setIsStatusOpen(true)}
                aria-label="Open pet profile"
                className={`relative w-12 h-12 md:w-14 md:h-14 bg-white/90 backdrop-blur-sm rounded-full shadow-lg flex items-center justify-center transition-all ${
                  isStatusOpen ? 'ring-2 ring-[#FF6B6B] scale-105' : 'hover:scale-105 active:scale-95'
                }`}
              >
                <User className="w-5 h-5 md:w-6 md:h-6 text-[#FF6B6B]" strokeWidth={2.5} />
              </button>

              {/* Coin Counter */}
              <div className="relative h-12 md:h-14 bg-white/90 backdrop-blur-sm rounded-full shadow-lg flex items-center justify-center px-4 gap-2">
                <div className="w-8 h-8 rounded-full bg-yellow-100 flex items-center justify-center border-2 border-yellow-400">
                  <Coins className="w-4 h-4 md:w-5 md:h-5 text-yellow-600" />
                </div>
                <span className="font-black text-lg md:text-xl text-yellow-600 tracking-tight">{coins.toLocaleString()}</span>
              </div>
            </div>

            {/* XP Popups */}
            <div className="absolute top-6 right-6 md:top-8 md:right-8 lg:top-10 lg:right-10 z-50 flex flex-col items-end gap-2 pointer-events-none">
              <AnimatePresence>
                {xpPopup.visible && (
                  <motion.div
                    key="xp-popup"
                    initial={{ opacity: 0, y: 10, scale: 0.8 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="bg-[#FF6B6B] text-white font-bold px-4 py-2 md:px-5 md:py-2.5 rounded-full shadow-lg text-sm md:text-base tracking-wide"
                  >
                    +{xpPopup.amount} XP
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <div className="pointer-events-auto absolute bottom-8 right-6 md:bottom-12 md:right-8 lg:bottom-16 lg:right-10 flex flex-col items-center gap-1.5 z-50">
              <div className="relative">
                <ActionButton
                  icon={<MessageCircle className="w-6 h-6 md:w-7 md:h-7" strokeWidth={2.5} />}
                  onClick={() => setIsMessagesOpen(true)}
                  active={isMessagesOpen}
                />
                {totalUnread > 0 && (
                  <span
                    className="pointer-events-none absolute -top-1 -right-1 min-w-[20px] h-5 px-1.5 rounded-full bg-red-500 text-white text-[11px] font-black flex items-center justify-center shadow-md border-2 border-white"
                    aria-label={`${totalUnread} unread`}
                  >
                    {totalUnread > 9 ? '9+' : totalUnread}
                  </span>
                )}
              </div>
              <ActionButton
                icon={<Shirt className="w-6 h-6 md:w-7 md:h-7" strokeWidth={2.5} />}
                onClick={() => setIsCosmeticsOpen(true)}
                active={isCosmeticsOpen}
              />
              <ActionButton
                icon={<Gamepad2 className="w-6 h-6 md:w-7 md:h-7" strokeWidth={2.5} />}
                onClick={() => {
                  if (miniGameState === 'inactive') {
                    setActiveGameId(null);
                    setMiniGameState('menu');
                  }
                }}
                active={miniGameState !== 'inactive'}
              />
            </div>

            <div className="pointer-events-auto absolute bottom-8 left-6 md:bottom-12 md:left-8 lg:bottom-16 lg:left-10 z-50 flex flex-row items-start gap-1.5">
              <Joystick onChange={handleJoystickMove} onEnd={stopDir} />
              <ActionButton
                className="w-10 h-10 md:w-12 md:h-12"
                icon={bunnyAction === 'sleep' ? <Sun className="w-5 h-5 md:w-6 md:h-6" strokeWidth={2.5} /> : <Moon className="w-5 h-5 md:w-6 md:h-6" strokeWidth={2.5} />}
                onClick={() => {
                  if (bunnyAction === 'sleep') {
                    setBunnyAction('wake');
                  } else {
                    setBunnyAction('sleep');
                    handleAddXp(5);
                  }
                }}
                active={bunnyAction === 'sleep'}
              />
            </div>
          </div>
        </div>
        </>
      )}

      {miniGameState === 'playing' && activeGameId && (
        <MiniGameIframe
          gameId={activeGameId}
          level={activeGameLevel}
          autoStart={autoStartGame}
        />
      )}

      {isStatusOpen && (
        <PetStatusOverlay
          ageInMonths={ageInMonths}
          currentXp={currentXp}
          requiredXp={requiredXp}
          onClose={() => setIsStatusOpen(false)}
          animalName={petName || selectedAnimalId}
          onNameChange={handleNameChange}
          onResetGame={handleResetGame}
          onOpenLeaderboard={() => {
            setIsStatusOpen(false);
            setIsLeaderboardsOpen(true);
          }}
          onOpenMessages={() => {
            setIsStatusOpen(false);
            setIsMessagesOpen(true);
          }}
          onSelectGame={(gameId) => {
            setIsStatusOpen(false);
            setActiveGameId(gameId);
            setMiniGameState('menu');
          }}
          gameProgress={gameProgress}
          chestsOpened={chests.filter(c => c.opened).length}
          chestsTotal={chests.length}
        />
      )}

      <MiniGameOverlay 
        isOpen={miniGameState === 'menu'} 
        onClose={() => setMiniGameState('inactive')} 
        onStartGame={(gameId, level) => {
          setActiveGameId(gameId);
          setActiveGameLevel(level);
          setAutoStartGame(true);
          setMiniGameState('playing');
        }} 
        ageInMonths={ageInMonths} 
        initialGameId={activeGameId}
        gameProgress={gameProgress}
      />

      <AnimatePresence>
        {showWelcomeOverlay && (
          <SlotMachineOverlay 
            key="welcome" 
            onStartOpening={() => {
              setShowTransitionVideo(true);
            }}
            onComplete={(animalId: string) => {
              setSelectedAnimalId(animalId);
              setShowWelcomeOverlay(false);
            }} 
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showTransitionVideo && (
          <TunnelTransition onComplete={() => setShowTransitionVideo(false)} />
        )}
      </AnimatePresence>

      <NamePromptOverlay 
        show={!showWelcomeOverlay && !showTransitionVideo && !petName}
        onSubmit={(name) => handleNameChange(name)}
      />

      <GlobalLeaderboardsOverlay
        isOpen={isLeaderboardsOpen}
        onClose={() => setIsLeaderboardsOpen(false)}
        onMessageUser={(uid, petName, animalId) => {
          setPendingDmTarget({ uid, petName, animalId });
          setIsLeaderboardsOpen(false);
          setIsMessagesOpen(true);
        }}
      />

      <MessagesOverlay
        isOpen={isMessagesOpen}
        onClose={() => setIsMessagesOpen(false)}
        myPetName={petName || selectedAnimalId}
        myAnimalId={selectedAnimalId}
        openDmWith={pendingDmTarget}
        onDmTargetConsumed={() => setPendingDmTarget(null)}
      />

      <CosmeticsOverlay
        isOpen={isCosmeticsOpen}
        onClose={() => setIsCosmeticsOpen(false)}
        cosmetics={unlockedCosmetics.filter(c => !c.toLowerCase().includes('bow tie'))}
        equippedCosmetics={equippedCosmetics.filter(c => !c.toLowerCase().includes('bow tie'))}
        coins={coins}
        onBuySet={handleBuySet}
        onToggleEquip={(baseName) => {
          setEquippedCosmetics(prev => {
            const data = getCosmeticData(baseName);
            if (!data) return prev;

            const equippedStr = prev.find(c => matchesBaseName(c, baseName));
            let next: string[];

            if (equippedStr) {
              next = prev.filter(c => c !== equippedStr);
            } else {
              // Unequip any other item in the same part category before equipping
              next = prev.filter(c => {
                let cBase = c;
                let cData = getCosmeticData(cBase);
                if (!cData) {
                  cBase = c.split(' ').slice(1).join(' ') || c;
                  cData = getCosmeticData(cBase);
                }
                return cData?.part !== data.part;
              });
              next.push(`${data.colors[0]} ${baseName}`);
            }

            localStorage.setItem('equippedCosmetics', JSON.stringify(next));
            if (user) {
              setDoc(doc(db, 'users_v3', user.uid), { equippedCosmetics: next }, { merge: true }).catch(e => console.error(e));
            }
            return next;
          });
        }}
        onSetColor={(baseName, color) => {
          setEquippedCosmetics(prev => {
            const data = getCosmeticData(baseName);
            if (!data) return prev;
            if (!data.colors.includes(color)) return prev;

            const equippedStr = prev.find(c => matchesBaseName(c, baseName));
            if (!equippedStr) return prev;
            if (equippedStr === `${color} ${baseName}`) return prev;

            const next = prev.filter(c => c !== equippedStr);
            next.push(`${color} ${baseName}`);

            localStorage.setItem('equippedCosmetics', JSON.stringify(next));
            if (user) {
              setDoc(doc(db, 'users_v3', user.uid), { equippedCosmetics: next }, { merge: true }).catch(e => console.error(e));
            }
            return next;
          });
        }}
      />
    </div>
  );
}
