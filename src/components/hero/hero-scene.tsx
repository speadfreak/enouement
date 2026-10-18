"use client";

/**
 * HeroScene — the cinematic 3D overlay for the hero.
 *
 * Performance profile (this file is the most expensive thing on the page
 * by a wide margin, so every choice here is deliberate):
 *
 *   • `tier`-driven particle count:   high=1100  medium=500  low/off=0
 *   • `dpr` capped:                   desktop [1, 1.5]   phone = 1
 *   • `frameloop="never"` when:       hero scrolled off-screen OR tab hidden
 *   • 1 ambient + 1 point light only (was 3 lights)
 *   • Particles drawn as a single `THREE.Points` (1 draw call)
 *   • On unmount: every geometry + material + the GL context is disposed
 *     explicitly so we never leak GPU memory between hero views / tier
 *     step-downs / route changes.
 *
 * The Canvas is wrapped in a `div` whose visibility is observed by an
 * IntersectionObserver — when it leaves the viewport (or the document
 * becomes hidden), we flip `frameloop` to "never" so rAF stops entirely
 * instead of redrawing an off-screen canvas.
 */

import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Float, Icosahedron, Edges } from "@react-three/drei";
import { useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import type { PerformanceTier } from "@/hooks/use-performance-tier";

/* ------------------------------------------------------------------ */
/*  Particles                                                          */
/* ------------------------------------------------------------------ */

function particleCountFor(tier: PerformanceTier): number {
  switch (tier) {
    case "high":
      return 1100;
    case "medium":
      return 500;
    case "low":
    case "off":
    default:
      return 0;
  }
}

function Particles({
  count,
  radius = 6,
}: {
  count: number;
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

  if (count === 0) return null;

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
/*  Core shape — wireframe shell with emissive edges                  */
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
/*  Scene cleanup — disposes every GPU resource on unmount             */
/* ------------------------------------------------------------------ */

function SceneCleanup() {
  const { gl, scene } = useThree();
  useEffect(() => {
    // Runs on Canvas unmount (i.e. when the hero 3D tears down on tier
    // step-down, route change, or page exit).
    return () => {
      scene.traverse((obj) => {
        const mesh = obj as THREE.Mesh;
        if (mesh.geometry) mesh.geometry.dispose();
        const mat = mesh.material as
          | THREE.Material
          | THREE.Material[]
          | undefined;
        if (Array.isArray(mat)) {
          mat.forEach((m) => m.dispose());
        } else if (mat) {
          mat.dispose();
        }
      });
      // Drop textures too (the Edges helper and any material maps).
      gl.dispose();
    };
  }, [gl, scene]);
  return null;
}

/* ------------------------------------------------------------------ */
/*  HeroScene                                                          */
/* ------------------------------------------------------------------ */

export function HeroScene({ tier = "high" }: { tier?: PerformanceTier }) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(true); // rAF running?
  const [isPhone, setIsPhone] = useState(false);

  // Phone / coarse-pointer detection — caps dpr to 1 and would otherwise
  // hide the scene (the wrapper is `hidden md:block` so this is mostly
  // defensive for narrow desktop windows).
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 767px)");
    const update = () => setIsPhone(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  // Pause the rAF loop when the hero scrolls off-screen OR the tab is
  // hidden — combined into a single boolean so we never redraw an
  // invisible canvas.
  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;

    const recompute = () => {
      if (document.hidden) {
        setActive(false);
        return;
      }
      const rect = el.getBoundingClientRect();
      const inViewport =
        rect.bottom > 0 && rect.top < window.innerHeight;
      setActive(inViewport);
    };

    recompute();

    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.target === el) recompute();
        }
      },
      { threshold: 0.01 },
    );
    io.observe(el);

    document.addEventListener("visibilitychange", recompute);
    window.addEventListener("resize", recompute);

    return () => {
      io.disconnect();
      document.removeEventListener("visibilitychange", recompute);
      window.removeEventListener("resize", recompute);
    };
  }, []);

  // Low / off tiers never render the Canvas at all — the wrapper stays
  // empty so the poster (slideshow + wordmark + gradient) is the hero.
  if (tier === "low" || tier === "off") return null;

  const count = particleCountFor(tier);
  const dpr: [number, number] | number = isPhone ? 1 : [1, 1.5];

  return (
    <div ref={wrapRef} className="absolute inset-0">
      <Canvas
        frameloop={active ? "always" : "never"}
        dpr={dpr}
        camera={{ position: [0, 0, 5], fov: 45 }}
        gl={{
          antialias: true,
          alpha: true,
          powerPreference: "high-performance",
        }}
        style={{ pointerEvents: "none" }}
      >
        <SceneCleanup />
        {/* 1 ambient + 1 point is enough — was 3 lights before. */}
        <ambientLight intensity={0.45} />
        <pointLight position={[5, 5, 5]} intensity={1.6} color="#ffe600" />

        <Float speed={1.4} rotationIntensity={0.5} floatIntensity={1.1}>
          <CoreShape />
        </Float>

        <Particles count={count} />
      </Canvas>
    </div>
  );
}

export default HeroScene;
