import { useState, useEffect, useCallback, useRef } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Text } from '@react-three/drei';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

const COLORS = ['#e74c3c', '#3498db', '#2ecc71', '#f1c40f', '#9b59b6'];
const LETTERS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I'];

function getNBackType(stimuli) {
  const activeCount = Object.values(stimuli).filter(Boolean).length;
  const types = {
    1: 'Single',
    2: 'Dual',
    3: 'Triple',
    4: 'Quad',
    5: 'Quint'
  };
  return types[activeCount] || '';
}

function Grid3D({ position, color, isActive }) {
  return (
    <group>
      {Array(27).fill().map((_, i) => {
        const x = (i % 3) - 1;
        const y = Math.floor((i / 3) % 3) - 1;
        const z = Math.floor(i / 9) - 1;
        const active = position && 
          x === position[0] && 
          y === position[1] && 
          z === position[2];
        
        return (
          <group key={i} position={[x * 2, y * 2, z * 2]}>
            <mesh>
              <boxGeometry args={[1.8, 1.8, 1.8]} />
              <meshPhongMaterial
                color={active ? color : '#ffffff'}
                opacity={active ? 1 : 0.1}
                transparent
                depthWrite={active}
              />
            </mesh>
            {active && (
              <Text
                position={[0, 0, 0.91]}
                fontSize={0.5}
                color={color}
                anchorX="center"
                anchorY="middle"
              >
                {isActive ? '●' : ''}
              </Text>
            )}
          </group>
        );
      })}
    </group>
  );
}

function Grid2D({ position, color, number }) {
  return (
    <div className="grid grid-cols-3 gap-2 w-[300px] h-[300px] mx-auto">
      {Array(9).fill().map((_, i) => {
        const x = i % 3;
        const y = Math.floor(i / 3);
        const active = position && 
          x === position[0] && 
          y === position[1];
        
        return (
          <div
            key={i}
            className={cn(
              "rounded-lg transition-all duration-300 flex items-center justify-center text-2xl",
              active ? "bg-[color:var(--active-color)] text-white" : "bg-card dark:bg-muted border border-border",
              !active && "text-transparent"
            )}
            style={{ '--active-color': color }}
          >
            {active && number}
          </div>
        );
      })}
    </div>
  );
}

export default function NBack() {
  const [settings, setSettings] = useState({
    is3D: false,
    nBack: 2,
    stimuli: {
      position: true,
      color: false,
      audio: false,
      shape: false,
      number: false
    }
  });

  const [sequence, setSequence] = useState([]);
  const [current, setCurrent] = useState(null);
  const [scores, setScores] = useState({
    position: { correct: 0, total: 0 },
    color: { correct: 0, total: 0 },
    audio: { correct: 0, total: 0 },
    shape: { correct: 0, total: 0 },
    number: { correct: 0, total: 0 }
  });

  const [isPlaying, setIsPlaying] = useState(false);
  const audioContext = useRef(null);

  const generateStimulus = useCallback(() => {
    const stimulus = {};
    
    if (settings.stimuli.position) {
      stimulus.position = settings.is3D
        ? [
            Math.floor(Math.random() * 3) - 1,
            Math.floor(Math.random() * 3) - 1,
            Math.floor(Math.random() * 3) - 1
          ]
        : [
            Math.floor(Math.random() * 3),
            Math.floor(Math.random() * 3)
          ];
    }
    
    if (settings.stimuli.color) {
      stimulus.color = COLORS[Math.floor(Math.random() * COLORS.length)];
    }
    
    if (settings.stimuli.audio) {
      stimulus.letter = LETTERS[Math.floor(Math.random() * LETTERS.length)];
    }
    
    if (settings.stimuli.number) {
      stimulus.number = Math.floor(Math.random() * 9) + 1;
    }
    
    return stimulus;
  }, [settings]);

  const playSound = useCallback((letter) => {
    if (!audioContext.current) {
      audioContext.current = new (window.AudioContext || window.webkitAudioContext)();
    }
    
    const oscillator = audioContext.current.createOscillator();
    const gainNode = audioContext.current.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.current.destination);
    
    const baseFrequency = 220;
    const letterIndex = LETTERS.indexOf(letter);
    oscillator.frequency.value = baseFrequency * Math.pow(1.5, letterIndex);
    
    gainNode.gain.value = 0.1;
    oscillator.start();
    gainNode.gain.exponentialRampToValueAtTime(0.00001, audioContext.current.currentTime + 0.5);
    
    setTimeout(() => oscillator.stop(), 500);
  }, []);

  useEffect(() => {
    if (!isPlaying) return;
    
    const interval = setInterval(() => {
      const newStimulus = generateStimulus();
      setSequence(prev => [...prev, newStimulus]);
      setCurrent(newStimulus);
      
      if (newStimulus.letter) {
        playSound(newStimulus.letter);
      }
    }, 3000);
    
    return () => clearInterval(interval);
  }, [isPlaying, generateStimulus, playSound]);

  const checkMatch = useCallback((type) => {
    if (!current || sequence.length <= settings.nBack) return;
    
    const target = sequence[sequence.length - settings.nBack - 1];
    let isMatch = false;
    
    switch (type) {
      case 'position':
        isMatch = settings.is3D
          ? current.position.every((v, i) => v === target.position[i])
          : current.position[0] === target.position[0] && 
            current.position[1] === target.position[1];
        break;
      case 'color':
        isMatch = current.color === target.color;
        break;
      case 'audio':
        isMatch = current.letter === target.letter;
        break;
      case 'number':
        isMatch = current.number === target.number;
        break;
      default:
        return;
    }
    
    setScores(prev => ({
      ...prev,
      [type]: {
        correct: prev[type].correct + (isMatch ? 1 : 0),
        total: prev[type].total + 1
      }
    }));
  }, [current, sequence, settings.nBack, settings.is3D]);

  const handleKeyPress = useCallback((e) => {
    if (!isPlaying) return;
    
    switch (e.key) {
      case 'a':
        if (settings.stimuli.position) checkMatch('position');
        break;
      case 's':
        if (settings.stimuli.color) checkMatch('color');
        break;
      case 'd':
        if (settings.stimuli.audio) checkMatch('audio');
        break;
      case 'f':
        if (settings.stimuli.number) checkMatch('number');
        break;
      default:
        break;
    }
  }, [isPlaying, settings.stimuli, checkMatch]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [handleKeyPress]);

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 flex gap-8">
        <div className="flex-1 bg-card rounded-xl overflow-hidden shadow-lg">
          {settings.is3D ? (
            <div className="w-full h-[600px]">
              <Canvas camera={{ position: [6, 6, 6], fov: 50 }}>
                <ambientLight intensity={0.5} />
                <pointLight position={[10, 10, 10]} />
                <Grid3D
                  position={current?.position}
                  color={current?.color || '#ffffff'}
                  isActive={true}
                />
                <OrbitControls
                  enableZoom={false}
                  autoRotate={!isPlaying}
                  autoRotateSpeed={1}
                />
              </Canvas>
            </div>
          ) : (
            <div className="h-[600px] flex items-center justify-center">
              <Grid2D
                position={current?.position}
                color={current?.color || '#3498db'}
                number={current?.number}
              />
            </div>
          )}
        </div>

        <div className="w-[350px] bg-card rounded-xl p-6 shadow-lg">
          <h2 className="text-2xl font-bold mb-6">{getNBackType(settings.stimuli)} N-Back</h2>
          
          <div className="space-y-6">
            <div className="space-y-4">
              <label className="flex items-center space-x-3 p-3 rounded-lg hover:bg-muted/50 transition-colors">
                <input
                  type="checkbox"
                  checked={settings.is3D}
                  onChange={e => setSettings(prev => ({
                    ...prev,
                    is3D: e.target.checked
                  }))}
                  className="form-checkbox"
                  disabled={isPlaying}
                />
                <span>3D Grid</span>
              </label>

              <div>
                <label className="form-label">N-Back Level:</label>
                <input
                  type="number"
                  value={settings.nBack}
                  onChange={e => setSettings(prev => ({
                    ...prev,
                    nBack: Math.max(1, parseInt(e.target.value))
                  }))}
                  min="1"
                  max="5"
                  className="form-input w-20"
                  disabled={isPlaying}
                />
              </div>

              <div className="form-group">
                <h3 className="text-sm font-medium text-muted-foreground">Stimuli:</h3>
                {Object.entries(settings.stimuli).map(([key, value]) => (
                  <label key={key} className="flex items-center space-x-3 p-3 rounded-lg hover:bg-muted/50 transition-colors">
                    <input
                      type="checkbox"
                      checked={value}
                      onChange={e => setSettings(prev => ({
                        ...prev,
                        stimuli: {
                          ...prev.stimuli,
                          [key]: e.target.checked
                        }
                      }))}
                      className="form-checkbox"
                      disabled={isPlaying}
                    />
                    <span className="capitalize">{key}</span>
                  </label>
                ))}
              </div>
            </div>

            <button
              onClick={() => {
                if (isPlaying) {
                  setIsPlaying(false);
                  setSequence([]);
                  setCurrent(null);
                } else {
                  setIsPlaying(true);
                }
              }}
              className={cn(
                "w-full py-2 px-4 rounded-md font-medium transition-colors",
                isPlaying
                  ? "bg-destructive hover:bg-destructive/90 text-destructive-foreground"
                  : "bg-primary hover:bg-primary/90 text-primary-foreground"
              )}
            >
              {isPlaying ? 'Stop' : 'Start'}
            </button>

            <div className="space-y-2">
              {Object.entries(scores).map(([type, score]) => (
                settings.stimuli[type] && (
                  <div key={type} className="flex justify-between items-center text-sm">
                    <span className="capitalize text-muted-foreground">{type}:</span>
                    <span className="font-medium text-foreground">
                      {score.correct}/{score.total}
                      {score.total > 0 && 
                        ` (${Math.round(score.correct/score.total * 100)}%)`
                      }
                    </span>
                  </div>
                )
              ))}
            </div>

            <div className="border-t border-border pt-4 space-y-2">
              <h3 className="text-sm font-medium text-muted-foreground">Controls:</h3>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>Position: <kbd className="px-2 py-1 bg-muted/50 dark:bg-muted text-foreground dark:text-foreground rounded-md border border-border shadow-sm">A</kbd></div>
                <div>Color: <kbd className="px-2 py-1 bg-muted/50 dark:bg-muted text-foreground dark:text-foreground rounded-md border border-border shadow-sm">S</kbd></div>
                <div>Audio: <kbd className="px-2 py-1 bg-muted/50 dark:bg-muted text-foreground dark:text-foreground rounded-md border border-border shadow-sm">D</kbd></div>
                <div>Number: <kbd className="px-2 py-1 bg-muted/50 dark:bg-muted text-foreground dark:text-foreground rounded-md border border-border shadow-sm">F</kbd></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}