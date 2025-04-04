import { useState, useEffect, useCallback, useRef } from 'react';
import { HelpButton } from '@/components/HelpButton';
import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { getTodayDate } from '@/lib/dateUtils';
import { Settings } from './NBack/Settings';
import { Grid2D, Grid3D } from './NBack/Grid';
import { History } from './NBack/History';

const COLORS = ['#e74c3c', '#3498db', '#2ecc71', '#f1c40f', '#9b59b6'];
const LETTERS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I'];
const SHAPES = ['circle', 'triangle', 'square', 'pentagon', 'hexagon', 'heptagon', 'octagon'];

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
  const [nbackHistory, setNbackHistory] = useLocalStorage('nback_history', []);
  const [focusMode, setFocusMode] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [showMobileSettings, setShowMobileSettings] = useState(false);
  
  // Function to delete a history session
  const handleDeleteSession = useCallback((timestamp) => {
    setNbackHistory(prev => prev.filter(session => session.timestamp !== timestamp));
  }, [setNbackHistory]);
  
  // Check if device is mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    // Initial check
    checkMobile();
    
    // Add resize listener
    window.addEventListener('resize', checkMobile);
    
    // Cleanup
    return () => window.removeEventListener('resize', checkMobile);
  }, []);
  
  const [settings, setSettings] = useLocalStorage('nback-settings', {
    is3D: false,
    use3DShapes: true, // New setting for 3D shapes when in 3D mode
    nBack: 1,
    useIndividualNBacks: false,
    individualNBacks: {
      position: 0,
      audio: 0,
      number: 0,
      color: 0,
      shape: 0
    },
    // Sets settings
    setsEnabled: true,
    setLength: 20,
    // Auto progression settings
    autoProgressionEnabled: true,
    thresholdAdvance: 80,
    thresholdFallback: 50,
    thresholdFallbackSessions: 3,
    progressCount: 0, // Track consecutive sessions below threshold
    thresholdAdvanceSessions: 1, // Number of consecutive sessions above threshold before increasing level
    advanceCount: 0, // Track consecutive sessions above threshold
    shapeCount: 6,
    displayDuration: 3000,
    randomizeDisplayDuration: false,
    displayDurationMin: 2000,
    displayDurationMax: 3000,
    delayDuration: 500,
    randomizeDelayDuration: false,
    delayDurationMin: 400,
    delayDurationMax: 600,
    autoRotate: false,
    rotationSpeedX: 1,
    rotationSpeedY: 1,
    rotationSpeedZ: 1,
    audioTypes: {
      tone: false,
      letters: true,
      numbers: false
    },
    stimuli: {
      position: true,
      audio: true,
      number: false,
      color: false,
      shape: false
    },
    sections: {
      nback: true,
      stimuli: true,
      timing: false
    },
    focusElements: {
      title: false,
      settings: false,
      score: true,
      history: false,
      stimuliButtons: true,
      turnCounter: true
    },
    guaranteedMatchesChance: 0.125,
    interferenceChance: 0.125,
    disableTurnDisplay: false,
    // Keybind settings
    positionKey: 'a',
    audioKey: 'l',
    numberKey: 'd',
    colorKey: 'f',
    shapeKey: 'j',
    startStopKey: 'Space'
  });

  const [sequence, setSequence] = useState([]);
  const sequenceRef = useRef([]);
  useEffect(() => {
    sequenceRef.current = sequence;
  }, [sequence]);
  const [current, setCurrent] = useState(null);
  const [score, setScore] = useState({
    position: { correct: 0, incorrect: 0 },
    audio: { correct: 0, incorrect: 0 },
    number: { correct: 0, incorrect: 0 },
    color: { correct: 0, incorrect: 0 },
    shape: { correct: 0, incorrect: 0 }
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
  const [rotationTime, setRotationTime] = useState(0);
  const [rotationOffset, setRotationOffset] = useState(0);
  const [cubeRotation, setCubeRotation] = useState([0, 0, 0]);
  
  // Reset rotation when the reset button is clicked
  useEffect(() => {
    if (settings.resetRotation) {
      setCubeRotation([0, 0, 0]);
      setRotationOffset(Date.now() * 0.001);
    }
  }, [settings.resetRotation]);
  
  // Update rotation offset when auto-rotate is enabled or rotation speeds change
  useEffect(() => {
    setRotationOffset(Date.now() * 0.001);
  }, [settings.autoRotate, settings.rotationSpeedX, settings.rotationSpeedY, settings.rotationSpeedZ]);
  
  // Animation loop for smooth rotation
  useEffect(() => {
    if (!settings.is3D || !settings.autoRotate) return;
    
    let animationFrameId;
    const animate = () => {
      setRotationTime((Date.now() * 0.001) - rotationOffset);
      animationFrameId = requestAnimationFrame(animate);
    };
    
    animationFrameId = requestAnimationFrame(animate);
    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [settings.is3D, settings.autoRotate, rotationOffset]);

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

    // Generate a number only when number stimulus is enabled
    if (settings.stimuli.number) {
      stimulus.number = Math.floor(Math.random() * 9) + 1;
    }
    
    if (settings.stimuli.shape) {
      stimulus.shape = SHAPES[Math.floor(Math.random() * Math.min(settings.shapeCount, SHAPES.length))];
    }
    
    // Implement forced matches using the advanced "Guaranteed Matches Chance"
    if (settings.guaranteedMatchesChance > 0 && sequenceRef.current.length > 0) {
      const forcedStimulus = { ...stimulus };
      let anyForced = false;
      
      if (settings.stimuli.position && sequenceRef.current.length >= getNBackForType('position')) {
        if (Math.random() < settings.guaranteedMatchesChance) {
          const n = getNBackForType('position');
          forcedStimulus.position = sequenceRef.current[sequenceRef.current.length - n].position;
          console.log("Forced match applied for position");
          anyForced = true;
        }
      }
      if (settings.stimuli.color && sequenceRef.current.length >= getNBackForType('color')) {
        if (Math.random() < settings.guaranteedMatchesChance) {
          const n = getNBackForType('color');
          forcedStimulus.color = sequenceRef.current[sequenceRef.current.length - n].color;
          console.log("Forced match applied for color");
          anyForced = true;
        }
      }
      if (settings.stimuli.number && sequenceRef.current.length >= getNBackForType('number')) {
        if (Math.random() < settings.guaranteedMatchesChance) {
          const n = getNBackForType('number');
          forcedStimulus.number = sequenceRef.current[sequenceRef.current.length - n].number;
          console.log("Forced match applied for number");
          anyForced = true;
        }
      }
      if (settings.stimuli.shape && sequenceRef.current.length >= getNBackForType('shape')) {
        if (Math.random() < settings.guaranteedMatchesChance) {
          const n = getNBackForType('shape');
          forcedStimulus.shape = sequenceRef.current[sequenceRef.current.length - n].shape;
          console.log("Forced match applied for shape");
          anyForced = true;
        }
      }
      if (settings.stimuli.audio && sequenceRef.current.length >= getNBackForType('audio')) {
        if (Math.random() < settings.guaranteedMatchesChance) {
          const n = getNBackForType('audio');
          const prevAudio = sequenceRef.current[sequenceRef.current.length - n];
          const audioType = stimulus.selectedAudioType;
          if (audioType === 'letters' && prevAudio.letter) {
            forcedStimulus.letter = prevAudio.letter;
            console.log("Forced match applied for audio (letters)");
            anyForced = true;
          } else if (audioType === 'numbers' && prevAudio.spokenNumber) {
            forcedStimulus.spokenNumber = prevAudio.spokenNumber;
            console.log("Forced match applied for audio (numbers)");
            anyForced = true;
          } else if (audioType === 'tone' && prevAudio.tone) {
            forcedStimulus.tone = prevAudio.tone;
            console.log("Forced match applied for audio (tone)");
            anyForced = true;
          }
        }
      }
      if (anyForced) {
        return forcedStimulus;
      }
    }
    
    // Implement interference: introduce near-miss stimuli to train resolution of cognitive interference.
    if (sequenceRef.current.length > 0) {
      const interferenceStimulus = { ...stimulus };
      let interferenceApplied = false;
      
      // For each stimulus type, apply interference if conditions met.
      if (settings.stimuli.position && sequenceRef.current.length >= getNBackForType('position') && getNBackForType('position') > 1 && Math.random() < settings.interferenceChance) {
        const n = getNBackForType('position');
        const prevPos = sequenceRef.current[sequenceRef.current.length - n].position;
        // For 2D grid: adjust each coordinate by ±1 modulo 3.
        interferenceStimulus.position = prevPos.map(coord => (coord + (Math.random() < 0.5 ? -1 : 1) + 3) % 3);
        interferenceApplied = true;
        console.log("Interference applied for position");
      }
      
      if (settings.stimuli.number && sequenceRef.current.length >= getNBackForType('number') && getNBackForType('number') > 1) {
        const n = getNBackForType('number');
        const prevNumber = sequenceRef.current[sequenceRef.current.length - n].number;
        // Adjust number by ±1 within range 1-9.
        let newNumber = prevNumber + (Math.random() < 0.5 ? -1 : 1);
        if (newNumber < 1) newNumber = 1;
        if (newNumber > 9) newNumber = 9;
        interferenceStimulus.number = newNumber;
        interferenceApplied = true;
        console.log("Interference applied for number");
      }
      
      if (settings.stimuli.shape && sequenceRef.current.length >= getNBackForType('shape') && getNBackForType('shape') > 1) {
        const n = getNBackForType('shape');
        const prevShape = sequenceRef.current[sequenceRef.current.length - n].shape;
        // Choose a different shape from the previous one.
        const availableShapes = SHAPES.filter(s => s !== prevShape);
        if (availableShapes.length > 0) {
          interferenceStimulus.shape = availableShapes[Math.floor(Math.random() * availableShapes.length)];
          interferenceApplied = true;
          console.log("Interference applied for shape");
        }
      }
      
      if (settings.stimuli.audio && sequenceRef.current.length >= getNBackForType('audio') && getNBackForType('audio') > 1) {
        const n = getNBackForType('audio');
        const prevAudio = sequenceRef.current[sequenceRef.current.length - n];
        const audioType = stimulus.selectedAudioType;
        if (audioType === 'letters' && prevAudio.letter) {
          // Shift letter to next in sequence.
          const index = LETTERS.indexOf(prevAudio.letter);
          interferenceStimulus.letter = LETTERS[(index + 1) % LETTERS.length];
          interferenceApplied = true;
          console.log("Interference applied for audio (letters)");
        } else if (audioType === 'numbers' && prevAudio.spokenNumber) {
          let newNum = prevAudio.spokenNumber + (Math.random() < 0.5 ? -1 : 1);
          if(newNum < 1) newNum = 1;
          if(newNum > 9) newNum = 9;
          interferenceStimulus.spokenNumber = newNum;
          interferenceApplied = true;
          console.log("Interference applied for audio (numbers)");
        } else if (audioType === 'tone' && prevAudio.tone) {
          const index = LETTERS.indexOf(prevAudio.tone);
          interferenceStimulus.tone = LETTERS[(index + 1) % LETTERS.length];
          interferenceApplied = true;
          console.log("Interference applied for audio (tone)");
        }
      }
      
      if (interferenceApplied) {
        return interferenceStimulus;
      }
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

  // Use refs to hold stable settings and functions so that they aren't recalculated on every render.
  const settingsRef = useRef(settings);
  const handleKeyPressRef = useRef(null);
  
  useEffect(() => {
    settingsRef.current = settings;
  }, [settings]);
  
  const getNBackForType = useCallback((type) => {
    if (!settings.useIndividualNBacks || !settings.individualNBacks[type] || settings.individualNBacks[type] === 0) {
      return settings.nBack;
    }
    return settings.individualNBacks[type];
  }, [settings.useIndividualNBacks, settings.individualNBacks, settings.nBack]);

  const checkMatch = useCallback((type) => {
    const nBackLevel = getNBackForType(type);
    if (!current || sequence.length <= nBackLevel) return;
    
    // Toggle the control state
    setToggledControls(prev => ({
      ...prev,
      [type]: !prev[type]
    }));
  }, [current, sequence.length, getNBackForType]);
  
  // Define handleKeyPress function
  const handleKeyPress = useCallback((e) => {
    const key = e.key.toLowerCase();
    
    // Get all keybinds
    const keybinds = {
      startStop: settings.startStopKey?.toLowerCase() || 'space',
      position: settings.positionKey?.toLowerCase() || 'a',
      audio: settings.audioKey?.toLowerCase() || 'l',
      number: settings.numberKey?.toLowerCase() || 'd',
      color: settings.colorKey?.toLowerCase() || 'f',
      shape: settings.shapeKey?.toLowerCase() || 'j'
    };

    // Check if the pressed key matches any of our keybinds
    const isKeybind = Object.values(keybinds).includes(key) ||
      (key === ' ' && keybinds.startStop === 'space') ||
      key === 'e';

    // Prevent default behavior if it's one of our keybinds
    if (isKeybind) {
      e.preventDefault();
    }
    
    // Handle focus mode toggle with 'e' key
    if (key === 'e') {
      setFocusMode(prev => !prev);
      return;
    }
    
    // Handle start/stop key
    if (key === ' ' && keybinds.startStop === 'space' ||
        key === keybinds.startStop) {
      if (isPlaying) {
        setIsPlaying(false);
        
        // Reset toggled controls when stopping the game
        setToggledControls({
          position: false,
          color: false,
          audio: false,
          shape: false,
          number: false
        });
        
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

        // Handle auto progression if enabled
        if (settings.autoProgressionEnabled && totalAttempts > 0) {
          // Make sure progressCount is initialized
          let newSettings = {
            ...settings,
            progressCount: settings.progressCount || 0
          };
          
          if (percentageCorrect >= settings.thresholdAdvance) {
            // Increment advance count for consecutive sessions above threshold
            const currentAdvanceCount = Number(settings.advanceCount || 0);
            const advanceThreshold = Number(settings.thresholdAdvanceSessions || 1);
            newSettings.advanceCount = currentAdvanceCount + 1;
            
            // Force update settings immediately to ensure UI reflects the change
            setSettings({...newSettings});
            
            // If we've reached the threshold for consecutive sessions above threshold
            if (Number(newSettings.advanceCount) >= advanceThreshold) {
              // Increase n-back level
              newSettings.nBack = settings.nBack + 1;
              
              // If using individual n-back levels, increase those that are active
              if (settings.useIndividualNBacks) {
                const newIndividualNBacks = { ...settings.individualNBacks };
                Object.entries(settings.stimuli)
                  .filter(([_, enabled]) => enabled)
                  .forEach(([type]) => {
                    if (newIndividualNBacks[type] > 0) {
                      newIndividualNBacks[type] += 1;
                    }
                  });
                newSettings.individualNBacks = newIndividualNBacks;
              }
              
              // Log level increase
              console.log(`Great job! N-Back level increased to ${newSettings.nBack}`);
              
              // Reset advance count
              newSettings.advanceCount = 0;
            }
            
            // Reset fallback count
            newSettings.progressCount = 0;
          }
          else if (percentageCorrect < settings.thresholdFallback) {
            // Increment progress count for consecutive sessions below threshold
            const currentCount = Number(settings.progressCount || 0);
            const threshold = Number(settings.thresholdFallbackSessions || 3);
            newSettings.progressCount = currentCount + 1;
            
            // Reset advance count since we're below threshold
            newSettings.advanceCount = 0;
            
            // Force update settings immediately to ensure UI reflects the change
            setSettings({...newSettings});
            
            // If we've reached the threshold for consecutive sessions below threshold
            if (Number(newSettings.progressCount) >= Number(settings.thresholdFallbackSessions || 3)) {
              // Decrease n-back level, but not below 1
              if (newSettings.nBack > 1) {
                newSettings.nBack = settings.nBack - 1;
                
                // If using individual n-back levels, decrease those that are active
                if (settings.useIndividualNBacks) {
                  const newIndividualNBacks = { ...settings.individualNBacks };
                  Object.entries(settings.stimuli)
                    .filter(([_, enabled]) => enabled)
                    .forEach(([type]) => {
                      if (newIndividualNBacks[type] > 1) {
                        newIndividualNBacks[type] -= 1;
                      }
                    });
                  newSettings.individualNBacks = newIndividualNBacks;
                }
                
                // Log level decrease
                console.log(`N-Back level decreased to ${newSettings.nBack}`);
              }
              
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
          setSettings({...newSettings});
        }

        // Get active stimuli types
        const activeStimuli = Object.entries(settings.stimuli)
          .filter(([_, enabled]) => enabled)
          .map(([type]) => type);

        // Get active audio types
        const activeAudioTypes = Object.entries(settings.audioTypes)
          .filter(([_, enabled]) => enabled)
          .map(([type]) => type);

        // Record session data to local storage with all stimuli
        const session = {
          exercise: 'nback',
          timestamp: Date.now(),
          date: getTodayDate(),
          duration: (Date.now() - startTime) / 1000 / 60,
          stimuli: sequence, // Store all stimuli for history playback
          metrics: {
            nBackLevel: settings.nBack,
            useIndividualNBacks: settings.useIndividualNBacks,
            individualNBacks: settings.useIndividualNBacks ?
              Object.fromEntries(
                activeStimuli.map(type => [
                  type,
                  settings.individualNBacks[type] || settings.nBack
                ])
              ) : null,
            percentageCorrect,
            activeStimuli,
            stimuliCount: activeStimuli.length,
            audioTypes: activeAudioTypes,
            audioTypesCount: activeAudioTypes.length,
            // Auto progression metrics
            autoProgressionEnabled: settings.autoProgressionEnabled,
            thresholdAdvance: settings.thresholdAdvance,
            thresholdFallback: settings.thresholdFallback,
            thresholdFallbackSessions: settings.thresholdFallbackSessions,
            progressCount: settings.progressCount || 0,
            thresholdAdvanceSessions: settings.thresholdAdvanceSessions || 1,
            advanceCount: settings.advanceCount || 0
          },
          // Store all settings used during this session
          settings: {
            is3D: settings.is3D,
            nBackLevel: settings.nBack,
            useIndividualNBacks: settings.useIndividualNBacks,
            individualNBacks: settings.useIndividualNBacks ? settings.individualNBacks : null,
            autoRotate: settings.autoRotate,
            rotationSpeedX: settings.rotationSpeedX !== undefined ? settings.rotationSpeedX : 1,
            rotationSpeedY: settings.rotationSpeedY !== undefined ? settings.rotationSpeedY : 1,
            rotationSpeedZ: settings.rotationSpeedZ !== undefined ? settings.rotationSpeedZ : 1,
            activeStimuli,
            audioTypes: activeAudioTypes,
            displayDuration: settings.displayDuration,
            randomizeDisplayDuration: settings.randomizeDisplayDuration,
            displayDurationMin: settings.displayDurationMin,
            displayDurationMax: settings.displayDurationMax,
            delayDuration: settings.delayDuration,
            randomizeDelayDuration: settings.randomizeDelayDuration,
            delayDurationMin: settings.delayDurationMin,
            delayDurationMax: settings.delayDurationMax,
            guaranteedMatchesChance: settings.guaranteedMatchesChance,
            interferenceChance: settings.interferenceChance,
            // Auto progression settings
            autoProgressionEnabled: settings.autoProgressionEnabled,
            thresholdAdvance: settings.thresholdAdvance,
            thresholdFallback: settings.thresholdFallback,
            thresholdFallbackSessions: settings.thresholdFallbackSessions,
            progressCount: settings.progressCount,
            thresholdAdvanceSessions: settings.thresholdAdvanceSessions,
            advanceCount: settings.advanceCount
          }
        };
        setNbackHistory(prev => [...prev, session]);

        // Reset game state
        setSequence([]);
        setCurrent(null);
        setStartTime(null);
      } else {
        setIsPlaying(true);
        setStartTime(Date.now());
      }
      return;
    }

    // Only handle stimulus keys if the game is playing
    if (!isPlaying) return;
    
    // Handle stimulus keys
    if (key === keybinds.position && settings.stimuli.position) {
      checkMatch('position');
    } else if (key === keybinds.audio && settings.stimuli.audio) {
      checkMatch('audio');
    } else if (key === keybinds.number && settings.stimuli.number) {
      checkMatch('number');
    } else if (key === keybinds.color && settings.stimuli.color) {
      checkMatch('color');
    } else if (key === keybinds.shape && settings.stimuli.shape) {
      checkMatch('shape');
    }
  }, [isPlaying, settings.stimuli, checkMatch]);
  
  // Store the handleKeyPress function in a ref so it can be accessed in the runTurn function
  useEffect(() => {
    handleKeyPressRef.current = handleKeyPress;
  }, [handleKeyPress]);
  
  useEffect(() => {
    if (!isPlaying) return;
    
    let timeoutId;
    const runTurn = () => {
      const currentSettings = settingsRef.current;
      const displayDuration = currentSettings.randomizeDisplayDuration
        ? Math.floor(Math.random() * (currentSettings.displayDurationMax - currentSettings.displayDurationMin + 1)) + currentSettings.displayDurationMin
        : currentSettings.displayDuration;
      const delayDuration = currentSettings.randomizeDelayDuration
        ? Math.floor(Math.random() * (currentSettings.delayDurationMax - currentSettings.delayDurationMin + 1)) + currentSettings.delayDurationMin
        : currentSettings.delayDuration;
        
      const newStimulus = {
        ...generateStimulus(),
        displayDuration,
        delayDuration
      };
      
      setSequence(prev => {
        const newSequence = [...prev, newStimulus];
        
        // Check if we've reached the set length and should stop automatically
        if (currentSettings.setsEnabled && newSequence.length >= currentSettings.setLength) {
          // Schedule a stop after this stimulus is displayed
          setTimeout(() => {
            if (isPlaying) {
              // Simulate pressing the start/stop key to stop the game
              const startStopKey = currentSettings.startStopKey?.toLowerCase() || 'space';
              handleKeyPressRef.current({
                key: startStopKey === 'space' ? ' ' : startStopKey,
                preventDefault: () => {}
              });
            }
          }, displayDuration + 100); // Add a small delay after the stimulus disappears
        }
        
        return newSequence;
      });
      
      setCurrent(newStimulus);
      
      if (currentSettings.stimuli.audio) {
        playSound(newStimulus);
      }
      
      timeoutId = setTimeout(() => {
        setCurrent(null);
        timeoutId = setTimeout(runTurn, delayDuration);
      }, displayDuration);
    };
    
    runTurn();
    
    return () => clearTimeout(timeoutId);
  }, [isPlaying, generateStimulus, playSound]);

  // These functions have been moved up before handleKeyPress

  // Check matches and update scores when a new stimulus appears
  useEffect(() => {
    if (!current || sequence.length <= Math.max(...Object.values(settings.individualNBacks), settings.nBack) + 1) return;
    
    // Check each stimulus type for matches and update scores
    Object.entries(settings.stimuli).forEach(([type, enabled]) => {
      if (!enabled) return;

      const nBackLevel = getNBackForType(type);
      
      // Get the previous stimulus and its target based on individual n-back level
      const prevStimulus = sequence[sequence.length - 2];
      const prevTarget = sequence[sequence.length - nBackLevel - 2];
      
      if (!prevStimulus || !prevTarget) return;
      
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
  }, [current, sequence, settings.nBack, settings.is3D, settings.audioTypes, settings.individualNBacks, settings.useIndividualNBacks, getNBackForType]);

  // This section is intentionally left empty to remove the duplicate handleKeyPress function

  // Handle touch events for mobile devices
  const handleTouchStart = useCallback((e) => {
    // Don't prevent default behavior at all to ensure buttons work on mobile
    // Just let the native touch events work normally
  }, []);

  useEffect(() => {
    const keydownHandler = (e) => {
      if (handleKeyPressRef.current) {
        handleKeyPressRef.current(e);
      }
    };
    
    window.addEventListener('keydown', keydownHandler);
    
    // Add touch event listeners for mobile
    if (isMobile) {
      document.addEventListener('touchstart', handleTouchStart, { passive: false });
    }
    
    return () => {
      window.removeEventListener('keydown', keydownHandler);
      if (isMobile) {
        document.removeEventListener('touchstart', handleTouchStart);
      }
    };
  }, [handleTouchStart, isMobile]);

  return (
    <div className={cn("min-h-screen bg-background", focusMode && "overflow-hidden")}>
      {focusMode ? (
        <div className="fixed inset-0 bg-background">
          <div className="absolute top-2 right-2 text-xs text-muted-foreground bg-card px-2 py-1 rounded-md opacity-50 hover:opacity-100 z-50">
            Press 'E' to exit focus mode
          </div>
          
          {/* Main container with proper spacing for the header */}
          <div className="w-full h-full pt-16 pb-8 flex flex-col">
            {/* Title - positioned below the header */}
            {settings.focusElements?.title && (
              <div className="text-center mb-4">
                <h2 className="text-2xl font-bold">{getNBackType(settings.stimuli)} N-Back</h2>
              </div>
            )}
            
            {/* Main content area */}
            <div className="flex-1 flex items-center justify-center relative">
              {/* Score panel - positioned appropriately based on device */}
              {settings.focusElements?.score && (
                <div className={cn(
                  "bg-card rounded-xl shadow-lg z-10",
                  isMobile
                    ? "fixed top-0 left-0 right-0 w-full p-0.5 block"
                    : "absolute left-8 top-1/2 -translate-y-1/2 w-[250px] p-4"
                )}>
                  <h2 className={cn("font-bold", isMobile ? "text-lg mb-1" : "text-xl mb-4")}>Score</h2>
                  <div className="border-b border-border pb-0.5 mb-0.5">
                    <div className="flex justify-between items-center">
                      <span className="font-medium">Total</span>
                      <span className={cn("font-semibold", isMobile ? "text-base" : "text-lg")}>
                        {(() => {
                          const enabledScores = Object.entries(score)
                            .filter(([type]) => settings.stimuli[type]);
                          
                          const totals = enabledScores.reduce((acc, [_, stats]) => ({
                            correct: acc.correct + stats.correct,
                            incorrect: acc.incorrect + stats.incorrect
                          }), { correct: 0, incorrect: 0 });

                          const totalAttempts = totals.correct + totals.incorrect;
                          return totalAttempts > 0
                            ? `${Math.round((totals.correct / totalAttempts) * 100)}%`
                            : '0%';
                        })()}
                      </span>
                    </div>
                  </div>
                  <div className={cn("grid", isMobile ? "grid-cols-2 gap-x-4 gap-y-1" : "space-y-3")}>
                    {Object.entries(score).map(([type, stats]) => (
                      settings.stimuli[type] && (
                        <div key={type} className={isMobile ? "" : "space-y-1"}>
                          <div className="flex justify-between items-center">
                            <span className="capitalize font-medium text-sm">{type}</span>
                            <span className="text-xs text-muted-foreground">
                              {Math.round((stats.correct / Math.max(stats.correct + stats.incorrect, 1)) * 100)}%
                            </span>
                          </div>
                          <div className="grid grid-cols-2 gap-1 text-xs">
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
              )}
              
              {/* Settings panel - positioned appropriately based on device */}
              {settings.focusElements?.settings && (
                <div className={cn(
                  "max-h-[80vh] overflow-y-auto z-10",
                  isMobile
                    ? "fixed bottom-20 left-0 right-0 mx-auto w-[90%] max-w-[350px]"
                    : "absolute right-8 top-1/2 -translate-y-1/2"
                )}>
                  <div className="bg-card rounded-xl p-4 shadow-lg w-full">
                    <Settings settings={settings} onSettingsChange={setSettings} isPlaying={isPlaying} isMobile={isMobile} />
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        // Simulate pressing the start/stop key
                        const startStopKey = settings.startStopKey?.toLowerCase() || 'space';
                        handleKeyPressRef.current({
                          key: startStopKey === 'space' ? ' ' : startStopKey,
                          preventDefault: () => {} // Add mock preventDefault
                        });
                      }}
                      className={cn(
                        "w-full py-2 px-4 rounded-md font-medium transition-colors mt-4",
                        isPlaying
                          ? "bg-destructive hover:bg-destructive/90 text-destructive-foreground"
                          : "bg-primary hover:bg-primary/90 text-primary-foreground"
                      )}
                    >
                      {isPlaying ? 'Stop' : 'Start'}
                    </button>
                  </div>
                </div>
              )}
              
              {/* Turn counter display - moved between score and grid for mobile */}
              {settings.focusElements?.turnCounter && !settings.disableTurnDisplay && (
                <div className={cn(
                  "bg-card rounded-xl px-6 py-3 shadow-lg z-10",
                  isMobile
                    ? "mt-2 mb-2 mx-auto" // Position between score and grid in mobile
                    : "absolute top-8 left-1/2 -translate-x-1/2"
                )}>
                  <div className="text-center">
                    <span className={cn("font-bold", isMobile ? "text-xl" : "text-2xl")}>
                      Turn: {sequence.length}/{settings.setsEnabled ? settings.setLength : '-'}
                    </span>
                  </div>
                </div>
              )}
              
              {/* Main grid display - ensure full visibility */}
              <div className={cn(
                "w-full flex items-center justify-center",
                isMobile ? "h-full mt-4" : "h-full",
                { "mt-8": isMobile && settings.focusElements?.score }
              )} style={{ height: isMobile ? '35vh' : '60vh' }}>
                {settings.is3D ? (
                  <div className="w-full h-full flex items-center justify-center">
                    <Canvas camera={{ position: [6, 6, 6], fov: 55 }}>
                      <ambientLight intensity={0.7} />
                      <pointLight position={[10, 10, 10]} intensity={1.2} />
                      <group rotation={[
                        cubeRotation[0] + (settings.autoRotate ? (rotationTime * (settings.rotationSpeedY !== undefined ? settings.rotationSpeedY : 1) * 0.1) % (2 * Math.PI) : 0),
                        cubeRotation[1] + (settings.autoRotate ? (rotationTime * (settings.rotationSpeedX !== undefined ? settings.rotationSpeedX : 1) * 0.1) % (2 * Math.PI) : 0),
                        cubeRotation[2] + (settings.autoRotate ? (rotationTime * (settings.rotationSpeedZ !== undefined ? settings.rotationSpeedZ : 1) * 0.1) % (2 * Math.PI) : 0)
                      ]}>
                        <Grid3D
                          position={current?.position}
                          color={current?.color || '#ffffff'}
                          isActive={true}
                          number={current?.number}
                          shape={current?.shape}
                          positionEnabled={settings.stimuli.position}
                          use3DShapes={settings.use3DShapes}
                        />
                      </group>
                      <OrbitControls
                        enableZoom={false}
                        autoRotate={false}
                        enableRotate={!isMobile || settings.is3D}
                        touchAction="none"
                      />
                    </Canvas>
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <div className={cn("transform", isMobile ? "mb-1 scale-125" : "scale-150")}>
                      <Grid2D
                        position={current?.position}
                        color={current?.color || '#3498db'}
                        number={current?.number}
                        shape={current?.shape}
                        positionEnabled={settings.stimuli.position}
                        isMobile={isMobile}
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
            
            {/* Bottom section for stimuli buttons and history */}
            <div className="mt-auto">
              {/* Stimuli Buttons - always at the bottom */}
              {(settings.focusElements?.stimuliButtons !== false) && (
                <div className="flex flex-col gap-4 mb-4">
                  <div className={cn(
                    isMobile
                      ? "grid gap-1 px-4 w-full mb-1"
                      : "flex justify-center gap-4"
                  )}
                  style={isMobile ? {
                    // Dynamically adjust grid columns based on enabled stimuli count
                    gridTemplateColumns: `repeat(${Math.min(2, Object.values(settings.stimuli).filter(Boolean).length)}, 1fr)`,
                  } : {}}>
                    {/* Filter enabled stimuli first, then map them */}
                    {['position', 'audio', 'number', 'color', 'shape']
                      .filter(type => settings.stimuli[type])
                      .map((type, index, filteredArray) => (
                        <button
                          key={type}
                          onClick={() => checkMatch(type)}
                          className={cn(
                            "rounded-lg font-medium transition-all",
                            isMobile
                              ? cn(
                                  "flex items-center justify-center",
                                  // Make the last button span 2 columns if odd number and it's the last one
                                  filteredArray.length % 2 !== 0 && index === filteredArray.length - 1
                                    ? "col-span-2 py-1.5 px-2"
                                    : "h-10 py-1.5"
                                )
                              : "flex flex-col items-center px-6 py-3 gap-2",
                            toggledControls[type]
                              ? "bg-primary text-primary-foreground shadow-lg scale-105 ring-2 ring-primary/50"
                              : "bg-muted hover:bg-muted/80"
                          )}
                          disabled={!isPlaying}
                        >
                          <span className={cn("capitalize", isMobile ? "text-xs" : "")}>{type}</span>
                          {!isMobile && (
                            <kbd className="px-2 py-1 bg-black/20 rounded text-sm">
                              {type === 'position' ? settings.positionKey?.toUpperCase() || 'A' :
                               type === 'audio' ? settings.audioKey?.toUpperCase() || 'L' :
                               type === 'number' ? settings.numberKey?.toUpperCase() || 'D' :
                               type === 'color' ? settings.colorKey?.toUpperCase() || 'F' :
                               settings.shapeKey?.toUpperCase() || 'J'}
                            </kbd>
                          )}
                        </button>
                    ))}
                  </div>
                  
                  {/* Mobile start/stop button below stimuli buttons */}
                  {isMobile && (
                    <div className="px-4 pb-2">
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          // Simulate pressing the start/stop key
                          const startStopKey = settings.startStopKey?.toLowerCase() || 'space';
                          handleKeyPressRef.current({
                            key: startStopKey === 'space' ? ' ' : startStopKey,
                            preventDefault: () => {} // Add mock preventDefault
                          });
                        }}
                        className={cn(
                          "w-full py-3 px-4 rounded-md font-medium transition-colors text-lg",
                          isPlaying
                            ? "bg-destructive hover:bg-destructive/90 text-destructive-foreground"
                            : "bg-primary hover:bg-primary/90 text-primary-foreground"
                        )}
                      >
                        {isPlaying ? 'Stop' : 'Start'}
                      </button>
                    </div>
                  )}
                </div>
              )}
              
              {/* History - positioned below the buttons and starts minimized */}
              {settings.focusElements?.history && (
                <div className={cn("mx-auto", isMobile ? "px-2 max-w-full" : "px-8 max-w-[1000px]")}>
                  <History
                    sessions={nbackHistory}
                    defaultExpanded={false}
                    onDeleteSession={handleDeleteSession}
                    isMobile={isMobile}
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        <>
          <div className={cn("container mx-auto px-4 py-8", isMobile ? "flex flex-col gap-6" : "flex gap-8")}>
            {/* Title for mobile view */}
            {isMobile && (
              <div className="text-center">
                <h2 className="text-2xl font-bold">{getNBackType(settings.stimuli)} N-Back</h2>
              </div>
            )}
            
            {/* Score panel */}
            <div className={isMobile ? "w-full block" : "w-[200px] mt-[56px]"}>
              <div className={cn("bg-card rounded-xl shadow-lg", isMobile ? "p-1" : "p-6 space-y-6")}>
                <div className="flex items-center justify-between">
                  <h2 className={cn("font-bold", isMobile ? "text-lg" : "text-2xl")}>Score</h2>
                </div>
                {/* Total Score */}
                <div className={cn("border-b border-border", isMobile ? "pb-1 mb-1" : "pb-4 mb-4")}>
                  <div className="flex justify-between items-center">
                    <span className="font-medium">Total</span>
                    <span className={cn("font-semibold", isMobile ? "text-base" : "text-lg")}>
                      {(() => {
                        const enabledScores = Object.entries(score)
                          .filter(([type]) => settings.stimuli[type]);
                        
                        const totals = enabledScores.reduce((acc, [_, stats]) => ({
                          correct: acc.correct + stats.correct,
                          incorrect: acc.incorrect + stats.incorrect
                        }), { correct: 0, incorrect: 0 });

                        const totalAttempts = totals.correct + totals.incorrect;
                        return totalAttempts > 0
                          ? `${Math.round((totals.correct / totalAttempts) * 100)}%`
                          : '0%';
                      })()}
                    </span>
                  </div>
                </div>
                <div className={cn(isMobile ? "grid grid-cols-2 gap-x-4 gap-y-1" : "space-y-4")}>
                  {Object.entries(score).map(([type, stats]) => (
                    settings.stimuli[type] && (
                      <div key={type} className={isMobile ? "" : "space-y-1"}>
                        <div className="flex justify-between items-center">
                          <span className="capitalize font-medium text-sm">{type}</span>
                          <span className="text-xs text-muted-foreground">
                            {Math.round((stats.correct / Math.max(stats.correct + stats.incorrect, 1)) * 100)}%
                          </span>
                        </div>
                        <div className="grid grid-cols-2 gap-1 text-xs">
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
              
              {/* Mobile start/stop button moved to after the grid */}
            </div>
            
            {/* Mobile turn display - positioned between score and grid */}
            {isMobile && !settings.disableTurnDisplay && (
              <div className="w-full flex justify-center mb-1 mt-1">
                <div className="bg-card rounded-xl px-6 py-1 shadow-lg">
                  <span className="font-bold text-xl">
                    Turn: {sequence.length}/{settings.setsEnabled ? settings.setLength : '-'}
                  </span>
                </div>
              </div>
            )}
            
            {/* Main grid area */}
            <div className="flex-1 bg-card rounded-xl overflow-hidden shadow-lg">
              <div className="flex flex-col gap-4">
                <div className="relative pt-0">
                  {/* Turn counter display in regular mode - only show here for desktop */}
                  {!settings.disableTurnDisplay && !isMobile && (
                    <div className="absolute top-4 left-1/2 -translate-x-1/2 z-10">
                      <div className="bg-card rounded-xl px-6 py-3 shadow-lg">
                        <span className="font-bold text-2xl">
                          Turn: {sequence.length}/{settings.setsEnabled ? settings.setLength : '-'}
                        </span>
                      </div>
                    </div>
                  )}
                  <div className={cn("w-full", isMobile ? "h-[280px] pt-1 pb-1" : "h-[500px]")}>
                    <HelpButton text={`N-Back Memory Training:

Watch for patterns that match what appeared N positions back in the sequence. ${isMobile ? 'Tap' : 'Press'} the corresponding ${isMobile ? 'button' : 'key'} when you detect a match:

• Position (${isMobile ? 'Tap Position button' : settings.positionKey?.toUpperCase() + ' Key'}): Same location as N steps ago
• Audio (${isMobile ? 'Tap Audio button' : settings.audioKey?.toUpperCase() + ' Key'}): Same sound as N steps ago
• Number (${isMobile ? 'Tap Number button' : settings.numberKey?.toUpperCase() + ' Key'}): Same number as N steps ago
• Color (${isMobile ? 'Tap Color button' : settings.colorKey?.toUpperCase() + ' Key'}): Same color as N steps ago
• Shape (${isMobile ? 'Tap Shape button' : settings.shapeKey?.toUpperCase() + ' Key'}): Same shape as N steps ago

${isMobile ? 'Tap the Start/Stop button' : 'Press ' + (settings.startStopKey === 'Space' ? 'SPACE' : settings.startStopKey?.toUpperCase() || 'SPACE')} to start/stop the game.

Example: In a 2-back task, if a pattern matches what appeared 2 positions ago, ${isMobile ? 'tap' : 'press'} the matching ${isMobile ? 'button' : 'key'}.`} />
                    {settings.is3D ? (
                      <Canvas camera={{ position: [6, 6, 6], fov: 50 }}>
                        <ambientLight intensity={0.5} />
                        <pointLight position={[10, 10, 10]} />
                        <group rotation={[
                          cubeRotation[0] + (settings.autoRotate ? (rotationTime * (settings.rotationSpeedY !== undefined ? settings.rotationSpeedY : 1) * 0.1) % (2 * Math.PI) : 0),
                          cubeRotation[1] + (settings.autoRotate ? (rotationTime * (settings.rotationSpeedX !== undefined ? settings.rotationSpeedX : 1) * 0.1) % (2 * Math.PI) : 0),
                          cubeRotation[2] + (settings.autoRotate ? (rotationTime * (settings.rotationSpeedZ !== undefined ? settings.rotationSpeedZ : 1) * 0.1) % (2 * Math.PI) : 0)
                        ]}>
                          <Grid3D
                            position={current?.position}
                            color={current?.color || '#ffffff'}
                            isActive={true}
                            number={current?.number}
                            shape={current?.shape}
                            positionEnabled={settings.stimuli.position}
                            use3DShapes={settings.use3DShapes}
                          />
                        </group>
                        <OrbitControls
                          enableZoom={false}
                          autoRotate={false}
                          enableRotate={!isMobile || settings.is3D}
                          touchAction="none"
                        />
                      </Canvas>
                    ) : (
                      <div className={cn("h-full flex items-center justify-center", isMobile ? "mb-1" : "")}>
                        <Grid2D
                          position={current?.position}
                          color={current?.color || '#3498db'}
                          number={current?.number}
                          shape={current?.shape}
                          positionEnabled={settings.stimuli.position}
                          isMobile={isMobile}
                        />
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex flex-col gap-4">
                  <div className={cn(
                    isMobile
                      ? "grid gap-1 px-4 w-full mb-1"
                      : "flex justify-center gap-4"
                  )}
                  style={isMobile ? {
                    // Dynamically adjust grid columns based on enabled stimuli count
                    gridTemplateColumns: `repeat(${Math.min(2, Object.values(settings.stimuli).filter(Boolean).length)}, 1fr)`,
                  } : {}}>
                    {/* Filter enabled stimuli first, then map them */}
                    {['position', 'audio', 'number', 'color', 'shape']
                      .filter(type => settings.stimuli[type])
                      .map((type, index, filteredArray) => (
                        <button
                          key={type}
                          onClick={() => checkMatch(type)}
                          className={cn(
                            "rounded-lg font-medium transition-all",
                            isMobile
                              ? cn(
                                  "flex items-center justify-center",
                                  // Make the last button span 2 columns if odd number and it's the last one
                                  filteredArray.length % 2 !== 0 && index === filteredArray.length - 1
                                    ? "col-span-2 py-1.5 px-2"
                                    : "h-10 py-1.5"
                                )
                              : "flex flex-col items-center px-6 py-3 gap-2",
                            toggledControls[type]
                              ? "bg-primary text-primary-foreground shadow-lg scale-105 ring-2 ring-primary/50"
                              : "bg-muted hover:bg-muted/80"
                          )}
                          disabled={!isPlaying}
                        >
                          <span className={cn("capitalize", isMobile ? "text-xs" : "")}>{type}</span>
                          {!isMobile && (
                            <kbd className="px-2 py-1 bg-black/20 rounded text-sm">
                              {type === 'position' ? settings.positionKey?.toUpperCase() || 'A' :
                               type === 'audio' ? settings.audioKey?.toUpperCase() || 'L' :
                               type === 'number' ? settings.numberKey?.toUpperCase() || 'D' :
                               type === 'color' ? settings.colorKey?.toUpperCase() || 'F' :
                               settings.shapeKey?.toUpperCase() || 'J'}
                            </kbd>
                          )}
                        </button>
                    ))}
                  </div>
                  
                  {/* Mobile start/stop button below stimuli buttons */}
                  {isMobile && (
                    <div className="px-4 pb-2">
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          // Simulate pressing the start/stop key
                          const startStopKey = settings.startStopKey?.toLowerCase() || 'space';
                          handleKeyPressRef.current({
                            key: startStopKey === 'space' ? ' ' : startStopKey,
                            preventDefault: () => {} // Add mock preventDefault
                          });
                        }}
                        className={cn(
                          "w-full py-3 px-4 rounded-md font-medium transition-colors text-lg",
                          isPlaying
                            ? "bg-destructive hover:bg-destructive/90 text-destructive-foreground"
                            : "bg-primary hover:bg-primary/90 text-primary-foreground"
                        )}
                      >
                        {isPlaying ? 'Stop' : 'Start'}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Settings panel - hidden on mobile initially */}
            {!isMobile && (
              <div className="w-[350px]">
                <h2 className="text-2xl font-bold mb-6">{getNBackType(settings.stimuli)} N-Back</h2>
                <Settings settings={settings} onSettingsChange={setSettings} isPlaying={isPlaying} isMobile={isMobile} />
                <div className="space-y-2">
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      // Simulate pressing the start/stop key
                      const startStopKey = settings.startStopKey?.toLowerCase() || 'space';
                      handleKeyPressRef.current({
                        key: startStopKey === 'space' ? ' ' : startStopKey,
                        preventDefault: () => {} // Add mock preventDefault
                      });
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
                </div>
              </div>
            )}
          </div>
          
          {/* Mobile settings toggle */}
          {isMobile && (
            <div className="container mx-auto px-4 pb-4">
              <button
                onClick={() => setShowMobileSettings(prev => !prev)}
                className="w-full py-3 px-4 rounded-md font-medium bg-card hover:bg-card/90 border border-border"
              >
                {showMobileSettings ? 'Hide Settings' : 'Show Settings'}
              </button>
              
              {showMobileSettings && (
                <div className="mt-4">
                  <Settings settings={settings} onSettingsChange={setSettings} isPlaying={isPlaying} isMobile={isMobile} />
                </div>
              )}
            </div>
          )}
          
          {/* History Section */}
          <div className={cn("container mx-auto pb-8", isMobile ? "px-2" : "px-4")}>
            <History
              sessions={nbackHistory}
              onDeleteSession={handleDeleteSession}
              isMobile={isMobile}
            />
          </div>
        </>
      )}
    </div>
  );
}