import * as THREE from 'three';
import { useRef } from 'react';

export function Room() {
  // Create a prominent edge material
  const edgeMaterial = new THREE.LineBasicMaterial({
    color: '#3498db',
    transparent: true,
    opacity: 0.6,
    linewidth: 2
  });

  // Create room geometry
  const roomGeometry = new THREE.BoxGeometry(10, 10, 10);
  const edges = new THREE.EdgesGeometry(roomGeometry);

  return (
    <group>
      {/* Room edges */}
      <lineSegments geometry={edges} material={edgeMaterial} />

      {/* Floor with subtle grid */}
      <mesh position={[0, -5, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[10, 10, 10, 10]} />
        <meshBasicMaterial
          color="#3498db"
          wireframe
          transparent
          opacity={0.15}
          emissive="#3498db"
          emissiveIntensity={0.1}
        />
      </mesh>

      {/* Back wall with subtle grid */}
      <mesh position={[0, 0, -5]}>
        <planeGeometry args={[10, 10, 10, 10]} />
        <meshBasicMaterial
          color="#3498db"
          wireframe
          transparent
          opacity={0.15}
          emissive="#3498db"
          emissiveIntensity={0.1}
        />
      </mesh>

      {/* Side walls with subtle grid */}
      <mesh position={[-5, 0, 0]} rotation={[0, Math.PI / 2, 0]}>
        <planeGeometry args={[10, 10, 10, 10]} />
        <meshBasicMaterial
          color="#3498db"
          wireframe
          transparent
          opacity={0.15}
          emissive="#3498db"
          emissiveIntensity={0.1}
        />
      </mesh>

      <mesh position={[5, 0, 0]} rotation={[0, -Math.PI / 2, 0]}>
        <planeGeometry args={[10, 10, 10, 10]} />
        <meshBasicMaterial
          color="#3498db"
          wireframe
          transparent
          opacity={0.15}
          emissive="#3498db"
          emissiveIntensity={0.1}
        />
      </mesh>

      {/* Ceiling with subtle grid */}
      <mesh position={[0, 5, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <planeGeometry args={[10, 10, 10, 10]} />
        <meshBasicMaterial
          color="#111111"
          wireframe
          transparent
          opacity={0.1}
        />
      </mesh>

      {/* Corner edge highlights */}
      {[
        [-5, -5, -5], [5, -5, -5], [-5, 5, -5], [5, 5, -5],
        [-5, -5, 5], [5, -5, 5], [-5, 5, 5], [5, 5, 5]
      ].map((position, index) => (
        <mesh key={index} position={position}>
          <sphereGeometry args={[0.15, 32, 32]} />
          <meshStandardMaterial
            color="#3498db"
            emissive="#3498db"
            emissiveIntensity={0.5}
            transparent
            opacity={0.8}
            metalness={0.9}
            roughness={0.1}
          />
        </mesh>
      ))}

      {/* Enhanced ambient lighting */}
      <ambientLight intensity={0.4} />

      {/* Corner lights with increased intensity */}
      {[
        [-4, 4, -4], [4, 4, -4], [-4, 4, 4], [4, 4, 4],
        [-4, -4, -4], [4, -4, -4], [-4, -4, 4], [4, -4, 4]
      ].map((position, index) => (
        <pointLight
          key={index}
          position={position}
          intensity={0.3}
          distance={12}
          decay={2}
          color="#3498db"
        />
      ))}

      {/* Enhanced center focus light */}
      <spotLight
        position={[0, 0, 10]}
        angle={Math.PI / 3}
        penumbra={0.7}
        intensity={0.6}
        distance={30}
        decay={1.5}
        color="#ffffff"
      />
    </group>
  );
}