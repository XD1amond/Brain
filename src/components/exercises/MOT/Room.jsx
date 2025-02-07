import * as THREE from 'three';
import { useRef } from 'react';

export function Room() {
  // Create edge material
  const edgeMaterial = new THREE.LineBasicMaterial({
    color: '#333333',
    transparent: true,
    opacity: 0.3,
    linewidth: 1
  });

  // Create room geometry (shorter height)
  const roomGeometry = new THREE.BoxGeometry(12, 8, 12);
  const edges = new THREE.EdgesGeometry(roomGeometry);

  return (
    <group>
      {/* Room edges */}
      <lineSegments geometry={edges} material={edgeMaterial} />

      {/* Floor */}
      <mesh position={[0, -4, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[12.001, 12.001]} /> {/* Slightly larger to prevent gaps */}
        <meshPhongMaterial
          color="#111111"
          transparent
          opacity={0.3}
          shininess={0}
        />
      </mesh>

      {/* Back wall */}
      <mesh position={[0, 0, -6]} receiveShadow>
        <planeGeometry args={[12.001, 8.001]} /> {/* Slightly larger to prevent gaps */}
        <meshPhongMaterial
          color="#111111"
          transparent
          opacity={0.3}
          shininess={0}
        />
      </mesh>

      {/* Side walls */}
      <mesh position={[-6, 0, 0]} rotation={[0, Math.PI / 2, 0]} receiveShadow>
        <planeGeometry args={[12.001, 8.001]} /> {/* Slightly larger to prevent gaps */}
        <meshPhongMaterial
          color="#111111"
          transparent
          opacity={0.3}
          shininess={0}
        />
      </mesh>

      <mesh position={[6, 0, 0]} rotation={[0, -Math.PI / 2, 0]} receiveShadow>
        <planeGeometry args={[12.001, 8.001]} /> {/* Slightly larger to prevent gaps */}
        <meshPhongMaterial
          color="#111111"
          transparent
          opacity={0.3}
          shininess={0}
        />
      </mesh>

      {/* Ceiling */}
      <mesh position={[0, 4, 0]} rotation={[Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[12.001, 12.001]} /> {/* Slightly larger to prevent gaps */}
        <meshPhongMaterial
          color="#111111"
          transparent
          opacity={0.3}
          shininess={0}
        />
      </mesh>

      {/* Invisible physics walls */}
      <mesh position={[0, -4, 0]}>
        <boxGeometry args={[12, 0.1, 12]} />
        <meshBasicMaterial visible={false} />
      </mesh>
      <mesh position={[0, 4, 0]}>
        <boxGeometry args={[12, 0.1, 12]} />
        <meshBasicMaterial visible={false} />
      </mesh>
      <mesh position={[0, 0, -6]}>
        <boxGeometry args={[12, 8, 0.1]} />
        <meshBasicMaterial visible={false} />
      </mesh>
      <mesh position={[-6, 0, 0]}>
        <boxGeometry args={[0.1, 8, 12]} />
        <meshBasicMaterial visible={false} />
      </mesh>
      <mesh position={[6, 0, 0]}>
        <boxGeometry args={[0.1, 8, 12]} />
        <meshBasicMaterial visible={false} />
      </mesh>
    </group>
  );
}