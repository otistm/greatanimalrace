import React, { useRef, useEffect, useState, useMemo } from 'react';
import { useFrame, ThreeEvent } from '@react-three/fiber';
import { Html, Outlines } from '@react-three/drei';
import { motion, AnimatePresence } from 'framer-motion';
import * as THREE from 'three';
import { getTerrainHeight } from '../utils/terrain';
import { CosmeticModel, useCosmeticsNodes } from './cosmetics/CosmeticModel';

export function Unicorn({ 
  position = [0, 0, 0], 
  targetPosition,
  moveDirRef,
  bunnyPositionRef,
  onReachTarget,
  action,
  onChat,
  ageInMonths = 0,
  stamina = 100,
  obstacles = [],
  equippedCosmetics = []
}: { 
  position?: [number, number, number], 
  targetPosition?: THREE.Vector3 | null,
  moveDirRef?: React.MutableRefObject<{x: number, z: number} | null>,
  bunnyPositionRef?: React.MutableRefObject<THREE.Vector3>,
  onReachTarget?: () => void,
  action?: string,
  onChat?: () => void,
  ageInMonths?: number,
  stamina?: number,
  obstacles?: {position: THREE.Vector3, radius: number}[],
  equippedCosmetics?: string[]
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
  const leftEyeRef = useRef<THREE.Mesh>(null);
  const rightEyeRef = useRef<THREE.Mesh>(null);
  const heldCarrotRef = useRef<THREE.Group>(null);
  const biteParticlesRef = useRef<THREE.Group>(null);

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
  }, [action]);

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

    if (leftEyeRef.current && rightEyeRef.current) {
        if (stamina < 30) {
        // Tired eyes (half closed)
        leftEyeRef.current.scale.set(1, 0.5, 1);
        rightEyeRef.current.scale.set(1, 0.5, 1);
        } else {
        // Normal eyes
        leftEyeRef.current.scale.set(1, 1, 1);
        rightEyeRef.current.scale.set(1, 1, 1);
        }
    }

    // Force sleep if stamina is 0
    if (stamina <= 0 && bunnyState.currentAction !== 'sleep') {
      bunnyState.currentAction = 'sleep';
    }

    // Movement Logic
    const moveDir = moveDirRef?.current;
    if (moveDir && stamina > 0) {
        bunnyState.isWalking = true;
        const speed = Math.max(1.0, (stamina / 100) * 4.0);
        const moveDist = speed * delta;
        
        const dir = new THREE.Vector2(moveDir.x, moveDir.z).normalize();
        let nextX = bunnyState.position.x + dir.x * moveDist;
        let nextZ = bunnyState.position.z + dir.y * moveDist;
        
        // Handle obstacle collision
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
    } else if (bunnyState.finalTarget && stamina > 0) {
        const currentPos2D = new THREE.Vector2(bunnyState.position.x, bunnyState.position.z);
        const targetPos2D = new THREE.Vector2(bunnyState.finalTarget.x, bunnyState.finalTarget.z);
        const dist = currentPos2D.distanceTo(targetPos2D);

        if (dist > 0.05) {
        bunnyState.isWalking = true;
        const speed = Math.max(1.0, (stamina / 100) * 4.0);
        const moveDist = Math.min(speed * delta, dist);
        const dir = new THREE.Vector2().subVectors(targetPos2D, currentPos2D).normalize();
        
        let nextX = bunnyState.position.x + dir.x * moveDist;
        let nextZ = bunnyState.position.z + dir.y * moveDist;
        
        // Handle obstacle collision
        for (const obs of obstacles) {
            const dx = nextX - obs.position.x;
            const dz = nextZ - obs.position.z;
            const dist = Math.sqrt(dx*dx + dz*dz);
            if (dist < obs.radius) {
                const fixDir = new THREE.Vector2(dx, dz).normalize();
                nextX = obs.position.x + fixDir.x * obs.radius;
                nextZ = obs.position.z + fixDir.y * obs.radius;
                
                // If we get blocked significantly towards target, we might get stuck in an infinite loop.
                // It's mostly fine for simple avoidance, it will slide along the radius.
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
    
    // Deplete stamina very slightly during active movement (when walking via joystick OR tapping target)
    if (bunnyState.isWalking && Math.random() < 0.1) {
        // Handled in parent for joystick, but for tap-to-move we don't easily have updateStamina here.
        // It's mostly handled now by the joystick movement in App.tsx. 
        // For tap-to-walk, we added a -1 drop upon reaching target in App.tsx.
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
        const walkSpeed = Math.max(5, (stamina / 100) * 20);
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
        const actionDuration = currentAction === 'sing' ? 5.0 : 2.5;

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
            break;
        }
    }

    if (bunnyState.currentAction !== 'eat') {
        if (heldCarrotRef.current) heldCarrotRef.current.visible = false;
        if (biteParticlesRef.current) biteParticlesRef.current.visible = false;
    }

    if (group.current) {
        if (!bunnyState.isWalking && ['sleep', 'play', 'sing'].includes(bunnyState.currentAction)) {
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

  const coat = "#ececf0";
  const gold = "#ffd700";
  const lightBlue = "#e0f7fa";
  const black = "#1a1a1a";
  const pink = "#ffb3c1";
  const pastelPink = "#ffc8dd";

  const { head: headNodes, body: bodyNodes, leftArm: leftArmNodes, rightArm: rightArmNodes, heldLeft: heldLeftNodes, heldRight: heldRightNodes, back: backNodes } = useCosmeticsNodes(equippedCosmetics || [], 'unicorn');

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
        <meshToonMaterial color={coat} />
        <Outlines thickness={0.02} color="black" />
        
        {/* Belly — partial sphere that shares the body's center and
            curvature so the pink chest reads as a region of the silver
            body rather than a stuck-on disc. Mirrors the integrated
            belly approach used for all PinkBunny species. No outline
            of its own; polygonOffset prevents z-fighting with the body. */}
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
            color={pink}
            side={THREE.DoubleSide}
            polygonOffset
            polygonOffsetFactor={-2}
            polygonOffsetUnits={-2}
          />
        </mesh>

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
          <meshToonMaterial color={coat} />
          <Outlines thickness={0.02} color="black" />
        </mesh>

        {/* Horn */}
        <mesh position={[0, 0.75, 0.45]} rotation={[0.6, 0, 0]} castShadow receiveShadow>
            <coneGeometry args={[0.12, 0.5, 16]} />
            <meshToonMaterial color={gold} />
            <Outlines thickness={0.02} color="black" />
        </mesh>
        
        {/* Pastel Pink Mane — horse-style row of soft rounded ellipsoid
            tufts arcing from between the ears down the back of the neck.
            Each tuft tilts further backward as it descends so the mane
            reads as flowing rather than stuck-on. */}
        <group>
            {([
                { pos: [0, 0.62, 0.08],  rotX: 0.45,  scale: 1.0  },
                { pos: [0, 0.72, -0.1],  rotX: 0.05,  scale: 1.15 },
                { pos: [0, 0.65, -0.32], rotX: -0.4,  scale: 1.15 },
                { pos: [0, 0.45, -0.55], rotX: -0.85, scale: 1.05 },
                { pos: [0, 0.18, -0.68], rotX: -1.25, scale: 0.95 },
                { pos: [0, -0.05, -0.7], rotX: -1.6,  scale: 0.85 },
            ] as { pos: [number, number, number]; rotX: number; scale: number }[]).map((t, i) => (
                <mesh
                    key={i}
                    position={t.pos}
                    rotation={[t.rotX, 0, 0]}
                    scale={[t.scale, t.scale * 1.55, t.scale * 0.95]}
                    castShadow
                    receiveShadow
                >
                    <sphereGeometry args={[0.13, 20, 20]} />
                    <meshToonMaterial color={pastelPink} />
                    <Outlines thickness={0.02} color="black" />
                </mesh>
            ))}
        </group>

        {/* Snout — horse-snout style: short rounded muzzle that sits high
            on the face with two soft dark nostrils embedded near the tip. */}
        <mesh position={[0, -0.08, 0.7]} scale={[1.5, 1.4, 1.5]} castShadow receiveShadow>
          <sphereGeometry args={[0.14, 32, 32]} />
          <meshToonMaterial color={coat} />
          <Outlines thickness={0.02} color="black" />
        </mesh>
        <mesh position={[-0.06, -0.11, 0.9]} scale={[1, 1.4, 0.6]} castShadow>
          <sphereGeometry args={[0.025, 16, 16]} />
          <meshToonMaterial color={black} />
        </mesh>
        <mesh position={[0.06, -0.11, 0.9]} scale={[1, 1.4, 0.6]} castShadow>
          <sphereGeometry args={[0.025, 16, 16]} />
          <meshToonMaterial color={black} />
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

        {/* Ears — horse-flap style: tall upright ellipsoids that point UP
            with a softer pink inner cup tucked in front. Mirrors the
            chibi horse ear shape but in the unicorn's silver + pink
            palette. */}
        <group ref={leftEarRef} position={[-0.32, 0.55, 0.02]} rotation={[0, 0, hatCosmetic ? 0.5 : 0.18]}>
          <mesh position={[0, 0.18, 0]} scale={[0.7, 1.5, 0.55]} castShadow receiveShadow>
            <sphereGeometry args={[0.18, 24, 24]} />
            <meshToonMaterial color={coat} />
            <Outlines thickness={0.02} color="black" />
          </mesh>
          <mesh position={[0, 0.18, 0.04]} scale={[0.45, 1.2, 0.25]} castShadow>
            <sphereGeometry args={[0.18, 20, 20]} />
            <meshToonMaterial color={pink} />
          </mesh>
        </group>
        <group ref={rightEarRef} position={[0.32, 0.55, 0.02]} rotation={[0, 0, hatCosmetic ? -0.5 : -0.18]}>
          <mesh position={[0, 0.18, 0]} scale={[0.7, 1.5, 0.55]} castShadow receiveShadow>
            <sphereGeometry args={[0.18, 24, 24]} />
            <meshToonMaterial color={coat} />
            <Outlines thickness={0.02} color="black" />
          </mesh>
          <mesh position={[0, 0.18, 0.04]} scale={[0.45, 1.2, 0.25]} castShadow>
            <sphereGeometry args={[0.18, 20, 20]} />
            <meshToonMaterial color={pink} />
          </mesh>
        </group>

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
            <meshToonMaterial color={coat} />
            <Outlines thickness={0.02} color="black" />
          </mesh>
          {/* Black Hoof */}
          <mesh position={[0, -0.175, 0]} castShadow receiveShadow>
            <sphereGeometry args={[0.151, 16, 16]} />
            <meshToonMaterial color={black} />
          </mesh>
          {/* Sleeve */}
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
            <meshToonMaterial color={coat} />
            <Outlines thickness={0.02} color="black" />
          </mesh>
          {/* Black Hoof */}
          <mesh position={[0, -0.175, 0]} castShadow receiveShadow>
            <sphereGeometry args={[0.151, 16, 16]} />
            <meshToonMaterial color={black} />
          </mesh>
          {/* Sleeve */}
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
        <group position={[0, 0.03, 0]} rotation={[0, 0, 0]}>
          <mesh castShadow receiveShadow>
            <capsuleGeometry args={[0.18, 0.3, 16, 16]} />
            <meshToonMaterial color={coat} />
            <Outlines thickness={0.02} color="black" />
          </mesh>
          {/* Black Hoof */}
          <mesh position={[0, -0.15, 0]} castShadow receiveShadow>
            <sphereGeometry args={[0.181, 16, 16]} />
            <meshToonMaterial color={black} />
          </mesh>
        </group>
      </group>
      <group ref={rightLegRef} position={[0.25, 0.3, 0]}>
        <group position={[0, 0.03, 0]} rotation={[0, 0, 0]}>
          <mesh castShadow receiveShadow>
            <capsuleGeometry args={[0.18, 0.3, 16, 16]} />
            <meshToonMaterial color={coat} />
            <Outlines thickness={0.02} color="black" />
          </mesh>
          {/* Black Hoof */}
          <mesh position={[0, -0.15, 0]} castShadow receiveShadow>
            <sphereGeometry args={[0.181, 16, 16]} />
            <meshToonMaterial color={black} />
          </mesh>
        </group>
      </group>

      {/* Tail — wolf-bushy curl rendered as a chain of overlapping ellipsoid
          blobs along the wolf tail curve. The blobs taper from a wide base
          (hidden inside the body) to a small tip, giving the puffy curled
          look of the chibi wolf/horse tail in a soft pastel pink to match
          the mane. */}
      <group position={[0, 0.45, -0.6]}>
        {([
            { pos: [0, -0.05, 0.18], scale: 0.18 },
            { pos: [0,  0.05, 0.05], scale: 0.16 },
            { pos: [0,  0.13, -0.08], scale: 0.14 },
            { pos: [0,  0.22, -0.17], scale: 0.12 },
            { pos: [0,  0.31, -0.16], scale: 0.10 },
            { pos: [0,  0.36, -0.07], scale: 0.085 },
        ] as { pos: [number, number, number]; scale: number }[]).map((seg, i) => (
            <mesh key={i} position={seg.pos} castShadow receiveShadow>
                <sphereGeometry args={[seg.scale, 16, 16]} />
                <meshToonMaterial color={pastelPink} />
                <Outlines thickness={0.02} color="black" />
            </mesh>
        ))}
      </group>
    </group>
  );
}
