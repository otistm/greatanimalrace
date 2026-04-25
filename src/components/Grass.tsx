import * as THREE from "three"
import React, { useRef, useMemo } from "react"
import { useFrame, useLoader } from "@react-three/fiber"
import { getTerrainHeight, TERRAIN_SEGMENTS } from "../utils/terrain"
import "./GrassMaterial"

function multiplyQuaternions(q1: THREE.Vector4, q2: THREE.Vector4) {
  const x = q1.x * q2.w + q1.y * q2.z - q1.z * q2.y + q1.w * q2.x
  const y = -q1.x * q2.z + q1.y * q2.w + q1.z * q2.x + q1.w * q2.y
  const z = q1.x * q2.y - q1.y * q2.x + q1.z * q2.w + q1.w * q2.z
  const w = -q1.x * q2.x - q1.y * q2.y - q1.z * q2.z + q1.w * q2.w
  return new THREE.Vector4(x, y, z, w)
}

function getAttributeData(instances: number, width: number) {
  const offsets = []
  const orientations = []
  const stretches = []
  const halfRootAngleSin = []
  const halfRootAngleCos = []

  let quaternion_0 = new THREE.Vector4()
  let quaternion_1 = new THREE.Vector4()

  const min = -0.25
  const max = 0.25

  for (let i = 0; i < instances; i++) {
    const offsetX = Math.random() * width - width / 2
    const offsetZ = Math.random() * width - width / 2
    const offsetY = getTerrainHeight(offsetX, offsetZ)
    offsets.push(offsetX, offsetY, offsetZ)

    let angle = Math.PI - Math.random() * (2 * Math.PI)
    halfRootAngleSin.push(Math.sin(0.5 * angle))
    halfRootAngleCos.push(Math.cos(0.5 * angle))

    let RotationAxis = new THREE.Vector3(0, 1, 0)
    let x = RotationAxis.x * Math.sin(angle / 2.0)
    let y = RotationAxis.y * Math.sin(angle / 2.0)
    let z = RotationAxis.z * Math.sin(angle / 2.0)
    let w = Math.cos(angle / 2.0)
    quaternion_0.set(x, y, z, w).normalize()

    angle = Math.random() * (max - min) + min
    RotationAxis = new THREE.Vector3(1, 0, 0)
    x = RotationAxis.x * Math.sin(angle / 2.0)
    y = RotationAxis.y * Math.sin(angle / 2.0)
    z = RotationAxis.z * Math.sin(angle / 2.0)
    w = Math.cos(angle / 2.0)
    quaternion_1.set(x, y, z, w).normalize()

    quaternion_0 = multiplyQuaternions(quaternion_0, quaternion_1)

    angle = Math.random() * (max - min) + min
    RotationAxis = new THREE.Vector3(0, 0, 1)
    x = RotationAxis.x * Math.sin(angle / 2.0)
    y = RotationAxis.y * Math.sin(angle / 2.0)
    z = RotationAxis.z * Math.sin(angle / 2.0)
    w = Math.cos(angle / 2.0)
    quaternion_1.set(x, y, z, w).normalize()

    quaternion_0 = multiplyQuaternions(quaternion_0, quaternion_1)

    orientations.push(quaternion_0.x, quaternion_0.y, quaternion_0.z, quaternion_0.w)

    if (i < instances / 3) {
      stretches.push(Math.random() * 1.8)
    } else {
      stretches.push(Math.random())
    }
  }

  return {
    offsets,
    orientations,
    stretches,
    halfRootAngleCos,
    halfRootAngleSin,
  }
}

export default function Grass({ options = { bW: 0.12, bH: 1, joints: 5 }, width = 100, instances = 50000, ...props }: any) {
  const { bW, bH, joints } = options
  const materialRef = useRef<any>(null)
  
  const [texture, alphaMap] = useLoader(THREE.TextureLoader, [
    "/BvO2-blade_diffuse.jpg",
    "/WGQG-blade_alpha.jpg"
  ])
  
  const attributeData = useMemo(() => getAttributeData(instances, width), [instances, width])
  const baseGeom = useMemo(() => {
    const geom = new THREE.PlaneGeometry(bW, bH, 1, joints).translate(0, bH / 2, 0)
    geom.computeBoundingSphere()
    geom.computeBoundingBox()
    return geom
  }, [options, bW, bH, joints])
  
  const groundGeo = useMemo(() => {
    const geo = new THREE.PlaneGeometry(width, width, TERRAIN_SEGMENTS, TERRAIN_SEGMENTS)
    geo.rotateX(-Math.PI / 2)
    const pos = geo.attributes.position
    const colors = []
    const color = new THREE.Color()
    const colorDark = new THREE.Color('#0d2b0d')
    const colorLight = new THREE.Color('#2d6a2d')
    
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i)
      const z = pos.getZ(i)
      const y = getTerrainHeight(x, z)
      pos.setY(i, y)
      
      const alpha = Math.max(0, Math.min(1, (y + 5) / 30))
      color.lerpColors(colorDark, colorLight, alpha)
      colors.push(color.r, color.g, color.b)
    }
    geo.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3))
    geo.computeVertexNormals()
    geo.computeBoundingSphere()
    geo.computeBoundingBox()
    return geo
  }, [width])
  
  const boundingSphere = useMemo(() => new THREE.Sphere(new THREE.Vector3(0, 0, 0), width * 2), [width])
  
  useFrame((state) => {
    if (materialRef.current) {
      materialRef.current.uniforms.time.value = state.clock.elapsedTime / 4
    }
  })
  
  return (
    <group {...props}>
      <mesh frustumCulled={false}>
        <instancedBufferGeometry index={baseGeom.index} attributes-position={baseGeom.attributes.position} attributes-uv={baseGeom.attributes.uv} boundingSphere={boundingSphere}>
          <instancedBufferAttribute attach="attributes-offset" args={[new Float32Array(attributeData.offsets), 3]} />
          <instancedBufferAttribute attach="attributes-orientation" args={[new Float32Array(attributeData.orientations), 4]} />
          <instancedBufferAttribute attach="attributes-stretch" args={[new Float32Array(attributeData.stretches), 1]} />
          <instancedBufferAttribute attach="attributes-halfRootAngleSin" args={[new Float32Array(attributeData.halfRootAngleSin), 1]} />
          <instancedBufferAttribute attach="attributes-halfRootAngleCos" args={[new Float32Array(attributeData.halfRootAngleCos), 1]} />
        </instancedBufferGeometry>
        {/* @ts-ignore */}
        <grassMaterial ref={materialRef} map={texture} alphaMap={alphaMap} toneMapped={false} />
      </mesh>
      <mesh position={[0, 0, 0]} geometry={groundGeo} receiveShadow>
        <meshStandardMaterial vertexColors roughness={0.9} metalness={0.1} />
      </mesh>
    </group>
  )
}
