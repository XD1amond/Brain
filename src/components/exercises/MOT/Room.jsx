import * as THREE from 'three';
import { useRef, useState, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';

export function Room({ settings }) {
  const [wallColor, setWallColor] = useState('#111111');
  const roomRef = useRef();
  
  // Get room dimensions from settings or use defaults
  const room = settings?.room || { width: 12, height: 8, depth: 12 };
  const width = room.width;
  const height = room.height;
  const depth = room.depth;
  
  // Half dimensions for positioning
  const halfWidth = width / 2;
  const halfHeight = height / 2;
  const halfDepth = depth / 2;
  
  // Edge visibility
  const edgeVisibility = room.edgeVisibility || 0.3;
  
  // Create edge material with configurable opacity
  const edgeMaterial = new THREE.LineBasicMaterial({
    color: '#888888', // Brighter color for better visibility
    transparent: true,
    opacity: edgeVisibility,
    linewidth: 3 // Thicker lines for better visibility
  });

  // Create room geometry with configurable dimensions
  const roomGeometry = new THREE.BoxGeometry(width, height, depth);
  const edges = new THREE.EdgesGeometry(roomGeometry);
  
  // Get game state from settings
  const gameState = settings?.gameState || 'setup';
  
  // Handle wall color changes if distractions are enabled
  useEffect(() => {
    if (!settings?.distractions?.wallColorChanges) {
      setWallColor('#111111');
    }
  }, [settings?.distractions?.wallColorChanges]);
  
  // Random wall color changes during tracking
  useFrame(() => {
    if (settings?.distractions?.wallColorChanges && gameState === 'tracking') {
      if (Math.random() < 0.01) { // 1% chance per frame to change color
        const r = Math.floor(Math.random() * 255);
        const g = Math.floor(Math.random() * 255);
        const b = Math.floor(Math.random() * 255);
        setWallColor(`rgb(${r}, ${g}, ${b})`);
      }
    }
  });

  return (
    <group ref={roomRef}>
      {/* Room edges */}
      <lineSegments geometry={edges} material={edgeMaterial} />

      {/* Floor */}
      <mesh position={[0, -halfHeight, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[width + 0.001, depth + 0.001]} /> {/* Slightly larger to prevent gaps */}
        <meshPhongMaterial
          color={wallColor}
          transparent
          opacity={0.3}
          shininess={0}
        />
      </mesh>

      {/* Back wall */}
      <mesh position={[0, 0, -halfDepth]} receiveShadow>
        <planeGeometry args={[width + 0.001, height + 0.001]} /> {/* Slightly larger to prevent gaps */}
        <meshPhongMaterial
          color={wallColor}
          transparent
          opacity={0.3}
          shininess={0}
        />
      </mesh>

      {/* Side walls */}
      <mesh position={[-halfWidth, 0, 0]} rotation={[0, Math.PI / 2, 0]} receiveShadow>
        <planeGeometry args={[depth + 0.001, height + 0.001]} /> {/* Slightly larger to prevent gaps */}
        <meshPhongMaterial
          color={wallColor}
          transparent
          opacity={0.3}
          shininess={0}
        />
      </mesh>

      <mesh position={[halfWidth, 0, 0]} rotation={[0, -Math.PI / 2, 0]} receiveShadow>
        <planeGeometry args={[depth + 0.001, height + 0.001]} /> {/* Slightly larger to prevent gaps */}
        <meshPhongMaterial
          color={wallColor}
          transparent
          opacity={0.3}
          shininess={0}
        />
      </mesh>

      {/* Ceiling */}
      <mesh position={[0, halfHeight, 0]} rotation={[Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[width + 0.001, depth + 0.001]} /> {/* Slightly larger to prevent gaps */}
        <meshPhongMaterial
          color={wallColor}
          transparent
          opacity={0.3}
          shininess={0}
        />
      </mesh>

      {/* Invisible physics walls */}
      <mesh position={[0, -halfHeight, 0]}>
        <boxGeometry args={[width, 0.1, depth]} />
        <meshBasicMaterial visible={false} />
      </mesh>
      <mesh position={[0, halfHeight, 0]}>
        <boxGeometry args={[width, 0.1, depth]} />
        <meshBasicMaterial visible={false} />
      </mesh>
      <mesh position={[0, 0, -halfDepth]}>
        <boxGeometry args={[width, height, 0.1]} />
        <meshBasicMaterial visible={false} />
      </mesh>
      <mesh position={[-halfWidth, 0, 0]}>
        <boxGeometry args={[0.1, height, depth]} />
        <meshBasicMaterial visible={false} />
      </mesh>
      <mesh position={[halfWidth, 0, 0]}>
        <boxGeometry args={[0.1, height, depth]} />
        <meshBasicMaterial visible={false} />
      </mesh>
    </group>
  );
}