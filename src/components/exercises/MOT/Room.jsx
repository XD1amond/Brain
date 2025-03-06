import * as THREE from 'three';
import { useRef, useState, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';

export function Room({ settings }) {
  // Individual wall colors
  const [floorColor, setFloorColor] = useState('#111111');
  const [ceilingColor, setCeilingColor] = useState('#111111');
  const [backWallColor, setBackWallColor] = useState('#111111');
  const [leftWallColor, setLeftWallColor] = useState('#111111');
  const [rightWallColor, setRightWallColor] = useState('#111111');
  
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
  
  // Reset wall colors when distraction is disabled
  useEffect(() => {
    if (!settings?.distractions?.wallColorChanges) {
      const defaultColor = '#111111';
      setFloorColor(defaultColor);
      setCeilingColor(defaultColor);
      setBackWallColor(defaultColor);
      setLeftWallColor(defaultColor);
      setRightWallColor(defaultColor);
    }
  }, [settings?.distractions?.wallColorChanges]);
  
  // Generate a random color
  const getRandomColor = () => {
    const r = Math.floor(Math.random() * 255);
    const g = Math.floor(Math.random() * 255);
    const b = Math.floor(Math.random() * 255);
    return `rgb(${r}, ${g}, ${b})`;
  };
  
  // Random wall color changes during tracking
  useFrame(() => {
    // Only apply wall color changes during the tracking phase
    if (settings?.distractions?.wallColorChanges && gameState === 'tracking') {
      const changeSeparately = settings?.distractions?.wallColorChangesSeparate;
      const changeInSync = settings?.distractions?.wallColorChangesSync;
      const wallChangeInterval = settings?.distractions?.wallColorChangeInterval || 1000;
      
      // Calculate probability based on frame rate (60fps) and desired interval
      const changeProb = 0.01 * (1000 / wallChangeInterval);
      
      if (Math.random() < changeProb) { // Chance per frame to change color
        if (changeSeparately) {
          if (changeInSync) {
            // Change all walls at once but to different colors
            const shouldChange = Math.random() < 0.5; // 50% chance to trigger a change
            if (shouldChange) {
              setFloorColor(getRandomColor());
              setCeilingColor(getRandomColor());
              setBackWallColor(getRandomColor());
              setLeftWallColor(getRandomColor());
              setRightWallColor(getRandomColor());
            }
          } else {
            // Change walls individually with independent probabilities
            if (Math.random() < 0.2) setFloorColor(getRandomColor());
            if (Math.random() < 0.2) setCeilingColor(getRandomColor());
            if (Math.random() < 0.2) setBackWallColor(getRandomColor());
            if (Math.random() < 0.2) setLeftWallColor(getRandomColor());
            if (Math.random() < 0.2) setRightWallColor(getRandomColor());
          }
        } else {
          // Change all walls to the same color
          const newColor = getRandomColor();
          setFloorColor(newColor);
          setCeilingColor(newColor);
          setBackWallColor(newColor);
          setLeftWallColor(newColor);
          setRightWallColor(newColor);
        }
      }
    } else if (settings?.distractions?.wallColorChanges && gameState !== 'tracking') {
      // Reset wall colors when not in tracking phase
      const defaultColor = '#111111';
      setFloorColor(defaultColor);
      setCeilingColor(defaultColor);
      setBackWallColor(defaultColor);
      setLeftWallColor(defaultColor);
      setRightWallColor(defaultColor);
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
          color={floorColor}
          transparent
          opacity={0.3}
          shininess={0}
        />
      </mesh>

      {/* Back wall */}
      <mesh position={[0, 0, -halfDepth]} receiveShadow>
        <planeGeometry args={[width + 0.001, height + 0.001]} /> {/* Slightly larger to prevent gaps */}
        <meshPhongMaterial
          color={backWallColor}
          transparent
          opacity={0.3}
          shininess={0}
        />
      </mesh>

      {/* Side walls */}
      <mesh position={[-halfWidth, 0, 0]} rotation={[0, Math.PI / 2, 0]} receiveShadow>
        <planeGeometry args={[depth + 0.001, height + 0.001]} /> {/* Slightly larger to prevent gaps */}
        <meshPhongMaterial
          color={leftWallColor}
          transparent
          opacity={0.3}
          shininess={0}
        />
      </mesh>

      <mesh position={[halfWidth, 0, 0]} rotation={[0, -Math.PI / 2, 0]} receiveShadow>
        <planeGeometry args={[depth + 0.001, height + 0.001]} /> {/* Slightly larger to prevent gaps */}
        <meshPhongMaterial
          color={rightWallColor}
          transparent
          opacity={0.3}
          shininess={0}
        />
      </mesh>

      {/* Ceiling */}
      <mesh position={[0, halfHeight, 0]} rotation={[Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[width + 0.001, depth + 0.001]} /> {/* Slightly larger to prevent gaps */}
        <meshPhongMaterial
          color={ceilingColor}
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