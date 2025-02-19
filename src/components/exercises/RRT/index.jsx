import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import { HelpButton } from '@/components/HelpButton';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { generateQuestion } from './generators';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { getTodayDate } from '@/lib/dateUtils';
import { Settings } from './Settings';
import { ExplanationButton } from './Explanation';
import { validatePreset, sanitizeInput, decompressSettings } from './constants/presets';

export default function RRT() {
  const [rrtAnalytics, setRrtAnalytics] = useLocalStorage('rrt_analytics', []);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState(null);
  const [carouselIndex, setCarouselIndex] = useState(0);
  const [history, setHistory] = useLocalStorage('rrt_history', []);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(0);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [questionStartTime, setQuestionStartTime] = useState(null);
  const [buttonOrder, setButtonOrder] = useState(['true', 'false']);
  const [buttonColors, setButtonColors] = useState({
    true: 'success',
    false: 'destructive'
  });

  const [userPresets, setUserPresets] = useLocalStorage('rrt_presets', []);
  const [presetName, setPresetName] = useState('');
  const [settings, setSettings] = useLocalStorage('rrt-settings', {
    // General Settings
    globalPremises: 2,
    generalTimer: 30,

    // Word Types
    useNonsenseWords: false,
    nonsenseWordLength: 3,
    useGarbageWords: false,
    garbageWordLength: 3,
    useMeaningfulWords: true,
    useNouns: true,
    useAdjectives: false,
    useEmoji: false,

    // Question Types
    questionTypes: {
      distinction: true,
      comparison: false,
      temporal: false,
      direction: false,
      direction3D: false,
      direction4D: false,
      syllogism: false,
      analogy: false,
      binary: false
    },

    // Question Type Settings
    distinctionPremises: 0, // 0 means use global
    distinctionTimer: 0,
    
    comparisonPremises: 0,
    comparisonTimer: 0,
    
    temporalPremises: 0,
    temporalTimer: 0,
    
    directionPremises: 0,
    directionTimer: 0,
    
    direction3DPremises: 0,
    direction3DTimer: 0,

    // Misc Settings
    enableCarouselMode: false,
    randomizeButtons: false,
    buttonNegation: false,

    // Keybind Settings
    trueKey: '1',
    falseKey: '2',
    playPauseKey: ' ',
    newQuestionKey: '3'
  });

  // Validate settings
  const hasWordType =
    settings.useNonsenseWords ||
    settings.useGarbageWords ||
    settings.useMeaningfulWords ||
    settings.useEmoji;

  const hasQuestionType = Object.values(settings.questionTypes).some(Boolean);

  // Disable start if settings are invalid
  const canStart = hasWordType && hasQuestionType;

  // Validate settings on load and ensure defaults
  useEffect(() => {
    setSettings(prev => {
      if (!hasWordType) {
        return {
          ...prev,
          useMeaningfulWords: true,
          useNouns: true
        };
      }

      if (!hasQuestionType) {
        return {
          ...prev,
          questionTypes: {
            ...prev.questionTypes,
            distinction: true
          }
        };
      }

      return prev;
    });
  }, [hasWordType, hasQuestionType]);
const generateNewQuestion = useCallback(() => {
  const question = generateQuestion(settings);
  question.createdAt = Date.now();

  // Randomize button order and colors if enabled
  if (settings.randomizeButtons) {
    const newOrder = Math.random() > 0.5 ? ['true', 'false'] : ['false', 'true'];
    setButtonOrder(newOrder);

    if (settings.buttonNegation) {
      const colors = ['success', 'destructive'];
      const randomColors = Math.random() > 0.5 ? colors : [...colors].reverse();
      setButtonColors({
        true: randomColors[0],
        false: randomColors[1]
      });
    } else {
      setButtonColors({
        true: 'success',
        false: 'destructive'
      });
    }
  } else {
    setButtonOrder(['true', 'false']);
    setButtonColors({
      true: 'success',
      false: 'destructive'
    });
  }

  // Batch state updates to prevent race conditions
  const updateStates = () => {
    setCurrentQuestion(question);
    setCarouselIndex(0);
    setQuestionStartTime(Date.now());
    setIsTransitioning(false);
    
    const timerDuration = settings[`${question.type}Timer`] || settings.generalTimer || 30;
    setTimeLeft(timerDuration);
    setIsTimerRunning(true);
  };

  // Ensure state updates happen in a single frame
  requestAnimationFrame(updateStates);
}, [settings]);

// Load preset from URL when settings are initialized
useEffect(() => {
  const loadPresetFromURL = () => {
    const urlBeforeHash = window.location.href.split('#')[0];
    const url = new URL(urlBeforeHash);
    const presetParam = url.searchParams.get('preset');
    
    if (presetParam) {
      try {
        const parsedData = JSON.parse(decodeURIComponent(presetParam));
        const { id, name, settings: compressedSettings } = parsedData;
        
        // Sanitize inputs
        const sanitizedName = sanitizeInput(name) || 'Imported Settings';
        
        // Decompress settings and merge with defaults
        const decompressedSettings = {
          ...settings, // Start with current settings as defaults
          ...decompressSettings(compressedSettings) // Override with decompressed values
        };
        
        // Validate preset
        if (validatePreset({ name: sanitizedName, settings: decompressedSettings })) {
          // Check if preset already exists
          if (!userPresets.some(p => p.id === id)) {
            const newPreset = {
              id,
              name: sanitizedName,
              settings: decompressedSettings,
              createdAt: Date.now()
            };
            setUserPresets(prev => [...prev, newPreset]);
          }
          
          // Apply new settings
          const newSettings = {
            ...decompressedSettings,
            _lastUpdated: Date.now()
          };
          
          // Update localStorage and state
          window.localStorage.setItem('rrt-settings', JSON.stringify(newSettings));
          setSettings(newSettings);
          setPresetName(sanitizedName);
          
          toast.success('Preset loaded successfully');
          
          // Clean up URL
          const currentUrl = new URL(window.location.href);
          const urlBeforeHash = currentUrl.href.split('#')[0];
          const hash = currentUrl.hash;
          const cleanUrl = new URL(urlBeforeHash);
          cleanUrl.searchParams.delete('preset');
          window.history.replaceState({}, '', cleanUrl.toString() + hash);
          
          // Force a new question with the new settings
          setTimeout(() => {
            generateNewQuestion();
          }, 0);
        } else {
          toast.error('Invalid preset format');
        }
      } catch (error) {
        toast.error('Failed to load shared preset');
      }
    }
  };
  
  // Only load preset once settings are initialized
  if (settings.globalPremises) {
    loadPresetFromURL();
  }
}, [settings.globalPremises]); // Depend on a key setting to ensure initialization

useEffect(() => {
  if (canStart) {
    generateNewQuestion();
  }
}, [canStart, settings, generateNewQuestion]);

// Keyboard controls
useEffect(() => {
  const handleKeyDown = (e) => {
    if (!currentQuestion || isTransitioning) return;
    
    const key = e.key;
    
    // Handle play/pause
    if ((key === settings.playPauseKey) || (settings.playPauseKey === 'Space' && key === ' ')) {
      e.preventDefault();
      togglePlay();
      return;
    }

    // Handle new question
    if ((key === settings.newQuestionKey) || (settings.newQuestionKey === 'Space' && key === ' ')) {
      e.preventDefault();
      generateNewQuestion();
      return;
    }
    
    // Only handle answer keys if playing
    if (!isPlaying) return;
    
    // Handle true/false answers
    if ((key === settings.trueKey) || (settings.trueKey === 'Space' && key === ' ')) {
      e.preventDefault();
      handleAnswer(true);
    } else if ((key === settings.falseKey) || (settings.falseKey === 'Space' && key === ' ')) {
      e.preventDefault();
      handleAnswer(false);
    }
  };

  window.addEventListener('keydown', handleKeyDown);
  return () => window.removeEventListener('keydown', handleKeyDown);
}, [currentQuestion, isPlaying, isTransitioning, settings.trueKey, settings.falseKey, settings.pauseKey]);

// Question timer
useEffect(() => {
  if (!isPlaying || !isTimerRunning || !currentQuestion) return;
  
  let timeoutTriggered = false;
  const timer = setInterval(() => {
    setTimeLeft(prev => {
      if (prev <= 1 && !timeoutTriggered) {
        timeoutTriggered = true;
        handleTimeout();
        return 0;
      }
      return prev - 1;
    });
  }, 1000);
  
  return () => {
    clearInterval(timer);
    timeoutTriggered = false;
  };
}, [isTimerRunning, isPlaying, currentQuestion]);

const togglePlay = () => {
  if (isPlaying) {
    setIsTimerRunning(false);
    setIsPlaying(false);
  } else {
    if (!currentQuestion) {
      generateNewQuestion();
    }
    setIsTimerRunning(true);
    setIsPlaying(true);
  }
};

const recordQuestionAnalytics = (question, isCorrect, responseTime) => {
  const duration = responseTime / 1000 / 60; // Convert ms to minutes
  const session = {
    exercise: 'rrt',
    timestamp: Date.now(),
    date: getTodayDate(),
    duration,
    metrics: {
      premisesCount: settings.globalPremises,
      timePerAnswer: Math.round(responseTime / 1000),
      percentageCorrect: isCorrect ? 100 : 0
    }
  };
  setRrtAnalytics(prev => [...prev, session]);
};

const handleAnswer = (answer) => {
    if (isTransitioning || !currentQuestion) return;
    setIsTransitioning(true);
    setIsTimerRunning(false);

    const isCorrect = answer === currentQuestion.isValid;
    const responseTime = Date.now() - questionStartTime;
    const timerValue = settings[`${currentQuestion.type}Timer`] || settings.generalTimer;
    const answeredQuestion = {
      ...currentQuestion,
      userAnswer: answer,
      isCorrect,
      answeredAt: Date.now(),
      responseTime,
      timerValue
    };
    
    // Batch state updates to prevent race conditions
    const updateStates = () => {
      setHistory(prev => [answeredQuestion, ...prev]);
      setScore(prev => prev + (isCorrect ? 1 : -1));
      recordQuestionAnalytics(answeredQuestion, isCorrect, responseTime);
      
      // Generate new question after a delay
      setTimeout(() => {
        setIsTransitioning(false);
        generateNewQuestion();
      }, 750);
    };

    // Ensure state updates happen in a single frame
    requestAnimationFrame(updateStates);
  };

  const handleTimeout = () => {
    if (isTransitioning || !currentQuestion) return;
    
    // Prevent double-handling of timeouts
    const lastQuestion = history[0];
    if (lastQuestion &&
        lastQuestion.createdAt === currentQuestion.createdAt &&
        lastQuestion.userAnswer === 'timeout') {
      return;
    }

    // Set transitioning state immediately to prevent multiple calls
    setIsTransitioning(true);
    setIsTimerRunning(false);
    setTimeLeft(0);

    const timerValue = settings[`${currentQuestion.type}Timer`] || settings.generalTimer || 30;
    const responseTime = timerValue * 1000;
    const timedOutQuestion = {
      ...currentQuestion,
      userAnswer: 'timeout',
      isCorrect: false,
      answeredAt: Date.now(),
      responseTime,
      timerValue
    };
    
    // Use a single state update batch to prevent race conditions
    const updateStates = () => {
      setHistory(prev => [timedOutQuestion, ...prev]);
      setScore(prev => prev - 1);
      recordQuestionAnalytics(timedOutQuestion, false, responseTime);
      
      // Generate new question after a delay
      setTimeout(() => {
        setIsTransitioning(false);
        generateNewQuestion();
      }, 750);
    };

    // Ensure state updates happen in a single frame
    requestAnimationFrame(updateStates);
  };

  const questionClasses = cn(
    "min-h-screen bg-background"
  );

  const questionAreaClasses = cn(
    "bg-card rounded-xl p-8 shadow-lg relative"
  );

  return (
    <div className={questionClasses}>
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_350px] gap-8">
          <div className="space-y-6">
            <div className={questionAreaClasses}>
              <HelpButton text="Relational Reasoning Training:

1. Read each premise (statement) carefully
2. Evaluate if the conclusion logically follows from the premises
3. Select 'True' if the conclusion is valid
4. Select 'False' if the conclusion is not supported

Work quickly but accurately - you have limited time for each question. Your score increases for correct answers and decreases for incorrect ones." />
              <div className="flex items-center gap-4 mb-6">
                <button
                  onClick={togglePlay}
                  className={cn(
                    "p-2 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors w-10 h-10 flex items-center justify-center",
                  )}
                  aria-label={isPlaying ? "Pause" : "Play"}
                >
                  {isPlaying ? (
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
                      <rect x="6" y="4" width="4" height="16" />
                      <rect x="14" y="4" width="4" height="16" />
                    </svg>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
                      <polygon points="5 3 19 12 5 21 5 3" />
                    </svg>
                  )}
                </button>
                {isPlaying && currentQuestion && (
                  <div className="h-1 bg-muted rounded-full overflow-hidden flex-1">
                    <div
                      className="h-full bg-primary transition-[width] duration-1000 ease-linear"
                      style={{ width: `${(timeLeft / (settings[`${currentQuestion.type}Timer`] || settings.generalTimer)) * 100}%` }}
                    />
                  </div>
                )}
              </div>
              
              <div className={cn(
                "transition-all duration-300",
                !isPlaying && "opacity-50 blur-xl"
              )}>
                <AnimatePresence mode="wait">
                  {currentQuestion && settings.enableCarouselMode ? (
                    <motion.div
                      key={carouselIndex}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="space-y-6"
                    >
                      {carouselIndex < currentQuestion.premises.length ? (
                        <>
                          <h3 className="text-lg font-medium text-primary">
                            Premise {carouselIndex + 1}/{currentQuestion.premises.length}
                          </h3>
                          <p className="text-xl" dangerouslySetInnerHTML={{ 
                            __html: currentQuestion.premises[carouselIndex] 
                          }} />
                          <button
                            onClick={() => setCarouselIndex(prev => prev + 1)}
                            className="w-full py-3 bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg font-medium transition-colors"
                          >
                            Next
                          </button>
                        </>
                      ) : (
                        <>
                          <div className="p-6 bg-primary/5 rounded-lg border border-primary/10">
                            <h3 className="text-lg font-medium text-primary mb-4">Conclusion</h3>
                            <p className="text-xl" dangerouslySetInnerHTML={{ 
                              __html: currentQuestion.conclusion 
                            }} />
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            {buttonOrder.map(value => (
                              <button
                                key={value}
                                disabled={isTransitioning || !isPlaying}
                                onClick={() => handleAnswer(value === 'true')}
                                className={cn(
                                  "py-3 rounded-lg font-medium transition-colors disabled:opacity-50",
                                  buttonColors[value] === 'success'
                                    ? "bg-success hover:bg-success/90 text-success-foreground"
                                    : "bg-destructive hover:bg-destructive/90 text-destructive-foreground"
                                )}
                              >
                                {value === 'true' ? 'True' : 'False'}
                              </button>
                            ))}
                          </div>
                        </>
                      )}
                    </motion.div>
                  ) : (
                    currentQuestion && (
                      <motion.div
                        key="full-display"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="space-y-6"
                      >
                        {currentQuestion.premises.map((premise, index) => (
                          <div
                            key={index}
                            className="p-4 bg-muted rounded-lg"
                            dangerouslySetInnerHTML={{ __html: premise }}
                          />
                        ))}
                        <div className="p-6 bg-primary/5 rounded-lg border border-primary/10">
                          <h3 className="text-lg font-medium text-primary mb-4">Conclusion</h3>
                          {currentQuestion.conclusions ? (
                            <div className="space-y-4">
                              {currentQuestion.conclusions.map((conclusion, index) => (
                                <p key={index} className="text-xl" dangerouslySetInnerHTML={{ __html: conclusion }} />
                              ))}
                            </div>
                          ) : (
                            <p className="text-xl" dangerouslySetInnerHTML={{ __html: currentQuestion.conclusion }} />
                          )}
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          {buttonOrder.map(value => (
                            <button
                              key={value}
                              disabled={isTransitioning || !isPlaying}
                              onClick={() => handleAnswer(value === 'true')}
                              className={cn(
                                "py-3 rounded-lg font-medium transition-colors disabled:opacity-50",
                                buttonColors[value] === 'success'
                                  ? "bg-success hover:bg-success/90 text-success-foreground"
                                  : "bg-destructive hover:bg-destructive/90 text-destructive-foreground"
                              )}
                            >
                              {value === 'true' ? 'True' : 'False'}
                            </button>
                          ))}
                        </div>
                      </motion.div>
                    )
                  )}
                </AnimatePresence>
              </div>
            </div>

            {history.length > 0 && (
              <div className="bg-card rounded-xl p-6 shadow-lg">
                <h3 className="text-lg font-medium mb-4">History</h3>
                <div className="space-y-4">
                  {history.map((item, index) => (
                    <div
                      key={index}
                      className={cn(
                        "p-4 rounded-lg border",
                        item.userAnswer === 'timeout'
                          ? "bg-warning/10 border-warning/20"
                          : item.isCorrect
                          ? "bg-success/10 border-success/20"
                          : "bg-destructive/10 border-destructive/20"
                      )}
                    >
                      <div className="flex justify-between items-center mb-2">
                        <h4 className="font-medium">
                          {item.type === 'direction' ? 'Space 2D' :
                           item.type === 'direction3D' ? 'Space 3D' :
                           item.type.charAt(0).toUpperCase() + item.type.slice(1)}
                        </h4>
                      </div>
                      <div className="space-y-2">
                        {item.premises.map((premise, i) => (
                          <p key={i} dangerouslySetInnerHTML={{ __html: premise }} />
                        ))}
                        <div className="pt-2 border-t border-border mt-2">
                          <p><strong>Conclusion{item.conclusions?.length > 1 ? 's' : ''}:</strong></p>
                          {item.conclusions ? (
                            <div className="space-y-2">
                              {item.conclusions.map((conclusion, i) => (
                                <p key={i} dangerouslySetInnerHTML={{ __html: conclusion }} />
                              ))}
                            </div>
                          ) : (
                            <p dangerouslySetInnerHTML={{ __html: item.conclusion }} />
                          )}
                        </div>
                        <div className="flex justify-between items-center text-sm text-muted-foreground">
                          <div className="flex items-center gap-3">
                            <span>
                              Response: {
                                item.userAnswer === 'timeout'
                                  ? 'Timed Out'
                                  : item.userAnswer
                                  ? 'True'
                                  : 'False'
                              }
                            </span>
                            <ExplanationButton question={item} />
                          </div>
                          <span>
                            {Math.round(item.responseTime / 1000)}s/{item.timerValue}s
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="space-y-6">
            <h2 className="text-2xl font-bold mb-6">Relational Reasoning Training</h2>
            <div className="bg-card rounded-xl p-6 shadow-lg">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold">Score</h2>
                <span className="text-3xl font-bold text-primary">{score}</span>
              </div>
              <div className="space-y-4">
                <div className="p-4 bg-primary/5 rounded-lg">
                  <h3 className="font-medium mb-2">Current Streak</h3>
                  <p className="text-2xl font-bold">
                    {history.findIndex(item => !item.isCorrect) === -1
                      ? history.length
                      : history.findIndex(item => !item.isCorrect)}
                  </p>
                </div>
                <div className="p-4 bg-primary/5 rounded-lg">
                  <h3 className="font-medium mb-2">Average Time</h3>
                  <p className="text-2xl font-bold">
                    {history.length > 0
                      ? `${Math.round(
                          history.reduce((acc, item) => acc + item.responseTime, 0) /
                            history.length /
                            1000
                        )}s`
                      : '0s'}
                  </p>
                </div>
              </div>
            </div>

            <Settings
              settings={settings}
              onSettingsChange={setSettings}
              userPresets={userPresets}
              setUserPresets={setUserPresets}
              presetName={presetName}
              setPresetName={setPresetName}
            />
          </div>
        </div>
      </div>
    </div>
  );
}