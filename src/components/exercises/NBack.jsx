import { useState, useEffect, useCallback, useRef } from 'react';
import { HelpButton } from '@/components/HelpButton';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Text, Html } from '@react-three/drei';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { getTodayDate } from '@/lib/dateUtils';
import { Settings } from './NBack/Settings';

const COLORS = ['#e74c3c', '#3498db', '#2ecc71', '#f1c40f', '#9b59b6'];
const LETTERS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I'];
const SHAPES = ['circle', 'triangle', 'square', 'pentagon', 'hexagon', 'heptagon', 'octagon'];

function Shape({ type, size = 80 }) {
  if (type === 'circle') {
    return (
      <svg width={size} height={size} className="absolute inset-0 left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
        <circle cx={size/2} cy={size/2} r={size/2 - 2} fill="currentColor" className="opacity-50" />
      </svg>
    );
  }

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
    
    // For triangle, adjust starting angle to center it
    const startAngle = type === 'triangle' ? -Math.PI / 2 : -Math.PI / 2;
    
    for (let i = 0; i < sides; i++) {
      const angle = (i * 2 * Math.PI / sides) + startAngle;
      points.push([
        size/2 * Math.cos(angle),
        size/2 * Math.sin(angle)
      ]);
    }
    return points.map(([x, y]) => `${x + size/2},${y + size/2}`).join(' ');
  };

  return (
    <svg width={size} height={size} className="absolute inset-0 left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
      <polygon points={getPoints()} fill="currentColor" className="opacity-50" />
    </svg>
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

function CubeFace({ position, rotation, color, number, shape, isActive }) {
  return (
    <group position={position} rotation={rotation}>
      <Html transform scale={0.41} style={{ width: '180px', height: '180px', pointerEvents: 'none' }}>
        <div className="relative w-full h-full flex items-center justify-center bg-[color:var(--active-color)]" style={{ '--active-color': color }}>
          {shape && (
            <div className="absolute inset-0 flex items-center justify-center">
              <Shape type={shape} size={130} />
            </div>
          )}
          <div className="relative z-10 font-bold text-5xl text-white">
            {number || (isActive ? '●' : '')}
          </div>
        </div>
      </Html>
    </group>
  );
}

function Grid3D({ position, color, isActive, number, shape }) {
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
              <>
                {/* Front face */}
                <CubeFace
                  position={[0, 0, 0.91]}
                  rotation={[0, 0, 0]}
                  color={color}
                  number={number}
                  shape={shape}
                  isActive={isActive}
                />

                {/* Back face */}
                <CubeFace
                  position={[0, 0, -0.91]}
                  rotation={[0, Math.PI, 0]}
                  color={color}
                  number={number}
                  shape={shape}
                  isActive={isActive}
                />

                {/* Right face */}
                <CubeFace
                  position={[0.91, 0, 0]}
                  rotation={[0, Math.PI / 2, 0]}
                  color={color}
                  number={number}
                  shape={shape}
                  isActive={isActive}
                />

                {/* Left face */}
                <CubeFace
                  position={[-0.91, 0, 0]}
                  rotation={[0, -Math.PI / 2, 0]}
                  color={color}
                  number={number}
                  shape={shape}
                  isActive={isActive}
                />

                {/* Top face */}
                <CubeFace
                  position={[0, 0.91, 0]}
                  rotation={[-Math.PI / 2, 0, 0]}
                  color={color}
                  number={number}
                  shape={shape}
                  isActive={isActive}
                />

                {/* Bottom face */}
                <CubeFace
                  position={[0, -0.91, 0]}
                  rotation={[Math.PI / 2, 0, 0]}
                  color={color}
                  number={number}
                  shape={shape}
                  isActive={isActive}
                />
              </>
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
              "rounded-lg transition-all duration-300 flex items-center justify-center text-2xl h-[90px]",
              active ? "bg-[color:var(--active-color)] text-white" : "bg-card dark:bg-muted border border-border",
              !active && "text-transparent"
            )}
            style={{ '--active-color': color }}
          >
            {active && (
              <div className="relative w-full h-full flex items-center justify-center">
                {shape && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Shape type={shape} />
                  </div>
                )}
                <div className="relative z-10 font-bold text-3xl" style={{ color: color }}>
                  {number}
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

export default function NBack() {
  const [nbackAnalytics, setNbackAnalytics] = useLocalStorage('nback_analytics', []);
  const [settings, setSettings] = useLocalStorage('nback-settings', {
    is3D: false,
    nBack: 2,
    shapeCount: 2,
    displayDuration: 3000,
    delayDuration: 500,
    autoRotate: false,
    audioTypes: {
      tone: false,
      letters: true,
      numbers: false
    },
    stimuli: {
      position: true,
      color: false,
      audio: true,
      shape: false,
      number: false
    },
    sections: {
      nback: true,
      stimuli: true,
      timing: false
    }
  });

  const [sequence, setSequence] = useState([]);
  const [current, setCurrent] = useState(null);
  const [score, setScore] = useState({
    position: { correct: 0, incorrect: 0 },
    color: { correct: 0, incorrect: 0 },
    audio: { correct: 0, incorrect: 0 },
    shape: { correct: 0, incorrect: 0 },
    number: { correct: 0, incorrect: 0 }
  });

  // Track which controls are toggled for the current turn
  const [toggledControls, setToggledControls] = useState({
    position: false,
    color: false,
    audio: false,
    shape: false,
    number: false
  });

  const [isPlaying, setIsPlaying] = useState(false);
  const [startTime, setStartTime] = useState(null);
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
      // Get all enabled audio types
      const enabledTypes = Object.entries(settings.audioTypes)
        .filter(([_, enabled]) => enabled)
        .map(([type]) => type);
      
      if (enabledTypes.length > 0) {
        // Randomly select one audio type
        const selectedType = enabledTypes[Math.floor(Math.random() * enabledTypes.length)];
        
        switch (selectedType) {
          case 'letters':
            stimulus.letter = LETTERS[Math.floor(Math.random() * LETTERS.length)];
            break;
          case 'numbers':
            stimulus.number = Math.floor(Math.random() * 9) + 1;
            break;
          case 'tone':
            stimulus.tone = LETTERS[Math.floor(Math.random() * LETTERS.length)];
            break;
        }
        
        // Store the selected type to know which audio to play
        stimulus.selectedAudioType = selectedType;
      }
    }

    // Always generate a number for display in shapes or when number stimulus is enabled
    if (settings.stimuli.number || settings.stimuli.shape) {
      stimulus.number = Math.floor(Math.random() * 9) + 1;
    }

    if (settings.stimuli.shape) {
      stimulus.shape = SHAPES[Math.floor(Math.random() * Math.min(settings.shapeCount, SHAPES.length))];
    }
    
    return stimulus;
  }, [settings]);

  const playSound = useCallback((stimulus) => {
    if (!stimulus.selectedAudioType) return;

    switch (stimulus.selectedAudioType) {
      case 'tone':
        if (!audioContext.current) {
          audioContext.current = new (window.AudioContext || window.webkitAudioContext)();
        }
        
        const oscillator = audioContext.current.createOscillator();
        const gainNode = audioContext.current.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.current.destination);
        
        const baseFrequency = 220;
        const letterIndex = LETTERS.indexOf(stimulus.tone);
        oscillator.frequency.value = baseFrequency * Math.pow(1.5, letterIndex);
        
        gainNode.gain.value = 0.1;
        oscillator.start();
        gainNode.gain.exponentialRampToValueAtTime(0.00001, audioContext.current.currentTime + 0.5);
        
        setTimeout(() => oscillator.stop(), 500);
        break;

      case 'letters':
        const letterUtterance = new SpeechSynthesisUtterance(stimulus.letter.toLowerCase());
        letterUtterance.rate = 0.8;
        letterUtterance.pitch = 1.0;
        window.speechSynthesis.speak(letterUtterance);
        break;

      case 'numbers':
        // Generate a different number for speaking than what's displayed
        let spokenNumber;
        do {
          spokenNumber = Math.floor(Math.random() * 9) + 1;
        } while (spokenNumber === stimulus.number);
        
        stimulus.spokenNumber = spokenNumber;
        const numberUtterance = new SpeechSynthesisUtterance(spokenNumber.toString());
        numberUtterance.rate = 0.8;
        numberUtterance.pitch = 1.0;
        window.speechSynthesis.speak(numberUtterance);
        break;
    }
  }, [settings.audioTypes]);

  useEffect(() => {
    if (!isPlaying) return;
    
    let timeoutId;
    const runTurn = () => {
      const newStimulus = generateStimulus();
      setSequence(prev => [...prev, newStimulus]);
      setCurrent(newStimulus);
      
      if (settings.stimuli.audio) {
        playSound(newStimulus);
      }

      // Clear current stimulus after display duration
      timeoutId = setTimeout(() => {
        setCurrent(null);
        // Wait for configured delay before starting next turn
        timeoutId = setTimeout(runTurn, settings.delayDuration);
      }, settings.displayDuration);
    };
    
    runTurn();
    
    return () => clearTimeout(timeoutId);
  }, [isPlaying, generateStimulus, playSound, settings.displayDuration]);

  const checkMatch = useCallback((type) => {
    if (!current || sequence.length <= settings.nBack) return;
    
    // Toggle the control state
    setToggledControls(prev => ({
      ...prev,
      [type]: !prev[type]
    }));
  }, [current, sequence.length, settings.nBack]);

  // Check matches and update scores when a new stimulus appears
  useEffect(() => {
    if (!current || sequence.length <= settings.nBack + 1) return;
    
    // Get the previous stimulus and its target
    const prevStimulus = sequence[sequence.length - 2];
    const prevTarget = sequence[sequence.length - settings.nBack - 2];
    
    if (!prevStimulus || !prevTarget) return;
    
    // Check each stimulus type for matches and update scores
    Object.entries(settings.stimuli).forEach(([type, enabled]) => {
      if (!enabled) return;
      
      let isMatch = false;
      switch (type) {
        case 'position':
          isMatch = settings.is3D
            ? prevStimulus.position.every((v, i) => v === prevTarget.position[i])
            : prevStimulus.position[0] === prevTarget.position[0] &&
              prevStimulus.position[1] === prevTarget.position[1];
          break;
        case 'color':
          isMatch = prevStimulus.color === prevTarget.color;
          break;
        case 'audio':
          isMatch = (
            (settings.audioTypes.tone && prevStimulus.tone === prevTarget.tone) ||
            (settings.audioTypes.letters && prevStimulus.letter === prevTarget.letter) ||
            (settings.audioTypes.numbers && prevStimulus.spokenNumber === prevTarget.spokenNumber)
          );
          break;
        case 'number':
          isMatch = prevStimulus.number === prevTarget.number;
          break;
        case 'shape':
          isMatch = prevStimulus.shape === prevTarget.shape;
          break;
      }

      const wasToggled = toggledControls[type];

      // Count as correct if:
      // 1. There was a match and user pressed the button (wasToggled true)
      // 2. There was no match and user didn't press the button (wasToggled false)
      const isCorrect = (isMatch && wasToggled) || (!isMatch && !wasToggled);

      setScore(prev => ({
        ...prev,
        [type]: {
          correct: prev[type].correct + (isCorrect ? 1 : 0),
          incorrect: prev[type].incorrect + (!isCorrect ? 1 : 0)
        }
      }));
    });

    // Reset toggles for next turn
    setToggledControls({
      position: false,
      color: false,
      audio: false,
      shape: false,
      number: false
    });
  }, [current, sequence, settings.nBack, settings.is3D, settings.audioTypes]);

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
      case 'g':
        if (settings.stimuli.shape) checkMatch('shape');
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
        <div className="w-[200px] mt-[56px]">
          <div className="bg-card rounded-xl p-6 shadow-lg space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold">Score</h2>
            </div>
            <div className="space-y-4">
              {Object.entries(score).map(([type, stats]) => (
                settings.stimuli[type] && (
                  <div key={type} className="space-y-1">
                    <div className="flex justify-between items-center">
                      <span className="capitalize font-medium">{type}</span>
                      <span className="text-sm text-muted-foreground">
                        {Math.round((stats.correct / Math.max(stats.correct + stats.incorrect, 1)) * 100)}%
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div className="text-green-500">
                        +{stats.correct}
                      </div>
                      <div className="text-red-500">
                        -{stats.incorrect}
                      </div>
                    </div>
                  </div>
                )
              ))}
            </div>
          </div>
        </div>
        
        <div className="flex-1 bg-card rounded-xl overflow-hidden shadow-lg">
          <div className="flex flex-col gap-8">
            <div className="relative">
              <div className="w-full h-[500px]">
                <HelpButton text="N-Back Memory Training:

Watch for patterns that match what appeared N positions back in the sequence. Press the corresponding key when you detect a match:

• Position (A Key): Same location as N steps ago
• Color (S Key): Same color as N steps ago
• Audio (D Key): Same sound as N steps ago
• Number (F Key): Same number as N steps ago
• Shape (G Key): Same shape as N steps ago

Example: In a 2-back task, if a pattern matches what appeared 2 positions ago, press the matching key." />
                {settings.is3D ? (
                  <Canvas camera={{ position: [6, 6, 6], fov: 50 }}>
                    <ambientLight intensity={0.5} />
                    <pointLight position={[10, 10, 10]} />
                    <Grid3D
                      position={current?.position}
                      color={current?.color || '#ffffff'}
                      isActive={true}
                      number={current?.number}
                      shape={current?.shape}
                    />
                    <OrbitControls
                      enableZoom={false}
                      autoRotate={settings.autoRotate}
                      autoRotateSpeed={1}
                    />
                  </Canvas>
                ) : (
                  <div className="h-full flex items-center justify-center">
                    <Grid2D
                      position={current?.position}
                      color={current?.color || '#3498db'}
                      number={current?.number}
                      shape={current?.shape}
                    />
                  </div>
                )}
              </div>
            </div>

            <div className="flex justify-center gap-4">
              {Object.entries(settings.stimuli).map(([type, enabled]) => enabled && (
                <button
                  key={type}
                  onClick={() => checkMatch(type)}
                  className={cn(
                    "px-6 py-3 rounded-lg font-medium transition-all flex flex-col items-center gap-2",
                    toggledControls[type]
                      ? "bg-primary text-primary-foreground shadow-lg scale-105 ring-2 ring-primary/50"
                      : "bg-muted hover:bg-muted/80"
                  )}
                  disabled={!isPlaying}
                >
                  <span className="capitalize">{type}</span>
                  <kbd className="px-2 py-1 bg-black/20 rounded text-sm">
                    {type === 'position' ? 'A' :
                     type === 'color' ? 'S' :
                     type === 'audio' ? 'D' :
                     type === 'number' ? 'F' :
                     'G'}
                  </kbd>
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="w-[350px]">
          <h2 className="text-2xl font-bold mb-6">{getNBackType(settings.stimuli)} N-Back</h2>
          <Settings settings={settings} onSettingsChange={setSettings} isPlaying={isPlaying} />
          <button
            onClick={() => {
              if (isPlaying) {
                setIsPlaying(false);
                
                // Calculate overall score metrics across all enabled stimuli
                const enabledScores = Object.entries(score)
                  .filter(([type]) => settings.stimuli[type]);
                
                const totals = enabledScores.reduce((acc, [_, stats]) => ({
                  correct: acc.correct + stats.correct,
                  incorrect: acc.incorrect + stats.incorrect
                }), { correct: 0, incorrect: 0 });

                const totalAttempts = totals.correct + totals.incorrect;
                const percentageCorrect = totalAttempts > 0
                  ? (totals.correct / totalAttempts) * 100
                  : 0;

                // Get active stimuli types
                const activeStimuli = Object.entries(settings.stimuli)
                  .filter(([_, enabled]) => enabled)
                  .map(([type]) => type);

                // Get active audio types
                const activeAudioTypes = Object.entries(settings.audioTypes)
                  .filter(([_, enabled]) => enabled)
                  .map(([type]) => type);

                // Record analytics to local storage
                const session = {
                  exercise: 'nback',
                  timestamp: Date.now(),
                  date: getTodayDate(),
                  duration: (Date.now() - startTime) / 1000 / 60, // Convert ms to minutes
                  metrics: {
                    nBackLevel: settings.nBack,
                    percentageCorrect,
                    activeStimuli,
                    stimuliCount: activeStimuli.length,
                    audioTypes: activeAudioTypes,
                    audioTypesCount: activeAudioTypes.length
                  }
                };
                setNbackAnalytics(prev => [...prev, session]);

                // Reset game state
                setSequence([]);
                setCurrent(null);
                setStartTime(null);
              } else {
                setIsPlaying(true);
                setStartTime(Date.now());
              }
            }}
            className={cn(
              "w-full py-2 px-4 rounded-md font-medium transition-colors mt-6",
              isPlaying
                ? "bg-destructive hover:bg-destructive/90 text-destructive-foreground"
                : "bg-primary hover:bg-primary/90 text-primary-foreground"
            )}
          >
            {isPlaying ? 'Stop' : 'Start'}
          </button>
        </div>
      </div>
    </div>
  );
}