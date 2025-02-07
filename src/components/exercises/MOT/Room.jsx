import * as THREE from 'three';
import { useRef } from 'react';

export function Room() {
  // Create a subtle edge material
  const edgeMaterial = new THREE.LineBasicMaterial({
    color: '#1e90ff',
    transparent: true,
    opacity: 0.2,
    linewidth: 1
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
          color="#111111"
          wireframe
          transparent
          opacity={0.1}
        />
      </mesh>

      {/* Back wall with subtle grid */}
      <mesh position={[0, 0, -5]}>
        <planeGeometry args={[10, 10, 10, 10]} />
        <meshBasicMaterial
          color="#111111"
          wireframe
          transparent
          opacity={0.1}
        />
      </mesh>

      {/* Side walls with subtle grid */}
      <mesh position={[-5, 0, 0]} rotation={[0, Math.PI / 2, 0]}>
        <planeGeometry args={[10, 10, 10, 10]} />
        <meshBasicMaterial
          color="#111111"
          wireframe
          transparent
          opacity={0.1}
        />
      </mesh>

      <mesh position={[5, 0, 0]} rotation={[0, -Math.PI / 2, 0]}>
        <planeGeometry args={[10, 10, 10, 10]} />
        <meshBasicMaterial
          color="#111111"
          wireframe
          transparent
          opacity={0.1}
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
          <sphereGeometry args={[0.1, 16, 16]} />
          <meshBasicMaterial color="#1e90ff" transparent opacity={0.3} />
        </mesh>
      ))}

      {/* Ambient lighting */}
      <ambientLight intensity={0.2} />

      {/* Subtle point lights in corners */}
      {[
        [-4, 4, -4], [4, 4, -4], [-4, 4, 4], [4, 4, 4],
        [-4, -4, -4], [4, -4, -4], [-4, -4, 4], [4, -4, 4]
      ].map((position, index) => (
        <pointLight
          key={index}
          position={position}
          intensity={0.1}
          distance={8}
          decay={2}
        />
      ))}

      {/* Center focus light */}
      <spotLight
        position={[0, 0, 5]}
        angle={Math.PI / 4}
        penumbra={0.5}
        intensity={0.3}
        distance={20}
        decay={2}
      />
    </group>
  );
}