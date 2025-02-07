import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { generateQuestion } from './questionGenerators';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { Settings } from './Settings';

export default function RRT() {
  const [settings, setSettings] = useLocalStorage('rrt-settings', {
    premises: 3,
    enableCarouselMode: false,
    enableTimer: true,
    timerDuration: 30,
    enableStroopEffect: false,
    questionTypes: {
      distinction: true,
      comparison: true,
      temporal: true,
      direction: true,
      direction3D: false,
      direction4D: false,
      syllogism: true,
      analogy: false,
      binary: false
    }
  });

  const [showSettings, setShowSettings] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState(null);
  const [carouselIndex, setCarouselIndex] = useState(0);
  const [history, setHistory] = useState([]);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(settings.timerDuration);
  const [isTimerRunning, setIsTimerRunning] = useState(false);

  const generateNewQuestion = useCallback(() => {
    const question = generateQuestion(settings);
    question.createdAt = Date.now();
    setCurrentQuestion(question);
    setCarouselIndex(0);
    setTimeLeft(settings.timerDuration);
    setIsTimerRunning(settings.enableTimer);
  }, [settings]);

  useEffect(() => {
    generateNewQuestion();
  }, [generateNewQuestion]);

  useEffect(() => {
    if (!isTimerRunning || !settings.enableTimer) return;
    
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
  }, [isTimerRunning, settings.enableTimer]);

  const handleAnswer = (answer) => {
    const isCorrect = answer === currentQuestion.isValid;
    const answeredQuestion = {
      ...currentQuestion,
      userAnswer: answer,
      isCorrect,
      answeredAt: Date.now(),
      responseTime: Date.now() - currentQuestion.createdAt
    };
    
    setHistory(prev => [answeredQuestion, ...prev]);
    setScore(prev => prev + (isCorrect ? 1 : -1));
    setIsTimerRunning(false);
    
    setTimeout(generateNewQuestion, 1500);
  };

  const handleTimeout = () => {
    const timedOutQuestion = {
      ...currentQuestion,
      userAnswer: 'timeout',
      isCorrect: false,
      answeredAt: Date.now(),
      responseTime: settings.timerDuration * 1000
    };
    
    setHistory(prev => [timedOutQuestion, ...prev]);
    setScore(prev => prev - 1);
    setIsTimerRunning(false);
    
    setTimeout(generateNewQuestion, 1500);
  };

  if (!currentQuestion) return null;

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_350px] gap-8">
          <div className="space-y-6">
            <div className="bg-card rounded-xl p-8 shadow-lg">
              {settings.enableTimer && (
                <div className="h-1 bg-muted rounded-full overflow-hidden mb-6">
                  <motion.div
                    className="h-full bg-primary"
                    initial={{ width: '100%' }}
                    animate={{ width: `${(timeLeft / settings.timerDuration) * 100}%` }}
                    transition={{ duration: 1, ease: 'linear' }}
                  />
                </div>
              )}
              
              <AnimatePresence mode="wait">
                {settings.enableCarouselMode ? (
                  <motion.div
                    key={carouselIndex}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
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
                            onClick={() => handleAnswer(true)}
                            className="py-3 bg-success hover:bg-success/90 text-success-foreground rounded-lg font-medium transition-colors"
                          >
                            True
                          </button>
                          <button
                            onClick={() => handleAnswer(false)}
                            className="py-3 bg-destructive hover:bg-destructive/90 text-destructive-foreground rounded-lg font-medium transition-colors"
                          >
                            False
                          </button>
                        </div>
                      </>
                    )}
                  </motion.div>
                ) : (
                  <motion.div
                    key="full-display"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
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
                      <p className="text-xl" dangerouslySetInnerHTML={{ 
                        __html: currentQuestion.conclusion 
                      }} />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <button
                        onClick={() => handleAnswer(true)}
                        className="py-3 bg-success hover:bg-success/90 text-success-foreground rounded-lg font-medium transition-colors"
                      >
                        True
                      </button>
                      <button
                        onClick={() => handleAnswer(false)}
                        className="py-3 bg-destructive hover:bg-destructive/90 text-destructive-foreground rounded-lg font-medium transition-colors"
                      >
                        False
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

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
          </div>

          <div className="space-y-6">
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
                <button
                  onClick={() => setShowSettings(!showSettings)}
                  className="w-full py-2 px-4 bg-muted hover:bg-muted/80 rounded-lg font-medium transition-colors"
                >
                  {showSettings ? 'Hide Settings' : 'Show Settings'}
                </button>
              </div>
            </div>

            {showSettings && (
              <Settings settings={settings} onSettingsChange={setSettings} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}