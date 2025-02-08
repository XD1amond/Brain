import { useState, useEffect, useCallback, useRef } from 'react';
import { Canvas } from '@react-three/fiber';
import { Text } from '@react-three/drei';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Settings } from './Settings';

const COLORS = ['#e74c3c', '#3498db', '#2ecc71', '#f1c40f', '#9b59b6'];
const LETTERS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I'];
const SHAPES = [
  'triangle',
  'square',
  'pentagon',
  'hexagon',
  'heptagon',
  'octagon'
];

function Shape({ type, size = 40 }) {
  const getPoints = () => {
    const points = [];
    const sides = {
      triangle: 3,
      square: 4,
      pentagon: 5,
      hexagon: 6,
      heptagon: 7,
      octagon: 8
    }[type] || 3;
    
    for (let i = 0; i < sides; i++) {
      const angle = (i * 2 * Math.PI / sides) - Math.PI / 2;
      points.push([
        size/2 * Math.cos(angle),
        size/2 * Math.sin(angle)
      ]);
    }
    return points.map(([x, y]) => `${x + size/2},${y + size/2}`).join(' ');
  };

  return (
    <svg width={size} height={size} className="inline-block">
      <polygon points={getPoints()} fill="currentColor" />
    </svg>
  );
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
                color={active ? color : '#4a5568'}
                opacity={active ? 1 : 0.15}
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

function Grid2D({ position, color, number, shape }) {
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
              "rounded-lg transition-all duration-300 flex items-center justify-center text-2xl font-bold h-[90px]",
              active ? "bg-primary text-primary-foreground" : "border border-border bg-card/50 text-muted-foreground dark:bg-muted"
            )}
            style={active ? { '--active-color': color } : {}}
          >
            {active && (shape ? <Shape type={shape} /> : number)}
          </div>
        );
      })}
    </div>
  );
}

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
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_350px] gap-8">
          <div className="space-y-6">
            <div className="bg-card dark:bg-gray-900 rounded-xl overflow-hidden shadow-lg">
              <div className="p-6 border-b border-border dark:border-gray-700">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-bold text-foreground dark:text-gray-100">
                    {getNBackType(settings.stimuli)} N-Back
                  </h2>
                  <button
                    onClick={() => setIsPlaying(!isPlaying)}
                    className={cn(
                      "px-6 py-2 rounded-lg font-medium transition-colors",
                      isPlaying
                        ? "bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        : "bg-primary text-primary-foreground hover:bg-primary/90"
                    )}
                  >
                    {isPlaying ? 'Stop' : 'Start'}
                  </button>
                </div>
              </div>

              <div className="h-[600px] flex items-center justify-center bg-gradient-to-b from-background to-background/50 dark:from-gray-900 dark:to-gray-900/50">
                {settings.is3D ? (
                  <Canvas camera={{ position: [6, 6, 6], fov: 50 }}>
                    <ambientLight intensity={0.5} />
                    <pointLight position={[10, 10, 10]} />
                    <Grid3D
                      position={current?.position}
                      color={current?.color || '#ffffff'}
                      isActive={true}
                    />
                  </Canvas>
                ) : (
                  <Grid2D
                    position={current?.position}
                    color={current?.color || '#3498db'}
                    number={current?.number}
                  />
                )}
              </div>
            </div>

            <div className="bg-card dark:bg-gray-900 rounded-xl p-6 shadow-lg">
              <h3 className="text-lg font-medium mb-4 text-foreground dark:text-gray-100">Performance</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {Object.entries(scores).map(([type, score]) => (
                  settings.stimuli[type] && (
                    <div key={type} className="p-4 bg-muted dark:bg-gray-800 rounded-lg">
                      <div className="text-sm font-medium text-muted-foreground dark:text-gray-400 mb-1 capitalize">
                        {type}
                      </div>
                      <div className="text-2xl font-bold text-foreground dark:text-gray-100">
                        {score.correct}/{score.total}
                        {score.total > 0 && (
                          <span className="text-sm font-normal text-muted-foreground dark:text-gray-400 ml-2">
                            ({Math.round(score.correct/score.total * 100)}%)
                          </span>
                        )}
                      </div>
                    </div>
                  )
                ))}
              </div>
            </div>
          </div>

          <Settings settings={settings} onSettingsChange={setSettings} />
        </div>
      </div>
    </div>
  );
}