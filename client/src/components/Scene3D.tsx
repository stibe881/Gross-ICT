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

function PlexusNetwork() {
  const count = 40;
  const radius = 15;
  const connectionDistance = 5;
  
  const points = useMemo(() => {
    const temp = [];
    for (let i = 0; i < count; i++) {
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      const r = radius * Math.cbrt(Math.random());
      
      temp.push({
        position: new THREE.Vector3(
          r * Math.sin(phi) * Math.cos(theta),
          (Math.random() - 0.5) * 5 - 4, // Flattened height, positioned lower
          r * Math.sin(phi) * Math.sin(theta)
        ),
        velocity: new THREE.Vector3(
          (Math.random() - 0.5) * 0.02,
          (Math.random() - 0.5) * 0.02,
          (Math.random() - 0.5) * 0.02
        )
      });
    }
    return temp;
  }, []);

  const linesGeometry = useRef<THREE.BufferGeometry>(null);
  const pointsRef = useRef<THREE.Points>(null);

  useFrame(() => {
    if (!linesGeometry.current || !pointsRef.current) return;

    // Update points
    points.forEach(point => {
      point.position.add(point.velocity);
      
      // Boundary check
      if (Math.abs(point.position.x) > 15) point.velocity.x *= -1;
      if (point.position.y > -2 || point.position.y < -6) point.velocity.y *= -1;
      if (Math.abs(point.position.z) > 10) point.velocity.z *= -1;
    });

    // Update lines
    const positions = [];
    const pointPositions = [];
    
    for (let i = 0; i < count; i++) {
      pointPositions.push(points[i].position.x, points[i].position.y, points[i].position.z);
      
      for (let j = i + 1; j < count; j++) {
        const dist = points[i].position.distanceTo(points[j].position);
        if (dist < connectionDistance) {
          positions.push(
            points[i].position.x, points[i].position.y, points[i].position.z,
            points[j].position.x, points[j].position.y, points[j].position.z
          );
        }
      }
    }

    linesGeometry.current.setAttribute(
      'position',
      new THREE.Float32BufferAttribute(positions, 3)
    );
    
    pointsRef.current.geometry.setAttribute(
      'position',
      new THREE.Float32BufferAttribute(pointPositions, 3)
    );
  });

  return (
    <group>
      <points ref={pointsRef}>
        <bufferGeometry />
        <pointsMaterial
          size={0.15}
          color="#ffd700"
          transparent
          opacity={0.8}
          sizeAttenuation
        />
      </points>
      <lineSegments>
        <bufferGeometry ref={linesGeometry} />
        <lineBasicMaterial
          color="#4a5568"
          transparent
          opacity={0.15}
          depthWrite={false}
        />
      </lineSegments>
    </group>
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

        <PlexusNetwork />
        <Environment preset="city" />
      </Canvas>
      
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-background/60 to-background pointer-events-none"></div>
    </div>
  );
}
