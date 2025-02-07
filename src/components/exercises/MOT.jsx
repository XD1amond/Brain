import { useState, useRef, useEffect } from 'react';
import { Canvas } from '@react-three/fiber';
import { PerspectiveCamera, Environment } from '@react-three/drei';
import { Physics, useSphere } from '@react-three/cannon';
import { motion } from 'framer-motion';
import * as THREE from 'three';
import { cn } from '@/lib/utils';
import { Room } from './MOT/Room';

function Ball({ position, isHighlighted, isSelectable, onClick, velocity }) {
  const [ref, api] = useSphere(() => ({
    mass: 1,
    position,
    args: [0.5],
    linearDamping: 0.31,
    angularDamping: 0.31,
  }));

  useEffect(() => {
    const interval = setInterval(() => {
      if (Math.random() < 0.1) {
        api.velocity.set(
          (Math.random() - 0.5) * velocity,
          (Math.random() - 0.5) * velocity,
          (Math.random() - 0.5) * velocity
        );
      }
    }, 1000);

    // Keep balls within bounds
    const unsubscribe = api.position.subscribe((pos) => {
      const bounds = 4; // Half of the cube size (10/2 - ball radius)
      if (Math.abs(pos[0]) > bounds || Math.abs(pos[1]) > bounds || Math.abs(pos[2]) > bounds) {
        // If ball is out of bounds, reverse its direction
        api.velocity.set(
          -pos[0] * 0.5,
          -pos[1] * 0.5,
          -pos[2] * 0.5
        );
        // Move ball slightly inward
        api.position.set(
          Math.min(Math.max(pos[0], -bounds), bounds),
          Math.min(Math.max(pos[1], -bounds), bounds),
          Math.min(Math.max(pos[2], -bounds), bounds)
        );
      }
    });

    return () => {
      clearInterval(interval);
      unsubscribe();
    };
  }, [api, velocity]);

  return (
    <mesh ref={ref} onClick={isSelectable ? onClick : undefined}>
      <sphereGeometry args={[0.5, 32, 32]} />
      <meshStandardMaterial
        color={isHighlighted ? '#ff4444' : '#ffffff'}
        emissive={isHighlighted ? '#ff4444' : '#000000'}
        emissiveIntensity={isHighlighted ? 0.5 : 0}
        metalness={0.5}
        roughness={0.2}
      />
    </mesh>
  );
}


function Scene({ balls, targetIndices, gameState, onBallClick, velocity }) {
  return (
    <>
      <Environment preset="sunset" />
      <PerspectiveCamera
        makeDefault
        position={[0, 0, 15]}
        fov={50}
      />
      <Physics gravity={[0, 0, 0]}>
        <Room />
        {balls.map((ball, index) => (
          <Ball
            key={index}
            position={ball.position}
            isHighlighted={
              gameState === 'ready' || gameState === 'tracking'
                ? targetIndices.includes(index)
                : gameState === 'selection' && targetIndices.includes(index)
            }
            isSelectable={gameState === 'selection'}
            onClick={() => onBallClick(index)}
            velocity={velocity}
          />
        ))}
      </Physics>
    </>
  );
}

export default function MOT() {
  const [settings, setSettings] = useState({
    numBalls: 8,
    numTargets: 3,
    trackingTime: 10,
    velocity: 5,
  });
  const [gameState, setGameState] = useState('setup');
  const [balls, setBalls] = useState([]);
  const [targetIndices, setTargetIndices] = useState([]);
  const [selectedIndices, setSelectedIndices] = useState([]);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(0);

  const initializeBalls = () => {
    const newBalls = [];
    for (let i = 0; i < settings.numBalls; i++) {
      newBalls.push({
        position: [
          (Math.random() - 0.5) * 6, // Reduced initial spread
          (Math.random() - 0.5) * 6,
          (Math.random() - 0.5) * 6
        ]
      });
    }
    setBalls(newBalls);

    const newTargetIndices = [];
    while (newTargetIndices.length < settings.numTargets) {
      const index = Math.floor(Math.random() * settings.numBalls);
      if (!newTargetIndices.includes(index)) {
        newTargetIndices.push(index);
      }
    }
    setTargetIndices(newTargetIndices);
    setGameState('ready');
  };

  const startTracking = () => {
    setGameState('tracking');
    setTimeLeft(settings.trackingTime);
  };

  useEffect(() => {
    if (gameState !== 'tracking') return;

    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          setGameState('selection');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [gameState]);

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
    setGameState('results');
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 flex gap-8">
        <div className="flex-1 bg-card rounded-xl overflow-hidden shadow-lg relative">
          <div className="absolute top-4 right-4 z-10 bg-background/80 backdrop-blur-sm px-6 py-2 rounded-lg font-semibold">
            Score: <span className="text-primary">{score}</span>
          </div>
          
          {(gameState === 'tracking' || gameState === 'selection') && (
            <div className="absolute top-4 left-4 right-4 z-10">
              <div className="h-1 bg-background/20 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-primary transition-all duration-1000 ease-linear"
                  style={{ width: `${(timeLeft / settings.trackingTime) * 100}%` }}
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
                velocity={settings.velocity}
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
                  Pay attention to the highlighted balls. You will need to track them when they start moving.
                </p>
              </div>
              <button
                onClick={startTracking}
                className="w-full py-2 px-4 bg-primary hover:bg-primary/90 text-primary-foreground rounded-md font-medium transition-colors"
              >
                Start Tracking
              </button>
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