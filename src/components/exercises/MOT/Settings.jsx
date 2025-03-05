import { useState } from 'react';
import { cn } from '@/lib/utils';
import { SettingTooltip } from '@/components/SettingTooltip';

function SettingsGroup({ title, children, defaultExpanded = false, visible = true }) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  if (!visible) return null;

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

  const handleNestedChange = (parentKey, key, value) => {
    onSettingsChange(prev => {
      const parent = prev[parentKey] || {};
      return {
        ...prev,
        [parentKey]: {
          ...parent,
          [key]: value
        }
      };
    });
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

  const handleRotationChange = (phase, axis, value) => {
    onSettingsChange(prev => {
      const rotation = prev.rotation || {
        selection: { x: 0, y: 0.5, z: 0, xBoomerang: 0, yBoomerang: 1, zBoomerang: 0 },
        memorization: { x: 0, y: 0.5, z: 0, xBoomerang: 0, yBoomerang: 1, zBoomerang: 0 },
        tracking: { x: 0, y: 0, z: 0, xBoomerang: 0, yBoomerang: 0, zBoomerang: 0 }
      };
      
      return {
        ...prev,
        rotation: {
          ...rotation,
          [phase]: {
            ...rotation[phase],
            [axis]: value
          }
        }
      };
    });
  };

  // Initialize default settings if they don't exist
  const advancedMode = settings.advancedMode ?? false;
  const physics = settings.physics || {
    ballDensity: 1,
    minSpeed: 5,
    maxSpeed: 10,
    collisionEnabled: true,
    movementPattern: 'regular'
  };
  const distractions = settings.distractions || {
    colorChanges: false,
    sizeChanges: false,
    screenFlash: false,
    wallColorChanges: false
  };
  const rotation = settings.rotation || {
    selection: { x: 0, y: 0.5, z: 0, xBoomerang: 0, yBoomerang: 0.5, zBoomerang: 0 },
    memorization: { x: 0, y: 0.5, z: 0, xBoomerang: 0, yBoomerang: 0.5, zBoomerang: 0 },
    tracking: { x: 0, y: 0, z: 0, xBoomerang: 0, yBoomerang: 0, zBoomerang: 0 }
  };
  const room = settings.room || {
    width: 12,
    height: 8,
    depth: 12
  };

  // Add a CSS style to fix tooltip positioning
  const formGroupStyle = `
    .form-group {
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .form-group > label {
      flex-shrink: 0;
    }
    .form-group > input,
    .form-group > select {
      flex-shrink: 0;
    }
  `;

  return (
    <div className="space-y-6 bg-card rounded-xl p-6 shadow-lg">
      <style>{formGroupStyle}</style>
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Settings</h2>
      </div>

      <div className="space-y-4">

        {/* Difficulty Section (renamed from Objects) */}
        <SettingsGroup title="Difficulty" defaultExpanded={false}>
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

        {/* Physics Section */}
        <SettingsGroup title="Physics" defaultExpanded={false} visible={advancedMode}>
          <div className="form-group">
            <label className="form-label">Ball Density</label>
            <input
              type="number"
              value={physics.ballDensity}
              onChange={e => handleNestedChange('physics', 'ballDensity', Math.max(0.1, Math.min(5, parseFloat(e.target.value))))}
              min="0.1"
              max="5"
              step="0.1"
              className="form-input w-20"
              disabled={isPlaying}
            />
            <SettingTooltip text="Controls ball mass/density affecting collision physics" />
          </div>

          <div className="form-group">
            <label className="form-label">Speed</label>
            <input
              type="number"
              value={physics.speed || ((physics.minSpeed + physics.maxSpeed) / 2)}
              onChange={e => {
                const speed = Math.max(1, parseInt(e.target.value));
                handleNestedChange('physics', 'speed', speed);
                // Also update min/max for backward compatibility
                handleNestedChange('physics', 'minSpeed', speed);
                handleNestedChange('physics', 'maxSpeed', speed);
              }}
              min="1"
              className="form-input w-20"
              disabled={isPlaying}
            />
            <SettingTooltip text="Ball movement speed" />
          </div>

          <div className="form-group">
            <label className="form-label flex items-center space-x-2">
              <input
                type="checkbox"
                checked={physics.collisionEnabled}
                onChange={e => handleNestedChange('physics', 'collisionEnabled', e.target.checked)}
                className="form-checkbox"
                disabled={isPlaying}
              />
              <span>Enable Collisions</span>
            </label>
            <SettingTooltip text="When enabled, balls bounce off each other. When disabled, balls pass through each other." />
          </div>

          <div className="form-group">
            <label className="form-label">Movement Pattern</label>
            <select
              value={physics.movementPattern}
              onChange={e => handleNestedChange('physics', 'movementPattern', e.target.value)}
              className="form-select w-full"
              disabled={isPlaying}
            >
              <option value="regular">Regular (Predictable Physics)</option>
              <option value="globalJitter">Global Jitter (All balls change direction together)</option>
              <option value="individualJitter">Individual Jitter (Each ball changes independently)</option>
            </select>
            <SettingTooltip text="Controls how balls change direction during movement" />
          </div>

          {physics.movementPattern === 'globalJitter' && (
            <>
              <div className="form-group">
                <label className="form-label">Global Jitter Intensity</label>
                <input
                  type="number"
                  value={physics.globalJitterIntensity || physics.jitterIntensity || 5}
                  onChange={e => handleNestedChange('physics', 'globalJitterIntensity', Math.max(1, Math.min(10, parseInt(e.target.value))))}
                  min="1"
                  max="10"
                  className="form-input w-20"
                  disabled={isPlaying}
                />
                <SettingTooltip text="How intensely balls change direction (higher = more intense)" />
              </div>
              <div className="form-group">
                <label className="form-label">Global Jitter Interval Range (ms)</label>
                <div className="flex items-center space-x-2">
                  <input
                    type="number"
                    value={physics.globalJitterMinInterval || 1000}
                    onChange={e => handleNestedChange('physics', 'globalJitterMinInterval', Math.max(100, Math.min(5000, parseInt(e.target.value))))}
                    min="100"
                    max="5000"
                    step="100"
                    className="form-input w-20"
                    disabled={isPlaying}
                  />
                  <span>to</span>
                  <input
                    type="number"
                    value={physics.globalJitterMaxInterval || 3000}
                    onChange={e => handleNestedChange('physics', 'globalJitterMaxInterval', Math.max(physics.globalJitterMinInterval || 1000, Math.min(10000, parseInt(e.target.value))))}
                    min={physics.globalJitterMinInterval || 1000}
                    max="10000"
                    step="100"
                    className="form-input w-20"
                    disabled={isPlaying}
                  />
                </div>
                <SettingTooltip text="How frequently balls change direction (lower = more frequent)" />
              </div>
            </>
          )}
          
          {physics.movementPattern === 'individualJitter' && (
            <>
              <div className="form-group">
                <label className="form-label">Individual Jitter Intensity</label>
                <input
                  type="number"
                  value={physics.individualJitterIntensity || physics.jitterIntensity || 5}
                  onChange={e => handleNestedChange('physics', 'individualJitterIntensity', Math.max(1, Math.min(10, parseInt(e.target.value))))}
                  min="1"
                  max="10"
                  className="form-input w-20"
                  disabled={isPlaying}
                />
                <SettingTooltip text="How intensely balls change direction (higher = more intense)" />
              </div>
              <div className="form-group">
                <label className="form-label">Individual Jitter Interval Range (ms)</label>
                <div className="flex items-center space-x-2">
                  <input
                    type="number"
                    value={physics.individualJitterMinInterval || 500}
                    onChange={e => handleNestedChange('physics', 'individualJitterMinInterval', Math.max(100, Math.min(5000, parseInt(e.target.value))))}
                    min="100"
                    max="5000"
                    step="100"
                    className="form-input w-20"
                    disabled={isPlaying}
                  />
                  <span>to</span>
                  <input
                    type="number"
                    value={physics.individualJitterMaxInterval || 1500}
                    onChange={e => handleNestedChange('physics', 'individualJitterMaxInterval', Math.max(physics.individualJitterMinInterval || 500, Math.min(10000, parseInt(e.target.value))))}
                    min={physics.individualJitterMinInterval || 500}
                    max="10000"
                    step="100"
                    className="form-input w-20"
                    disabled={isPlaying}
                  />
                </div>
                <SettingTooltip text="How frequently balls change direction (lower = more frequent)" />
              </div>
            </>
          )}
        </SettingsGroup>

        {/* Distractions Section */}
        <SettingsGroup title="Distractions" defaultExpanded={false} visible={advancedMode}>
          <div className="space-y-4">
            {/* Color Changes */}
            <SettingsGroup title="Color Changes" defaultExpanded={false}>
              <div className="form-group">
                <label className="form-label flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={distractions.colorChanges}
                    onChange={e => handleNestedChange('distractions', 'colorChanges', e.target.checked)}
                    className="form-checkbox"
                    disabled={isPlaying}
                  />
                  <span>Enable Color Changes</span>
                </label>
                <SettingTooltip text="Balls randomly change colors during tracking" />
              </div>

              {distractions.colorChanges && (
                <>
                  <div className="form-group">
                    <label className="form-label">Interval Range (ms)</label>
                    <div className="flex items-center space-x-2">
                      <input
                        type="number"
                        value={distractions.colorChangeMinInterval || 1000}
                        onChange={e => handleNestedChange('distractions', 'colorChangeMinInterval', Math.max(100, Math.min(5000, parseInt(e.target.value))))}
                        min="100"
                        max="5000"
                        step="100"
                        className="form-input w-20"
                        disabled={isPlaying}
                      />
                      <span>to</span>
                      <input
                        type="number"
                        value={distractions.colorChangeMaxInterval || 3000}
                        onChange={e => handleNestedChange('distractions', 'colorChangeMaxInterval', Math.max(distractions.colorChangeMinInterval || 1000, Math.min(10000, parseInt(e.target.value))))}
                        min={distractions.colorChangeMinInterval || 1000}
                        max="10000"
                        step="100"
                        className="form-input w-20"
                        disabled={isPlaying}
                      />
                    </div>
                    <SettingTooltip text="How often colors change (in milliseconds)" />
                  </div>

                  <div className="form-group">
                    <label className="form-label flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={distractions.colorChangesSync || false}
                        onChange={e => handleNestedChange('distractions', 'colorChangesSync', e.target.checked)}
                        className="form-checkbox"
                        disabled={isPlaying}
                      />
                      <span>Change in Sync</span>
                    </label>
                    <SettingTooltip text="When enabled, all balls change color at the same time. When disabled, each ball changes independently." />
                  </div>

                  {distractions.colorChangesSync && (
                    <div className="form-group">
                      <label className="form-label flex items-center space-x-2">
                        <input
                          type="checkbox"
                          checked={distractions.allSameColor !== false}
                          onChange={e => handleNestedChange('distractions', 'allSameColor', e.target.checked)}
                          className="form-checkbox"
                          disabled={isPlaying}
                        />
                        <span>All Same Color</span>
                      </label>
                      <SettingTooltip text="When enabled, all balls change to the same color. When disabled, each ball changes to a different color." />
                    </div>
                  )}

                  <div className="form-group">
                    <label className="form-label">Color Change Interval (ms)</label>
                    <input
                      type="number"
                      value={distractions.colorChangeInterval || 1000}
                      onChange={e => handleNestedChange('distractions', 'colorChangeInterval', Math.max(100, parseInt(e.target.value)))}
                      min="100"
                      className="form-input w-20"
                      disabled={isPlaying}
                    />
                    <SettingTooltip text="How frequently color changes occur (lower = more frequent)" />
                  </div>
                </>
              )}
            </SettingsGroup>

            {/* Size Changes */}
            <SettingsGroup title="Size Changes" defaultExpanded={false}>
              <div className="form-group">
                <label className="form-label flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={distractions.sizeChanges}
                    onChange={e => handleNestedChange('distractions', 'sizeChanges', e.target.checked)}
                    className="form-checkbox"
                    disabled={isPlaying}
                  />
                  <span>Enable Size Changes</span>
                </label>
                <SettingTooltip text="Balls randomly change size during tracking" />
              </div>

              {distractions.sizeChanges && (
                <>
                  <div className="form-group">
                    <label className="form-label">Size Range</label>
                    <div className="flex items-center space-x-2">
                      <input
                        type="number"
                        value={distractions.sizeChangeMin || 0.8}
                        onChange={e => handleNestedChange('distractions', 'sizeChangeMin', Math.max(0.5, Math.min(0.9, parseFloat(e.target.value))))}
                        min="0.5"
                        max="0.9"
                        step="0.1"
                        className="form-input w-20"
                        disabled={isPlaying}
                      />
                      <span>to</span>
                      <input
                        type="number"
                        value={distractions.sizeChangeMax || 1.2}
                        onChange={e => handleNestedChange('distractions', 'sizeChangeMax', Math.max(1.1, Math.min(2.0, parseFloat(e.target.value))))}
                        min="1.1"
                        max="2.0"
                        step="0.1"
                        className="form-input w-20"
                        disabled={isPlaying}
                      />
                    </div>
                    <SettingTooltip text="Size multiplier range (relative to normal size)" />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Interval Range (ms)</label>
                    <div className="flex items-center space-x-2">
                      <input
                        type="number"
                        value={distractions.sizeChangeMinInterval || 1000}
                        onChange={e => handleNestedChange('distractions', 'sizeChangeMinInterval', Math.max(100, Math.min(5000, parseInt(e.target.value))))}
                        min="100"
                        max="5000"
                        step="100"
                        className="form-input w-20"
                        disabled={isPlaying}
                      />
                      <span>to</span>
                      <input
                        type="number"
                        value={distractions.sizeChangeMaxInterval || 3000}
                        onChange={e => handleNestedChange('distractions', 'sizeChangeMaxInterval', Math.max(distractions.sizeChangeMinInterval || 1000, Math.min(10000, parseInt(e.target.value))))}
                        min={distractions.sizeChangeMinInterval || 1000}
                        max="10000"
                        step="100"
                        className="form-input w-20"
                        disabled={isPlaying}
                      />
                    </div>
                    <SettingTooltip text="How often sizes change (in milliseconds)" />
                  </div>
                  
                  <div className="form-group">
                    <label className="form-label flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={distractions.sizeChangesSync || false}
                        onChange={e => handleNestedChange('distractions', 'sizeChangesSync', e.target.checked)}
                        className="form-checkbox"
                        disabled={isPlaying}
                      />
                      <span>Change in Sync</span>
                    </label>
                    <SettingTooltip text="When enabled, all balls change size at the same time. When disabled, each ball changes independently." />
                  </div>

                  {distractions.sizeChangesSync && (
                    <div className="form-group">
                      <label className="form-label flex items-center space-x-2">
                        <input
                          type="checkbox"
                          checked={distractions.allSameSize !== false}
                          onChange={e => handleNestedChange('distractions', 'allSameSize', e.target.checked)}
                          className="form-checkbox"
                          disabled={isPlaying}
                        />
                        <span>All Same Size</span>
                      </label>
                      <SettingTooltip text="When enabled, all balls change to the same size. When disabled, each ball changes to a different size." />
                    </div>
                  )}

                  <div className="form-group">
                    <label className="form-label">Size Change Interval (ms)</label>
                    <input
                      type="number"
                      value={distractions.sizeChangeInterval || 2000}
                      onChange={e => handleNestedChange('distractions', 'sizeChangeInterval', Math.max(100, parseInt(e.target.value)))}
                      min="100"
                      className="form-input w-20"
                      disabled={isPlaying}
                    />
                    <SettingTooltip text="How frequently size changes occur (lower = more frequent)" />
                  </div>
                </>
              )}
            </SettingsGroup>

            {/* Screen Flash */}
            <SettingsGroup title="Screen Flash" defaultExpanded={false}>
              <div className="form-group">
                <label className="form-label flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={distractions.screenFlash}
                    onChange={e => handleNestedChange('distractions', 'screenFlash', e.target.checked)}
                    className="form-checkbox"
                    disabled={isPlaying}
                  />
                  <span>Enable Screen Flash</span>
                </label>
                <SettingTooltip text="Screen briefly flashes with blank or random colors" />
              </div>

              {distractions.screenFlash && (
                <>
                  <div className="form-group">
                    <label className="form-label">Interval Range (ms)</label>
                    <div className="flex items-center space-x-2">
                      <input
                        type="number"
                        value={distractions.flashMinInterval || 2000}
                        onChange={e => handleNestedChange('distractions', 'flashMinInterval', Math.max(1000, Math.min(10000, parseInt(e.target.value))))}
                        min="1000"
                        max="10000"
                        step="500"
                        className="form-input w-20"
                        disabled={isPlaying}
                      />
                      <span>to</span>
                      <input
                        type="number"
                        value={distractions.flashMaxInterval || 8000}
                        onChange={e => handleNestedChange('distractions', 'flashMaxInterval', Math.max(distractions.flashMinInterval || 2000, Math.min(20000, parseInt(e.target.value))))}
                        min={distractions.flashMinInterval || 2000}
                        max="20000"
                        step="500"
                        className="form-input w-20"
                        disabled={isPlaying}
                      />
                    </div>
                    <SettingTooltip text="How often flashes occur (in milliseconds)" />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Flash Length (ms)</label>
                    <input
                      type="number"
                      value={distractions.flashLength || 200}
                      onChange={e => handleNestedChange('distractions', 'flashLength', Math.max(50, Math.min(500, parseInt(e.target.value))))}
                      min="50"
                      max="500"
                      step="10"
                      className="form-input w-20"
                      disabled={isPlaying}
                    />
                    <SettingTooltip text="Duration of each flash effect" />
                  </div>
                </>
              )}
            </SettingsGroup>

            {/* Wall Color Changes */}
            <SettingsGroup title="Wall Color Changes" defaultExpanded={false}>
              <div className="form-group">
                <label className="form-label flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={distractions.wallColorChanges}
                    onChange={e => handleNestedChange('distractions', 'wallColorChanges', e.target.checked)}
                    className="form-checkbox"
                    disabled={isPlaying}
                  />
                  <span>Enable Wall Color Changes</span>
                </label>
                <SettingTooltip text="Room walls change colors during tracking" />
              </div>

              {distractions.wallColorChanges && (
                <>
                  <div className="form-group">
                    <label className="form-label">Interval Range (ms)</label>
                    <div className="flex items-center space-x-2">
                      <input
                        type="number"
                        value={distractions.wallColorMinInterval || 2000}
                        onChange={e => handleNestedChange('distractions', 'wallColorMinInterval', Math.max(1000, Math.min(10000, parseInt(e.target.value))))}
                        min="1000"
                        max="10000"
                        step="500"
                        className="form-input w-20"
                        disabled={isPlaying}
                      />
                      <span>to</span>
                      <input
                        type="number"
                        value={distractions.wallColorMaxInterval || 5000}
                        onChange={e => handleNestedChange('distractions', 'wallColorMaxInterval', Math.max(distractions.wallColorMinInterval || 2000, Math.min(15000, parseInt(e.target.value))))}
                        min={distractions.wallColorMinInterval || 2000}
                        max="15000"
                        step="500"
                        className="form-input w-20"
                        disabled={isPlaying}
                      />
                    </div>
                    <SettingTooltip text="How often wall colors change (in milliseconds)" />
                  </div>

                  <div className="form-group">
                    <label className="form-label flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={distractions.wallColorChangesSeparate || false}
                        onChange={e => handleNestedChange('distractions', 'wallColorChangesSeparate', e.target.checked)}
                        className="form-checkbox"
                        disabled={isPlaying}
                      />
                      <span>Change Walls Separately</span>
                    </label>
                    <SettingTooltip text="When enabled, each wall changes color independently. When disabled, all walls change to the same color." />
                  </div>

                  {distractions.wallColorChangesSeparate && (
                    <div className="form-group">
                      <label className="form-label flex items-center space-x-2">
                        <input
                          type="checkbox"
                          checked={distractions.wallColorChangesSync || false}
                          onChange={e => handleNestedChange('distractions', 'wallColorChangesSync', e.target.checked)}
                          className="form-checkbox"
                          disabled={isPlaying}
                        />
                        <span>Change in Sync</span>
                      </label>
                      <SettingTooltip text="When enabled, all walls change color at the same time but to different colors. When disabled, each wall changes independently." />
                    </div>
                  )}

                  <div className="form-group">
                    <label className="form-label">Wall Color Change Interval (ms)</label>
                    <input
                      type="number"
                      value={distractions.wallColorChangeInterval || 1000}
                      onChange={e => handleNestedChange('distractions', 'wallColorChangeInterval', Math.max(100, parseInt(e.target.value)))}
                      min="100"
                      className="form-input w-20"
                      disabled={isPlaying}
                    />
                    <SettingTooltip text="How frequently wall colors change (lower = more frequent)" />
                  </div>
                </>
              )}
            </SettingsGroup>
          </div>
        </SettingsGroup>

        {/* Rotation Section */}
        <SettingsGroup title="Rotation" defaultExpanded={false} visible={advancedMode}>
          <div className="space-y-4">
            {/* Mouse Rotation */}
            <div className="form-group">
              <label className="form-label flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={settings.mouseRotation?.enabled || false}
                  onChange={e => handleNestedChange('mouseRotation', 'enabled', e.target.checked)}
                  className="form-checkbox"
                  disabled={isPlaying}
                />
                <span>Mouse Rotation</span>
              </label>
              <SettingTooltip text="Enable rotation by clicking and dragging in the game area" />
            </div>
            
            {settings.mouseRotation?.enabled && (
              <div className="form-group">
                <label className="form-label">Sensitivity</label>
                <input
                  type="number"
                  value={settings.mouseRotation?.sensitivity || 1.0}
                  onChange={e => handleNestedChange('mouseRotation', 'sensitivity', Math.max(0.1, Math.min(5, parseFloat(e.target.value))))}
                  min="0.1"
                  max="5"
                  step="0.1"
                  className="form-input w-20"
                  disabled={isPlaying}
                />
                <SettingTooltip text="Mouse rotation sensitivity" />
              </div>
            )}
            {/* Memorization Phase Rotation */}
            <SettingsGroup title="Memorization Phase" defaultExpanded={false}>
              <div className="space-y-2">
                <div className="form-group">
                  <label className="form-label">X-Axis Rotation Rate</label>
                  <input
                    type="number"
                    value={rotation.memorization.x}
                    onChange={e => handleRotationChange('memorization', 'x', parseFloat(e.target.value))}
                    min="-2"
                    max="2"
                    step="0.1"
                    className="form-input w-20"
                    disabled={isPlaying}
                  />
                  <SettingTooltip text="Rotation rate around X-axis (up/down)" />
                </div>
                
                <div className="form-group">
                  <label className="form-label">Y-Axis Rotation Rate</label>
                  <input
                    type="number"
                    value={rotation.memorization.y}
                    onChange={e => handleRotationChange('memorization', 'y', parseFloat(e.target.value))}
                    min="-2"
                    max="2"
                    step="0.1"
                    className="form-input w-20"
                    disabled={isPlaying}
                  />
                  <SettingTooltip text="Rotation rate around Y-axis (side-to-side)" />
                </div>
                
                <div className="form-group">
                  <label className="form-label">Z-Axis Rotation Rate</label>
                  <input
                    type="number"
                    value={rotation.memorization.z}
                    onChange={e => handleRotationChange('memorization', 'z', parseFloat(e.target.value))}
                    min="-2"
                    max="2"
                    step="0.1"
                    className="form-input w-20"
                    disabled={isPlaying}
                  />
                  <SettingTooltip text="Rotation rate around Z-axis (roll)" />
                </div>
                
                <div className="form-group">
                  <label className="form-label">X-Axis Boomerang Distance</label>
                  <input
                    type="number"
                    value={rotation.memorization.xBoomerang}
                    onChange={e => handleRotationChange('memorization', 'xBoomerang', parseFloat(e.target.value))}
                    min="0"
                    max="3"
                    step="0.1"
                    className="form-input w-20"
                    disabled={isPlaying}
                  />
                  <SettingTooltip text="How far rotation goes before reversing (0 for continuous)" />
                </div>
                
                <div className="form-group">
                  <label className="form-label">Y-Axis Boomerang Distance</label>
                  <input
                    type="number"
                    value={rotation.memorization.yBoomerang}
                    onChange={e => handleRotationChange('memorization', 'yBoomerang', parseFloat(e.target.value))}
                    min="0"
                    max="3"
                    step="0.1"
                    className="form-input w-20"
                    disabled={isPlaying}
                  />
                  <SettingTooltip text="How far rotation goes before reversing (0 for continuous)" />
                </div>
                
                <div className="form-group">
                  <label className="form-label">Z-Axis Boomerang Distance</label>
                  <input
                    type="number"
                    value={rotation.memorization.zBoomerang}
                    onChange={e => handleRotationChange('memorization', 'zBoomerang', parseFloat(e.target.value))}
                    min="0"
                    max="3"
                    step="0.1"
                    className="form-input w-20"
                    disabled={isPlaying}
                  />
                  <SettingTooltip text="How far rotation goes before reversing (0 for continuous)" />
                </div>
              </div>
            </SettingsGroup>
            
            {/* Tracking Phase Rotation */}
            <SettingsGroup title="Tracking Phase" defaultExpanded={false}>
              <div className="space-y-2">
                <div className="form-group">
                  <label className="form-label">X-Axis Rotation Rate</label>
                  <input
                    type="number"
                    value={rotation.tracking.x}
                    onChange={e => handleRotationChange('tracking', 'x', parseFloat(e.target.value))}
                    min="-2"
                    max="2"
                    step="0.1"
                    className="form-input w-20"
                    disabled={isPlaying}
                  />
                  <SettingTooltip text="Rotation rate around X-axis (up/down)" />
                </div>
                
                <div className="form-group">
                  <label className="form-label">Y-Axis Rotation Rate</label>
                  <input
                    type="number"
                    value={rotation.tracking.y}
                    onChange={e => handleRotationChange('tracking', 'y', parseFloat(e.target.value))}
                    min="-2"
                    max="2"
                    step="0.1"
                    className="form-input w-20"
                    disabled={isPlaying}
                  />
                  <SettingTooltip text="Rotation rate around Y-axis (side-to-side)" />
                </div>
                
                <div className="form-group">
                  <label className="form-label">Z-Axis Rotation Rate</label>
                  <input
                    type="number"
                    value={rotation.tracking.z}
                    onChange={e => handleRotationChange('tracking', 'z', parseFloat(e.target.value))}
                    min="-2"
                    max="2"
                    step="0.1"
                    className="form-input w-20"
                    disabled={isPlaying}
                  />
                  <SettingTooltip text="Rotation rate around Z-axis (roll)" />
                </div>
                
                <div className="form-group">
                  <label className="form-label">X-Axis Boomerang Distance</label>
                  <input
                    type="number"
                    value={rotation.tracking.xBoomerang}
                    onChange={e => handleRotationChange('tracking', 'xBoomerang', parseFloat(e.target.value))}
                    min="0"
                    max="3"
                    step="0.1"
                    className="form-input w-20"
                    disabled={isPlaying}
                  />
                  <SettingTooltip text="How far rotation goes before reversing (0 for continuous)" />
                </div>
                
                <div className="form-group">
                  <label className="form-label">Y-Axis Boomerang Distance</label>
                  <input
                    type="number"
                    value={rotation.tracking.yBoomerang}
                    onChange={e => handleRotationChange('tracking', 'yBoomerang', parseFloat(e.target.value))}
                    min="0"
                    max="3"
                    step="0.1"
                    className="form-input w-20"
                    disabled={isPlaying}
                  />
                  <SettingTooltip text="How far rotation goes before reversing (0 for continuous)" />
                </div>
                
                <div className="form-group">
                  <label className="form-label">Z-Axis Boomerang Distance</label>
                  <input
                    type="number"
                    value={rotation.tracking.zBoomerang}
                    onChange={e => handleRotationChange('tracking', 'zBoomerang', parseFloat(e.target.value))}
                    min="0"
                    max="3"
                    step="0.1"
                    className="form-input w-20"
                    disabled={isPlaying}
                  />
                  <SettingTooltip text="How far rotation goes before reversing (0 for continuous)" />
                </div>
              </div>
            </SettingsGroup>
            
            {/* Selection Phase Rotation */}
            <SettingsGroup title="Selection Phase" defaultExpanded={false}>
              <div className="space-y-2">
                <div className="form-group">
                  <label className="form-label">X-Axis Rotation Rate</label>
                  <input
                    type="number"
                    value={rotation.selection.x}
                    onChange={e => handleRotationChange('selection', 'x', parseFloat(e.target.value))}
                    min="-2"
                    max="2"
                    step="0.1"
                    className="form-input w-20"
                    disabled={isPlaying}
                  />
                  <SettingTooltip text="Rotation rate around X-axis (up/down)" />
                </div>
                
                <div className="form-group">
                  <label className="form-label">Y-Axis Rotation Rate</label>
                  <input
                    type="number"
                    value={rotation.selection.y}
                    onChange={e => handleRotationChange('selection', 'y', parseFloat(e.target.value))}
                    min="-2"
                    max="2"
                    step="0.1"
                    className="form-input w-20"
                    disabled={isPlaying}
                  />
                  <SettingTooltip text="Rotation rate around Y-axis (side-to-side)" />
                </div>
                
                <div className="form-group">
                  <label className="form-label">Z-Axis Rotation Rate</label>
                  <input
                    type="number"
                    value={rotation.selection.z}
                    onChange={e => handleRotationChange('selection', 'z', parseFloat(e.target.value))}
                    min="-2"
                    max="2"
                    step="0.1"
                    className="form-input w-20"
                    disabled={isPlaying}
                  />
                  <SettingTooltip text="Rotation rate around Z-axis (roll)" />
                </div>
                
                <div className="form-group">
                  <label className="form-label">X-Axis Boomerang Distance</label>
                  <input
                    type="number"
                    value={rotation.selection.xBoomerang}
                    onChange={e => handleRotationChange('selection', 'xBoomerang', parseFloat(e.target.value))}
                    min="0"
                    max="3"
                    step="0.1"
                    className="form-input w-20"
                    disabled={isPlaying}
                  />
                  <SettingTooltip text="How far rotation goes before reversing (0 for continuous)" />
                </div>
                
                <div className="form-group">
                  <label className="form-label">Y-Axis Boomerang Distance</label>
                  <input
                    type="number"
                    value={rotation.selection.yBoomerang}
                    onChange={e => handleRotationChange('selection', 'yBoomerang', parseFloat(e.target.value))}
                    min="0"
                    max="3"
                    step="0.1"
                    className="form-input w-20"
                    disabled={isPlaying}
                  />
                  <SettingTooltip text="How far rotation goes before reversing (0 for continuous)" />
                </div>
                
                <div className="form-group">
                  <label className="form-label">Z-Axis Boomerang Distance</label>
                  <input
                    type="number"
                    value={rotation.selection.zBoomerang}
                    onChange={e => handleRotationChange('selection', 'zBoomerang', parseFloat(e.target.value))}
                    min="0"
                    max="3"
                    step="0.1"
                    className="form-input w-20"
                    disabled={isPlaying}
                  />
                  <SettingTooltip text="How far rotation goes before reversing (0 for continuous)" />
                </div>
              </div>
            </SettingsGroup>
          </div>
        </SettingsGroup>

        {/* Room Section */}
        <SettingsGroup title="Room" defaultExpanded={false} visible={advancedMode}>
          <div className="form-group">
            <label className="form-label">Width</label>
            <input
              type="number"
              value={room.width}
              onChange={e => handleNestedChange('room', 'width', Math.max(8, Math.min(20, parseInt(e.target.value))))}
              min="8"
              max="20"
              className="form-input w-20"
              disabled={isPlaying}
            />
            <SettingTooltip text="Room width dimension" />
          </div>

          <div className="form-group">
            <label className="form-label">Height</label>
            <input
              type="number"
              value={room.height}
              onChange={e => handleNestedChange('room', 'height', Math.max(6, Math.min(16, parseInt(e.target.value))))}
              min="6"
              max="16"
              className="form-input w-20"
              disabled={isPlaying}
            />
            <SettingTooltip text="Room height dimension" />
          </div>

          <div className="form-group">
            <label className="form-label">Depth</label>
            <input
              type="number"
              value={room.depth}
              onChange={e => handleNestedChange('room', 'depth', Math.max(8, Math.min(20, parseInt(e.target.value))))}
              min="8"
              max="20"
              className="form-input w-20"
              disabled={isPlaying}
            />
            <SettingTooltip text="Room depth dimension" />
          </div>

          <div className="form-group">
            <label className="form-label">Edge Visibility</label>
            <input
              type="number"
              value={room.edgeVisibility || 0.3}
              onChange={e => handleNestedChange('room', 'edgeVisibility', Math.max(0.1, Math.min(1, parseFloat(e.target.value))))}
              min="0.1"
              max="1"
              step="0.1"
              className="form-input w-20"
              disabled={isPlaying}
            />
            <SettingTooltip text="Visibility of room edges (0.1-1)" />
          </div>
        </SettingsGroup>

        {/* Timing Section */}
        <SettingsGroup title="Timing" defaultExpanded={false} visible={advancedMode}>
          <div className="form-group">
            <label className="form-label">Remember Time (s)</label>
            <input
              type="number"
              value={settings.rememberTime}
              onChange={e => handleChange('rememberTime', Math.max(1, parseInt(e.target.value)))}
              min="1"
              className="form-input w-20"
              disabled={isPlaying}
            />
            <SettingTooltip text="Time to memorize target balls" />
          </div>

          <div className="form-group">
            <label className="form-label">Tracking Time (s)</label>
            <input
              type="number"
              value={settings.trackingTime}
              onChange={e => handleChange('trackingTime', Math.max(1, parseInt(e.target.value)))}
              min="1"
              className="form-input w-20"
              disabled={isPlaying}
            />
            <SettingTooltip text="Duration of ball movement" />
          </div>

          <div className="form-group">
            <label className="form-label">Selection Time (s)</label>
            <input
              type="number"
              value={settings.selectionTime}
              onChange={e => handleChange('selectionTime', Math.max(0, parseInt(e.target.value)))}
              min="0"
              className="form-input w-20"
              disabled={isPlaying}
            />
            <SettingTooltip text="Time to select target balls. Set to 0 for unlimited selection time (no timer)." />
          </div>
        </SettingsGroup>

        {/* Crosshair Section */}
        <SettingsGroup title="Crosshair" defaultExpanded={false} visible={advancedMode}>
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

        {/* Keybinds Section */}
        <SettingsGroup title="Keybinds" defaultExpanded={false}>
          <div className="space-y-4">
            {/* Basic Controls */}
            <SettingsGroup title="Basic Controls" defaultExpanded={true}>
              <div className="space-y-4">
                <div className="form-group">
                  <label className="form-label">Start/Stop</label>
                  <div className="relative">
                    <input
                      type="text"
                      value="Space"
                      readOnly
                      className="form-input w-20 bg-muted/50"
                    />
                  </div>
                  <SettingTooltip text="Start or stop the exercise" />
                </div>
                
                <div className="form-group">
                  <label className="form-label">Next Phase</label>
                  <div className="relative">
                    <input
                      type="text"
                      value="F"
                      readOnly
                      className="form-input w-20 bg-muted/50"
                    />
                  </div>
                  <SettingTooltip text="Skip to the next phase of the exercise" />
                </div>
                
                <div className="form-group">
                  <label className="form-label">Focus Mode</label>
                  <div className="relative">
                    <input
                      type="text"
                      value="E"
                      readOnly
                      className="form-input w-20 bg-muted/50"
                    />
                  </div>
                  <SettingTooltip text="Toggle fullscreen mode" />
                </div>
              </div>
            </SettingsGroup>
            
            {/* Navigation Controls */}
            <SettingsGroup title="Navigation Controls" defaultExpanded={false}>
              <div className="space-y-4">
                <div className="form-group">
                  <label className="form-label">Navigate Balls</label>
                  <div className="relative">
                    <input
                      type="text"
                      value="Arrow Keys"
                      readOnly
                      className="form-input w-32 bg-muted/50"
                    />
                  </div>
                  <SettingTooltip text="Use arrow keys to navigate between balls" />
                </div>
                
                <div className="form-group">
                  <label className="form-label">Select Ball</label>
                  <div className="relative">
                    <input
                      type="text"
                      value="Enter"
                      readOnly
                      className="form-input w-20 bg-muted/50"
                    />
                  </div>
                  <SettingTooltip text="Select the currently highlighted ball" />
                </div>
              </div>
            </SettingsGroup>
            
            {/* Number Selection */}
            <SettingsGroup title="Number Selection" defaultExpanded={false}>
              <div className="space-y-2">
                <p className="text-xs text-muted-foreground mb-2">
                  During selection phase, press number keys to select balls directly:
                </p>
                
                {[1, 2, 3, 4, 5, 6, 7, 8].map(num => (
                  <div key={num} className="form-group">
                    <label className="form-label">Select Ball {num}</label>
                    <div className="relative">
                      <input
                        type="text"
                        value={`${num}`}
                        readOnly
                        className="form-input w-20 bg-muted/50"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </SettingsGroup>
          </div>
        </SettingsGroup>

        {/* Advanced Section - Always visible */}
        <SettingsGroup title="Advanced" defaultExpanded={false}>
          {/* Advanced Mode Toggle */}
          <div className="form-group">
            <label className="form-label flex items-center space-x-2">
              <input
                type="checkbox"
                checked={advancedMode}
                onChange={e => handleChange('advancedMode', e.target.checked)}
                className="form-checkbox"
                disabled={isPlaying}
              />
              <span>Advanced Mode</span>
              <SettingTooltip text="Enable advanced settings for more customization options" />
            </label>
          </div>
          
          {advancedMode && (
            <div className="form-group mt-4">
              <label className="form-label flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={settings.threeDGlasses ?? false}
                  onChange={e => handleChange('threeDGlasses', e.target.checked)}
                  className="form-checkbox"
                  disabled={isPlaying}
                />
                <span>3D Glasses Mode</span>
              </label>
              <SettingTooltip text="Enable stereoscopic 3D mode (requires 3D glasses)" />
            </div>
          )}
        </SettingsGroup>
      </div>
    </div>
  );
}