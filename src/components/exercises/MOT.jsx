import { useState, useRef, useEffect } from 'react';
import { HelpButton } from '@/components/HelpButton';
import { Canvas } from '@react-three/fiber';
import { PerspectiveCamera, Environment } from '@react-three/drei';
import { Physics, useSphere } from '@react-three/cannon';
import { motion, AnimatePresence } from 'framer-motion';
import * as THREE from 'three';
import { cn } from '@/lib/utils';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { getTodayDate } from '@/lib/dateUtils';
import { Room } from './MOT/Room';
import { Settings } from './MOT/Settings';

function Ball({ position, isHighlighted, isSelectable, onClick, velocity, gameState, isSelected, showingResults, wasTarget }) {
  const [ref, api] = useSphere(() => ({
    mass: 1,
    position,
    args: [0.45],
    linearDamping: 0.31,
    angularDamping: 0.31,
    collisionResponse: true,
    fixedRotation: true,
    material: {
      friction: 0,
      restitution: 1
    },
    sleepTimeLimit: 0.1,
    allowSleep: false
  }));

  useEffect(() => {
    // Only start movement when in tracking state
    if (gameState === 'tracking' && velocity > 0) {
      // Initial velocity
      // Initial velocity
      const angle = Math.random() * Math.PI * 2;
      const elevation = (Math.random() - 0.5) * Math.PI;
      const speed = velocity * (0.8 + Math.random() * 0.8); // Match interval speed variation
      api.velocity.set(
        Math.cos(angle) * Math.cos(elevation) * speed,
        Math.sin(elevation) * speed,
        Math.sin(angle) * Math.cos(elevation) * speed
      );

      const interval = setInterval(() => {
        // Random direction changes
        const angle = Math.random() * Math.PI * 2;
        const elevation = (Math.random() - 0.5) * Math.PI;
        const speed = velocity * (0.8 + Math.random() * 0.8); // Varying speed
        api.velocity.set(
          Math.cos(angle) * Math.cos(elevation) * speed,
          Math.sin(elevation) * speed,
          Math.sin(angle) * Math.cos(elevation) * speed
        );
      }, 800); // More frequent updates

      return () => clearInterval(interval);
    } else {
      // Stop movement when not in tracking state
      api.velocity.set(0, 0, 0);
    }
  }, [api, velocity, gameState]);

  // Keep balls within bounds
  useEffect(() => {
    const unsubscribe = api.position.subscribe((pos) => {
      const boundsX = 5.5;  // Horizontal bounds
      const boundsY = 3.5;  // Vertical bounds (shorter)
      const boundsZ = 5.5;  // Depth bounds
      
      const bounds = [boundsX, boundsY, boundsZ];
      let needsUpdate = false;
      let newPos = [...pos];
      let newVel = [0, 0, 0];
  
      // Check each axis
      for (let i = 0; i < 3; i++) {
        if (Math.abs(pos[i]) > bounds[i]) {
          needsUpdate = true;
          // Simple bounce with fixed velocity
          newVel[i] = -Math.sign(pos[i]) * velocity * 0.8;
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
  }, [api, velocity]);

  return (
    <mesh ref={ref} onClick={isSelectable ? onClick : undefined}>
      <sphereGeometry args={[0.45, 32, 32]} />
      <meshPhongMaterial
        color={
          gameState === 'ready' && isHighlighted ? '#ff4444' :
          gameState === 'selection' && !showingResults && isSelected ? '#44ff44' :
          showingResults && isSelected && wasTarget ? '#44ff44' :
          showingResults && isSelected && !wasTarget ? '#ff4444' :
          showingResults && !isSelected && wasTarget ? '#ffff44' :
          '#ffffff'
        }
        emissive={
          gameState === 'ready' && isHighlighted ? '#ff4444' :
          gameState === 'selection' && !showingResults && isSelected ? '#44ff44' :
          showingResults && isSelected && wasTarget ? '#44ff44' :
          showingResults && isSelected && !wasTarget ? '#ff4444' :
          showingResults && !isSelected && wasTarget ? '#ffff44' :
          '#000000'
        }
        emissiveIntensity={
          (gameState === 'ready' && isHighlighted) ||
          (gameState === 'selection' && (isSelected || showingResults)) ? 0.5 : 0
        }
        shininess={70}
        specular="#ffffff"
      />
    </mesh>
  );
}


function Crosshair({ settings }) {
  if (!settings.crosshair?.enabled) return null;

  const crosshair = settings.crosshair || defaultSettings.crosshair;
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

function Scene({ balls, targetIndices, gameState, onBallClick, velocity, selectedIndices, showingResults, settings }) {
  return (
    <>
      <Environment preset="night" />
      <PerspectiveCamera
        makeDefault
        position={[0, 0, 12]}
        fov={60}
      />
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
        <Room />
        {balls.map((ball, index) => (
          <Ball
            key={index}
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

  const defaultSettings = {
    numBalls: 8,
    numTargets: 3,
    rememberTime: 3,
    trackingTime: 10,
    selectionTime: 5,
    velocity: 7,
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
    }
  };

  const [settings, setSettings] = useLocalStorage('mot-settings', defaultSettings);

  // Ensure crosshair settings exist (for users with existing settings)
  useEffect(() => {
    if (!settings.crosshair) {
      setSettings(prev => ({
        ...prev,
        crosshair: defaultSettings.crosshair
      }));
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
    // Create new balls
    const newBalls = [];
    for (let i = 0; i < settings.numBalls; i++) {
      newBalls.push({
        position: [
          (Math.random() - 0.5) * 8,
          (Math.random() - 0.5) * 5, // Reduced vertical spread
          (Math.random() - 0.5) * 8
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

  const handleBallClick = (index) => {
    if (gameState !== 'selection') return;

    setSelectedIndices(prev => {
      if (prev.includes(index)) {
        return prev.filter(i => i !== index);
      }
      if (prev.length < settings.numTargets) {
        return [...prev, index];
      }
      return prev;
    });
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
3. When they stop, click on the balls you were tracking
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
                settings={settings}
              />
            </Canvas>
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
                  Click on the balls you were tracking.
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