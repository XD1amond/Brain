import { useState, useEffect, useCallback, useRef } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Text } from '@react-three/drei';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

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
  const [settings, setSettings] = useState({
    is3D: false,
    nBack: 2,
    shapeCount: 2,
    displayDuration: 3000,
    autoRotate: false,
    audioTypes: {
      tone: true,
      letters: false,
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
  const [scores, setScores] = useState({
    position: { correct: 0, total: 0 },
    color: { correct: 0, total: 0 },
    audio: { correct: 0, total: 0 },
    shape: { correct: 0, total: 0 },
    number: { correct: 0, total: 0 }
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

    if (settings.stimuli.shape && !settings.is3D) {
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
    
    const interval = setInterval(() => {
      const newStimulus = generateStimulus();
      setSequence(prev => [...prev, newStimulus]);
      setCurrent(newStimulus);
      
      if (settings.stimuli.audio) {
        playSound(newStimulus);
      }
    }, settings.displayDuration);
    
    return () => clearInterval(interval);
  }, [isPlaying, generateStimulus, playSound]);

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
    
    // Update scores for each toggled control from the previous turn
    Object.entries(toggledControls).forEach(([type, isToggled]) => {
      if (!isToggled) return;
      
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

      setScores(prev => ({
        ...prev,
        [type]: {
          correct: prev[type].correct + (isMatch ? 1 : 0),
          total: prev[type].total + 1
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
        <div className="flex-1 bg-card rounded-xl overflow-hidden shadow-lg">
          <div className="flex flex-col gap-8">
            {settings.is3D ? (
              <div className="w-full h-[500px]">
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
                    autoRotate={settings.autoRotate}
                    autoRotateSpeed={1}
                  />
                </Canvas>
              </div>
            ) : (
              <div className="h-[500px] flex items-center justify-center">
                <Grid2D
                  position={current?.position}
                  color={current?.color || '#3498db'}
                  number={current?.number}
                  shape={current?.shape}
                />
              </div>
            )}

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

        <div className="w-[350px] bg-card rounded-xl p-6 shadow-lg">
          <h2 className="text-2xl font-bold mb-6">{getNBackType(settings.stimuli)} N-Back</h2>
          
          <div className="space-y-4">
            {/* N-back Settings Section */}
            <div className="border rounded-lg overflow-hidden hover:border-primary/50 transition-colors">
              <button
                className="w-full p-4 text-left font-medium flex justify-between items-center hover:bg-muted/50 transition-colors"
                onClick={() => setSettings(prev => ({
                  ...prev,
                  sections: { ...prev.sections, nback: !prev.sections?.nback }
                }))}
              >
                <span>N-Back Settings</span>
                <span className="text-muted-foreground transition-transform duration-300 ease-in-out"
                      style={{ transform: settings.sections?.nback ? 'rotate(180deg)' : 'rotate(0deg)' }}>
                  ▼
                </span>
              </button>
              <div className={cn(
                "transition-all duration-300 ease-in-out origin-top",
                settings.sections?.nback ? "max-h-[500px] opacity-100 scale-100" : "max-h-0 opacity-0 scale-95 overflow-hidden"
              )}>
                <div className="p-4 space-y-4 bg-muted/20">
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

                  {settings.is3D && (
                    <label className="flex items-center space-x-3 p-3 ml-6 rounded-lg hover:bg-muted/50 transition-colors">
                      <input
                        type="checkbox"
                        checked={settings.autoRotate}
                        onChange={e => setSettings(prev => ({
                          ...prev,
                          autoRotate: e.target.checked
                        }))}
                        className="form-checkbox"
                        disabled={isPlaying}
                      />
                      <span>Auto-rotate</span>
                    </label>
                  )}

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
                </div>
              </div>
            </div>

            {/* Stimuli Settings Section */}
            <div className="border rounded-lg overflow-hidden hover:border-primary/50 transition-colors">
              <button
                className="w-full p-4 text-left font-medium flex justify-between items-center hover:bg-muted/50 transition-colors"
                onClick={() => setSettings(prev => ({
                  ...prev,
                  sections: { ...prev.sections, stimuli: !prev.sections?.stimuli }
                }))}
              >
                <span>Stimuli Settings</span>
                <span className="text-muted-foreground transition-transform duration-300 ease-in-out"
                      style={{ transform: settings.sections?.stimuli ? 'rotate(180deg)' : 'rotate(0deg)' }}>
                  ▼
                </span>
              </button>
              <div className={cn(
                "transition-all duration-300 ease-in-out origin-top",
                settings.sections?.stimuli ? "max-h-[1000px] opacity-100 scale-100" : "max-h-0 opacity-0 scale-95 overflow-hidden"
              )}>
                <div className="p-4 space-y-4 bg-muted/20">
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

                  {/* Shape count indented under shape stimuli */}
                  {settings.stimuli.shape && !settings.is3D && (
                    <div className="mt-2 ml-8 p-3 rounded-lg bg-muted/30">
                      <label className="form-label block mb-2 text-sm font-medium">Number of Shapes:</label>
                      <div className="flex items-center gap-2">
                        <input
                          type="range"
                          min="2"
                          max="6"
                          value={settings.shapeCount}
                          onChange={e => setSettings(prev => ({
                            ...prev,
                            shapeCount: parseInt(e.target.value)
                          }))}
                          className="form-range w-32"
                          disabled={isPlaying}
                        />
                        <span className="text-sm font-medium">{settings.shapeCount}</span>
                      </div>
                    </div>
                  )}

                  {/* Audio types indented under audio stimuli */}
                  {settings.stimuli.audio && (
                    <div className="mt-2 ml-8 p-3 rounded-lg bg-muted/30 space-y-2">
                      <div className="text-sm font-medium">Audio Types:</div>
                      {Object.entries({
                        tone: 'Tones',
                        letters: 'Spoken Letters',
                        numbers: 'Spoken Numbers'
                      }).map(([type, label]) => (
                        <label key={type} className="flex items-center space-x-3 p-2 rounded-lg hover:bg-muted/50 transition-colors">
                          <input
                            type="checkbox"
                            checked={settings.audioTypes[type]}
                            onChange={e => setSettings(prev => ({
                              ...prev,
                              audioTypes: {
                                ...prev.audioTypes,
                                [type]: e.target.checked
                              }
                            }))}
                            className="form-checkbox"
                            disabled={isPlaying}
                          />
                          <span className="text-sm">{label}</span>
                        </label>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Timing Settings Section */}
            <div className="border rounded-lg overflow-hidden hover:border-primary/50 transition-colors">
              <button
                className="w-full p-4 text-left font-medium flex justify-between items-center hover:bg-muted/50 transition-colors"
                onClick={() => setSettings(prev => ({
                  ...prev,
                  sections: { ...prev.sections, timing: !prev.sections?.timing }
                }))}
              >
                <span>Timing Settings</span>
                <span className="text-muted-foreground transition-transform duration-300 ease-in-out"
                      style={{ transform: settings.sections?.timing ? 'rotate(180deg)' : 'rotate(0deg)' }}>
                  ▼
                </span>
              </button>
              <div className={cn(
                "transition-all duration-300 ease-in-out origin-top",
                settings.sections?.timing ? "max-h-[500px] opacity-100 scale-100" : "max-h-0 opacity-0 scale-95 overflow-hidden"
              )}>
                <div className="p-4 space-y-4 bg-muted/20">
                  <div>
                    <label className="form-label block mb-2">Display Duration:</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        value={settings.displayDuration}
                        onChange={e => setSettings(prev => ({
                          ...prev,
                          displayDuration: Math.max(500, parseInt(e.target.value))
                        }))}
                        min="500"
                        max="10000"
                        step="100"
                        className="form-input w-24"
                        disabled={isPlaying}
                      />
                      <span className="text-sm text-muted-foreground">milliseconds</span>
                    </div>
                  </div>
                </div>
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

          </div>
        </div>
      </div>
    </div>
  );
}