"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import { Float, Icosahedron, Edges } from "@react-three/drei";
import { useMemo, useRef } from "react";
import * as THREE from "three";

/* ------------------------------------------------------------------ */
/*  Particles — drifting glowing points inside a spherical shell      */
/* ------------------------------------------------------------------ */
function Particles({
  count = 1100,
  radius = 6,
}: {
  count?: number;
  radius?: number;
}) {
  const ref = useRef<THREE.Points>(null);

  const positions = useMemo(() => {
    const arr = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      // bias points toward the outer shell for a "dust cloud" feel
      const r = radius * (0.45 + Math.random() * 0.55);
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(Math.random() * 2 - 1);
      arr[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      arr[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      arr[i * 3 + 2] = r * Math.cos(phi);
    }
    return arr;
  }, [count, radius]);

  useFrame((_, delta) => {
    if (!ref.current) return;
    ref.current.rotation.y += delta * 0.035;
    ref.current.rotation.x += delta * 0.012;
  });

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial
        size={0.04}
        color="#b9f6ca"
        transparent
        opacity={0.85}
        sizeAttenuation
        depthWrite={false}
      />
    </points>
  );
}

/* ------------------------------------------------------------------ */
/*  The glowing icosahedron — wireframe shell with emissive edges      */
/* ------------------------------------------------------------------ */
function CoreShape() {
  const outerRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (!outerRef.current) return;
    const t = state.clock.elapsedTime;
    outerRef.current.rotation.x = t * 0.18;
    outerRef.current.rotation.y = t * 0.24;
  });

  return (
    <group>
      {/* inner solid icosahedron — deep dark with yellow emissive glow */}
      <Icosahedron args={[1.25, 0]} ref={outerRef}>
        <meshStandardMaterial
          color="#0b130e"
          emissive="#ffe600"
          emissiveIntensity={0.35}
          metalness={0.85}
          roughness={0.18}
        />
        <Edges color="#ffe600" threshold={15} />
      </Icosahedron>

      {/* outer wireframe shell — green, slow counter-rotation */}
      <Icosahedron args={[1.55, 1]}>
        <meshBasicMaterial
          color="#00c853"
          wireframe
          transparent
          opacity={0.18}
        />
      </Icosahedron>

      {/* outermost faint halo */}
      <Icosahedron args={[1.85, 0]}>
        <meshBasicMaterial
          color="#b9f6ca"
          wireframe
          transparent
          opacity={0.06}
        />
      </Icosahedron>
    </group>
  );
}

/* ------------------------------------------------------------------ */
/*  HeroScene — full 3D canvas overlay                                 */
/* ------------------------------------------------------------------ */
export function HeroScene({ enabled = true }: { enabled?: boolean }) {
  if (!enabled) return null;

  return (
    <Canvas
      dpr={[1, 1.5]}
      camera={{ position: [0, 0, 5], fov: 45 }}
      gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
      style={{ pointerEvents: "none" }}
    >
      <ambientLight intensity={0.45} />
      <pointLight position={[5, 5, 5]} intensity={1.6} color="#ffe600" />
      <pointLight position={[-5, -3, -5]} intensity={0.7} color="#00c853" />
      <pointLight position={[0, 3, 4]} intensity={0.4} color="#b9f6ca" />

      <Float speed={1.4} rotationIntensity={0.5} floatIntensity={1.1}>
        <CoreShape />
      </Float>

      <Particles count={1100} />
    </Canvas>
  );
}

export default HeroScene;
