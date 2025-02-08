import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

export function Settings({ settings, onSettingsChange }) {
  const handleChange = (key, value) => {
    onSettingsChange(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const handleQuestionTypeChange = (type, enabled) => {
    onSettingsChange(prev => {
      // If trying to disable a type, check if it would leave no types enabled
      if (!enabled) {
        const enabledCount = Object.values(prev.questionTypes).filter(Boolean).length;
        if (enabledCount <= 1 && prev.questionTypes[type]) {
          // Prevent disabling the last enabled type
          return prev;
        }
      }
      
      return {
        ...prev,
        questionTypes: {
          ...prev.questionTypes,
          [type]: enabled
        }
      };
    });
  };

  return (
    <div className="bg-card rounded-xl p-6 shadow-lg">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold">Settings</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-medium text-primary mb-4">General</h3>
            <div className="space-y-4">
              <div className="form-group">
                <label className="form-label">Number of Premises</label>
                <input
                  type="number"
                  min="2"
                  max="6"
                  value={settings.premises}
                  onChange={e => handleChange('premises', parseInt(e.target.value))}
                  className="form-input"
                />
              </div>

              <label className="flex items-center space-x-3 p-3 rounded-lg hover:bg-muted/50 transition-colors">
                <input
                  type="checkbox"
                  checked={settings.enableCarouselMode}
                  onChange={e => handleChange('enableCarouselMode', e.target.checked)}
                  className="form-checkbox"
                />
                <span className="font-medium">Carousel Mode</span>
              </label>

              <label className="flex items-center space-x-3 p-3 rounded-lg hover:bg-muted/50 transition-colors">
                <input
                  type="checkbox"
                  checked={settings.enableTimer}
                  onChange={e => handleChange('enableTimer', e.target.checked)}
                  className="form-checkbox"
                />
                <span className="font-medium">Enable Timer</span>
              </label>

              {settings.enableTimer && (
                <div className="form-group">
                  <label className="form-label">Timer Duration (seconds)</label>
                  <input
                    type="number"
                    min="5"
                    max="60"
                    value={settings.timerDuration}
                    onChange={e => handleChange('timerDuration', parseInt(e.target.value))}
                    className="form-input"
                  />
                </div>
              )}

              <label className="flex items-center space-x-3 p-3 rounded-lg hover:bg-muted/50 transition-colors">
                <input
                  type="checkbox"
                  checked={settings.enableStroopEffect}
                  onChange={e => handleChange('enableStroopEffect', e.target.checked)}
                  className="form-checkbox"
                />
                <span className="font-medium">Enable Stroop Effect</span>
              </label>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-medium text-primary mb-4">Question Types</h3>
            <div className="space-y-3">
              {Object.entries({
                distinction: 'Distinction (Same/Opposite)',
                comparison: 'Comparison (More/Less)',
                temporal: 'Temporal (Before/After)',
                direction: '2D Direction',
                direction3D: '3D Direction',
                direction4D: '4D Direction',
                syllogism: 'Syllogism',
                analogy: 'Analogy',
                binary: 'Binary Logic'
              }).map(([type, label]) => (
                <label key={type} className="flex items-center space-x-3 p-3 rounded-lg hover:bg-muted/50 transition-colors">
                  <input
                    type="checkbox"
                    checked={settings.questionTypes[type]}
                    onChange={e => handleQuestionTypeChange(type, e.target.checked)}
                    className="form-checkbox"
                  />
                  <span className="font-medium">{label}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="p-4 bg-primary/5 rounded-lg">
            <h4 className="font-medium mb-2">Tips</h4>
            <ul className="text-sm text-muted-foreground space-y-2">
              <li>• Enable Carousel Mode for better focus on each premise</li>
              <li>• Start with fewer premises and gradually increase difficulty</li>
              <li>• Use the timer to improve response speed</li>
              <li>• Mix different question types for varied practice</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}