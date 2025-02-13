import { useState } from 'react';
import { cn } from '@/lib/utils';

function SettingsGroup({ title, children, defaultExpanded = false }) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  return (
    <div className="space-y-2">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center justify-between w-full p-3 rounded-lg hover:bg-muted/50 transition-colors"
      >
        <span className="font-medium">{title}</span>
        <span className="text-muted-foreground">
          {isExpanded ? '−' : '+'}
        </span>
      </button>
      {isExpanded && (
        <div className="space-y-2 ml-4">
          {children}
        </div>
      )}
    </div>
  );
}

export function Settings({ settings, onSettingsChange, isPlaying }) {
  const handleChange = (key, value) => {
    onSettingsChange(prev => ({
      ...prev,
      [key]: value
    }));
  };

  return (
    <div className="space-y-6 bg-card rounded-xl p-6 shadow-lg">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Settings</h2>
      </div>

      <div className="space-y-4">
        <SettingsGroup title="Objects" defaultExpanded={false}>
          <div className="form-group">
            <label className="form-label">Number of Balls</label>
            <input
              type="number"
              value={settings.numBalls}
              onChange={e => handleChange('numBalls', Math.max(4, Math.min(20, parseInt(e.target.value))))}
              min="4"
              max="20"
              className="form-input w-20"
              disabled={isPlaying}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Target Balls</label>
            <input
              type="number"
              value={settings.numTargets}
              onChange={e => handleChange('numTargets', Math.max(1, Math.min(
                settings.numBalls - 1,
                parseInt(e.target.value)
              )))}
              min="1"
              max={settings.numBalls - 1}
              className="form-input w-20"
              disabled={isPlaying}
            />
          </div>
        </SettingsGroup>

        <SettingsGroup title="Movement" defaultExpanded={false}>
          <div className="form-group">
            <label className="form-label">Ball Speed</label>
            <input
              type="number"
              value={settings.velocity}
              onChange={e => handleChange('velocity', Math.max(1, Math.min(10, parseInt(e.target.value))))}
              min="1"
              max="10"
              className="form-input w-20"
              disabled={isPlaying}
            />
          </div>
        </SettingsGroup>

        <SettingsGroup title="Timing" defaultExpanded={false}>
          <div className="form-group">
            <label className="form-label">Remember Time (s)</label>
            <input
              type="number"
              value={settings.rememberTime}
              onChange={e => handleChange('rememberTime', Math.max(1, Math.min(10, parseInt(e.target.value))))}
              min="1"
              max="10"
              className="form-input w-20"
              disabled={isPlaying}
            />
            <p className="text-sm text-muted-foreground mt-1">
              Time to memorize target balls
            </p>
          </div>

          <div className="form-group">
            <label className="form-label">Tracking Time (s)</label>
            <input
              type="number"
              value={settings.trackingTime}
              onChange={e => handleChange('trackingTime', Math.max(5, Math.min(30, parseInt(e.target.value))))}
              min="5"
              max="30"
              className="form-input w-20"
              disabled={isPlaying}
            />
            <p className="text-sm text-muted-foreground mt-1">
              Duration of ball movement
            </p>
          </div>

          <div className="form-group">
            <label className="form-label">Selection Time (s)</label>
            <input
              type="number"
              value={settings.selectionTime}
              onChange={e => handleChange('selectionTime', Math.max(3, Math.min(10, parseInt(e.target.value))))}
              min="3"
              max="10"
              className="form-input w-20"
              disabled={isPlaying}
            />
            <p className="text-sm text-muted-foreground mt-1">
              Time to select target balls
            </p>
          </div>
        </SettingsGroup>
      </div>
    </div>
  );
}