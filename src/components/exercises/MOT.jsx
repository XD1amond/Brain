import { useState, useRef, useEffect, useMemo } from 'react';
import { HelpButton } from '@/components/HelpButton';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { PerspectiveCamera, Environment, Effects, Text } from '@react-three/drei';
import { Physics, useSphere } from '@react-three/cannon';
import { motion, AnimatePresence } from 'framer-motion';
import * as THREE from 'three';
import { cn } from '@/lib/utils';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { getTodayDate } from '@/lib/dateUtils';
import { Room } from './MOT/Room';
import { Settings } from './MOT/Settings';
import { NumberLabels } from './MOT/NumberLabels';
import { ImprovedAnaglyphEffect } from './MOT/ImprovedAnaglyphEffect';

function Ball({
  position,
  isHighlighted,
  isSelectable,
  onClick,
  velocity,
  gameState,
  isSelected,
  showingResults,
  wasTarget,
  settings,
  index,
  highlightedBallIndex
}) {
  // Get game state from settings if not provided directly
  const currentGameState = settings?.gameState || gameState;
  
  // Get physics settings
  const physics = settings.physics || {
    ballDensity: 1,
    minSpeed: 5,
    maxSpeed: 10,
    collisionEnabled: true,
    movementPattern: 'regular',
    jitterIntensity: 5
  };
  
  // Get distractions settings
  const distractions = settings.distractions || {
    colorChanges: false,
    sizeChanges: false
  };
  
  // State for ball appearance changes
  const [ballColor, setBallColor] = useState('#ffffff');
  const [ballSize, setBallSize] = useState(0.45);
  const defaultSize = 0.45;
  
  // Calculate actual velocity based on speed setting
  // Use the single speed setting if available, otherwise fall back to min/max for backward compatibility
  const actualVelocity = velocity > 0
    ? (physics.speed || velocity)
    : 0;
  
  // Set up physics with configurable density
  const [ref, api] = useSphere(() => ({
    mass: physics.ballDensity,
    position,
    args: [ballSize],
    linearDamping: 0.31,
    angularDamping: 0.31,
    // Use collisionResponse to properly enable/disable collisions
    collisionResponse: physics.collisionEnabled,
    // Set collisionFilterGroup and collisionFilterMask to disable collisions completely when not enabled
    // When collisions are disabled, use a unique group ID for each ball to prevent collisions
    collisionFilterGroup: physics.collisionEnabled ? 1 : index + 100, // Unique group when disabled
    collisionFilterMask: physics.collisionEnabled ? 1 : 0, // No mask when disabled
    fixedRotation: true,
    material: {
      friction: 0,
      restitution: 1
    },
    sleepTimeLimit: 0.1,
    allowSleep: false
  }));
  
  // Handle ball movement based on movement pattern
  useEffect(() => {
    if (currentGameState === 'tracking' && actualVelocity > 0) {
      // Initial velocity
      const angle = Math.random() * Math.PI * 2;
      const elevation = (Math.random() - 0.5) * Math.PI;
      const speed = actualVelocity * (0.8 + Math.random() * 0.4);
      api.velocity.set(
        Math.cos(angle) * Math.cos(elevation) * speed,
        Math.sin(elevation) * speed,
        Math.sin(angle) * Math.cos(elevation) * speed
      );
      
      // Different movement patterns
      let interval;
      
      if (physics.movementPattern === 'regular') {
        // Regular pattern - no random direction changes
        // Ensure we don't change direction at all for regular movement
        // Just maintain the initial velocity throughout tracking
      } else if (physics.movementPattern === 'globalJitter') {
        // Global jitter - all balls change direction simultaneously
        // This is handled in the Scene component
      } else if (physics.movementPattern === 'individualJitter') {
        // Individual jitter - each ball changes independently
        // Use the specific individual jitter settings or fall back to the general jitter settings
        const jitterIntensity = physics.individualJitterIntensity || physics.jitterIntensity || 5;
        const jitterInterval = physics.individualJitterInterval || 1000;
        
        // Calculate jitter magnitude based on intensity (higher intensity = more dramatic direction changes)
        const jitterMagnitude = jitterIntensity / 5; // Scale from 1-10 to 0.2-2.0
        const jitterProbability = jitterMagnitude * 0.3; // Scale probability based on intensity
        
        interval = setInterval(() => {
          if (Math.random() < jitterProbability) { // Chance to change direction based on intensity
            const angle = Math.random() * Math.PI * 2;
            const elevation = (Math.random() - 0.5) * Math.PI;
            const speed = actualVelocity * (0.8 + jitterMagnitude * Math.random() * 0.4);
            api.velocity.set(
              Math.cos(angle) * Math.cos(elevation) * speed,
              Math.sin(elevation) * speed,
              Math.sin(angle) * Math.cos(elevation) * speed
            );
          }
        }, jitterInterval);
      }

      return () => clearInterval(interval);
    } else {
      // Stop movement when not in tracking state
      api.velocity.set(0, 0, 0);
    }
  }, [api, actualVelocity, currentGameState, physics.movementPattern, physics.jitterIntensity]);

  // Keep balls within bounds based on room dimensions
  useEffect(() => {
    const room = settings.room || { width: 12, height: 8, depth: 12 };
    const boundsX = room.width / 2 - ballSize;
    const boundsY = room.height / 2 - ballSize;
    const boundsZ = room.depth / 2 - ballSize;
    
    const unsubscribe = api.position.subscribe((pos) => {
      const bounds = [boundsX, boundsY, boundsZ];
      let needsUpdate = false;
      let newPos = [...pos];
      let newVel = [0, 0, 0];
  
      // Check each axis
      for (let i = 0; i < 3; i++) {
        if (Math.abs(pos[i]) > bounds[i]) {
          needsUpdate = true;
          // Simple bounce with velocity based on settings
          newVel[i] = -Math.sign(pos[i]) * actualVelocity * 0.8;
          // Push ball away from boundary
          newPos[i] = Math.sign(pos[i]) * (bounds[i] - 0.1);
        }
      }
  
      if (needsUpdate) {
        api.position.set(...newPos);
        api.velocity.set(...newVel);
      }
    });

    return () => unsubscribe();
  }, [api, actualVelocity, ballSize, settings.room]);
  
  // Handle ball appearance distractions - ONLY during tracking phase
  useFrame(() => {
    // Only apply distractions during the tracking phase
    if (currentGameState === 'tracking') {
      // Random color changes
      if (distractions.colorChanges) {
        // Get color change settings
        const colorChangeInterval = distractions.colorChangeInterval || 1000;
        const colorChangeProbability = 0.005 * (1000 / colorChangeInterval);
        const allSameColor = distractions.allSameColor !== undefined ? distractions.allSameColor : true;
        
        // Check if we should change in sync or individually
        const shouldChangeColor = distractions.colorChangesSync
          ? index === 0 && Math.random() < colorChangeProbability // Only first ball triggers change for all
          : Math.random() < colorChangeProbability; // Each ball changes independently
        
        if (shouldChangeColor) {
          // Generate a random color
          const r = Math.floor(Math.random() * 255);
          const g = Math.floor(Math.random() * 255);
          const b = Math.floor(Math.random() * 255);
          const newColor = `rgb(${r}, ${g}, ${b})`;
          
          // If in sync mode and this is the first ball, use a global event to change all balls
          if (distractions.colorChangesSync && index === 0) {
            // If all balls should be the same color, use the same color for all
            if (allSameColor) {
              // Use a custom event to synchronize color changes
              const colorEvent = new CustomEvent('syncColorChange', {
                detail: { color: newColor }
              });
              window.dispatchEvent(colorEvent);
            } else {
              // Use a custom event to trigger individual color changes
              const colorEvent = new CustomEvent('triggerColorChange', {});
              window.dispatchEvent(colorEvent);
            }
          } else if (!distractions.colorChangesSync) {
            // Individual change
            setBallColor(newColor);
          }
        }
      } else if (!distractions.colorChanges) {
        setBallColor('#ffffff');
      }
      
      // Random size changes
      if (distractions.sizeChanges) {
        // Get size change settings or use defaults
        const minSize = distractions.sizeChangeMin || 0.8;
        const maxSize = distractions.sizeChangeMax || 1.2;
        const sizeChangeInterval = distractions.sizeChangeInterval || 2000;
        const sizeChangeProbability = 0.005 * (1000 / sizeChangeInterval);
        const changeAllAtOnce = distractions.sizeChangesSync || false;
        const allSameSize = distractions.allSameSize !== undefined ? distractions.allSameSize : true;
        
        // Determine if we should change size
        const shouldChangeSize = changeAllAtOnce
          ? index === 0 && Math.random() < sizeChangeProbability // Only first ball triggers change for all
          : Math.random() < sizeChangeProbability; // Each ball changes independently
        
        if (shouldChangeSize) {
          // Calculate new size based on settings
          const sizeMultiplier = minSize + Math.random() * (maxSize - minSize);
          const newSize = defaultSize * sizeMultiplier;
          
          // If changing all at once and this is the first ball, use a custom event
          if (changeAllAtOnce && index === 0) {
            if (allSameSize) {
              // All balls change to the same size
              const sizeEvent = new CustomEvent('syncSizeChange', {
                detail: { size: newSize }
              });
              window.dispatchEvent(sizeEvent);
            } else {
              // All balls change size but to different sizes
              const sizeEvent = new CustomEvent('triggerSizeChange', {});
              window.dispatchEvent(sizeEvent);
            }
          } else if (!changeAllAtOnce) {
            // Individual change
            setBallSize(newSize);
            api.setRadius(newSize);
          }
        }
      } else if (!distractions.sizeChanges && ballSize !== defaultSize) {
        setBallSize(defaultSize);
        api.setRadius(defaultSize);
      }
    } else {
      // Reset appearance when not in tracking phase
      if (distractions.colorChanges) {
        setBallColor('#ffffff');
      }
      if (distractions.sizeChanges && ballSize !== defaultSize) {
        setBallSize(defaultSize);
        api.setRadius(defaultSize);
      }
    }
  });
  
  // Listen for synchronized color changes
  useEffect(() => {
    const handleSyncColorChange = (e) => {
      if (distractions.colorChanges && distractions.colorChangesSync) {
        setBallColor(e.detail.color);
      }
    };
    
    // Listen for individual color changes trigger
    const handleTriggerColorChange = () => {
      if (distractions.colorChanges && distractions.colorChangesSync) {
        // Generate a random color for each ball
        const r = Math.floor(Math.random() * 255);
        const g = Math.floor(Math.random() * 255);
        const b = Math.floor(Math.random() * 255);
        const newColor = `rgb(${r}, ${g}, ${b})`;
        setBallColor(newColor);
      }
    };
    
    // Listen for synchronized size changes
    const handleSyncSizeChange = (e) => {
      if (distractions.sizeChanges && distractions.sizeChangesSync) {
        setBallSize(e.detail.size);
        api.setRadius(e.detail.size);
      }
    };
    
    // Listen for individual size changes trigger
    const handleTriggerSizeChange = () => {
      if (distractions.sizeChanges && distractions.sizeChangesSync) {
        // Generate a random size for each ball
        const minSize = distractions.sizeChangeMin || 0.8;
        const maxSize = distractions.sizeChangeMax || 1.2;
        const sizeMultiplier = minSize + Math.random() * (maxSize - minSize);
        const newSize = defaultSize * sizeMultiplier;
        setBallSize(newSize);
        api.setRadius(newSize);
      }
    };
    
    window.addEventListener('syncColorChange', handleSyncColorChange);
    window.addEventListener('triggerColorChange', handleTriggerColorChange);
    window.addEventListener('syncSizeChange', handleSyncSizeChange);
    window.addEventListener('triggerSizeChange', handleTriggerSizeChange);
    
    return () => {
      window.removeEventListener('syncColorChange', handleSyncColorChange);
      window.removeEventListener('triggerColorChange', handleTriggerColorChange);
      window.removeEventListener('syncSizeChange', handleSyncSizeChange);
      window.removeEventListener('triggerSizeChange', handleTriggerSizeChange);
    };
  }, [api, distractions.colorChanges, distractions.colorChangesSync, distractions.sizeChanges, distractions.sizeChangesSync,
      distractions.sizeChangeMin, distractions.sizeChangeMax, defaultSize]);
  
  // Determine ball color based on game state
  const getBallColor = () => {
    if (distractions.colorChanges && currentGameState === 'tracking') {
      return ballColor;
    }
    
    if (currentGameState === 'selection' && highlightedBallIndex === index) {
      return '#ffffff'; // Highlighted ball in selection phase
    }
    
    if (currentGameState === 'ready' && isHighlighted) {
      return '#ff4444';
    } else if (currentGameState === 'selection' && !showingResults && isSelected) {
      return '#44ff44';
    } else if (showingResults && isSelected && wasTarget) {
      return '#44ff44';
    } else if (showingResults && isSelected && !wasTarget) {
      return '#ff4444';
    } else if (showingResults && !isSelected && wasTarget) {
      return '#ffff44';
    } else {
      return '#ffffff';
    }
  };
  
  // Determine emissive color based on game state
  const getEmissiveColor = () => {
    if (currentGameState === 'selection' && highlightedBallIndex === index) {
      return '#ffffff'; // Highlighted ball in selection phase
    }
    
    if (currentGameState === 'ready' && isHighlighted) {
      return '#ff4444';
    } else if (currentGameState === 'selection' && !showingResults && isSelected) {
      return '#44ff44';
    } else if (showingResults && isSelected && wasTarget) {
      return '#44ff44';
    } else if (showingResults && isSelected && !wasTarget) {
      return '#ff4444';
    } else if (showingResults && !isSelected && wasTarget) {
      return '#ffff44';
    } else {
      return '#000000';
    }
  };
  
  // Determine emissive intensity based on game state
  const getEmissiveIntensity = () => {
    if (currentGameState === 'selection' && highlightedBallIndex === index) {
      return 0.7; // Highlighted ball in selection phase
    }
    
    if ((currentGameState === 'ready' && isHighlighted) ||
        (currentGameState === 'selection' && (isSelected || showingResults))) {
      return 0.5;
    } else {
      return 0;
    }
  };

  // We no longer render number labels directly on the balls
  // Instead, we'll use a separate component for numbers in the Scene
  const renderNumberLabel = () => {
    return null;
  };

  return (
    <group>
      <mesh
        ref={ref}
        onClick={isSelectable ? onClick : undefined}
        uuid={`ball-${index}`}
      >
        <sphereGeometry args={[ballSize, 32, 32]} />
        <meshPhongMaterial
          color={getBallColor()}
          emissive={getEmissiveColor()}
          emissiveIntensity={getEmissiveIntensity()}
          shininess={70}
          specular="#ffffff"
        />
      </mesh>
      {renderNumberLabel()}
    </group>
  );
}


function Crosshair({ settings }) {
  if (!settings.crosshair?.enabled) return null;

  const crosshair = settings.crosshair || {
    enabled: true,
    color: { r: 255, g: 255, b: 255, a: 1 },
    innerLines: { enabled: true, opacity: 1, length: 6, thickness: 2, offset: 3 },
    outerLines: { enabled: true, opacity: 1, length: 2, thickness: 2, offset: 10 },
    centerDot: { enabled: true, opacity: 1, thickness: 2 },
    rotation: 0
  };
  
  const color = new THREE.Color(
    (crosshair?.color?.r ?? 255) / 255,
    (crosshair?.color?.g ?? 255) / 255,
    (crosshair?.color?.b ?? 255) / 255
  );

  const material = new THREE.LineBasicMaterial({
    color,
    transparent: true,
    opacity: crosshair?.color?.a ?? 1,
    depthTest: false
  });

  const renderCenterDot = () => {
    if (!crosshair?.centerDot?.enabled) return null;
    const geometry = new THREE.CircleGeometry((crosshair?.centerDot?.thickness ?? 2) / 100, 32);
    return (
      <mesh renderOrder={999} material={material}>
        <primitive object={geometry} />
      </mesh>
    );
  };

  const renderLines = (lineSettings, isInner) => {
    if (!lineSettings?.enabled) return null;

    const offset = (lineSettings?.offset ?? (isInner ? 3 : 10)) / 50;
    const length = (lineSettings?.length ?? (isInner ? 6 : 2)) / 50;
    const thickness = (lineSettings?.thickness ?? 2) / 200;

    const vertices = [];
    const rotation = ((crosshair?.rotation ?? 0) * Math.PI) / 180;

    // Helper function to rotate a point
    const rotatePoint = (x, y) => [
      x * Math.cos(rotation) - y * Math.sin(rotation),
      x * Math.sin(rotation) + y * Math.cos(rotation)
    ];

    // Create lines in all four directions
    [-1, 1].forEach(dirX => {
      [-1, 1].forEach(dirY => {
        const startX = dirX * offset;
        const startY = dirY * offset;
        const endX = dirX * (offset + length);
        const endY = dirY * (offset + length);

        // Rotate the points
        const [rotStartX, rotStartY] = rotatePoint(startX, startY);
        const [rotEndX, rotEndY] = rotatePoint(endX, endY);

        vertices.push(
          rotStartX, rotStartY, 0,
          rotEndX, rotEndY, 0
        );
      });
    });

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));

    return (
      <lineSegments renderOrder={999} geometry={geometry} material={material} />
    );
  };

  return (
    <group position={[0, 0, 0]}>
      {renderCenterDot()}
      {renderLines(crosshair?.innerLines, true)}
      {renderLines(crosshair?.outerLines, false)}
    </group>
  );
}

// Camera controller for rotation
function CameraController({ settings, gameState }) {
  const { camera, gl } = useThree();
  const rotationRef = useRef({ x: 0, y: 0, z: 0 });
  const directionRef = useRef({ x: 1, y: 1, z: 1 });
  const isDraggingRef = useRef(false);
  const previousMousePositionRef = useRef({ x: 0, y: 0 });
  
  // Get current game state from settings if not provided directly
  const currentGameState = settings?.gameState || gameState;
  
  // Mouse rotation settings
  const mouseRotationEnabled = settings?.mouseRotation?.enabled || false;
  const mouseSensitivity = settings?.mouseRotation?.sensitivity || 1.0;
  
  // Get rotation settings for current phase
  const getRotationSettings = () => {
    if (!settings.rotation) return { x: 0, y: 0, z: 0, xBoomerang: 0, yBoomerang: 0, zBoomerang: 0 };
    
    if (currentGameState === 'ready') {
      // Ready phase uses memorization settings
      // Fix: Use the correct settings for memorization phase
      return settings.rotation.memorization || { x: 0, y: 0.5, z: 0, xBoomerang: 0, yBoomerang: 0.5, zBoomerang: 0 };
    } else if (currentGameState === 'tracking') {
      // Tracking phase uses tracking settings
      return settings.rotation.tracking || { x: 0, y: 0, z: 0, xBoomerang: 0, yBoomerang: 0, zBoomerang: 0 };
    } else if (currentGameState === 'selection') {
      // Selection phase uses selection settings
      // Fix: Use the correct settings for selection phase
      return settings.rotation.selection || { x: 0, y: 0.3, z: 0, xBoomerang: 0, yBoomerang: 0.5, zBoomerang: 0 };
    }
    
    return { x: 0, y: 0, z: 0, xBoomerang: 0, yBoomerang: 0, zBoomerang: 0 };
  };
  
  // Track previous game state to detect transitions
  const prevGameStateRef = useRef(currentGameState);
  
  // Set up mouse rotation handlers
  useEffect(() => {
    if (!mouseRotationEnabled || currentGameState === 'setup' || currentGameState === 'results') {
      return;
    }
    
    const handleMouseDown = (e) => {
      if (e.button === 0) { // Left mouse button
        isDraggingRef.current = true;
        previousMousePositionRef.current = { x: e.clientX, y: e.clientY };
      }
    };
    
    const handleMouseMove = (e) => {
      if (!isDraggingRef.current) return;
      
      // Calculate deltas with proper sensitivity
      const deltaX = (e.clientX - previousMousePositionRef.current.x) * 0.01 * mouseSensitivity;
      const deltaY = (e.clientY - previousMousePositionRef.current.y) * 0.01 * mouseSensitivity;
      
      // Apply rotation in the correct direction
      // When dragging left, camera should rotate left (negative Y)
      // When dragging right, camera should rotate right (positive Y)
      rotationRef.current.y -= deltaX; // Invert X axis movement
      // When dragging up, camera should rotate up (negative X)
      // When dragging down, camera should rotate down (positive X)
      rotationRef.current.x += deltaY; // Don't invert Y axis movement
      
      previousMousePositionRef.current = { x: e.clientX, y: e.clientY };
    };
    
    const handleMouseUp = () => {
      isDraggingRef.current = false;
    };
    
    const canvas = gl.domElement;
    canvas.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    
    return () => {
      canvas.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [mouseRotationEnabled, currentGameState, gl, mouseSensitivity]);
  
  // Apply camera rotation
  useFrame((state, delta) => {
    if (currentGameState === 'setup' || currentGameState === 'results') {
      // Reset camera position when not playing
      camera.position.set(0, 0, 12);
      camera.rotation.set(0, 0, 0);
      rotationRef.current = { x: 0, y: 0, z: 0 };
      directionRef.current = { x: 1, y: 1, z: 1 };
      return;
    }
    
    // Check for phase transitions
    if (prevGameStateRef.current !== currentGameState) {
      // Reset camera position at the end of each phase
      rotationRef.current = { x: 0, y: 0, z: 0 };
      camera.position.set(0, 0, 12);
      camera.lookAt(0, 0, 0);
      
      prevGameStateRef.current = currentGameState;
    }
    
    const rotationSettings = getRotationSettings();
    
    // Apply rotation for each axis
    ['x', 'y', 'z'].forEach(axis => {
      const rate = rotationSettings[axis] || 0;
      const boomerangDistance = rotationSettings[`${axis}Boomerang`] || 0;
      
      if (rate !== 0) {
        // Update rotation
        rotationRef.current[axis] += rate * delta * directionRef.current[axis];
        
        // Handle boomerang effect
        if (boomerangDistance > 0) {
          if (Math.abs(rotationRef.current[axis]) >= boomerangDistance) {
            directionRef.current[axis] *= -1;
            rotationRef.current[axis] = Math.sign(rotationRef.current[axis]) * boomerangDistance;
          }
        }
      }
    });
    
    // Apply rotations to camera
    camera.position.set(
      12 * Math.sin(rotationRef.current.y),
      12 * Math.sin(rotationRef.current.x),
      12 * Math.cos(rotationRef.current.y) * Math.cos(rotationRef.current.x)
    );
    camera.lookAt(0, 0, 0);
    camera.rotation.z = rotationRef.current.z;
  });
  
  return null;
}

// Screen flash effect for distractions (DOM-based, only flashes the game area with solid white)
function ScreenFlash({ settings, gameState }) {
  const [flashOpacity, setFlashOpacity] = useState(0);
  
  // Use regular React useEffect + setTimeout instead of setInterval for better performance
  useEffect(() => {
    // Only enable screen flash during tracking phase
    if (gameState !== 'tracking' || !settings?.distractions?.screenFlash) {
      setFlashOpacity(0); // Ensure flash is off when not tracking
      return;
    }
    
    // Get flash settings or use defaults
    const minInterval = settings?.distractions?.flashMinInterval || 2000;
    const maxInterval = settings?.distractions?.flashMaxInterval || 8000;
    const flashLength = settings?.distractions?.flashLength || 200;
    
    // Function to schedule the next flash
    const scheduleNextFlash = () => {
      const nextDelay = minInterval + Math.random() * (maxInterval - minInterval);
      const timeoutId = setTimeout(() => {
        // Always use white color with 100% opacity
        setFlashOpacity(1);
        
        // Reset after configured flash length
        const resetId = setTimeout(() => {
          setFlashOpacity(0);
          // Schedule the next flash after this one ends
          scheduleNextFlash();
        }, flashLength);
        
        return () => clearTimeout(resetId);
      }, nextDelay);
      
      return () => clearTimeout(timeoutId);
    };
    
    // Start the flash cycle
    const cleanupFn = scheduleNextFlash();
    
    return () => {
      cleanupFn();
      setFlashOpacity(0); // Ensure flash is off when component unmounts
    };
  }, [gameState, settings?.distractions?.screenFlash, settings?.distractions?.flashMinInterval,
      settings?.distractions?.flashMaxInterval, settings?.distractions?.flashLength]);
  
  if (flashOpacity <= 0) return null;
  
  return (
    <div
      style={{
        position: 'absolute', // Use absolute to only cover the game area
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: '#ffffff', // Always white
        opacity: flashOpacity,
        pointerEvents: 'none',
        zIndex: 100 // Higher z-index to ensure it covers everything
      }}
    />
  );
}

// 3D Glasses effect using AnaglyphEffect from three.js
function ThreeDGlassesEffect({ enabled, settings }) {
  const { gl, scene, camera } = useThree();
  const effectRef = useRef(null);
  const originalRenderRef = useRef(null);
  const isInitializedRef = useRef(false);
  
  // Get the 3D disparity setting or use default
  const disparity = settings?.threeDDisparity || 0.064;
  
  useEffect(() => {
    // Prevent multiple initializations
    if (isInitializedRef.current && !enabled) {
      // If already initialized and now disabled, clean up
      if (effectRef.current) {
        // Restore original render method
        if (originalRenderRef.current) {
          gl.render = originalRenderRef.current;
        }
        effectRef.current.dispose();
        effectRef.current = null;
      }
      isInitializedRef.current = false;
      return;
    }
    
    // If already initialized or not enabled, do nothing
    if (isInitializedRef.current || !enabled) {
      return;
    }
    
    try {
      // Store the original render method
      originalRenderRef.current = gl.render.bind(gl);
      
      // Get the renderer size
      const size = gl.getSize(new THREE.Vector2());
      
      // Create the anaglyph effect with the disparity setting
      const anaglyphEffect = new ImprovedAnaglyphEffect(gl, size.width, size.height, disparity);
      
      // Store the effect
      effectRef.current = anaglyphEffect;
      
      // Override the render method - use a wrapper function to avoid recursion
      gl.render = function(sceneToRender, cameraToRender) {
        if (effectRef.current && sceneToRender && cameraToRender) {
          effectRef.current.render(sceneToRender, cameraToRender);
        } else {
          originalRenderRef.current(sceneToRender, cameraToRender);
        }
      };
      
      isInitializedRef.current = true;
    } catch (error) {
      console.error("Failed to initialize 3D glasses effect:", error);
    }
    
    return () => {
      // Cleanup on unmount
      if (effectRef.current) {
        // Restore original render method
        if (originalRenderRef.current) {
          gl.render = originalRenderRef.current;
        }
        effectRef.current.dispose();
        effectRef.current = null;
      }
      isInitializedRef.current = false;
    };
  }, [enabled, gl, disparity]);
  
  // Update disparity when it changes
  useEffect(() => {
    if (effectRef.current && isInitializedRef.current && enabled) {
      effectRef.current.setDisparity(disparity);
    }
  }, [disparity, enabled]);
  
  return null;
}

// The ImprovedAnaglyphEffect class has been moved to a separate file

// Global jitter controller for all balls
function GlobalJitterController({ settings, gameState, api }) {
  // Get current game state from settings if not provided directly
  const currentGameState = settings?.gameState || gameState;
  
  useEffect(() => {
    if (currentGameState !== 'tracking') return;
    
    const physics = settings.physics || {};
    if (physics.movementPattern !== 'globalJitter') return;
    
    // Use the specific global jitter settings or fall back to the general jitter settings
    const jitterIntensity = physics.globalJitterIntensity || physics.jitterIntensity || 5;
    const jitterInterval = physics.globalJitterInterval || 2000;
    
    // Calculate jitter magnitude based on intensity (higher intensity = more dramatic direction changes)
    const jitterMagnitude = jitterIntensity / 5; // Scale from 1-10 to 0.2-2.0
    
    const interval = setInterval(() => {
      if (api && api.length > 0) {
        // Apply the same random direction to all balls
        const angle = Math.random() * Math.PI * 2;
        const elevation = (Math.random() - 0.5) * Math.PI;
        // Use the single speed setting if available, otherwise fall back to min/max for backward compatibility
        const velocity = physics.speed || settings.velocity || 7;
        // Apply jitter magnitude to speed variation
        const speed = velocity * (0.8 + jitterMagnitude * Math.random() * 0.4);
        
        api.forEach(ballApi => {
          ballApi.velocity.set(
            Math.cos(angle) * Math.cos(elevation) * speed,
            Math.sin(elevation) * speed,
            Math.sin(angle) * Math.cos(elevation) * speed
          );
        });
      }
    }, jitterInterval);
    
    return () => clearInterval(interval);
  }, [api, currentGameState, settings.physics, settings.velocity]);
  
  return null;
}

function Scene({ balls, targetIndices, gameState, onBallClick, velocity, selectedIndices, showingResults, settings, highlightedBallIndex, onKeyNavigation }) {
  // Collect ball APIs for global jitter
  const ballApiRefs = useRef([]);
  
  // Set up key navigation
  useEffect(() => {
    const handleKeyDown = (e) => {
      // For number keys 1-8, only prevent default and handle them during selection phase
      const numberKeys = ['1', '2', '3', '4', '5', '6', '7', '8'];
      
      if (numberKeys.includes(e.key)) {
        // Only prevent default for number keys during selection phase
        if (gameState === 'selection' && !showingResults) {
          e.preventDefault();
          onKeyNavigation(e.key);
        }
        // Otherwise, allow default behavior (typing in input fields)
        return;
      }
      
      // For other control keys, always prevent default
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Enter', ' ', 'e', 'E', 'f', 'F'].includes(e.key)) {
        e.preventDefault();
        onKeyNavigation(e.key);
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onKeyNavigation, gameState, showingResults]);
  
  return (
    <>
      <Environment preset="night" />
      <PerspectiveCamera
        makeDefault
        position={[0, 0, 12]}
        fov={60}
      />
      <CameraController settings={settings} gameState={gameState} />
      <ThreeDGlassesEffect enabled={settings.threeDGlasses} settings={settings} />
      <Crosshair settings={settings} />
      <ambientLight intensity={0.2} />
      <pointLight position={[0, 0, 10]} intensity={0.5} />
      <Physics
        gravity={[0, 0, 0]}
        defaultContactMaterial={{
          friction: 0,
          restitution: 1,
          contactEquationStiffness: 1e8,
          contactEquationRelaxation: 1,
          contactEquationRegularizationTime: 3
        }}
        iterations={20}
        tolerance={0.0001}
      >
        <GlobalJitterController
          settings={settings}
          gameState={gameState}
          api={ballApiRefs.current}
        />
        <Room settings={settings} gameState={gameState} />
        {balls.map((ball, index) => (
          <Ball
            key={index}
            index={index}
            position={ball.position}
            isHighlighted={
              (gameState === 'ready' || gameState === 'tracking') && targetIndices.includes(index)
            }
            isSelectable={gameState === 'selection' && !showingResults}
            onClick={() => onBallClick(index)}
            velocity={velocity}
            gameState={gameState}
            isSelected={selectedIndices.includes(index)}
            showingResults={showingResults}
            wasTarget={targetIndices.includes(index)}
            settings={settings}
            highlightedBallIndex={highlightedBallIndex}
          />
        ))}
        {/* Add the number labels as a separate component */}
        <NumberLabels
          balls={balls}
          gameState={gameState}
          showingResults={showingResults}
        />
      </Physics>
    </>
  );
}
export default function MOT() {
  const [motAnalytics, setMotAnalytics] = useLocalStorage('mot_analytics', []);
  const [history, setHistory] = useLocalStorage('mot_history', []);
  const [expandedHistoryItem, setExpandedHistoryItem] = useState(null);
  const [startTime, setStartTime] = useState(null);
  const [highlightedBallIndex, setHighlightedBallIndex] = useState(null);

  const defaultSettings = {
    numBalls: 8,
    numTargets: 4,
    rememberTime: 3,
    trackingTime: 10,
    selectionTime: 0,
    velocity: 7,
    advancedMode: false,
    // Auto progression settings
    autoProgressionEnabled: true,
    thresholdAdvance: 80,
    thresholdFallback: 50,
    thresholdFallbackSessions: 3,
    progressCount: 0, // Track consecutive sessions below threshold
    thresholdAdvanceSessions: 1, // Number of consecutive sessions above threshold before increasing level
    advanceCount: 0, // Track consecutive sessions above threshold
    speedIncrement: 1, // How much to increase/decrease speed by
    physics: {
      ballDensity: 1,
      speed: 7,
      minSpeed: 7, // For backward compatibility
      maxSpeed: 7, // For backward compatibility
      collisionEnabled: true,
      movementPattern: 'individualJitter',
      jitterIntensity: 5
    },
    distractions: {
      colorChanges: false,
      sizeChanges: false,
      screenFlash: false,
      wallColorChanges: false
    },
    mouseRotation: {
      enabled: false,
      sensitivity: 1.0
    },
    rotation: {
      selection: { x: 0, y: 0.3, z: 0, xBoomerang: 0, yBoomerang: 0.5, zBoomerang: 0 },
      memorization: { x: 0, y: 0.5, z: 0, xBoomerang: 0, yBoomerang: 0.5, zBoomerang: 0 },
      tracking: { x: 0, y: 0, z: 0, xBoomerang: 0, yBoomerang: 0, zBoomerang: 0 }
    },
    room: {
      width: 12,
      height: 8,
      depth: 12,
      edgeVisibility: 0.3
    },
    crosshair: {
      enabled: true,
      color: {
        r: 255,
        g: 0,
        b: 0,
        a: 1
      },
      innerLines: {
        enabled: false,
        opacity: 1,
        length: 6,
        thickness: 2,
        offset: 3
      },
      outerLines: {
        enabled: false,
        opacity: 1,
        length: 2,
        thickness: 2,
        offset: 10
      },
      centerDot: {
        enabled: true,
        opacity: 1,
        thickness: 5
      },
      rotation: 0
    },
    threeDGlasses: false,
    threeDDisparity: 0.064
  };

  const [settings, setSettings] = useLocalStorage('mot_settings', defaultSettings);

  // Ensure all settings exist (for users with existing settings)
  useEffect(() => {
    // Create a deep copy of the settings to avoid reference issues
    const updatedSettings = JSON.parse(JSON.stringify(defaultSettings));
    
    // Deep merge function to recursively merge objects
    const deepMerge = (target, source) => {
      for (const key in source) {
        if (source[key] !== null && typeof source[key] === 'object' && !Array.isArray(source[key])) {
          // If property doesn't exist in target, create it
          if (!target[key]) target[key] = {};
          // Recursively merge objects
          deepMerge(target[key], source[key]);
        } else {
          // For primitive values and arrays, just copy over
          if (source[key] !== undefined) {
            target[key] = source[key];
          }
        }
      }
      return target;
    };
    
    // Merge existing user settings with defaults
    const mergedSettings = deepMerge(updatedSettings, settings);
    
    // Always update settings to ensure all properties are properly initialized
    setSettings(mergedSettings);
  }, []);
  
  const [gameState, setGameState] = useState('setup');
  const [showingResults, setShowingResults] = useState(false);
  
  // Update balls when settings change
  useEffect(() => {
    // Initialize balls with random positions based on current settings
    const initialBalls = [];
    const room = settings.room || { width: 12, height: 8, depth: 12 };
    const spreadX = room.width * 0.4;
    const spreadY = room.height * 0.4;
    const spreadZ = room.depth * 0.4;
    
    for (let i = 0; i < settings.numBalls; i++) {
      initialBalls.push({
        position: [
          (Math.random() - 0.5) * spreadX,
          (Math.random() - 0.5) * spreadY,
          (Math.random() - 0.5) * spreadZ
        ]
      });
    }
    setBalls(initialBalls);
    
    // If we're in setup mode, also update target indices when ball count changes
    if (gameState === 'setup') {
      const newTargetIndices = [];
      const targetCount = Math.min(settings.numTargets, settings.numBalls - 1);
      
      while (newTargetIndices.length < targetCount) {
        const index = Math.floor(Math.random() * settings.numBalls);
        if (!newTargetIndices.includes(index)) {
          newTargetIndices.push(index);
        }
      }
      setTargetIndices(newTargetIndices);
    }
  }, [settings.numBalls, settings.numTargets, settings.room]);
  const [balls, setBalls] = useState(() => {
    // Initialize balls with random positions
    const initialBalls = [];
    for (let i = 0; i < 8; i++) {
      initialBalls.push({
        position: [
          (Math.random() - 0.5) * 8,
          (Math.random() - 0.5) * 5, // Reduced vertical spread
          (Math.random() - 0.5) * 8
        ]
      });
    }
    return initialBalls;
  });
  const [targetIndices, setTargetIndices] = useState([]);
  const [selectedIndices, setSelectedIndices] = useState([]);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(0);
const initializeBalls = () => {
  setShowingResults(false);
  
  // Get room dimensions
  const room = settings.room || { width: 12, height: 8, depth: 12 };
  const spreadX = room.width * 0.4;
  const spreadY = room.height * 0.4;
  const spreadZ = room.depth * 0.4;
  
  // Create new balls
  const newBalls = [];
  for (let i = 0; i < settings.numBalls; i++) {
    newBalls.push({
      position: [
        (Math.random() - 0.5) * spreadX,
        (Math.random() - 0.5) * spreadY,
        (Math.random() - 0.5) * spreadZ
      ]
    });
  }
  setBalls(newBalls);

  // Select target balls
  const newTargetIndices = [];
  while (newTargetIndices.length < settings.numTargets) {
    const index = Math.floor(Math.random() * settings.numBalls);
    if (!newTargetIndices.includes(index)) {
      newTargetIndices.push(index);
    }
  }
  setTargetIndices(newTargetIndices);
  
  // Reset selection
  setSelectedIndices([]);
  
  // Find ball closest to center for initial selection
  let closestBallIndex = 0;
  let closestDistance = Infinity;
  
  newBalls.forEach((ball, index) => {
    const distance = Math.sqrt(
      ball.position[0] * ball.position[0] +
      ball.position[1] * ball.position[1] +
      ball.position[2] * ball.position[2]
    );
    
    if (distance < closestDistance) {
      closestDistance = distance;
      closestBallIndex = index;
    }
  });
  
  setHighlightedBallIndex(closestBallIndex);
  
  // Start remember phase with timer and record start time
  setGameState('ready');
  setTimeLeft(settings.rememberTime);
  setStartTime(Date.now());
};

// Handle game state transitions and timers
useEffect(() => {
  if (!gameState || gameState === 'setup' || gameState === 'results') return;

  // If we're in selection phase and selectionTime is 0, don't start a timer
  if (gameState === 'selection' && settings.selectionTime === 0) {
    // Hide the timer bar for unlimited selection time
    setTimeLeft(0);
    return;
  }

  const timer = setInterval(() => {
    setTimeLeft(prev => {
      if (prev <= 0) {
        // Transition states
        if (gameState === 'ready') {
          setGameState('tracking');
          return settings.trackingTime;
        } else if (gameState === 'tracking') {
          setGameState('selection');
          // If selectionTime is 0, don't start a countdown
          return settings.selectionTime || 0;
        } else if (gameState === 'selection' && settings.selectionTime > 0) {
          checkResults();
          return 0;
        }
        return 0;
      }
      return prev - 1;
    });
  }, 1000);

  return () => clearInterval(timer);
}, [gameState, settings.trackingTime, settings.rememberTime, settings.selectionTime]);

// Handle ball click selection
const handleBallClick = (index) => {
  if (gameState !== 'selection' || showingResults) return;

  setSelectedIndices(prev => {
    if (prev.includes(index)) {
      return prev.filter(i => i !== index);
    }
    if (prev.length < settings.numTargets) {
      return [...prev, index];
    }
    return prev;
  });
  
  // Update highlighted ball
  setHighlightedBallIndex(index);
};

// Handle keyboard navigation
const handleKeyNavigation = (key) => {
  // Handle 'F' key to move to next phase regardless of current game state
  if (key === 'f' || key === 'F') {
    if (gameState === 'ready') {
      setGameState('tracking');
      setTimeLeft(settings.trackingTime);
    } else if (gameState === 'tracking') {
      setGameState('selection');
      setTimeLeft(settings.selectionTime || 0);
    } else if (gameState === 'selection' && !showingResults) {
      checkResults();
    }
    return;
  }
  
  // Handle 'E' key for fullscreen
  if (key === 'e' || key === 'E') {
    // Toggle fullscreen for the canvas element directly
    const canvas = document.querySelector('canvas');
    if (canvas) {
      if (!document.fullscreenElement) {
        // Apply styles to make canvas fill the screen
        canvas.style.position = 'fixed';
        canvas.style.top = '0';
        canvas.style.left = '0';
        canvas.style.width = '100vw';
        canvas.style.height = '100vh';
        canvas.style.zIndex = '9999';
        
        canvas.requestFullscreen().catch(err => {
          console.error(`Error attempting to enable fullscreen: ${err.message}`);
          // Reset styles if fullscreen fails
          canvas.style = '';
        });
      } else {
        if (document.exitFullscreen) {
          document.exitFullscreen().then(() => {
            // Reset styles after exiting fullscreen
            setTimeout(() => {
              const canvas = document.querySelector('canvas');
              if (canvas) {
                canvas.style = '';
              }
            }, 100);
          }).catch(() => {
            // Reset styles even if exitFullscreen fails
            const canvas = document.querySelector('canvas');
            if (canvas) {
              canvas.style = '';
            }
          });
        }
      }
    }
    return;
  }
  
  // Handle Space key to start/stop the exercise
  if (key === ' ') {
    if (gameState === 'setup') {
      initializeBalls();
    } else if (gameState === 'results') {
      setSelectedIndices([]);
      setShowingResults(false);
      initializeBalls();
    } else {
      setSelectedIndices([]);
      setShowingResults(false);
      setGameState('setup');
      setStartTime(null);
    }
    return;
  }
  
  // Handle number keys 1-8 for direct ball selection
  if (gameState === 'selection' && !showingResults) {
    const numKey = parseInt(key);
    if (!isNaN(numKey) && numKey >= 1 && numKey <= 8 && numKey <= balls.length) {
      const ballIndex = numKey - 1;
      handleBallClick(ballIndex);
      return;
    }
  }
  
  // Only handle arrow keys and Enter during selection phase
  if (gameState !== 'selection' || showingResults) return;
  
  // If no ball is highlighted, highlight the first one
  if (highlightedBallIndex === null && balls.length > 0) {
    setHighlightedBallIndex(0);
    return;
  }
  
  if (key === 'Enter') {
    // Select/deselect the highlighted ball
    handleBallClick(highlightedBallIndex);
    return;
  }
  
  // Get current highlighted ball position
  const currentBall = balls[highlightedBallIndex];
  if (!currentBall) return;
  
  const currentPos = currentBall.position;
  
  // Find the next ball in the requested direction
  let nextBallIndex = highlightedBallIndex;
  let smallestDistance = Infinity;
  
  balls.forEach((ball, index) => {
    if (index === highlightedBallIndex) return;
    
    const pos = ball.position;
    const dx = pos[0] - currentPos[0];
    const dy = pos[1] - currentPos[1];
    const dz = pos[2] - currentPos[2];
    const distance = Math.sqrt(dx*dx + dy*dy + dz*dz);
    
    // Check if ball is in the requested direction
    let isInDirection = false;
    
    if (key === 'ArrowRight' && dx > 0 && Math.abs(dx) > Math.abs(dz)) {
      isInDirection = true;
    } else if (key === 'ArrowLeft' && dx < 0 && Math.abs(dx) > Math.abs(dz)) {
      isInDirection = true;
    } else if (key === 'ArrowUp' && dz < 0) {
      isInDirection = true;
    } else if (key === 'ArrowDown' && dz > 0) {
      isInDirection = true;
    }
    
    if (isInDirection && distance < smallestDistance) {
      smallestDistance = distance;
      nextBallIndex = index;
    }
  });
  
  // Update highlighted ball if we found a better one
  if (nextBallIndex !== highlightedBallIndex) {
    setHighlightedBallIndex(nextBallIndex);
  }
};



  const checkResults = () => {
    const correct = selectedIndices.filter(index =>
      targetIndices.includes(index)
    ).length;
    setScore(prev => prev + correct);
    setShowingResults(true);
    setTimeLeft(0);
    setGameState('results');

    // Record analytics data only if we have a start time
    if (startTime) {
      const duration = (Date.now() - startTime) / 1000 / 60; // Convert ms to minutes
      const percentageCorrect = (correct / settings.numTargets) * 100;
      
      // Handle auto progression if enabled
      if (settings.autoProgressionEnabled) {
        // Create a deep copy of settings to avoid reference issues
        let newSettings = JSON.parse(JSON.stringify(settings));
        
        if (percentageCorrect >= settings.thresholdAdvance) {
          // Increment advance count for consecutive sessions above threshold
          const currentAdvanceCount = Number(settings.advanceCount || 0);
          const advanceThreshold = Number(settings.thresholdAdvanceSessions || 1);
          newSettings.advanceCount = currentAdvanceCount + 1;
          
          // If we've reached the threshold for consecutive sessions above threshold
          if (Number(newSettings.advanceCount) >= advanceThreshold) {
            // Increase speed
            const currentSpeed = newSettings.physics.speed || 7;
            const speedIncrement = newSettings.speedIncrement || 0.5;
            const newSpeed = currentSpeed + speedIncrement;
            
            // Ensure physics object exists
            if (!newSettings.physics) newSettings.physics = {};
            
            newSettings.physics = {
              ...newSettings.physics,
              speed: newSpeed,
              minSpeed: newSpeed, // For backward compatibility
              maxSpeed: newSpeed  // For backward compatibility
            };
            
            console.log(`Great job! Speed increased to ${newSpeed}`);
            
            // Reset advance count
            newSettings.advanceCount = 0;
          }
          
          // Reset fallback count
          newSettings.progressCount = 0;
        }
        else if (percentageCorrect < settings.thresholdFallback) {
          // Increment progress count for consecutive sessions below threshold
          const currentCount = Number(settings.progressCount || 0);
          newSettings.progressCount = currentCount + 1;
          
          // Reset advance count since we're below threshold
          newSettings.advanceCount = 0;
          
          // If we've reached the threshold for consecutive sessions below threshold
          if (Number(newSettings.progressCount) >= Number(settings.thresholdFallbackSessions || 3)) {
            // Decrease speed, but not below 0.1
            const currentSpeed = newSettings.physics.speed || 7;
            const speedIncrement = newSettings.speedIncrement || 0.5;
            const newSpeed = Math.max(0.1, currentSpeed - speedIncrement);
            
            // Ensure physics object exists
            if (!newSettings.physics) newSettings.physics = {};
            
            newSettings.physics = {
              ...newSettings.physics,
              speed: newSpeed,
              minSpeed: newSpeed, // For backward compatibility
              maxSpeed: newSpeed  // For backward compatibility
            };
            
            console.log(`Speed decreased to ${newSpeed}`);
            
            // Reset progress count
            newSettings.progressCount = 0;
          }
        }
        else {
          // Score is between thresholds, reset both counts
          newSettings.progressCount = 0;
          newSettings.advanceCount = 0;
        }
        
        // Update settings with a new object to ensure state update
        setSettings(newSettings);
      }
      
      const session = {
        exercise: 'mot',
        timestamp: Date.now(),
        date: getTodayDate(),
        duration,
        metrics: {
          percentageCorrect,
          totalBalls: settings.numBalls,
          trackingBalls: settings.numTargets,
          speed: settings.physics.speed || 7,
          // Auto progression metrics
          autoProgressionEnabled: settings.autoProgressionEnabled,
          thresholdAdvance: settings.thresholdAdvance,
          thresholdFallback: settings.thresholdFallback,
          progressCount: settings.progressCount || 0,
          advanceCount: settings.advanceCount || 0
        }
      };
      setMotAnalytics(prev => [...prev, session]);

      // Add to history
      const historyItem = {
        timestamp: Date.now(),
        settings: { ...settings },
        results: {
          correct,
          total: settings.numTargets,
          duration,
          percentageCorrect,
          speed: settings.physics.speed || 7
        }
      };
      setHistory(prev => [historyItem, ...prev]);
    }
    setStartTime(null);
  };

  const useHistorySettings = (historyItem) => {
    // Create a deep copy of the history settings to avoid reference issues
    const historicalSettings = JSON.parse(JSON.stringify(historyItem.settings));
    
    // Merge with default settings to ensure all properties exist
    const mergedSettings = { ...defaultSettings };
    
    // Deep merge function to recursively merge objects
    const deepMerge = (target, source) => {
      for (const key in source) {
        if (source[key] !== null && typeof source[key] === 'object' && !Array.isArray(source[key])) {
          // If property doesn't exist in target, create it
          if (!target[key]) target[key] = {};
          // Recursively merge objects
          deepMerge(target[key], source[key]);
        } else {
          // For primitive values and arrays, just copy over
          if (source[key] !== undefined) {
            target[key] = source[key];
          }
        }
      }
      return target;
    };
    
    // Apply historical settings while ensuring all required properties exist
    const finalSettings = deepMerge(mergedSettings, historicalSettings);
    
    // Update settings
    setSettings(finalSettings);
    setExpandedHistoryItem(null);
    setGameState('setup');
    setShowingResults(false);
    setSelectedIndices([]);
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 grid grid-cols-[1fr_350px] gap-8">
        <div className="bg-card rounded-xl overflow-hidden shadow-lg relative h-[600px]">
          <div className="absolute top-4 right-4 z-10 bg-background/80 backdrop-blur-sm px-6 py-2 rounded-lg font-semibold">
            Score: <span className="text-primary">{score}</span>
          </div>
          
          {(gameState === 'ready' || gameState === 'tracking' || gameState === 'selection') && (
            <div className="absolute top-4 left-4 right-4 z-10">
              <div className="h-1 bg-background/20 rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary"
                  style={{
                    width: `${(timeLeft / (
                      gameState === 'ready' ? settings.rememberTime :
                      gameState === 'tracking' ? settings.trackingTime :
                      settings.selectionTime
                    )) * 100}%`,
                    transition: timeLeft === (
                      gameState === 'ready' ? settings.rememberTime :
                      gameState === 'tracking' ? settings.trackingTime :
                      settings.selectionTime
                    ) ? 'none' : 'width 950ms linear'
                  }}
                />
              </div>
            </div>
          )}
          
          <div className="w-full h-[600px] relative">
            <HelpButton text="3D Multiple Object Tracking:

1. Memorize the highlighted red balls
2. Keep track of their positions while they move
3. When they stop, click on the balls you were tracking (or use arrow keys and Enter)
4. Score points for correctly identifying the original balls

The more accurately you identify the original balls, the higher your score!" />
            <Canvas>
              <Scene
                balls={balls}
                targetIndices={targetIndices}
                gameState={gameState}
                onBallClick={handleBallClick}
                velocity={gameState === 'tracking' ? (settings.physics?.speed || settings.velocity) : 0}
                selectedIndices={selectedIndices}
                showingResults={showingResults}
                settings={{...settings, gameState}} // Pass gameState as part of settings
                highlightedBallIndex={highlightedBallIndex}
                onKeyNavigation={handleKeyNavigation}
              />
            </Canvas>
            <ScreenFlash settings={settings} gameState={gameState} />
          </div>
        </div>

        <div className="w-[350px]">
          <h2 className="text-2xl font-bold mb-6">3D Multiple Object Tracking</h2>
          
          {gameState === 'setup' && (
            <div className="space-y-6">
              <Settings settings={settings} onSettingsChange={setSettings} isPlaying={gameState !== 'setup'} />

              <button
                onClick={initializeBalls}
                className="w-full py-2 px-4 bg-primary hover:bg-primary/90 text-primary-foreground rounded-md font-medium transition-colors"
              >
                Start Exercise
              </button>
            </div>
          )}

          {gameState === 'ready' && (
            <div className="space-y-4">
              <div className="p-4 bg-primary/5 rounded-lg">
                <h3 className="font-semibold mb-2">Remember These Balls</h3>
                <p className="text-sm text-muted-foreground">
                  Pay attention to the highlighted balls. They will start moving in {timeLeft} seconds.
                </p>
              </div>
            </div>
          )}

          {gameState === 'selection' && (
            <div className="space-y-4">
              <div className="p-4 bg-primary/5 rounded-lg">
                <h3 className="font-semibold mb-2">Select Target Balls</h3>
                <p className="text-sm text-muted-foreground">
                  Click on the balls you were tracking, or use arrow keys and Enter to navigate.
                </p>
                <p className="mt-2 font-medium">
                  Selected: {selectedIndices.length}/{settings.numTargets}
                </p>
              </div>
              <button
                onClick={checkResults}
                disabled={selectedIndices.length !== settings.numTargets}
                className={cn(
                  "w-full py-2 px-4 rounded-md font-medium transition-colors",
                  selectedIndices.length === settings.numTargets
                    ? "bg-primary hover:bg-primary/90 text-primary-foreground"
                    : "bg-muted text-muted-foreground cursor-not-allowed"
                )}
              >
                Check Results
              </button>
            </div>
          )}

          {gameState === 'results' && (
            <div className="space-y-4">
              <div className={cn(
                "p-4 rounded-lg",
                selectedIndices.filter(index => targetIndices.includes(index)).length === settings.numTargets
                  ? "bg-success/10"
                  : "bg-destructive/10"
              )}>
                <h3 className="font-semibold mb-2">Results</h3>
                <p className="text-3xl font-bold text-center my-4">
                  {selectedIndices.filter(index => targetIndices.includes(index)).length}
                  /{settings.numTargets}
                </p>
              </div>
              <div className="space-y-2">
                <button
                  onClick={() => {
                    setSelectedIndices([]);
                    setShowingResults(false);
                    initializeBalls();
                  }}
                  className="w-full py-2 px-4 bg-primary hover:bg-primary/90 text-primary-foreground rounded-md font-medium transition-colors"
                >
                  Try Again
                </button>
                <button
                  onClick={() => {
                    setSelectedIndices([]);
                    setShowingResults(false);
                    setGameState('setup');
                    setStartTime(null);
                  }}
                  className="w-full py-2 px-4 bg-muted hover:bg-muted/90 text-muted-foreground rounded-md font-medium transition-colors"
                >
                  Return to Settings
                </button>
              </div>
            </div>
          )}


          {history.length > 0 && (
            <div className="bg-card rounded-xl p-6 shadow-lg mt-6">
              <h3 className="text-lg font-medium mb-4">History</h3>
              <div className="space-y-4">
                {history.map((item, index) => (
                  <div
                    key={item.timestamp}
                    className={cn(
                      "p-4 rounded-lg border",
                      item.results.correct === item.results.total
                        ? "bg-success/10 border-success/20"
                        : "bg-destructive/10 border-destructive/20"
                    )}
                  >
                    <div className="flex justify-between items-center mb-2">
                      <div className="space-y-1">
                        <h4 className="font-medium">
                          Score: {item.results.correct}/{item.results.total}
                        </h4>
                        <p className="text-sm text-muted-foreground">
                          {new Date(item.timestamp).toLocaleString()}
                        </p>
                      </div>
                      <button
                        onClick={() => setExpandedHistoryItem(expandedHistoryItem === index ? null : index)}
                        className="p-2 hover:bg-background/50 rounded-lg transition-colors"
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          className={cn(
                            "w-4 h-4 transition-transform",
                            expandedHistoryItem === index ? "transform rotate-180" : ""
                          )}
                        >
                          <polyline points="6 9 12 15 18 9" />
                        </svg>
                      </button>
                    </div>

                    <AnimatePresence>
                      {expandedHistoryItem === index && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.2 }}
                          className="overflow-hidden"
                        >
                          <div className="pt-4 border-t border-border mt-2 space-y-2">
                            <p className="text-sm">
                              <span className="text-muted-foreground">Total Balls:</span>{" "}
                              {item.settings.numBalls}
                            </p>
                            <p className="text-sm">
                              <span className="text-muted-foreground">Tracking Balls:</span>{" "}
                              {item.settings.numTargets}
                            </p>
                            <p className="text-sm">
                              <span className="text-muted-foreground">Ball Speed:</span>{" "}
                              {item.settings.physics?.speed || item.settings.velocity}
                            </p>
                            <p className="text-sm">
                              <span className="text-muted-foreground">Tracking Time:</span>{" "}
                              {item.settings.trackingTime}s
                            </p>
                            <button
                              onClick={() => useHistorySettings(item)}
                              className="w-full mt-4 py-2 bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg font-medium transition-colors text-sm"
                            >
                              Use These Settings
                            </button>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}