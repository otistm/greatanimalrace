import React, { useMemo, useRef, useState } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';

// Constants and materials
const woodMat = new THREE.MeshStandardMaterial({
    color: '#8b5a2b',
    roughness: 0.8,
    metalness: 0.1,
    flatShading: true
});

const darkWoodMat = new THREE.MeshStandardMaterial({
    color: '#4a2f1d',
    roughness: 0.9,
    metalness: 0.1,
    flatShading: true
});

const metalMat = new THREE.MeshStandardMaterial({
    color: '#71717a',
    roughness: 0.5,
    metalness: 0.8,
    flatShading: true
});

const goldMat = new THREE.MeshStandardMaterial({
    color: '#fbbf24',
    roughness: 0.3,
    metalness: 1.0,
    flatShading: true
});

const velvetMat = new THREE.MeshStandardMaterial({
    color: '#9f1239', 
    roughness: 0.9,
    flatShading: true
});

// Helper for perturbed box
function createBox(w: number, h: number, d: number) {
    const geo = new THREE.BoxGeometry(w, h, d, 2, 2, 2);
    const pos = geo.attributes.position;
    for(let i=0; i<pos.count; i++) {
        pos.setX(i, pos.getX(i) + (Math.random()-0.5)*0.05);
        pos.setY(i, pos.getY(i) + (Math.random()-0.5)*0.05);
        pos.setZ(i, pos.getZ(i) + (Math.random()-0.5)*0.05);
    }
    geo.computeVertexNormals();
    return geo;
}

export function TreasureChest(props: any) {
    const lidPivotRef = useRef<THREE.Group>(null);
    const lightRef = useRef<THREE.PointLight>(null);
    const glowGroupRef = useRef<THREE.Group>(null);
    const { isLooted, onOpen, ...restProps } = props;
    const [localIsOpen, setLocalIsOpen] = useState(false);
    const isOpen = props.isOpen !== undefined ? props.isOpen : localIsOpen;
    
    // Animate state
    const openAmount = useRef(0);
    const lootFade = useRef(1);
    
    // Add opened state
    const handleOpen = (e: any) => {
        e.stopPropagation();
        if (!isOpen) {
            setLocalIsOpen(true);
            if (onOpen) onOpen();
        }
    };

    const { baseGroup, lidGroup, glows, particles } = useMemo(() => {
        const bg = new THREE.Group();
        const lg = new THREE.Group();
        
        const addMesh = (geo: THREE.BufferGeometry, mat: THREE.Material, x: number, y: number, z: number, group: THREE.Group, castShadow=true) => {
            const mesh = new THREE.Mesh(geo, mat);
            mesh.position.set(x, y, z);
            mesh.castShadow = castShadow;
            mesh.receiveShadow = true;
            group.add(mesh);
            return mesh;
        };

        // Wood walls
        addMesh(createBox(10, 0.5, 6), woodMat, 0, 0.25, 0, bg); 
        addMesh(createBox(10, 4.5, 0.5), woodMat, 0, 2.75, 2.75, bg); 
        addMesh(createBox(10, 4.5, 0.5), woodMat, 0, 2.75, -2.75, bg); 
        addMesh(createBox(0.5, 4.5, 5), woodMat, -4.75, 2.75, 0, bg); 
        addMesh(createBox(0.5, 4.5, 5), woodMat, 4.75, 2.75, 0, bg); 

        // Velvet Cushion
        addMesh(createBox(8.8, 0.3, 4.8), velvetMat, 0, 0.65, 0, bg, false);

        // Metal Straps for Base
        const vertStrap = createBox(0.6, 5.1, 0.6);
        addMesh(vertStrap, metalMat, -4.75, 2.5, 2.75, bg); 
        addMesh(vertStrap, metalMat, 4.75, 2.5, 2.75, bg); 
        addMesh(vertStrap, metalMat, -4.75, 2.5, -2.75, bg); 
        addMesh(vertStrap, metalMat, 4.75, 2.5, -2.75, bg); 
        
        const horizStrap1 = createBox(10.2, 0.6, 0.6);
        addMesh(horizStrap1, metalMat, 0, 0.25, 2.75, bg); 
        addMesh(horizStrap1, metalMat, 0, 0.25, -2.75, bg); 
        
        const horizStrap2 = createBox(0.6, 0.6, 6.2);
        addMesh(horizStrap2, metalMat, -4.75, 0.25, 0, bg); 
        addMesh(horizStrap2, metalMat, 4.75, 0.25, 0, bg); 
        
        addMesh(createBox(0.6, 5.1, 0.2), metalMat, 0, 2.5, 3.0, bg); 

        // 2. Build Lid
        const archShape = new THREE.Shape();
        archShape.absarc(0, 0, 3, 0, Math.PI, false); 
        archShape.lineTo(-2.5, 0); 
        archShape.absarc(0, 0, 2.5, Math.PI, 0, true); 
        archShape.lineTo(3, 0);

        const lidGeo = new THREE.ExtrudeGeometry(archShape, { 
            depth: 10, bevelEnabled: true, bevelSegments: 1, steps: 1, bevelSize: 0.05, bevelThickness: 0.05, curveSegments: 5 
        });
        const lpos = lidGeo.attributes.position;
        for(let i=0; i<lpos.count; i++) {
            lpos.setX(i, lpos.getX(i) + (Math.random()-0.5)*0.03);
            lpos.setY(i, lpos.getY(i) + (Math.random()-0.5)*0.03);
        }
        lidGeo.computeVertexNormals();

        const lidMesh = new THREE.Mesh(lidGeo, woodMat);
        lidMesh.castShadow = true;
        lidMesh.receiveShadow = true;
        lidMesh.rotation.y = Math.PI / 2;
        lidMesh.position.set(-5, 0, 3); 
        lg.add(lidMesh);

        const capShape = new THREE.Shape();
        capShape.absarc(0, 0, 3, 0, Math.PI, false);
        const capGeo = new THREE.ExtrudeGeometry(capShape, { depth: 0.5, bevelEnabled: false, curveSegments: 5 });
        
        const leftCap = new THREE.Mesh(capGeo, woodMat);
        leftCap.rotation.y = Math.PI / 2;
        leftCap.position.set(-5.0, 0, 3);
        leftCap.castShadow = true;
        lg.add(leftCap);

        const rightCap = new THREE.Mesh(capGeo, woodMat);
        rightCap.rotation.y = Math.PI / 2;
        rightCap.position.set(4.5, 0, 3);
        rightCap.castShadow = true;
        lg.add(rightCap);

        const strapShape = new THREE.Shape();
        strapShape.absarc(0, 0, 3.1, 0, Math.PI, false);
        strapShape.lineTo(-2.9, 0);
        strapShape.absarc(0, 0, 2.9, Math.PI, 0, true);
        strapShape.lineTo(3.1, 0);
        const strapGeo = new THREE.ExtrudeGeometry(strapShape, { depth: 0.6, bevelEnabled: false, curveSegments: 5 });

        [-4.75, -0.3, 4.15].forEach(xOffset => {
            const strap = new THREE.Mesh(strapGeo, metalMat);
            strap.rotation.y = Math.PI / 2;
            strap.position.set(xOffset, 0, 3);
            strap.castShadow = true;
            lg.add(strap);
        });

        // 3. Lock Mechanism
        const lockGroup = new THREE.Group();
        lockGroup.position.set(0, 0, 6.1); 
        lg.add(lockGroup);

        const lockBody = new THREE.Mesh(new THREE.BoxGeometry(1.6, 1.8, 0.5), goldMat);
        lockBody.position.set(0, -0.5, 0); 
        lockBody.castShadow = true;
        lockGroup.add(lockBody);

        const lockHole = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.15, 0.6, 6), darkWoodMat);
        lockHole.rotation.x = Math.PI / 2;
        lockHole.position.set(0, -0.4, 0.1);
        lockGroup.add(lockHole);

        const lockSlot = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.3, 0.6), darkWoodMat);
        lockSlot.position.set(0, -0.6, 0.1);
        lockGroup.add(lockSlot);

        // 4. Rivets
        const rivetGeo = new THREE.ConeGeometry(0.12, 0.15, 4); 
        const addRivet = (x:number, y:number, z:number, group:THREE.Group, rotX:number, rotY:number, rotZ:number) => {
            const rivet = new THREE.Mesh(rivetGeo, goldMat);
            rivet.position.set(x, y, z);
            rivet.rotation.set(rotX, rotY, rotZ);
            group.add(rivet);
        };

        [-4.75, 4.75].forEach(x => {
            [2.75, -2.75].forEach(z => {
                for(let y=1.2; y<=4; y+=1.4) {
                    addRivet(x, y, z + 0.3 * Math.sign(z), bg, Math.PI/2, 0, 0); 
                    addRivet(x + 0.3 * Math.sign(x), y, z, bg, 0, 0, -Math.PI/2 * Math.sign(x)); 
                }
            });
        });

        [-4.45, 0, 4.45].forEach(x => {
            for(let a=0.2; a<Math.PI-0.1; a+=0.5) {
                const r = 3.15;
                const y = Math.sin(a) * r;
                const z = 3 + Math.cos(a) * r;
                addRivet(x, y, z, lg, a + Math.PI/2, 0, 0);
            }
        });

        const glowsList: THREE.Mesh[] = [];
        const createGlowSphere = (radius: number, color: number, opacity: number) => {
            const mesh = new THREE.Mesh(
                new THREE.IcosahedronGeometry(radius, 2),
                new THREE.MeshBasicMaterial({
                    color: color,
                    transparent: true,
                    opacity: 0,
                    blending: THREE.AdditiveBlending,
                    depthWrite: false
                })
            );
            glowsList.push(mesh);
            return mesh;
        };

        const g1 = createGlowSphere(2.8, 0xff5500, 0.4);
        const g2 = createGlowSphere(1.8, 0xffaa00, 0.7);
        const g3 = createGlowSphere(0.8, 0xffffff, 1.0);

        const partsData: any[] = [];
        const particleGeo = new THREE.OctahedronGeometry(0.12, 0);
        const particleMat = new THREE.MeshBasicMaterial({
            color: 0xffdd66,
            transparent: true,
            opacity: 0,
            blending: THREE.AdditiveBlending
        });

        for(let i=0; i<60; i++) {
            const p = new THREE.Mesh(particleGeo, particleMat);
            p.position.set((Math.random()-0.5)*6, 1 + Math.random()*2, (Math.random()-0.5)*4);
            p.userData = {
                vx: (Math.random()-0.5)*0.04,
                vy: Math.random()*0.06 + 0.02,
                vz: (Math.random()-0.5)*0.04,
                rotX: Math.random()*0.1,
                rotY: Math.random()*0.1,
                life: Math.random(),
                delay: Math.random() * 2 // stagger start
            };
            partsData.push(p);
        }

        // Need to apply matrix updates to let particles show correctly when primitives are grouped
        partsData.forEach(p => p.updateMatrix());
        return { baseGroup: bg, lidGroup: lg, glows: glowsList, particles: partsData };

    }, []);

    useFrame((state, delta) => {
        const time = state.clock.getElapsedTime();
        const targetOpen = isOpen ? 1 : 0;
        openAmount.current += (targetOpen - openAmount.current) * 6.0 * delta;

        // Fade out glows and particles once looted
        if (isLooted) {
            lootFade.current = Math.max(0, lootFade.current - delta * 2.0);
        }

        if (lidPivotRef.current) {
            lidPivotRef.current.rotation.x = -openAmount.current * (Math.PI * 0.6);
        }

        if (lightRef.current) {
            lightRef.current.intensity = openAmount.current * 10 * lootFade.current; // Scaled down pointlight max intensity
        }

        if (glowGroupRef.current) {
            glows.forEach((glow, index) => {
                const targetOpacity = [0.4, 0.7, 1.0][index] * lootFade.current;
                if (glow.material && 'opacity' in glow.material) {
                   (glow.material as any).opacity = openAmount.current * targetOpacity;
                }
                
                const pulse = isOpen ? Math.sin(time * 3 + index) * 0.05 : 0;
                const scale = 0.5 + openAmount.current * 0.5 + pulse;
                glow.scale.setScalar(scale);
                
                glow.rotation.y = time * (0.2 + index*0.1);
                glow.rotation.z = time * 0.1;
            });
        }

        particles.forEach(p => {
            if (openAmount.current > 0.1) {
                if (p.userData.delay > 0) {
                    p.userData.delay -= delta * 5;
                    return;
                }

                p.position.x += p.userData.vx;
                p.position.y += p.userData.vy;
                p.position.z += p.userData.vz;
                
                p.rotation.x += p.userData.rotX;
                p.rotation.y += p.userData.rotY;

                p.userData.life -= delta * 0.5;
                
                if (p.material && 'opacity' in p.material) {
                  (p.material as any).opacity = Math.max(0, p.userData.life * openAmount.current * 1.5 * lootFade.current);
                }

                if (p.userData.life <= 0) {
                    p.position.set((Math.random()-0.5)*5, 1.5, (Math.random()-0.5)*3);
                    p.userData.life = 1.0;
                    p.userData.vy = Math.random()*0.06 + 0.02;
                }
            } else {
                if (p.material && 'opacity' in p.material) {
                  (p.material as any).opacity *= 0.8;
                  if ((p.material as any).opacity < 0.01) {
                    p.position.set((Math.random()-0.5)*5, 1.5, (Math.random()-0.5)*3);
                    p.userData.life = Math.random();
                    p.userData.delay = Math.random();
                  }
                }
            }
        });
    });

    return (
        <group {...restProps} onClick={handleOpen}>
            <primitive object={baseGroup} />
            <group ref={lidPivotRef} position={[0, 5, -3]}>
                <primitive object={lidGroup} />
            </group>

            <pointLight ref={lightRef} color={0xffaa00} intensity={0} distance={25} position={[0, 2.5, 0]} />

            <group ref={glowGroupRef} position={[0, 2.5, 0]}>
                {glows.map((g, i) => <primitive key={`glow-${i}`} object={g} />)}
            </group>

            {particles.map((p, i) => <primitive key={`part-${i}`} object={p} />)}
        </group>
    );
}
