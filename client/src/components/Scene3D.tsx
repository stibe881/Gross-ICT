import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Float, PerspectiveCamera, Environment, Sparkles, MeshTransmissionMaterial } from "@react-three/drei";
import { useRef, useMemo, useState } from "react";
import * as THREE from "three";

function GridFloor() {
  const meshRef = useRef<THREE.Mesh>(null);
  
  useFrame((state) => {
    if (!meshRef.current) return;
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

  const Geometry = () => {
    switch(type) {
      case "torus": return <torusKnotGeometry args={[0.6, 0.2, 128, 32]} />;
      case "icosa": return <icosahedronGeometry args={[0.8, 0]} />; // Low poly look
      case "octa": return <octahedronGeometry args={[0.8, 0]} />;
      default: return <boxGeometry />;
    }
  };

  return (
    <Float speed={2 * speed} rotationIntensity={0.5} floatIntensity={0.5}>
      <mesh 
        ref={meshRef} 
        position={position} 
        onPointerOver={() => setHover(true)}
        onPointerOut={() => setHover(false)}
      >
        <Geometry />
        {/* Modern Glass/Metal Material */}
        <MeshTransmissionMaterial
          backside
          samples={4}
          thickness={0.5}
          chromaticAberration={0.1}
          anisotropy={0.1}
          distortion={0.1}
          distortionScale={0.1}
          temporalDistortion={0.1}
          iridescence={1}
          iridescenceIOR={1}
          iridescenceThicknessRange={[0, 1400]}
          roughness={0.2}
          metalness={0.1}
          color={color}
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

export default function Scene3D() {
  return (
    <div className="absolute inset-0 -z-10 h-full w-full">
      <Canvas gl={{ antialias: false, powerPreference: "high-performance" }} dpr={[1, 1.5]}>
        <PerspectiveCamera makeDefault position={[0, 0, 12]} fov={45} />
        
        <color attach="background" args={['#050505']} />
        <fog attach="fog" args={['#050505', 5, 25]} />
        
        <ambientLight intensity={0.5} />
        <pointLight position={[10, 10, 10]} intensity={2} color="#ffd700" />
        <pointLight position={[-10, -10, -10]} intensity={1} color="#4a5568" />
        <spotLight position={[0, 10, 0]} intensity={1} angle={0.5} penumbra={1} />
        
        <group position={[0, 0, 0]}>
          {/* Hero Object - Torus Knot */}
          <ModernShape position={[3, 1, 0]} type="torus" color="#ffd700" scale={1.2} speed={0.8} />
          
          {/* Floating Crystals */}
          <ModernShape position={[-3, -1, 1]} type="icosa" color="#333" scale={0.8} speed={0.6} />
          <ModernShape position={[0, 2, -2]} type="octa" color="#666" scale={0.6} speed={1.2} />
          <ModernShape position={[-2, 3, -1]} type="icosa" color="#ffd700" scale={0.4} speed={0.4} />
          <ModernShape position={[2, -2, -1]} type="torus" color="#444" scale={0.5} speed={0.9} />
          
          <ConnectionLines />
          <InteractiveParticles count={80} />
          <Sparkles count={40} scale={12} size={3} speed={0.4} opacity={0.4} color="#ffd700" />
        </group>

        <GridFloor />
        <Environment preset="city" />
      </Canvas>
      
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-background/60 to-background pointer-events-none"></div>
    </div>
  );
}
