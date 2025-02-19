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

  const handleCrosshairChange = (key, value, subKey = null) => {
    onSettingsChange(prev => {
      const crosshair = prev.crosshair || {
        enabled: true,
        color: { r: 255, g: 255, b: 255, a: 1 },
        innerLines: { enabled: true, opacity: 1, length: 6, thickness: 2, offset: 3 },
        outerLines: { enabled: true, opacity: 1, length: 2, thickness: 2, offset: 10 },
        centerDot: { enabled: true, opacity: 1, thickness: 2 },
        rotation: 0
      };

      if (subKey) {
        return {
          ...prev,
          crosshair: {
            ...crosshair,
            [key]: {
              ...crosshair[key],
              [subKey]: value
            }
          }
        };
      }

      return {
        ...prev,
        crosshair: {
          ...crosshair,
          [key]: value
        }
      };
    });
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

        <SettingsGroup title="Crosshair" defaultExpanded={false}>
          <div className="form-group">
            <label className="form-label flex items-center space-x-2">
              <input
                type="checkbox"
                checked={settings.crosshair?.enabled ?? true}
                onChange={e => handleCrosshairChange('enabled', e.target.checked)}
                className="form-checkbox"
                disabled={isPlaying}
              />
              <span>Show Crosshair</span>
            </label>
          </div>

          {settings.crosshair?.enabled && (
            <div className="space-y-4 mt-4">
              <div className="form-group">
                <label className="form-label">Color</label>
                <div className="grid grid-cols-4 gap-2">
                  <div>
                    <label className="text-xs text-muted-foreground">R</label>
                    <input
                      type="number"
                      value={settings.crosshair?.color?.r || 255}
                      onChange={e => handleCrosshairChange('color', Math.max(0, Math.min(255, parseInt(e.target.value) || 0)), 'r')}
                      min="0"
                      max="255"
                      className="form-input w-full"
                      disabled={isPlaying}
                    />
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground">G</label>
                    <input
                      type="number"
                      value={settings.crosshair?.color?.g || 0}
                      onChange={e => handleCrosshairChange('color', Math.max(0, Math.min(255, parseInt(e.target.value) || 0)), 'g')}
                      min="0"
                      max="255"
                      className="form-input w-full"
                      disabled={isPlaying}
                    />
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground">B</label>
                    <input
                      type="number"
                      value={settings.crosshair?.color?.b || 0}
                      onChange={e => handleCrosshairChange('color', Math.max(0, Math.min(255, parseInt(e.target.value) || 0)), 'b')}
                      min="0"
                      max="255"
                      className="form-input w-full"
                      disabled={isPlaying}
                    />
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground">Alpha</label>
                    <input
                      type="number"
                      value={settings.crosshair?.color?.a || 1}
                      onChange={e => handleCrosshairChange('color', Math.max(0, Math.min(1, parseFloat(e.target.value) || 0)), 'a')}
                      min="0"
                      max="1"
                      step="0.1"
                      className="form-input w-full"
                      disabled={isPlaying}
                    />
                  </div>
                </div>
                <div className="mt-2">
                  <input
                    type="color"
                    value={`#${(settings.crosshair?.color?.r ?? 255).toString(16).padStart(2, '0')}${(settings.crosshair?.color?.g ?? 0).toString(16).padStart(2, '0')}${(settings.crosshair?.color?.b ?? 0).toString(16).padStart(2, '0')}`}
                    onChange={e => {
                      const hex = e.target.value.substring(1);
                      const r = parseInt(hex.substring(0, 2), 16);
                      const g = parseInt(hex.substring(2, 4), 16);
                      const b = parseInt(hex.substring(4, 6), 16);
                      handleCrosshairChange('color', {
                        ...(settings.crosshair?.color ?? { a: 1 }),
                        r, g, b
                      });
                    }}
                    className="w-full"
                    disabled={isPlaying}
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Rotation (degrees)</label>
                <input
                  type="number"
                  value={settings.crosshair?.rotation || 0}
                  onChange={e => handleCrosshairChange('rotation', Math.max(0, Math.min(360, parseInt(e.target.value) || 0)))}
                  min="0"
                  max="360"
                  className="form-input w-20"
                  disabled={isPlaying}
                />
              </div>

              <div className="space-y-4 border-t border-border pt-4">
                <h3 className="font-medium">Center Dot</h3>
                <div className="space-y-2">
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={settings.crosshair?.centerDot?.enabled ?? true}
                      onChange={e => handleCrosshairChange('centerDot', e.target.checked, 'enabled')}
                      className="form-checkbox"
                      disabled={isPlaying}
                    />
                    <span>Show Center Dot</span>
                  </label>
                  {settings.crosshair?.centerDot?.enabled && (
                    <>
                      <div className="form-group">
                        <label className="form-label">Thickness</label>
                        <input
                          type="number"
                          value={settings.crosshair?.centerDot?.thickness || 5}
                          onChange={e => handleCrosshairChange('centerDot', Math.max(1, Math.min(10, parseInt(e.target.value) || 1)), 'thickness')}
                          min="1"
                          max="10"
                          className="form-input w-20"
                          disabled={isPlaying}
                        />
                      </div>
                      <div className="form-group">
                        <label className="form-label">Opacity</label>
                        <input
                          type="number"
                          value={settings.crosshair?.centerDot?.opacity ?? 1}
                          onChange={e => handleCrosshairChange('centerDot', Math.max(0, Math.min(1, parseFloat(e.target.value) || 0)), 'opacity')}
                          min="0"
                          max="1"
                          step="0.1"
                          className="form-input w-20"
                          disabled={isPlaying}
                        />
                      </div>
                    </>
                  )}
                </div>
              </div>

              <div className="space-y-4 border-t border-border pt-4">
                <h3 className="font-medium">Inner Lines</h3>
                <div className="space-y-2">
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={settings.crosshair?.innerLines?.enabled ?? true}
                      onChange={e => handleCrosshairChange('innerLines', e.target.checked, 'enabled')}
                      className="form-checkbox"
                      disabled={isPlaying}
                    />
                    <span>Show Inner Lines</span>
                  </label>
                  {settings.crosshair?.innerLines?.enabled && (
                    <>
                      <div className="form-group">
                        <label className="form-label">Length</label>
                        <input
                          type="number"
                          value={settings.crosshair?.innerLines?.length ?? 6}
                          onChange={e => handleCrosshairChange('innerLines', Math.max(1, Math.min(20, parseInt(e.target.value) || 1)), 'length')}
                          min="1"
                          max="20"
                          className="form-input w-20"
                          disabled={isPlaying}
                        />
                      </div>
                      <div className="form-group">
                        <label className="form-label">Thickness</label>
                        <input
                          type="number"
                          value={settings.crosshair?.innerLines?.thickness ?? 2}
                          onChange={e => handleCrosshairChange('innerLines', Math.max(1, Math.min(10, parseInt(e.target.value) || 1)), 'thickness')}
                          min="1"
                          max="10"
                          className="form-input w-20"
                          disabled={isPlaying}
                        />
                      </div>
                      <div className="form-group">
                        <label className="form-label">Offset</label>
                        <input
                          type="number"
                          value={settings.crosshair?.innerLines?.offset ?? 3}
                          onChange={e => handleCrosshairChange('innerLines', Math.max(0, Math.min(20, parseInt(e.target.value) || 0)), 'offset')}
                          min="0"
                          max="20"
                          className="form-input w-20"
                          disabled={isPlaying}
                        />
                      </div>
                      <div className="form-group">
                        <label className="form-label">Opacity</label>
                        <input
                          type="number"
                          value={settings.crosshair?.innerLines?.opacity ?? 1}
                          onChange={e => handleCrosshairChange('innerLines', Math.max(0, Math.min(1, parseFloat(e.target.value) || 0)), 'opacity')}
                          min="0"
                          max="1"
                          step="0.1"
                          className="form-input w-20"
                          disabled={isPlaying}
                        />
                      </div>
                    </>
                  )}
                </div>
              </div>

              <div className="space-y-4 border-t border-border pt-4">
                <h3 className="font-medium">Outer Lines</h3>
                <div className="space-y-2">
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={settings.crosshair?.outerLines?.enabled ?? true}
                      onChange={e => handleCrosshairChange('outerLines', e.target.checked, 'enabled')}
                      className="form-checkbox"
                      disabled={isPlaying}
                    />
                    <span>Show Outer Lines</span>
                  </label>
                  {settings.crosshair?.outerLines?.enabled && (
                    <>
                      <div className="form-group">
                        <label className="form-label">Length</label>
                        <input
                          type="number"
                          value={settings.crosshair?.outerLines?.length ?? 2}
                          onChange={e => handleCrosshairChange('outerLines', Math.max(1, Math.min(20, parseInt(e.target.value) || 1)), 'length')}
                          min="1"
                          max="20"
                          className="form-input w-20"
                          disabled={isPlaying}
                        />
                      </div>
                      <div className="form-group">
                        <label className="form-label">Thickness</label>
                        <input
                          type="number"
                          value={settings.crosshair?.outerLines?.thickness ?? 2}
                          onChange={e => handleCrosshairChange('outerLines', Math.max(1, Math.min(10, parseInt(e.target.value) || 1)), 'thickness')}
                          min="1"
                          max="10"
                          className="form-input w-20"
                          disabled={isPlaying}
                        />
                      </div>
                      <div className="form-group">
                        <label className="form-label">Offset</label>
                        <input
                          type="number"
                          value={settings.crosshair?.outerLines?.offset ?? 10}
                          onChange={e => handleCrosshairChange('outerLines', Math.max(0, Math.min(20, parseInt(e.target.value) || 0)), 'offset')}
                          min="0"
                          max="20"
                          className="form-input w-20"
                          disabled={isPlaying}
                        />
                      </div>
                      <div className="form-group">
                        <label className="form-label">Opacity</label>
                        <input
                          type="number"
                          value={settings.crosshair?.outerLines?.opacity ?? 1}
                          onChange={e => handleCrosshairChange('outerLines', Math.max(0, Math.min(1, parseFloat(e.target.value) || 0)), 'opacity')}
                          min="0"
                          max="1"
                          step="0.1"
                          className="form-input w-20"
                          disabled={isPlaying}
                        />
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          )}
        </SettingsGroup>
      </div>
    </div>
  );
}