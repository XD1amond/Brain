import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { generateQuestion } from './questionGenerators';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { Settings } from './Settings';

export default function RRT() {
  const [settings, setSettings] = useLocalStorage('rrt-settings', {
    // General Settings
    globalPremises: 2,

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
    distinctionTimer: 30,
    
    comparisonPremises: 0,
    comparisonTimer: 30,
    comparison180Mode: false,
    
    temporalPremises: 0,
    temporalTimer: 30,
    temporal180Mode: false,
    
    directionPremises: 0,
    directionTimer: 30,
    
    direction3DPremises: 0,
    direction3DTimer: 30,

    // Misc Settings
    enableCarouselMode: false,
    enableNegation: false,
    removeNegationExplainer: false,
    enableMeta: false,
    enableStroopEffect: false
  });

  // Validate settings on load
  useEffect(() => {
    setSettings(prev => {
      // Ensure at least one word type is enabled
      const hasWordType = 
        prev.useNonsenseWords ||
        prev.useGarbageWords ||
        prev.useMeaningfulWords ||
        prev.useEmoji;

      if (!hasWordType) {
        return {
          ...prev,
          useMeaningfulWords: true,
          useNouns: true
        };
      }

      // Ensure at least one question type is enabled
      const hasQuestionType = Object.values(prev.questionTypes).some(Boolean);
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
  }, []);

  const [isPlaying, setIsPlaying] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState(null);
  const [carouselIndex, setCarouselIndex] = useState(0);
  const [history, setHistory] = useState([]);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(0);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);

  const generateNewQuestion = useCallback(() => {
    const question = generateQuestion(settings);
    question.createdAt = Date.now();
    setCurrentQuestion(question);
    setCarouselIndex(0);
    
    const timerDuration = settings[`${question.type}Timer`] || 30;
    setTimeLeft(timerDuration);
    setIsTimerRunning(true);
    setIsTransitioning(false);
  }, [settings]);

  useEffect(() => {
    if (!isPlaying || !isTimerRunning) return;
    
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          handleTimeout();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    
    return () => clearInterval(timer);
  }, [isTimerRunning, isPlaying]);

  const togglePlay = () => {
    if (isPlaying) {
      setIsTimerRunning(false);
    } else {
      if (!currentQuestion) {
        generateNewQuestion();
      } else {
        setIsTimerRunning(true);
      }
    }
    setIsPlaying(!isPlaying);
  };

  const handleAnswer = (answer) => {
    if (isTransitioning) return;
    setIsTransitioning(true);
    setIsTimerRunning(false);

    const isCorrect = answer === currentQuestion.isValid;
    const answeredQuestion = {
      ...currentQuestion,
      userAnswer: answer,
      isCorrect,
      answeredAt: Date.now(),
      responseTime: Date.now() - currentQuestion.createdAt
    };
    
    requestAnimationFrame(() => {
      setHistory(prev => [answeredQuestion, ...prev]);
      setScore(prev => prev + (isCorrect ? 1 : -1));
      setTimeout(generateNewQuestion, 750);
    });
  };

  const handleTimeout = () => {
    if (isTransitioning) return;
    setIsTransitioning(true);
    setIsTimerRunning(false);

    const timedOutQuestion = {
      ...currentQuestion,
      userAnswer: 'timeout',
      isCorrect: false,
      answeredAt: Date.now(),
      responseTime: settings[`${currentQuestion.type}Timer`] * 1000
    };
    
    requestAnimationFrame(() => {
      setHistory(prev => [timedOutQuestion, ...prev]);
      setScore(prev => prev - 1);
      setTimeout(generateNewQuestion, 750);
    });
  };

  const questionClasses = cn(
    "min-h-screen bg-background",
    settings.enableStroopEffect && "stroop-effect"
  );

  const questionAreaClasses = cn(
    "bg-card rounded-xl p-8 shadow-lg relative"
  );

  // Validate current settings
  const hasWordType = 
    settings.useNonsenseWords ||
    settings.useGarbageWords ||
    settings.useMeaningfulWords ||
    settings.useEmoji;

  const hasQuestionType = Object.values(settings.questionTypes).some(Boolean);

  // Disable start if settings are invalid
  const canStart = hasWordType && hasQuestionType;

  return (
    <div className={questionClasses}>
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_350px] gap-8">
          <div className="space-y-6">
            <div className={questionAreaClasses}>
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
                      style={{ width: `${(timeLeft / settings[`${currentQuestion.type}Timer`]) * 100}%` }}
                    />
                  </div>
                )}
              </div>
              
              <div className={cn("transition-opacity", !isPlaying && "opacity-50")}>
                <AnimatePresence mode="wait">
                  {isPlaying && currentQuestion && settings.enableCarouselMode ? (
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
                            <button
                              disabled={isTransitioning}
                              onClick={() => handleAnswer(true)}
                              className="py-3 bg-success hover:bg-success/90 text-success-foreground rounded-lg font-medium transition-colors disabled:opacity-50"
                            >
                              True
                            </button>
                            <button
                              disabled={isTransitioning}
                              onClick={() => handleAnswer(false)}
                              className="py-3 bg-destructive hover:bg-destructive/90 text-destructive-foreground rounded-lg font-medium transition-colors disabled:opacity-50"
                            >
                              False
                            </button>
                          </div>
                        </>
                      )}
                    </motion.div>
                  ) : (
                    isPlaying && currentQuestion && (
                      <motion.div
                        key="full-display"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="space-y-6"
                      >
                        {!settings.removeNegationExplainer && settings.enableNegation && (
                          <div className="p-4 bg-muted rounded-lg mb-4">
                            <p className="text-sm text-muted-foreground">
                              Invert the <span className="text-primary">highlighted</span> text
                            </p>
                          </div>
                        )}
                        {currentQuestion.premises.map((premise, index) => (
                          <div
                            key={index}
                            className="p-4 bg-muted rounded-lg"
                            dangerouslySetInnerHTML={{ __html: premise }}
                          />
                        ))}
                        <div className="p-6 bg-primary/5 rounded-lg border border-primary/10">
                          <h3 className="text-lg font-medium text-primary mb-4">Conclusion</h3>
                          <p className="text-xl" dangerouslySetInnerHTML={{ 
                            __html: currentQuestion.conclusion 
                          }} />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <button
                            disabled={isTransitioning}
                            onClick={() => handleAnswer(true)}
                            className="py-3 bg-success hover:bg-success/90 text-success-foreground rounded-lg font-medium transition-colors disabled:opacity-50"
                          >
                            True
                          </button>
                          <button
                            disabled={isTransitioning}
                            onClick={() => handleAnswer(false)}
                            className="py-3 bg-destructive hover:bg-destructive/90 text-destructive-foreground rounded-lg font-medium transition-colors disabled:opacity-50"
                          >
                            False
                          </button>
                        </div>
                      </motion.div>
                    )
                  )}
                </AnimatePresence>
              </div>
            </div>

            {isPlaying && (
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
                      <div className="space-y-2">
                        {item.premises.map((premise, i) => (
                          <p key={i} dangerouslySetInnerHTML={{ __html: premise }} />
                        ))}
                        <div className="pt-2 border-t border-border mt-2">
                          <p><strong>Conclusion:</strong></p>
                          <p dangerouslySetInnerHTML={{ __html: item.conclusion }} />
                        </div>
                        <div className="flex justify-between items-center text-sm text-muted-foreground">
                          <span>
                            Response: {
                              item.userAnswer === 'timeout'
                                ? 'Timed Out'
                                : item.userAnswer
                                ? 'True'
                                : 'False'
                            }
                          </span>
                          <span>
                            {Math.round(item.responseTime / 1000)}s
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
            {isPlaying && (
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
            )}

            <Settings settings={settings} onSettingsChange={setSettings} />
          </div>
        </div>
      </div>
    </div>
  );
}