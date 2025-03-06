import { useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Text } from '@react-three/drei';

// Individual number label that follows its ball
function NumberLabel({ ball, index }) {
  const { camera } = useThree();
  const groupRef = useRef();
  const ballRef = useRef(ball);
  
  // Update the ball reference when it changes
  if (ball !== ballRef.current) {
    ballRef.current = ball;
  }
  
  // Update position every frame to follow the ball
  useFrame(({ scene }) => {
    if (!groupRef.current) return;
    
    // Find the actual ball mesh in the scene
    const ballMesh = scene.getObjectByProperty('uuid', `ball-${index}`);
    
    if (ballMesh) {
      // Get the world position of the ball
      const worldPos = ballMesh.getWorldPosition(groupRef.current.position.clone());
      
      // Update the label position to match the ball
      groupRef.current.position.copy(worldPos);
      
      // Make the label face the camera
      groupRef.current.lookAt(camera.position);
    } else {
      // Fallback to using the position from the ball data
      const ballPosition = ballRef.current.position;
      if (ballPosition) {
        groupRef.current.position.set(
          ballPosition[0],
          ballPosition[1],
          ballPosition[2]
        );
      }
    }
  });
  
  return (
    <group ref={groupRef}>
      {/* Background circle for better visibility */}
      <mesh position={[0, 0, 0.46]}>
        <circleGeometry args={[0.2, 32]} />
        <meshBasicMaterial color="#000000" opacity={0.8} transparent />
      </mesh>
      {/* Number text */}
      <Text
        position={[0, 0, 0.47]}
        fontSize={0.3}
        color="#ffffff"
        anchorX="center"
        anchorY="middle"
        renderOrder={1000}
        depthTest={false}
      >
        {(index + 1).toString()}
      </Text>
    </group>
  );
}

// Main component that renders number labels
export function NumberLabels({ balls, gameState, showingResults }) {
  // Only render in selection phase and not showing results
  if (gameState !== 'selection' || showingResults) return null;
  
  return (
    <>
      {balls.slice(0, 8).map((ball, index) => (
        <NumberLabel
          key={index}
          ball={ball}
          index={index}
        />
      ))}
    </>
  );
}