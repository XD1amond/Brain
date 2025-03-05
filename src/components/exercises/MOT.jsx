import { useState, useRef, useEffect, useMemo } from 'react';
import { HelpButton } from '@/components/HelpButton';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { PerspectiveCamera, Environment, Effects } from '@react-three/drei';
import { Physics, useSphere } from '@react-three/cannon';
import { motion, AnimatePresence } from 'framer-motion';
import * as THREE from 'three';
import { cn } from '@/lib/utils';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { getTodayDate } from '@/lib/dateUtils';
import { Room } from './MOT/Room';
import { Settings } from './MOT/Settings';

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
  
  // Calculate actual velocity based on min/max settings
  const actualVelocity = velocity > 0
    ? Math.max(physics.minSpeed, Math.min(physics.maxSpeed, velocity))
    : 0;
  
  // Set up physics with configurable density
  const [ref, api] = useSphere(() => ({
    mass: physics.ballDensity,
    position,
    args: [ballSize],
    linearDamping: 0.31,
    angularDamping: 0.31,
    collisionResponse: physics.collisionEnabled,
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
        // Regular pattern - occasional random direction changes
        interval = setInterval(() => {
          const angle = Math.random() * Math.PI * 2;
          const elevation = (Math.random() - 0.5) * Math.PI;
          const speed = actualVelocity * (0.8 + Math.random() * 0.4);
          api.velocity.set(
            Math.cos(angle) * Math.cos(elevation) * speed,
            Math.sin(elevation) * speed,
            Math.sin(angle) * Math.cos(elevation) * speed
          );
        }, 2000);
      } else if (physics.movementPattern === 'globalJitter') {
        // Global jitter - all balls change direction simultaneously
        // This is handled in the Scene component
      } else if (physics.movementPattern === 'individualJitter') {
        // Individual jitter - each ball changes independently
        const jitterFrequency = 1000 / (physics.jitterIntensity || 5);
        interval = setInterval(() => {
          if (Math.random() < 0.3) { // 30% chance to change direction
            const angle = Math.random() * Math.PI * 2;
            const elevation = (Math.random() - 0.5) * Math.PI;
            const speed = actualVelocity * (0.8 + Math.random() * 0.4);
            api.velocity.set(
              Math.cos(angle) * Math.cos(elevation) * speed,
              Math.sin(elevation) * speed,
              Math.sin(angle) * Math.cos(elevation) * speed
            );
          }
        }, jitterFrequency);
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
  
  // Handle ball appearance distractions
  useFrame(() => {
    if (currentGameState === 'tracking') {
      // Random color changes
      if (distractions.colorChanges && Math.random() < 0.005) {
        const r = Math.floor(Math.random() * 255);
        const g = Math.floor(Math.random() * 255);
        const b = Math.floor(Math.random() * 255);
        setBallColor(`rgb(${r}, ${g}, ${b})`);
      } else if (!distractions.colorChanges) {
        setBallColor('#ffffff');
      }
      
      // Random size changes
      if (distractions.sizeChanges && Math.random() < 0.005) {
        const newSize = defaultSize * (0.8 + Math.random() * 0.4);
        setBallSize(newSize);
        api.setRadius(newSize);
      } else if (!distractions.sizeChanges && ballSize !== defaultSize) {
        setBallSize(defaultSize);
        api.setRadius(defaultSize);
      }
    }
  });
  
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

  return (
    <mesh
      ref={ref}
      onClick={isSelectable ? onClick : undefined}
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
  const { camera } = useThree();
  const rotationRef = useRef({ x: 0, y: 0, z: 0 });
  const directionRef = useRef({ x: 1, y: 1, z: 1 });
  
  // Get current game state from settings if not provided directly
  const currentGameState = settings?.gameState || gameState;
  
  // Get rotation settings for current phase
  const getRotationSettings = () => {
    if (!settings.rotation) return { x: 0, y: 0, z: 0, xBoomerang: 0, yBoomerang: 0, zBoomerang: 0 };
    
    if (currentGameState === 'ready') {
      return settings.rotation.selection || { x: 0, y: 0.5, z: 0, xBoomerang: 0, yBoomerang: 1, zBoomerang: 0 };
    } else if (currentGameState === 'tracking') {
      return settings.rotation.tracking || { x: 0, y: 0, z: 0, xBoomerang: 0, yBoomerang: 0, zBoomerang: 0 };
    } else if (currentGameState === 'selection') {
      return settings.rotation.memorization || { x: 0, y: 0.5, z: 0, xBoomerang: 0, yBoomerang: 1, zBoomerang: 0 };
    }
    
    return { x: 0, y: 0, z: 0, xBoomerang: 0, yBoomerang: 0, zBoomerang: 0 };
  };
  
  // Track previous game state to detect transitions
  const prevGameStateRef = useRef(currentGameState);
  
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
      // If transitioning from tracking to selection (end of boomerang mode)
      if (prevGameStateRef.current === 'tracking' && currentGameState === 'selection') {
        // Snap back to head-on view
        rotationRef.current = { x: 0, y: 0, z: 0 };
        camera.position.set(0, 0, 12);
        camera.lookAt(0, 0, 0);
      }
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

// Screen flash effect for distractions (DOM-based, not using R3F hooks)
function ScreenFlash({ settings, gameState }) {
  const [flashOpacity, setFlashOpacity] = useState(0);
  const [flashColor, setFlashColor] = useState('#ffffff');
  
  // Use regular React useEffect + setInterval instead of useFrame
  useEffect(() => {
    if (gameState !== 'tracking' || !settings?.distractions?.screenFlash) return;
    
    // Check for flash effect every 50ms (approximately similar to frame rate)
    const interval = setInterval(() => {
      if (Math.random() < 0.01) { // Adjusted probability for interval-based checking
        // Random color or white
        const r = Math.floor(Math.random() * 255);
        const g = Math.floor(Math.random() * 255);
        const b = Math.floor(Math.random() * 255);
        setFlashColor(Math.random() < 0.5 ? '#ffffff' : `rgb(${r}, ${g}, ${b})`);
        setFlashOpacity(0.3 + Math.random() * 0.4); // 30-70% opacity
        
        // Reset after a short time
        setTimeout(() => {
          setFlashOpacity(0);
        }, 100 + Math.random() * 150); // 100-250ms flash
      }
    }, 50);
    
    return () => clearInterval(interval);
  }, [gameState, settings?.distractions?.screenFlash]);
  
  if (flashOpacity <= 0) return null;
  
  return (
    <div
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: flashColor,
        opacity: flashOpacity,
        pointerEvents: 'none',
        zIndex: 10
      }}
    />
  );
}

// 3D Glasses effect
function ThreeDGlassesEffect({ enabled }) {
  if (!enabled) return null;
  
  // Import AnaglyphEffect from three.js examples
  useEffect(() => {
    if (enabled) {
      // We'll use a different approach for 3D glasses
      // Instead of using the <anaglyph> component which isn't available
      // We'll apply a red/cyan color filter to the scene
      const canvas = document.querySelector('canvas');
      if (canvas) {
        canvas.style.filter = 'saturate(0) contrast(1.1)';
        canvas.style.animation = 'anaglyphEffect 5s infinite alternate';
        
        // Add the CSS animation if it doesn't exist
        if (!document.getElementById('anaglyph-style')) {
          const style = document.createElement('style');
          style.id = 'anaglyph-style';
          style.textContent = `
            @keyframes anaglyphEffect {
              0% { filter: saturate(0) contrast(1.1) hue-rotate(0deg); }
              100% { filter: saturate(0) contrast(1.1) hue-rotate(180deg); }
            }
          `;
          document.head.appendChild(style);
        }
      }
    } else {
      // Remove the effect when disabled
      const canvas = document.querySelector('canvas');
      if (canvas) {
        canvas.style.filter = '';
        canvas.style.animation = '';
      }
      
      // Remove the style element when not needed
      const style = document.getElementById('anaglyph-style');
      if (style) {
        document.head.removeChild(style);
      }
    }
    
    return () => {
      // Cleanup
      const canvas = document.querySelector('canvas');
      if (canvas) {
        canvas.style.filter = '';
        canvas.style.animation = '';
      }
      
      const style = document.getElementById('anaglyph-style');
      if (style) {
        document.head.removeChild(style);
      }
    };
  }, [enabled]);
  
  return null;
}

// Global jitter controller for all balls
function GlobalJitterController({ settings, gameState, api }) {
  // Get current game state from settings if not provided directly
  const currentGameState = settings?.gameState || gameState;
  
  useEffect(() => {
    if (currentGameState !== 'tracking') return;
    
    const physics = settings.physics || {};
    if (physics.movementPattern !== 'globalJitter') return;
    
    const jitterFrequency = 1000 / (physics.jitterIntensity || 5);
    const interval = setInterval(() => {
      if (api && api.length > 0) {
        // Apply the same random direction to all balls
        const angle = Math.random() * Math.PI * 2;
        const elevation = (Math.random() - 0.5) * Math.PI;
        const velocity = Math.max(physics.minSpeed || 5, Math.min(physics.maxSpeed || 10, settings.velocity));
        const speed = velocity * (0.8 + Math.random() * 0.4);
        
        api.forEach(ballApi => {
          ballApi.velocity.set(
            Math.cos(angle) * Math.cos(elevation) * speed,
            Math.sin(elevation) * speed,
            Math.sin(angle) * Math.cos(elevation) * speed
          );
        });
      }
    }, jitterFrequency);
    
    return () => clearInterval(interval);
  }, [api, currentGameState, settings.physics, settings.velocity]);
  
  return null;
}

function Scene({ balls, targetIndices, gameState, onBallClick, velocity, selectedIndices, showingResults, settings, highlightedBallIndex, onKeyNavigation }) {
  // Collect ball APIs for global jitter
  const ballApiRefs = useRef([]);
  
  // Set up key navigation
  useEffect(() => {
    if (gameState !== 'selection' || showingResults) return;
    
    const handleKeyDown = (e) => {
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Enter'].includes(e.key)) {
        e.preventDefault();
        onKeyNavigation(e.key);
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [gameState, showingResults, onKeyNavigation]);
  
  return (
    <>
      <Environment preset="night" />
      <PerspectiveCamera
        makeDefault
        position={[0, 0, 12]}
        fov={60}
      />
      <CameraController settings={settings} gameState={gameState} />
      <ThreeDGlassesEffect enabled={settings.threeDGlasses} />
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
    numTargets: 3,
    rememberTime: 3,
    trackingTime: 10,
    selectionTime: 5,
    velocity: 7,
    advancedMode: false,
    physics: {
      ballDensity: 1,
      minSpeed: 5,
      maxSpeed: 10,
      collisionEnabled: true,
      movementPattern: 'regular',
      jitterIntensity: 5
    },
    distractions: {
      colorChanges: false,
      sizeChanges: false,
      screenFlash: false,
      wallColorChanges: false
    },
    rotation: {
      selection: { x: 0, y: 0.5, z: 0, xBoomerang: 0, yBoomerang: 0.5, zBoomerang: 0 },
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
    threeDGlasses: false
  };

  const [settings, setSettings] = useLocalStorage('mot-settings', defaultSettings);

  // Ensure all settings exist (for users with existing settings)
  useEffect(() => {
    const updatedSettings = { ...defaultSettings };
    
    // Preserve user's existing settings
    if (settings.numBalls) updatedSettings.numBalls = settings.numBalls;
    if (settings.numTargets) updatedSettings.numTargets = settings.numTargets;
    if (settings.rememberTime) updatedSettings.rememberTime = settings.rememberTime;
    if (settings.trackingTime) updatedSettings.trackingTime = settings.trackingTime;
    if (settings.selectionTime) updatedSettings.selectionTime = settings.selectionTime;
    if (settings.velocity) updatedSettings.velocity = settings.velocity;
    if (settings.crosshair) updatedSettings.crosshair = { ...defaultSettings.crosshair, ...settings.crosshair };
    
    // Only update if there are missing settings
    if (!settings.physics || !settings.rotation || !settings.room || !settings.distractions) {
      setSettings(updatedSettings);
    }
  }, []);
  const [gameState, setGameState] = useState('setup');
  const [showingResults, setShowingResults] = useState(false);
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

  const timer = setInterval(() => {
    setTimeLeft(prev => {
      if (prev <= 0) {
        // Transition states
        if (gameState === 'ready') {
          setGameState('tracking');
          return settings.trackingTime;
        } else if (gameState === 'tracking') {
          setGameState('selection');
          return settings.selectionTime;
        } else if (gameState === 'selection') {
          checkResults();
          return 0;
        }
        return 0;
      }
      return prev - 1;
    });
  }, 1000);

  return () => clearInterval(timer);
}, [gameState, settings.trackingTime, settings.rememberTime]);

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
      const session = {
        exercise: 'mot',
        timestamp: Date.now(),
        date: getTodayDate(),
        duration,
        metrics: {
          percentageCorrect: (correct / settings.numTargets) * 100,
          totalBalls: settings.numBalls,
          trackingBalls: settings.numTargets
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
          percentageCorrect: (correct / settings.numTargets) * 100
        }
      };
      setHistory(prev => [historyItem, ...prev]);
    }
    setStartTime(null);
  };

  const useHistorySettings = (historyItem) => {
    setSettings(historyItem.settings);
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
                  className="h-full bg-primary transition-all duration-1000 ease-linear"
                  style={{
                    width: `${(timeLeft / (
                      gameState === 'ready' ? settings.rememberTime :
                      gameState === 'tracking' ? settings.trackingTime :
                      settings.selectionTime
                    )) * 100}%`
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
                velocity={gameState === 'tracking' ? settings.velocity : 0}
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
                              {item.settings.velocity}
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