import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Float, PerspectiveCamera, Environment, Sparkles } from "@react-three/drei";
// Post-processing removed for stability
// import { EffectComposer, Bloom, ChromaticAberration, Noise, Vignette } from '@react-three/postprocessing';
import { useRef, useMemo, useState } from "react";
import * as THREE from "three";

function NetworkFloor() {
  const groupRef = useRef<THREE.Group>(null);
  
  // Generate random nodes for the network floor
  const nodes = useMemo(() => {
    const temp = [];
    for (let i = 0; i < 50; i++) {
      temp.push({
        x: (Math.random() - 0.5) * 40,
        z: (Math.random() - 0.5) * 20,
        size: Math.random() * 0.1 + 0.05
      });
    }
    return temp;
  }, []);

  useFrame((state) => {
    if (!groupRef.current) return;
    // Slowly rotate the floor for dynamic effect
    groupRef.current.rotation.y = state.clock.getElapsedTime() * 0.05;
  });

  return (
    <group position={[0, -4, 0]} rotation={[0.1, 0, 0]}>
      <group ref={groupRef}>
        {/* Network Nodes */}
        {nodes.map((node, i) => (
          <mesh key={i} position={[node.x, 0, node.z]}>
            <sphereGeometry args={[node.size, 8, 8]} />
            <meshBasicMaterial color="#333" transparent opacity={0.4} />
          </mesh>
        ))}
        
        {/* Connecting Lines */}
        <gridHelper 
          args={[60, 20, 0x222222, 0x111111]} 
          position={[0, -0.1, 0]} 
        />
        
        {/* Digital Horizon Glow */}
        <mesh position={[0, 0, -15]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[60, 10]} />
          <meshBasicMaterial color="#000" transparent opacity={0.8} />
        </mesh>
      </group>
    </group>
  );
}

function InteractiveParticles({ count = 60 }) {
  const { mouse, viewport } = useThree();
  const points = useRef<THREE.Points>(null);

  const particlesPosition = useMemo(() => {
    const positions = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 20;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 20;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 10;
    }
    return positions;
  }, [count]);

  useFrame((state) => {
    if (!points.current) return;
    
    points.current.rotation.y = state.clock.getElapsedTime() * 0.05;
    points.current.rotation.x = state.clock.getElapsedTime() * 0.02;

    const x = (mouse.x * viewport.width) / 80;
    const y = (mouse.y * viewport.height) / 80;
    points.current.position.x += (x - points.current.position.x) * 0.05;
    points.current.position.y += (y - points.current.position.y) * 0.05;
  });

  return (
    <points ref={points}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={particlesPosition.length / 3}
          array={particlesPosition}
          itemSize={3}
          args={[particlesPosition, 3]}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.05}
        color="#ffd700"
        sizeAttenuation={true}
        transparent
        opacity={0.6}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
}

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

function ConnectionLines() {
  const count = 20; // Reduced for performance
  const linesRef = useRef<THREE.Group>(null);
  
  const lines = useMemo(() => {
    const temp = [];
    for (let i = 0; i < count; i++) {
      const start = new THREE.Vector3((Math.random() - 0.5) * 15, (Math.random() - 0.5) * 15, (Math.random() - 0.5) * 5);
      const end = new THREE.Vector3((Math.random() - 0.5) * 15, (Math.random() - 0.5) * 15, (Math.random() - 0.5) * 5);
      temp.push({ start, end });
    }
    return temp;
  }, []);

  useFrame((state) => {
    if (!linesRef.current) return;
    linesRef.current.rotation.y = state.clock.getElapsedTime() * 0.02;
  });

  return (
    <group ref={linesRef}>
      {lines.map((line, i) => {
        const geometry = new THREE.BufferGeometry().setFromPoints([line.start, line.end]);
        return (
          <primitive key={i} object={new THREE.Line(geometry, new THREE.LineBasicMaterial({ color: "#ffffff", transparent: true, opacity: 0.03 }))} />
        );
      })}
    </group>
  );
}

function ScrollRig({ children }: { children: React.ReactNode }) {
  const group = useRef<THREE.Group>(null);
  
  useFrame((state) => {
    if (!group.current) return;
    
    // Calculate scroll progress directly from window to avoid ScrollControls conflict
    // Using a safe fallback if document is not ready
    const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
    const scrollProgress = maxScroll > 0 ? window.scrollY / maxScroll : 0;
    
    // Smooth rotation using dampening
    // We use a smaller lerp factor for smoother movement
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
            
            <ConnectionLines />
            <InteractiveParticles count={60} />
            <Sparkles count={30} scale={12} size={3} speed={0.4} opacity={0.4} color="#ffd700" />
          </group>
        </ScrollRig>

        <NetworkFloor />
        <Environment preset="city" />
        
        {/* Post-processing disabled for stability */}
      </Canvas>
      
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-background/60 to-background pointer-events-none"></div>
    </div>
  );
}
