import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Float, PerspectiveCamera, Environment, Sparkles } from "@react-three/drei";
import { useRef, useMemo, useState } from "react";
import * as THREE from "three";

function ModernShape({ position, type = "torus", color, scale = 1, speed = 1 }: { position: [number, number, number], type?: "torus" | "icosa" | "octa", color: string, scale?: number, speed?: number }) {
  const meshRef = useRef<THREE.Mesh>(null);
  const [hovered, setHover] = useState(false);
  
  useFrame((state) => {
    if (!meshRef.current) return;
    const t = state.clock.getElapsedTime();
    
    meshRef.current.rotation.x = t * 0.2 * speed;
    meshRef.current.rotation.y = t * 0.3 * speed;
    
    const targetScale = hovered ? scale * 1.1 : scale;
    meshRef.current.scale.lerp(new THREE.Vector3(targetScale, targetScale, targetScale), 0.1);
  });

  return (
    <Float speed={2 * speed} rotationIntensity={0.5} floatIntensity={0.5}>
      <mesh 
        ref={meshRef} 
        position={position} 
        onPointerOver={() => setHover(true)}
        onPointerOut={() => setHover(false)}
      >
        {type === "torus" && <torusKnotGeometry args={[0.6, 0.2, 64, 16]} />}
        {type === "icosa" && <icosahedronGeometry args={[0.8, 0]} />}
        {type === "octa" && <octahedronGeometry args={[0.8, 0]} />}
        {/* Optimized Metal Material */}
        <meshStandardMaterial
          roughness={0.2}
          metalness={0.8}
          color={color}
          emissive={color}
          emissiveIntensity={0.2}
        />
      </mesh>
    </Float>
  );
}

function OrganicFlow() {
  const count = 150;
  const pointsRef = useRef<THREE.Points>(null);
  
  const particles = useMemo(() => {
    const temp = [];
    for (let i = 0; i < count; i++) {
      const x = (Math.random() - 0.5) * 30;
      const z = (Math.random() - 0.5) * 20;
      const y = (Math.random() - 0.5) * 10;
      const speed = 0.2 + Math.random() * 0.5;
      const offset = Math.random() * Math.PI * 2;
      
      temp.push({ x, y, z, speed, offset, originalY: y });
    }
    return temp;
  }, []);

  useFrame((state) => {
    if (!pointsRef.current) return;
    
    const positions = pointsRef.current.geometry.attributes.position.array as Float32Array;
    const t = state.clock.getElapsedTime();
    
    for (let i = 0; i < count; i++) {
      const p = particles[i];
      
      // Organic wave motion
      const y = p.originalY + Math.sin(t * p.speed + p.offset + p.x * 0.2) * 1.5;
      
      // Gentle drift
      let x = p.x + Math.cos(t * 0.1 + p.offset) * 0.5;
      
      positions[i * 3] = x;
      positions[i * 3 + 1] = y;
      positions[i * 3 + 2] = p.z;
    }
    
    pointsRef.current.geometry.attributes.position.needsUpdate = true;
  });

  const initialPositions = useMemo(() => {
    const pos = new Float32Array(count * 3);
    particles.forEach((p, i) => {
      pos[i * 3] = p.x;
      pos[i * 3 + 1] = p.y;
      pos[i * 3 + 2] = p.z;
    });
    return pos;
  }, [particles]);

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={count}
          array={initialPositions}
          itemSize={3}
          args={[initialPositions, 3]}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.1}
        color="#ffd700"
        transparent
        opacity={0.6}
        sizeAttenuation
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
}

function ScrollRig({ children }: { children: React.ReactNode }) {
  const group = useRef<THREE.Group>(null);
  
  useFrame((state) => {
    if (!group.current) return;
    
    const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
    const scrollProgress = maxScroll > 0 ? window.scrollY / maxScroll : 0;
    
    group.current.rotation.y = THREE.MathUtils.lerp(group.current.rotation.y, scrollProgress * Math.PI * 2, 0.05);
    group.current.position.y = THREE.MathUtils.lerp(group.current.position.y, scrollProgress * 2, 0.05);
  });

  return <group ref={group}>{children}</group>;
}

export default function Scene3D() {
  return (
    <div className="absolute inset-0 -z-10 h-full w-full">
      <Canvas gl={{ antialias: false }} dpr={[1, 1]}>
        <PerspectiveCamera makeDefault position={[0, 0, 12]} fov={45} />
        
        <color attach="background" args={['#050505']} />
        <fog attach="fog" args={['#050505', 5, 25]} />
        
        <ambientLight intensity={0.5} />
        <pointLight position={[10, 10, 10]} intensity={2} color="#ffd700" />
        <pointLight position={[-10, -10, -10]} intensity={1} color="#4a5568" />
        <spotLight position={[0, 10, 0]} intensity={1} angle={0.5} penumbra={1} />
        
        <ScrollRig>
          <group position={[0, 0, 0]}>
            {/* Hero Object - Torus Knot */}
            <ModernShape position={[3, 1, 0]} type="torus" color="#ffd700" scale={1.2} speed={0.8} />
            
            {/* Floating Crystals */}
            <ModernShape position={[-3, -1, 1]} type="icosa" color="#333" scale={0.8} speed={0.6} />
            <ModernShape position={[0, 2, -2]} type="octa" color="#666" scale={0.6} speed={1.2} />
            <ModernShape position={[-2, 3, -1]} type="icosa" color="#ffd700" scale={0.4} speed={0.4} />
            <ModernShape position={[2, -2, -1]} type="torus" color="#444" scale={0.5} speed={0.9} />
            
            <Sparkles count={30} scale={12} size={3} speed={0.4} opacity={0.4} color="#ffd700" />
          </group>
        </ScrollRig>

        <OrganicFlow />
        <Environment preset="city" />
      </Canvas>
      
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-background/60 to-background pointer-events-none"></div>
    </div>
  );
}
