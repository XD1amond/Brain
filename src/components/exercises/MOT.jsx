import { useState, useRef, useEffect } from 'react';
import { Canvas } from '@react-three/fiber';
import { PerspectiveCamera, Environment } from '@react-three/drei';
import { Physics, useSphere } from '@react-three/cannon';
import { motion } from 'framer-motion';
import * as THREE from 'three';
import { cn } from '@/lib/utils';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { Room } from './MOT/Room';

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


function Scene({ balls, targetIndices, gameState, onBallClick, velocity, selectedIndices, showingResults }) {
  return (
    <>
      <Environment preset="night" />
      <PerspectiveCamera
        makeDefault
        position={[0, 0, 12]}
        fov={60}
      />
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
  const [settings, setSettings] = useLocalStorage('mot-settings', {
    numBalls: 8,
    numTargets: 3,
    rememberTime: 3,
    trackingTime: 10,
    selectionTime: 5,
    velocity: 7,
  });
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
    
    // Start remember phase with timer
    setGameState('ready');
    setTimeLeft(settings.rememberTime);
  };

  // Handle game state transitions and timers
  useEffect(() => {
    if (!gameState || gameState === 'setup' || gameState === 'results') return;

    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
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
    
    // Transition to results screen after a delay
    setTimeout(() => {
      setGameState('results');
      setShowingResults(false);
    }, 2000);
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 flex gap-8">
        <div className="flex-1 bg-card rounded-xl overflow-hidden shadow-lg relative">
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
          
          <div className="w-full h-[600px]">
            <Canvas>
              <Scene
                balls={balls}
                targetIndices={targetIndices}
                gameState={gameState}
                onBallClick={handleBallClick}
                velocity={gameState === 'tracking' ? settings.velocity : 0}
                selectedIndices={selectedIndices}
                showingResults={showingResults}
              />
            </Canvas>
          </div>
        </div>

        <div className="w-[350px] bg-card rounded-xl p-6 shadow-lg">
          <h2 className="text-2xl font-bold mb-6">3D Multiple Object Tracking</h2>
          
          {gameState === 'setup' && (
            <div className="space-y-6">
              <div className="p-4 bg-primary/5 rounded-lg">
                <h3 className="font-semibold mb-2">Exercise Settings</h3>
                <p className="text-sm text-muted-foreground">
                  Configure the difficulty level and parameters for your training session.
                </p>
              </div>

              <div className="space-y-4">
                <div className="form-group">
                  <label className="form-label">Number of Balls</label>
                  <input
                    type="number"
                    value={settings.numBalls}
                    onChange={(e) => setSettings(prev => ({
                      ...prev,
                      numBalls: Math.max(4, Math.min(20, parseInt(e.target.value)))
                    }))}
                    min="4"
                    max="20"
                    className="form-input"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Target Balls</label>
                  <input
                    type="number"
                    value={settings.numTargets}
                    onChange={(e) => setSettings(prev => ({
                      ...prev,
                      numTargets: Math.max(1, Math.min(
                        settings.numBalls - 1,
                        parseInt(e.target.value)
                      ))
                    }))}
                    min="1"
                    max={settings.numBalls - 1}
                    className="form-input"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Tracking Time (s)</label>
                  <input
                    type="number"
                    value={settings.trackingTime}
                    onChange={(e) => setSettings(prev => ({
                      ...prev,
                      trackingTime: Math.max(5, Math.min(30, parseInt(e.target.value)))
                    }))}
                    min="5"
                    max="30"
                    className="form-input"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Remember Time (s)</label>
                  <input
                    type="number"
                    value={settings.rememberTime}
                    onChange={(e) => setSettings(prev => ({
                      ...prev,
                      rememberTime: Math.max(1, Math.min(10, parseInt(e.target.value)))
                    }))}
                    min="1"
                    max="10"
                    className="form-input"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Selection Time (s)</label>
                  <input
                    type="number"
                    value={settings.selectionTime}
                    onChange={(e) => setSettings(prev => ({
                      ...prev,
                      selectionTime: Math.max(3, Math.min(10, parseInt(e.target.value)))
                    }))}
                    min="3"
                    max="10"
                    className="form-input"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Ball Speed</label>
                  <input
                    type="number"
                    value={settings.velocity}
                    onChange={(e) => setSettings(prev => ({
                      ...prev,
                      velocity: Math.max(1, Math.min(10, parseInt(e.target.value)))
                    }))}
                    min="1"
                    max="10"
                    className="form-input"
                  />
                </div>
              </div>

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
              <button
                onClick={() => {
                  setSelectedIndices([]);
                  setShowingResults(false);
                  setGameState('setup');
                }}
                className="w-full py-2 px-4 bg-primary hover:bg-primary/90 text-primary-foreground rounded-md font-medium transition-colors"
              >
                Try Again
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}