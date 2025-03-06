import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { Room } from './Room';

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
            <div className="font-medium">Total Balls:</div>
            <div>{settings.numBalls}</div>
            
            <div className="font-medium">Target Balls:</div>
            <div>{settings.numTargets}</div>
            
            <div className="font-medium">Ball Speed:</div>
            <div>{settings.physics?.speed || settings.velocity}</div>
            
            <div className="font-medium">Remember Time:</div>
            <div>{settings.rememberTime}s</div>
            
            <div className="font-medium">Tracking Time:</div>
            <div>{settings.trackingTime}s</div>
            
            <div className="font-medium">Selection Time:</div>
            <div>{settings.selectionTime > 0 ? `${settings.selectionTime}s` : 'Unlimited'}</div>
            
            {settings.physics && (
              <>
                <div className="font-medium col-span-2 mt-2">Physics:</div>
                <div className="font-medium ml-4">Movement Pattern:</div>
                <div className="capitalize">{settings.physics.movementPattern}</div>
                
                <div className="font-medium ml-4">Collisions:</div>
                <div>{settings.physics.collisionEnabled ? 'Enabled' : 'Disabled'}</div>
                
                {settings.physics.jitterIntensity && (
                  <>
                    <div className="font-medium ml-4">Jitter Intensity:</div>
                    <div>{settings.physics.jitterIntensity}/10</div>
                  </>
                )}
              </>
            )}
            
            {settings.distractions && Object.values(settings.distractions).some(v => v) && (
              <>
                <div className="font-medium col-span-2 mt-2">Distractions:</div>
                {settings.distractions.colorChanges && (
                  <div className="col-span-2 ml-4">Color Changes</div>
                )}
                {settings.distractions.sizeChanges && (
                  <div className="col-span-2 ml-4">Size Changes</div>
                )}
                {settings.distractions.screenFlash && (
                  <div className="col-span-2 ml-4">Screen Flash</div>
                )}
                {settings.distractions.wallColorChanges && (
                  <div className="col-span-2 ml-4">Wall Color Changes</div>
                )}
              </>
            )}
            
            {settings.rotation && (
              <>
                <div className="font-medium col-span-2 mt-2">Camera Rotation:</div>
                {settings.rotation.memorization && (
                  <>
                    <div className="font-medium ml-4 col-span-2">Memorization Phase:</div>
                    <div className="ml-8 col-span-2 grid grid-cols-2 gap-2">
                      <div>X: {settings.rotation.memorization.x}</div>
                      <div>Y: {settings.rotation.memorization.y}</div>
                      <div>Z: {settings.rotation.memorization.z}</div>
                    </div>
                  </>
                )}
                {settings.rotation.tracking && (
                  <>
                    <div className="font-medium ml-4 col-span-2">Tracking Phase:</div>
                    <div className="ml-8 col-span-2 grid grid-cols-2 gap-2">
                      <div>X: {settings.rotation.tracking.x}</div>
                      <div>Y: {settings.rotation.tracking.y}</div>
                      <div>Z: {settings.rotation.tracking.z}</div>
                    </div>
                  </>
                )}
                {settings.rotation.selection && (
                  <>
                    <div className="font-medium ml-4 col-span-2">Selection Phase:</div>
                    <div className="ml-8 col-span-2 grid grid-cols-2 gap-2">
                      <div>X: {settings.rotation.selection.x}</div>
                      <div>Y: {settings.rotation.selection.y}</div>
                      <div>Z: {settings.rotation.selection.z}</div>
                    </div>
                  </>
                )}
              </>
            )}
            
            {settings.mouseRotation?.enabled && (
              <>
                <div className="font-medium ml-4">Mouse Rotation:</div>
                <div>Enabled (Sensitivity: {settings.mouseRotation.sensitivity})</div>
              </>
            )}
            
            {settings.threeDGlasses && (
              <>
                <div className="font-medium ml-4">3D Glasses:</div>
                <div>Enabled (Disparity: {settings.threeDDisparity})</div>
              </>
            )}
            
            {settings.autoProgressionEnabled && (
              <>
                <div className="font-medium col-span-2 mt-2">Auto Progression:</div>
                <div className="font-medium ml-4">Advance Threshold:</div>
                <div>{settings.thresholdAdvance}%</div>
                
                <div className="font-medium ml-4">Fallback Threshold:</div>
                <div>{settings.thresholdFallback}%</div>
                
                <div className="font-medium ml-4">Speed Increment:</div>
                <div>{settings.speedIncrement}</div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function HistoryItem({ session, index, onUseSettings }) {
  const [expanded, setExpanded] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  
  // Calculate percentage correct
  const percentCorrect = Math.round(session.results.percentageCorrect);
  
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
              {session.results.correct}/{session.results.total} correct • {percentCorrect}% • {Math.round(session.results.duration * 10) / 10} min
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
                {/* 3D Scene display */}
                <div className="flex-1 min-w-0">
                  <div className="bg-card rounded-lg p-4 h-[350px] flex items-center justify-center">
                    <Canvas camera={{ position: [6, 6, 6], fov: 50 }}>
                      <ambientLight intensity={0.5} />
                      <pointLight position={[10, 10, 10]} />
                      <Room settings={session.settings} />
                      <OrbitControls
                        enableZoom={false}
                        autoRotate={true}
                        autoRotateSpeed={1}
                      />
                    </Canvas>
                  </div>
                </div>
                
                {/* Session information */}
                <div className="w-full md:w-[300px] space-y-4">
                  <div className="bg-card rounded-lg p-4">
                    <h3 className="font-medium mb-2">Session Details</h3>
                    
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                        <div className="font-medium">Date:</div>
                        <div>{new Date(session.timestamp).toLocaleDateString()}</div>
                        
                        <div className="font-medium">Time:</div>
                        <div>{new Date(session.timestamp).toLocaleTimeString()}</div>
                        
                        <div className="font-medium">Duration:</div>
                        <div>{Math.round(session.results.duration * 10) / 10} min</div>
                        
                        <div className="font-medium">Score:</div>
                        <div>{session.results.correct}/{session.results.total} ({percentCorrect}%)</div>
                        
                        <div className="font-medium">Ball Speed:</div>
                        <div>{session.results.speed}</div>
                        
                        <div className="font-medium">Total Balls:</div>
                        <div>{session.settings.numBalls}</div>
                        
                        <div className="font-medium">Target Balls:</div>
                        <div>{session.settings.numTargets}</div>
                      </div>
                      
                      {session.settings.autoProgressionEnabled && (
                        <div className="space-y-2 pt-2 border-t border-border">
                          <div className="text-sm text-muted-foreground">Auto Progression:</div>
                          <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                            <div className="font-medium">Status:</div>
                            <div>
                              {percentCorrect >= session.settings.thresholdAdvance
                                ? "Advanced"
                                : percentCorrect < session.settings.thresholdFallback
                                  ? "Regressed"
                                  : "Maintained"}
                            </div>
                          </div>
                        </div>
                      )}
                      
                      <button
                        onClick={() => onUseSettings(session)}
                        className="w-full mt-4 py-2 bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg font-medium transition-colors text-sm"
                      >
                        Use These Settings
                      </button>
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

export function History({ sessions, defaultExpanded = true, onUseSettings }) {
  const [expanded, setExpanded] = useState(defaultExpanded);
  
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
              {sessions.map((session, index) => (
                <HistoryItem 
                  key={session.timestamp} 
                  session={session} 
                  index={index} 
                  onUseSettings={onUseSettings}
                />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}