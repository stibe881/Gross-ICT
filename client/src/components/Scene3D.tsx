import { Canvas, useFrame } from "@react-three/fiber";
import { Float, PerspectiveCamera, Environment, Stars, Sparkles } from "@react-three/drei";
import { useRef, useMemo } from "react";
import * as THREE from "three";

function GridFloor() {
  return (
    <gridHelper 
      args={[100, 100, 0xffffff, 0xffffff]} 
      position={[0, -4, 0]} 
      rotation={[0, 0, 0]}
    >
      <meshBasicMaterial color="#333" transparent opacity={0.1} />
    </gridHelper>
  );
}

function AbstractShape({ position, color, scale = 1 }: { position: [number, number, number], color: string, scale?: number }) {
  const meshRef = useRef<THREE.Mesh>(null);
  
  useFrame((state) => {
    if (!meshRef.current) return;
    const t = state.clock.getElapsedTime();
    meshRef.current.rotation.x = t * 0.2;
    meshRef.current.rotation.y = t * 0.1;
    meshRef.current.position.y = position[1] + Math.sin(t * 0.5) * 0.2;
  });

  return (
    <Float speed={2} rotationIntensity={0.5} floatIntensity={0.5}>
      <mesh ref={meshRef} position={position} scale={scale}>
        <icosahedronGeometry args={[1, 0]} />
        <meshPhysicalMaterial 
          color={color} 
          roughness={0.1} 
          metalness={0.8}
          transmission={0.5}
          thickness={2}
          clearcoat={1}
        />
      </mesh>
    </Float>
  );
}

function ConnectionLines() {
  const count = 20;
  const lines = useMemo(() => {
    const temp = [];
    for (let i = 0; i < count; i++) {
      const start = new THREE.Vector3((Math.random() - 0.5) * 10, (Math.random() - 0.5) * 10, (Math.random() - 0.5) * 5);
      const end = new THREE.Vector3((Math.random() - 0.5) * 10, (Math.random() - 0.5) * 10, (Math.random() - 0.5) * 5);
      temp.push({ start, end });
    }
    return temp;
  }, []);

  return (
    <group>
      {lines.map((line, i) => {
        const geometry = new THREE.BufferGeometry().setFromPoints([line.start, line.end]);
        return (
          <primitive key={i} object={new THREE.Line(geometry, new THREE.LineBasicMaterial({ color: "#ffffff", transparent: true, opacity: 0.05 }))} />
        );
      })}
    </group>
  );
}

export default function Scene3D() {
  return (
    <div className="absolute inset-0 -z-10 h-full w-full pointer-events-none">
      <Canvas gl={{ antialias: true, toneMapping: THREE.ACESFilmicToneMapping }}>
        <PerspectiveCamera makeDefault position={[0, 0, 12]} fov={45} />
        
        <color attach="background" args={['#050505']} />
        <fog attach="fog" args={['#050505', 5, 20]} />
        
        <ambientLight intensity={0.2} />
        <pointLight position={[10, 10, 10]} intensity={1} color="#ffd700" />
        <pointLight position={[-10, -10, -10]} intensity={0.5} color="#4a5568" />
        
        <group position={[0, 0, 0]}>
          <AbstractShape position={[3, 1, 0]} color="#ffd700" scale={0.8} />
          <AbstractShape position={[-3, -1, 1]} color="#333" scale={0.6} />
          <AbstractShape position={[0, 2, -2]} color="#666" scale={0.4} />
          
          <ConnectionLines />
          <Sparkles count={50} scale={10} size={2} speed={0.4} opacity={0.2} color="#ffd700" />
        </group>

        <GridFloor />
        <Environment preset="city" />
      </Canvas>
      
      {/* Gradient Overlay for better text readability */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-background/50 to-background pointer-events-none"></div>
    </div>
  );
}
