import React, { useRef, useState, useEffect, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Float, MeshTransmissionMaterial } from '@react-three/drei';
import * as THREE from 'three';

export function GashaponEgg({ position = [0, 1, 0], onHatch }: { position?: [number, number, number], onHatch: () => void }) {
  const groupRef = useRef<THREE.Group>(null);
  const floatRef = useRef<THREE.Group>(null);
  const topHalfRef = useRef<THREE.Mesh>(null);
  const bottomHalfRef = useRef<THREE.Mesh>(null);
  const ringRef = useRef<THREE.Mesh>(null);
  const lightRef = useRef<THREE.PointLight>(null);
  const particlesRef = useRef<THREE.Group>(null);
  const hasHatchedRef = useRef(false);

  const [isPressing, setIsPressing] = useState(false);
  const [isHatching, setIsHatching] = useState(false);
  const pressProgress = useRef(0);
  const [hatched, setHatched] = useState(false);
  
  const openAudioRef = useRef<HTMLAudioElement | null>(null);

  const particles = useMemo(() => Array.from({ length: 40 }).map(() => ({
    vx: (Math.random() - 0.5) * 6,
    vy: Math.random() * 6 + 2,
    vz: (Math.random() - 0.5) * 6,
    scale: 0.05 + Math.random() * 0.15,
    color: Math.random() > 0.5 ? "#ffd700" : "#ffffff"
  })), []);

  useEffect(() => {
    openAudioRef.current = new Audio('/ball_open.mp3');
  }, []);

  useFrame((state, delta) => {
    if (hatched || hasHatchedRef.current) return;

    if (!isHatching) {
      if (isPressing) {
        pressProgress.current += delta * 0.75; // Takes about 1.33 seconds to hatch
        if (pressProgress.current >= 1) {
          pressProgress.current = 1;
          setIsHatching(true);
          if (openAudioRef.current) {
            openAudioRef.current.currentTime = 0;
            openAudioRef.current.play().catch(err => console.error("Open audio playback failed:", err));
          }
        }
      } else if (pressProgress.current > 0) {
        pressProgress.current -= delta * 2; // Quickly lose progress if let go
        if (pressProgress.current < 0) pressProgress.current = 0;
      }

      if (groupRef.current && pressProgress.current > 0) {
        // Increase shake intensity significantly as progress increases
        const shakeIntensity = pressProgress.current * 0.4;
        groupRef.current.rotation.z = Math.sin(state.clock.elapsedTime * 50) * shakeIntensity;
        groupRef.current.rotation.x = Math.cos(state.clock.elapsedTime * 55) * shakeIntensity;
        
        // Add a pulsing scale effect
        const pulse = Math.sin(state.clock.elapsedTime * 30) * 0.05 * pressProgress.current;
        const scale = 1 + pressProgress.current * 0.15 + pulse;
        groupRef.current.scale.set(scale, scale * 1.2, scale);

        // Increase internal light intensity
        if (lightRef.current) {
          lightRef.current.intensity = pressProgress.current * 8;
        }

        // Make the ring glow brighter
        if (ringRef.current) {
          (ringRef.current.material as THREE.MeshStandardMaterial).emissiveIntensity = 0.8 + pressProgress.current * 3;
        }
      } else if (groupRef.current) {
        groupRef.current.scale.set(1, 1.2, 1);
        groupRef.current.rotation.set(0, 0, 0);
        
        if (lightRef.current) {
          lightRef.current.intensity = 0;
        }
        if (ringRef.current) {
          (ringRef.current.material as THREE.MeshStandardMaterial).emissiveIntensity = 0.8;
        }
      }
      
      // Continuous 360 rotation
      if (floatRef.current) {
        floatRef.current.rotation.y += delta * 0.5;
      }
    }

    if (isHatching) {
      if (topHalfRef.current && bottomHalfRef.current && ringRef.current) {
        topHalfRef.current.position.y += 0.05;
        topHalfRef.current.position.x += 0.02;
        topHalfRef.current.rotation.z -= 0.05;
        (topHalfRef.current.material as THREE.Material).opacity -= 0.02;

        bottomHalfRef.current.position.y -= 0.05;
        bottomHalfRef.current.position.x -= 0.02;
        bottomHalfRef.current.rotation.z += 0.05;
        (bottomHalfRef.current.material as THREE.Material).opacity -= 0.02;

        (ringRef.current.material as THREE.Material).opacity -= 0.05;

        if (particlesRef.current) {
          particlesRef.current.children.forEach((child, i) => {
            const mesh = child as THREE.Mesh;
            const p = particles[i];
            mesh.position.x += p.vx * delta;
            mesh.position.y += p.vy * delta;
            mesh.position.z += p.vz * delta;
            p.vy -= 9.8 * delta; // gravity
            mesh.rotation.x += delta * 5;
            mesh.rotation.y += delta * 5;
            (mesh.material as THREE.Material).opacity -= delta * 1.5;
          });
        }

        if ((topHalfRef.current.material as THREE.Material).opacity <= 0 && !hasHatchedRef.current) {
          hasHatchedRef.current = true;
          setHatched(true);
          onHatch();
        }
      }
    }
  });

  const handlePointerDown = (e: any) => {
    e.stopPropagation();
    setIsPressing(true);
  };

  const handlePointerUp = (e: any) => {
    e.stopPropagation();
    setIsPressing(false);
  };

  if (hatched) return null;

  return (
    <Float speed={2} rotationIntensity={0.5} floatIntensity={2} floatingRange={[-0.2, 0.2]}>
      <group ref={floatRef} position={position}>
        <group 
          ref={groupRef} 
          scale={[1, 1.2, 1]}
          onPointerDown={handlePointerDown}
          onPointerUp={handlePointerUp}
          onPointerOut={(e) => {
            setIsPressing(false);
            document.body.style.cursor = 'auto';
          }}
          onPointerOver={() => document.body.style.cursor = 'pointer'}
        >
          <mesh ref={topHalfRef} castShadow receiveShadow>
            <sphereGeometry args={[1, 64, 64, 0, Math.PI * 2, 0, Math.PI / 2]} />
            <MeshTransmissionMaterial 
              color="#ffd700" 
              resolution={256}
              thickness={0.5}
              roughness={0.1}
              transmission={1}
              ior={1.5}
              chromaticAberration={0.4}
              backside
              transparent
              opacity={1}
            />
          </mesh>
          <mesh ref={bottomHalfRef} castShadow receiveShadow>
            <sphereGeometry args={[1, 64, 64, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2]} />
            <MeshTransmissionMaterial 
              color="#ffcc00" 
              resolution={256}
              thickness={0.5}
              roughness={0.1}
              transmission={1}
              ior={1.5}
              chromaticAberration={0.4}
              backside
              transparent
              opacity={1}
            />
          </mesh>
          <mesh ref={ringRef} castShadow receiveShadow>
            <cylinderGeometry args={[1.02, 1.02, 0.1, 64]} />
            <meshStandardMaterial color="#ffffff" emissive="#ffffff" emissiveIntensity={0.8} metalness={1} roughness={0} transparent opacity={1} />
          </mesh>

          {/* Internal glowing light that brightens when pressed */}
          <pointLight ref={lightRef} color="#ffffff" intensity={0} distance={5} />
          
          {isHatching && (
            <group ref={particlesRef}>
              {particles.map((p, i) => (
                <mesh key={i} scale={p.scale}>
                  <octahedronGeometry args={[1, 0]} />
                  <meshStandardMaterial color={p.color} emissive={p.color} emissiveIntensity={2} transparent opacity={1} />
                </mesh>
              ))}
            </group>
          )}
        </group>
      </group>
    </Float>
  );
}
