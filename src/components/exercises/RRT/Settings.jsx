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
    onSettingsChange(prev => ({
      ...prev,
      questionTypes: {
        ...prev.questionTypes,
        [type]: enabled
      }
    }));
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
              <div>
                <label className="block text-sm font-medium mb-1">
                  Number of Premises
                </label>
                <input
                  type="number"
                  min="2"
                  max="6"
                  value={settings.premises}
                  onChange={e => handleChange('premises', parseInt(e.target.value))}
                  className="w-full rounded-md border-gray-300 focus:border-primary focus:ring-primary"
                />
              </div>

              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={settings.enableCarouselMode}
                  onChange={e => handleChange('enableCarouselMode', e.target.checked)}
                  className="rounded border-gray-300 text-primary focus:ring-primary"
                />
                <span>Carousel Mode</span>
              </label>

              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={settings.enableTimer}
                  onChange={e => handleChange('enableTimer', e.target.checked)}
                  className="rounded border-gray-300 text-primary focus:ring-primary"
                />
                <span>Enable Timer</span>
              </label>

              {settings.enableTimer && (
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Timer Duration (seconds)
                  </label>
                  <input
                    type="number"
                    min="5"
                    max="60"
                    value={settings.timerDuration}
                    onChange={e => handleChange('timerDuration', parseInt(e.target.value))}
                    className="w-full rounded-md border-gray-300 focus:border-primary focus:ring-primary"
                  />
                </div>
              )}

              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={settings.enableStroopEffect}
                  onChange={e => handleChange('enableStroopEffect', e.target.checked)}
                  className="rounded border-gray-300 text-primary focus:ring-primary"
                />
                <span>Enable Stroop Effect</span>
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
                <label key={type} className="flex items-center space-x-2 p-2 rounded-lg hover:bg-muted transition-colors">
                  <input
                    type="checkbox"
                    checked={settings.questionTypes[type]}
                    onChange={e => handleQuestionTypeChange(type, e.target.checked)}
                    className="rounded border-gray-300 text-primary focus:ring-primary"
                  />
                  <span>{label}</span>
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