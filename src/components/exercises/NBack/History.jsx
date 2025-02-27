import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Grid2D, Grid3D } from './Grid';
import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';

function formatDate(timestamp) {
  const date = new Date(timestamp);
  return date.toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  });
}

function SettingsPopup({ settings, onClose }) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[1000]" onClick={onClose}>
      <div className="bg-card rounded-xl p-6 shadow-lg max-w-md max-h-[80vh] overflow-y-auto relative z-[1001]" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold">Session Settings</h3>
          <button onClick={onClose} className="p-1 rounded-full hover:bg-muted">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>
        
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-2">
            <div className="font-medium">N-Back Level:</div>
            <div>{settings.nBackLevel}</div>
            
            {settings.useIndividualNBacks && (
              <>
                <div className="font-medium col-span-2 mt-2">Individual N-Back Levels:</div>
                {Object.entries(settings.individualNBacks || {}).map(([type, level]) => (
                  <div key={type} className="col-span-2 grid grid-cols-2 gap-2 ml-4">
                    <div className="capitalize">{type}:</div>
                    <div>{level}</div>
                  </div>
                ))}
              </>
            )}
            
            <div className="font-medium">Grid Type:</div>
            <div>{settings.is3D ? '3D' : '2D'}</div>
            
            {settings.is3D && (
              <>
                <div className="font-medium">Auto-rotate:</div>
                <div>{settings.autoRotate ? 'Yes' : 'No'}</div>
              </>
            )}
            
            <div className="font-medium col-span-2 mt-2">Active Stimuli:</div>
            {settings.activeStimuli.map(stimulus => (
              <div key={stimulus} className="col-span-1 ml-4 capitalize">{stimulus}</div>
            ))}
            
            {settings.activeStimuli.includes('audio') && (
              <>
                <div className="font-medium col-span-2 mt-2">Audio Types:</div>
                {settings.audioTypes.map(type => (
                  <div key={type} className="col-span-1 ml-4 capitalize">{type}</div>
                ))}
              </>
            )}
            
            <div className="font-medium col-span-2 mt-2">Timing:</div>
            <div className="font-medium ml-4">Display Duration:</div>
            <div>
              {settings.randomizeDisplayDuration 
                ? `${settings.displayDurationMin} - ${settings.displayDurationMax} ms`
                : `${settings.displayDuration} ms`}
            </div>
            
            <div className="font-medium ml-4">Delay Duration:</div>
            <div>
              {settings.randomizeDelayDuration 
                ? `${settings.delayDurationMin} - ${settings.delayDurationMax} ms`
                : `${settings.delayDuration} ms`}
            </div>
            
            <div className="font-medium col-span-2 mt-2">Advanced:</div>
            <div className="font-medium ml-4">Guaranteed Matches:</div>
            <div>{(settings.guaranteedMatchesChance * 100).toFixed(1)}%</div>
            
            <div className="font-medium ml-4">Interference Chance:</div>
            <div>{(settings.interferenceChance * 100).toFixed(1)}%</div>
          </div>
        </div>
      </div>
    </div>
  );
}

function HistoryItem({ session, index }) {
  const [expanded, setExpanded] = useState(false);
  const [currentTurn, setCurrentTurn] = useState(0);
  const [showSettings, setShowSettings] = useState(false);
  
  // Calculate percentage correct
  const percentCorrect = Math.round(session.metrics.percentageCorrect);
  
  return (
    <div className={cn(
      "border border-border rounded-lg overflow-hidden transition-all",
      expanded ? "mb-6" : "mb-2"
    )}>
      {/* Preview header - always visible */}
      <div 
        className="p-4 bg-card flex items-center justify-between cursor-pointer hover:bg-muted/50 transition-colors"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center gap-4">
          <div className="text-xl font-semibold">{index + 1}</div>
          <div>
            <div className="font-medium">{formatDate(session.timestamp)}</div>
            <div className="text-sm text-muted-foreground">
              {session.stimuli.length} turns • {percentCorrect}% correct • {Math.round(session.duration * 10) / 10} min
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button 
            className="p-2 rounded-full hover:bg-background"
            onClick={(e) => {
              e.stopPropagation();
              setShowSettings(true);
            }}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="3"></circle>
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
            </svg>
          </button>
          <div className="w-6 h-6 flex items-center justify-center">
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              width="20" 
              height="20" 
              viewBox="0 0 24 24" 
              fill="none" 
              stroke="currentColor" 
              strokeWidth="2" 
              strokeLinecap="round" 
              strokeLinejoin="round"
              className={cn("transition-transform", expanded ? "rotate-180" : "")}
            >
              <polyline points="6 9 12 15 18 9"></polyline>
            </svg>
          </div>
        </div>
      </div>
      
      {/* Expanded content */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden"
          >
            <div className="p-4 bg-background border-t border-border">
              <div className="flex flex-col md:flex-row gap-6">
                {/* Grid display */}
                <div className="flex-1 min-w-0">
                  <div className="bg-card rounded-lg p-4 h-[350px] flex items-center justify-center">
                    {session.settings.is3D ? (
                      <div className="w-full h-full">
                        <Canvas camera={{ position: [6, 6, 6], fov: 50 }}>
                          <ambientLight intensity={0.5} />
                          <pointLight position={[10, 10, 10]} />
                          <Grid3D
                            position={session.stimuli[currentTurn]?.position}
                            color={session.stimuli[currentTurn]?.color || '#ffffff'}
                            isActive={true}
                            number={session.stimuli[currentTurn]?.number}
                            shape={session.stimuli[currentTurn]?.shape}
                          />
                          <OrbitControls
                            enableZoom={false}
                            autoRotate={session.settings.autoRotate}
                            autoRotateSpeed={1}
                          />
                        </Canvas>
                      </div>
                    ) : (
                      <Grid2D
                        position={session.stimuli[currentTurn]?.position}
                        color={session.stimuli[currentTurn]?.color || '#3498db'}
                        number={session.stimuli[currentTurn]?.number}
                        shape={session.stimuli[currentTurn]?.shape}
                      />
                    )}
                  </div>
                </div>
                
                {/* Turn information */}
                <div className="w-full md:w-[300px] space-y-4">
                  <div className="bg-card rounded-lg p-4">
                    <h3 className="font-medium mb-2">Turn {currentTurn + 1} of {session.stimuli.length}</h3>
                    
                    <div className="space-y-4">
                      <div>
                        <label className="text-sm text-muted-foreground block mb-2">
                          Select Turn
                        </label>
                        <input
                          type="range"
                          min="0"
                          max={session.stimuli.length - 1}
                          value={currentTurn}
                          onChange={(e) => setCurrentTurn(parseInt(e.target.value))}
                          className="w-full"
                        />
                      </div>
                      
                      {/* Timing information */}
                      <div>
                        <div className="text-sm text-muted-foreground mb-2">Timing:</div>
                        <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                          <div className="font-medium">Display Duration:</div>
                          <div>{session.stimuli[currentTurn]?.displayDuration || session.settings.displayDuration} ms</div>
                          
                          <div className="font-medium">Delay Duration:</div>
                          <div>{session.stimuli[currentTurn]?.delayDuration || session.settings.delayDuration} ms</div>
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <div className="text-sm text-muted-foreground">Stimulus Details:</div>
                        {session.stimuli[currentTurn] && (
                          <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                            {session.stimuli[currentTurn].position && (
                              <>
                                <div className="font-medium">Position:</div>
                                <div>{JSON.stringify(session.stimuli[currentTurn].position)}</div>
                              </>
                            )}
                            
                            {session.stimuli[currentTurn].color && (
                              <>
                                <div className="font-medium">Color:</div>
                                <div className="flex items-center gap-2">
                                  <div 
                                    className="w-4 h-4 rounded-full" 
                                    style={{ backgroundColor: session.stimuli[currentTurn].color }}
                                  ></div>
                                  {session.stimuli[currentTurn].color}
                                </div>
                              </>
                            )}
                            
                            {session.stimuli[currentTurn].number && (
                              <>
                                <div className="font-medium">Number:</div>
                                <div>{session.stimuli[currentTurn].number}</div>
                              </>
                            )}
                            
                            {session.stimuli[currentTurn].shape && (
                              <>
                                <div className="font-medium">Shape:</div>
                                <div className="capitalize">{session.stimuli[currentTurn].shape}</div>
                              </>
                            )}
                            
                            {session.stimuli[currentTurn].letter && (
                              <>
                                <div className="font-medium">Audio (Letter):</div>
                                <div>{session.stimuli[currentTurn].letter}</div>
                              </>
                            )}
                            
                            {session.stimuli[currentTurn].spokenNumber && (
                              <>
                                <div className="font-medium">Audio (Number):</div>
                                <div>{session.stimuli[currentTurn].spokenNumber}</div>
                              </>
                            )}
                            
                            {session.stimuli[currentTurn].tone && (
                              <>
                                <div className="font-medium">Audio (Tone):</div>
                                <div>{session.stimuli[currentTurn].tone}</div>
                              </>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Settings popup */}
      {showSettings && (
        <SettingsPopup 
          settings={session.settings} 
          onClose={() => setShowSettings(false)} 
        />
      )}
    </div>
  );
}

export function History({ sessions }) {
  const [expanded, setExpanded] = useState(true);
  
  if (!sessions || sessions.length === 0) {
    return null;
  }
  
  return (
    <div className="mt-8 bg-card rounded-xl p-6 shadow-lg">
      <div 
        className="flex items-center justify-between mb-4 cursor-pointer"
        onClick={() => setExpanded(!expanded)}
      >
        <h2 className="text-2xl font-bold">History</h2>
        <div className="w-6 h-6 flex items-center justify-center">
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            width="20" 
            height="20" 
            viewBox="0 0 24 24" 
            fill="none" 
            stroke="currentColor" 
            strokeWidth="2" 
            strokeLinecap="round" 
            strokeLinejoin="round"
            className={cn("transition-transform", expanded ? "rotate-180" : "")}
          >
            <polyline points="6 9 12 15 18 9"></polyline>
          </svg>
        </div>
      </div>
      
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden"
          >
            <div className="space-y-2 mt-4">
              {sessions.slice().reverse().map((session, index) => (
                <HistoryItem 
                  key={session.timestamp} 
                  session={session} 
                  index={sessions.length - 1 - index} 
                />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}