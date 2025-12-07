import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Float, PerspectiveCamera, Environment, Sparkles, Stars } from "@react-three/drei";
import { useRef, useMemo, useState } from "react";
import * as THREE from "three";

function GridFloor() {
  const meshRef = useRef<THREE.Mesh>(null);
  
  useFrame((state) => {
    if (!meshRef.current) return;
    // Slowly move the grid to create a "traveling" effect
    meshRef.current.position.z = (state.clock.getElapsedTime() * 0.5) % 2;
  });

  return (
    <group rotation={[Math.PI / 2, 0, 0]} position={[0, -4, 0]}>
      <gridHelper 
        args={[100, 100, 0xffffff, 0xffffff]} 
        position={[0, 0, 0]} 
        rotation={[-Math.PI / 2, 0, 0]}
      >
        <meshBasicMaterial color="#333" transparent opacity={0.05} />
      </gridHelper>
    </group>
  );
}

function InteractiveParticles({ count = 100 }) {
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
    
    // Rotate entire particle system slowly
    points.current.rotation.y = state.clock.getElapsedTime() * 0.05;
    points.current.rotation.x = state.clock.getElapsedTime() * 0.02;

    // Mouse interaction parallax
    const x = (mouse.x * viewport.width) / 50;
    const y = (mouse.y * viewport.height) / 50;
    points.current.position.x = THREE.MathUtils.lerp(points.current.position.x, x, 0.1);
    points.current.position.y = THREE.MathUtils.lerp(points.current.position.y, y, 0.1);
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

function AbstractShape({ position, color, scale = 1, speed = 1 }: { position: [number, number, number], color: string, scale?: number, speed?: number }) {
  const meshRef = useRef<THREE.Mesh>(null);
  const [hovered, setHover] = useState(false);
  
  useFrame((state) => {
    if (!meshRef.current) return;
    const t = state.clock.getElapsedTime();
    
    // Complex rotation
    meshRef.current.rotation.x = t * 0.2 * speed;
    meshRef.current.rotation.y = t * 0.3 * speed;
    
    // Floating movement
    meshRef.current.position.y = position[1] + Math.sin(t * 0.5 * speed) * 0.3;
    
    // Scale pulse on hover
    const targetScale = hovered ? scale * 1.2 : scale;
    meshRef.current.scale.lerp(new THREE.Vector3(targetScale, targetScale, targetScale), 0.1);
  });

  return (
    <Float speed={2 * speed} rotationIntensity={0.5} floatIntensity={0.5}>
      <mesh 
        ref={meshRef} 
        position={position} 
        scale={scale}
        onPointerOver={() => setHover(true)}
        onPointerOut={() => setHover(false)}
      >
        <icosahedronGeometry args={[1, 1]} />
        <meshPhysicalMaterial 
          color={color} 
          roughness={0.2} 
          metalness={0.8}
          transmission={0.2}
          thickness={1}
          clearcoat={1}
          wireframe={hovered} // Switch to wireframe on hover for "tech" feel
        />
      </mesh>
    </Float>
  );
}

function ConnectionLines() {
  const count = 30;
  const linesRef = useRef<THREE.Group>(null);
  
  const lines = useMemo(() => {
    const temp = [];
    for (let i = 0; i < count; i++) {
      const start = new THREE.Vector3((Math.random() - 0.5) * 15, (Math.random() - 0.5) * 15, (Math.random() - 0.5) * 5);
      const end = new THREE.Vector3((Math.random() - 0.5) * 15, (Math.random() - 0.5) * 15, (Math.random() - 0.5) * 5);
      temp.push({ start, end, speed: Math.random() * 0.5 + 0.1 });
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

export default function Scene3D() {
  return (
    <div className="absolute inset-0 -z-10 h-full w-full">
      <Canvas gl={{ antialias: true, toneMapping: THREE.ACESFilmicToneMapping }} dpr={[1, 2]}>
        <PerspectiveCamera makeDefault position={[0, 0, 12]} fov={45} />
        
        <color attach="background" args={['#050505']} />
        <fog attach="fog" args={['#050505', 5, 25]} />
        
        <ambientLight intensity={0.2} />
        <pointLight position={[10, 10, 10]} intensity={1} color="#ffd700" />
        <pointLight position={[-10, -10, -10]} intensity={0.5} color="#4a5568" />
        <spotLight position={[0, 10, 0]} intensity={0.5} angle={0.5} penumbra={1} />
        
        <group position={[0, 0, 0]}>
          <AbstractShape position={[3, 1, 0]} color="#ffd700" scale={0.8} speed={1.2} />
          <AbstractShape position={[-3, -1, 1]} color="#333" scale={0.6} speed={0.8} />
          <AbstractShape position={[0, 2, -2]} color="#666" scale={0.4} speed={1.5} />
          <AbstractShape position={[-2, 3, -1]} color="#ffd700" scale={0.3} speed={0.5} />
          <AbstractShape position={[2, -2, -1]} color="#444" scale={0.5} speed={1.0} />
          
          <ConnectionLines />
          <InteractiveParticles count={150} />
          <Sparkles count={80} scale={12} size={3} speed={0.8} opacity={0.4} color="#ffd700" />
        </group>

        <GridFloor />
        <Environment preset="city" />
      </Canvas>
      
      {/* Gradient Overlay for better text readability */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-background/60 to-background pointer-events-none"></div>
    </div>
  );
}
