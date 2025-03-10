import { useState } from 'react';
import { cn } from '@/lib/utils';
import { SettingTooltip } from '@/components/SettingTooltip';

function KeybindInput({ label, value, onChange, defaultValue }) {
  const [isBinding, setIsBinding] = useState(false);
  const displayValue = value === ' ' || value?.toLowerCase() === 'space'
    ? 'Space'
    : value?.toUpperCase() || defaultValue;

  const handleKeyDown = (e) => {
    e.preventDefault();
    if (e.key === 'Escape') {
      setIsBinding(false);
      return;
    }
    
    let newValue = e.key;
    if (e.key === ' ') {
      newValue = 'Space';
    }
    onChange(newValue);
    setIsBinding(false);
  };

  return (
    <div className="form-group">
      <label className="form-label">{label}</label>
      <div className="relative">
        <input
          type="text"
          value={displayValue}
          onFocus={() => setIsBinding(true)}
          onKeyDown={isBinding ? handleKeyDown : undefined}
          readOnly
          className="form-input w-20"
        />
        {isBinding && (
          <div className="absolute left-0 -bottom-6 text-sm text-muted-foreground whitespace-nowrap">
            Press any key to bind it, press Esc to exit
          </div>
        )}
      </div>
    </div>
  );
}

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

export function Settings({ settings, onSettingsChange, isPlaying, isMobile }) {
  const handleChange = (key, value) => {
    onSettingsChange(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const handleIndividualNBackChange = (type, value) => {
    onSettingsChange(prev => ({
      ...prev,
      individualNBacks: {
        ...prev.individualNBacks,
        [type]: value
      }
    }));
  };

  // Check if advanced mode is enabled
  const advancedMode = settings.advancedMode || false;

  return (
    <div className={cn("space-y-6 bg-card rounded-xl shadow-lg", isMobile ? "p-4" : "p-6")}>
      <div className="flex items-center justify-between">
        <h2 className={cn("font-bold", isMobile ? "text-xl" : "text-2xl")}>Settings</h2>
      </div>

      <div className="space-y-4">
        <SettingsGroup title="General" defaultExpanded={false}>
          <div className="space-y-4">
            <label className="flex items-center space-x-3 p-3 rounded-lg hover:bg-muted/50 transition-colors">
              <input
                type="checkbox"
                checked={settings.is3D}
                onChange={e => handleChange('is3D', e.target.checked)}
                className="form-checkbox"
                disabled={isPlaying}
              />
              <span>3D Grid <SettingTooltip text="Displays the grid in 3D space, allowing for rotation and depth perception." /></span>
            </label>

            <div className="border-t border-border pt-4 mt-4">
              <label className="flex items-center space-x-3 p-3 rounded-lg hover:bg-muted/50 transition-colors">
                <input
                  type="checkbox"
                  checked={settings.setsEnabled === undefined ? true : settings.setsEnabled}
                  onChange={e => handleChange('setsEnabled', e.target.checked)}
                  className="form-checkbox"
                  disabled={isPlaying}
                />
                <span>Sets <SettingTooltip text="Automatically stop the game after a specific number of turns." /></span>
              </label>

              {(settings.setsEnabled === undefined || settings.setsEnabled) && (
                <div className="space-y-4 ml-6 mt-2">
                  <div className="form-group">
                    <label className="form-label">Set Length <SettingTooltip text="Number of turns before the game automatically stops." /></label>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        value={settings.setLength || 20}
                        onChange={e => handleChange('setLength', Math.max(1, parseInt(e.target.value)))}
                        min="1"
                        max="100"
                        className="form-input w-20"
                        disabled={isPlaying}
                      />
                      <span className="text-sm text-muted-foreground">turns</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* 3D settings moved to Rotation section */}
          </div>
        </SettingsGroup>

        <SettingsGroup title="Level" defaultExpanded={false}>
          <div className="space-y-4">
            <div className="form-group">
              <label className="form-label">N-Back Level</label>
              <input
                type="number"
                value={settings.nBack}
                onChange={e => handleChange('nBack', Math.max(1, parseInt(e.target.value)))}
                min="1"
                max="10"
                className="form-input w-20"
                disabled={isPlaying}
              />
            </div>

            <label className="flex items-center space-x-3 p-3 rounded-lg hover:bg-muted/50 transition-colors">
              <input
                type="checkbox"
                checked={settings.useIndividualNBacks}
                onChange={e => handleChange('useIndividualNBacks', e.target.checked)}
                className="form-checkbox"
                disabled={isPlaying}
              />
              <span>Individual N-Back Levels <SettingTooltip text="Allows setting different N-Back levels for each stimulus type (position, audio, number, color, shape)." /></span>
            </label>

            {settings.useIndividualNBacks && (
              <div className="space-y-3 ml-6">
                {Object.entries(settings.stimuli)
                  .filter(([_, enabled]) => enabled)
                  .map(([type]) => (
                    <div key={type} className="form-group">
                      <label className="form-label flex items-center justify-between">
                        <span className="capitalize">{type}</span>
                        <input
                          type="number"
                          value={settings.individualNBacks?.[type] ?? 0}
                          onChange={e => handleIndividualNBackChange(type, Math.max(0, parseInt(e.target.value)))}
                          min="0"
                          max="10"
                          className="form-input w-20"
                          disabled={isPlaying}
                        />
                      </label>
                      <div className="text-sm text-muted-foreground mt-1">
                        {settings.individualNBacks?.[type] === 0 && "Using main N-Back level"}
                      </div>
                    </div>
                  ))}
              </div>
            )}

            <div className="border-t border-border pt-4 mt-4">
              <label className="flex items-center space-x-3 p-3 rounded-lg hover:bg-muted/50 transition-colors">
                <input
                  type="checkbox"
                  checked={settings.autoProgressionEnabled || false}
                  onChange={e => handleChange('autoProgressionEnabled', e.target.checked)}
                  className="form-checkbox"
                  disabled={isPlaying}
                />
                <span>Auto Progression <SettingTooltip text="Automatically progresses/decreases the nback level after it reaches the advance/fallback threshold respectivelly." /></span>
              </label>

              {settings.autoProgressionEnabled && (
                <div className="space-y-4 ml-6 mt-2">
                  <div className="form-group">
                    <label className="form-label">Advance Threshold (%) <SettingTooltip text="Increase level when score is above this threshold." /></label>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        value={settings.thresholdAdvance || 80}
                        onChange={e => handleChange('thresholdAdvance', Math.max(50, Math.min(100, parseInt(e.target.value))))}
                        min="50"
                        max="100"
                        className="form-input w-20"
                        disabled={isPlaying || !advancedMode}
                        readOnly={!advancedMode}
                      />
                    </div>
                  </div>

                  <div className="form-group mt-4">
                    <label className="form-label">Advance Sessions <SettingTooltip text="Number of consecutive sessions above threshold before increasing level." /></label>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        value={settings.thresholdAdvanceSessions || 1}
                        onChange={e => handleChange('thresholdAdvanceSessions', Math.max(1, parseInt(e.target.value)))}
                        min="1"
                        max="10"
                        className="form-input w-20"
                        disabled={isPlaying || !advancedMode}
                        readOnly={!advancedMode}
                      />
                    </div>
                  </div>
                  
                  {/* Advance Progress indicator */}
                  <div className="mt-4 p-3 bg-muted/30 rounded-lg">
                    <div className="text-sm font-medium mb-2">Advance Status:</div>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 bg-muted rounded-full h-2 overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-300 ${
                            Number(settings.advanceCount || 0) >= Number(settings.thresholdAdvanceSessions || 1)
                              ? 'bg-blue-500'
                              : Number(settings.advanceCount || 0) >= Number(settings.thresholdAdvanceSessions || 1) / 2
                                ? 'bg-blue-400'
                                : 'bg-blue-300'
                          }`}
                          style={{
                            width: `${Math.min(100, Number(settings.advanceCount || 0) / Number(settings.thresholdAdvanceSessions || 1) * 100)}%`
                          }}
                        ></div>
                      </div>
                      <span className="text-sm font-medium">
                        {Number(settings.advanceCount || 0)}/{Number(settings.thresholdAdvanceSessions || 1)}
                      </span>
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                      {Number(settings.advanceCount || 0) > 0 ?
                        `${Number(settings.advanceCount)} consecutive session${Number(settings.advanceCount) !== 1 ? 's' : ''} above threshold` :
                        'No consecutive sessions above threshold'}
                    </div>
                  </div>

                  <div className="form-group mt-4">
                    <label className="form-label">Fallback Threshold (%) <SettingTooltip text="Decrease level when score is below this threshold." /></label>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        value={settings.thresholdFallback || 50}
                        onChange={e => handleChange('thresholdFallback', Math.max(0, Math.min(settings.thresholdAdvance - 5, parseInt(e.target.value))))}
                        min="0"
                        max={settings.thresholdAdvance ? settings.thresholdAdvance - 5 : 75}
                        className="form-input w-20"
                        disabled={isPlaying || !advancedMode}
                        readOnly={!advancedMode}
                      />
                    </div>
                  </div>
                  
                  <div className="form-group mt-4">
                    <label className="form-label">Fallback Sessions <SettingTooltip text="Number of consecutive sessions below threshold before decreasing level." /></label>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        value={settings.thresholdFallbackSessions || 3}
                        onChange={e => handleChange('thresholdFallbackSessions', Math.max(1, parseInt(e.target.value)))}
                        min="1"
                        max="10"
                        className="form-input w-20"
                        disabled={isPlaying || !advancedMode}
                        readOnly={!advancedMode}
                      />
                    </div>
                  </div>
                  
                  {/* Fallback Progress indicator */}
                  <div className="mt-4 p-3 bg-muted/30 rounded-lg">
                    <div className="text-sm font-medium mb-2">Fallback Status:</div>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 bg-muted rounded-full h-2 overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-300 ${
                            Number(settings.progressCount || 0) >= Number(settings.thresholdFallbackSessions || 3) - 1
                              ? 'bg-red-500'
                              : Number(settings.progressCount || 0) >= Number(settings.thresholdFallbackSessions || 3) / 2
                                ? 'bg-amber-500'
                                : 'bg-green-500'
                          }`}
                          style={{
                            width: `${Math.min(100, Number(settings.progressCount || 0) / Number(settings.thresholdFallbackSessions || 3) * 100)}%`
                          }}
                        ></div>
                      </div>
                      <span className="text-sm font-medium">
                        {Number(settings.progressCount || 0)}/{Number(settings.thresholdFallbackSessions || 3)}
                      </span>
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                      {Number(settings.progressCount || 0) > 0 ?
                        `${Number(settings.progressCount)} consecutive session${Number(settings.progressCount) !== 1 ? 's' : ''} below threshold` :
                        'No consecutive sessions below threshold'}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </SettingsGroup>

        <SettingsGroup title="Stimuli" defaultExpanded={false}>
          <div className="form-group space-y-2">
            {['position', 'audio', 'number', 'color', 'shape'].map(key => (
              <div key={key}>
                <label className="flex items-center space-x-3 p-3 rounded-lg hover:bg-muted/50 transition-colors">
                  <input
                    type="checkbox"
                    checked={settings.stimuli[key]}
                    onChange={e => handleChange('stimuli', {
                      ...settings.stimuli,
                      [key]: e.target.checked
                    })}
                    className="form-checkbox"
                    disabled={isPlaying}
                  />
                  <span className="capitalize">{key}</span>
                </label>
                
                {key === 'audio' && settings.stimuli[key] && (
                  <div className="mt-2 ml-8 p-3 rounded-lg bg-muted/30 space-y-2">
                    <div className="text-sm font-medium">Audio Types:</div>
                    {Object.entries({
                      tone: 'Tones',
                      letters: 'Spoken Letters',
                      numbers: 'Spoken Numbers'
                    }).map(([type, label]) => (
                      <label key={type} className="flex items-center space-x-3 p-2 rounded-lg hover:bg-muted/50 transition-colors">
                        <input
                          type="checkbox"
                          checked={settings.audioTypes[type]}
                          onChange={e => handleChange('audioTypes', {
                            ...settings.audioTypes,
                            [type]: e.target.checked
                          })}
                          className="form-checkbox"
                          disabled={isPlaying}
                        />
                        <span className="text-sm">{label}</span>
                      </label>
                    ))}
                  </div>
                )}

                {key === 'shape' && settings.stimuli[key] && (
                  <div className="mt-2 ml-8 p-3 rounded-lg bg-muted/30 space-y-4">
                    <div>
                      <label className="form-label block mb-2 text-sm font-medium">Number of Shapes:</label>
                      <div className="flex items-center gap-2">
                        <input
                          type="range"
                          min="2"
                          max="6"
                          value={settings.shapeCount}
                          onChange={e => handleChange('shapeCount', parseInt(e.target.value))}
                          className="form-range w-32"
                          disabled={isPlaying}
                        />
                        <span className="text-sm font-medium">{settings.shapeCount}</span>
                      </div>
                    </div>
                    
                    {settings.is3D && (
                      <label className="flex items-center space-x-3 p-2 rounded-lg hover:bg-muted/50 transition-colors">
                        <input
                          type="checkbox"
                          checked={settings.use3DShapes}
                          onChange={e => handleChange('use3DShapes', e.target.checked)}
                          className="form-checkbox"
                          disabled={isPlaying}
                        />
                        <span className="text-sm">Use 3D Shapes</span>
                      </label>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </SettingsGroup>

        {advancedMode && (
          <SettingsGroup title="Timing" defaultExpanded={false}>
            <div className="space-y-4">
              <div className="form-group">
                <label className="form-label">Display Duration (ms) <SettingTooltip text="How long each stimulus is displayed on the screen before disappearing." /></label>
                {settings.randomizeDisplayDuration ? (
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      value={settings.displayDurationMin === "" ? "" : settings.displayDurationMin}
                      onChange={e => {
                        if (e.target.value === "") {
                          handleChange('displayDurationMin', "");
                        } else {
                          handleChange('displayDurationMin', Math.max(0, parseInt(e.target.value)));
                        }
                      }}
                      onBlur={e => {
                        if(e.target.value === "") {
                          handleChange('displayDurationMin', 2000);
                        }
                      }}
                      {...(settings.displayDurationMin === "" ? {} : { min: "0" })}
                      className="form-input w-24"
                      disabled={isPlaying}
                    />
                    <span>to</span>
                    <input
                      type="number"
                      value={settings.displayDurationMax === "" ? "" : settings.displayDurationMax}
                      onChange={e => {
                        if (e.target.value === "") {
                          handleChange('displayDurationMax', "");
                        } else {
                          handleChange('displayDurationMax', Math.max(0, parseInt(e.target.value)));
                        }
                      }}
                      onBlur={e => {
                        if(e.target.value === "") {
                          handleChange('displayDurationMax', 3000);
                        }
                      }}
                      {...(settings.displayDurationMax === "" ? {} : { min: "0" })}
                      className="form-input w-24"
                      disabled={isPlaying}
                    />
                    <span className="text-sm text-muted-foreground">milliseconds</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={settings.displayDuration}
                      onChange={e => handleChange('displayDuration', e.target.value)}
                      onBlur={e => {
                        if (e.target.value === "" || isNaN(parseInt(e.target.value))) {
                          handleChange('displayDuration', 3000);
                        } else {
                          handleChange('displayDuration', parseInt(e.target.value));
                        }
                      }}
                      className="form-input w-24"
                      disabled={isPlaying}
                    />
                    <span className="text-sm text-muted-foreground">milliseconds</span>
                  </div>
                )}
                <label className="flex items-center space-x-3 p-3 rounded-lg hover:bg-muted/50 transition-colors mt-2">
                  <input
                    type="checkbox"
                    checked={settings.randomizeDisplayDuration || false}
                    onChange={e => handleChange('randomizeDisplayDuration', e.target.checked)}
                    className="form-checkbox"
                    disabled={isPlaying}
                  />
                  <span>Randomize Display Duration</span>
                </label>
              </div>

              <div className="form-group">
                <label className="form-label">Delay Between Turns (ms) <SettingTooltip text="The time interval between consecutive stimuli presentations." /></label>
                {settings.randomizeDelayDuration ? (
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      value={settings.delayDurationMin === "" ? "" : settings.delayDurationMin || 400}
                      onChange={e => {
                        if (e.target.value === "") {
                          handleChange('delayDurationMin', "");
                        } else {
                          handleChange('delayDurationMin', Math.max(0, parseInt(e.target.value)));
                        }
                      }}
                      onBlur={e => {
                        if(e.target.value === "") {
                          handleChange('delayDurationMin', 400);
                        }
                      }}
                      className="form-input w-24"
                      disabled={isPlaying}
                    />
                    <span>to</span>
                    <input
                      type="number"
                      value={settings.delayDurationMax === "" ? "" : settings.delayDurationMax || 600}
                      onChange={e => {
                        if (e.target.value === "") {
                          handleChange('delayDurationMax', "");
                        } else {
                          handleChange('delayDurationMax', Math.max(0, parseInt(e.target.value)));
                        }
                      }}
                      onBlur={e => {
                        if (e.target.value === "") {
                          handleChange('delayDurationMax', 600);
                        }
                      }}
                      className="form-input w-24"
                      disabled={isPlaying}
                    />
                    <span className="text-sm text-muted-foreground">milliseconds</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      value={settings.delayDuration === "" ? "" : settings.delayDuration}
                      onChange={e => {
                        if (e.target.value === "") {
                          handleChange('delayDuration', "");
                        } else {
                          handleChange('delayDuration', Math.max(0, parseInt(e.target.value)));
                        }
                      }}
                      onBlur={e => {
                        if (e.target.value === "" || isNaN(parseInt(e.target.value))) {
                          handleChange('delayDuration', 500);
                        }
                      }}
                      min="0"
                      max="2000"
                      step="100"
                      className="form-input w-24"
                      disabled={isPlaying}
                    />
                    <span className="text-sm text-muted-foreground">milliseconds</span>
                  </div>
                )}
                <label className="flex items-center space-x-3 p-3 rounded-lg hover:bg-muted/50 transition-colors mt-2">
                  <input
                    type="checkbox"
                    checked={settings.randomizeDelayDuration || false}
                    onChange={e => handleChange('randomizeDelayDuration', e.target.checked)}
                    className="form-checkbox"
                    disabled={isPlaying}
                  />
                  <span>Randomize Delay Duration</span>
                </label>
              </div>
            </div>
          </SettingsGroup>
        )}

        <SettingsGroup title="Keybinds" defaultExpanded={false}>
          <div className="grid gap-4">
            <KeybindInput
              label="Position"
              value={settings.positionKey}
              onChange={value => handleChange('positionKey', value)}
              defaultValue="A"
            />
            <KeybindInput
              label="Audio"
              value={settings.audioKey}
              onChange={value => handleChange('audioKey', value)}
              defaultValue="L"
            />
            <KeybindInput
              label="Number"
              value={settings.numberKey}
              onChange={value => handleChange('numberKey', value)}
              defaultValue="D"
            />
            <KeybindInput
              label="Color"
              value={settings.colorKey}
              onChange={value => handleChange('colorKey', value)}
              defaultValue="F"
            />
            <KeybindInput
              label="Shape"
              value={settings.shapeKey}
              onChange={value => handleChange('shapeKey', value)}
              defaultValue="J"
            />
            <KeybindInput
              label="Start/Stop"
              value={settings.startStopKey}
              onChange={value => handleChange('startStopKey', value)}
              defaultValue="Space"
            />
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
            </div>
          </div>
        </SettingsGroup>

        {advancedMode && (
          <SettingsGroup title="Focus" defaultExpanded={false}>
            <div className="space-y-2">
              <div className="text-sm text-muted-foreground mb-2">
                Select which elements remain visible in focus mode:
              </div>
              <label className="flex items-center space-x-3 p-3 rounded-lg hover:bg-muted/50 transition-colors">
                <input
                  type="checkbox"
                  checked={settings.focusElements?.title || false}
                  onChange={e => handleChange('focusElements', {
                    ...settings.focusElements || {},
                    title: e.target.checked
                  })}
                  className="form-checkbox"
                  disabled={isPlaying}
                />
                <span>Title</span>
              </label>
              <label className="flex items-center space-x-3 p-3 rounded-lg hover:bg-muted/50 transition-colors">
                <input
                  type="checkbox"
                  checked={settings.focusElements?.settings || false}
                  onChange={e => handleChange('focusElements', {
                    ...settings.focusElements || {},
                    settings: e.target.checked
                  })}
                  className="form-checkbox"
                  disabled={isPlaying}
                />
                <span>Settings</span>
              </label>
              <label className="flex items-center space-x-3 p-3 rounded-lg hover:bg-muted/50 transition-colors">
                <input
                  type="checkbox"
                  checked={settings.focusElements?.score || false}
                  onChange={e => handleChange('focusElements', {
                    ...settings.focusElements || {},
                    score: e.target.checked
                  })}
                  className="form-checkbox"
                  disabled={isPlaying}
                />
                <span>Score</span>
              </label>
              <label className="flex items-center space-x-3 p-3 rounded-lg hover:bg-muted/50 transition-colors">
                <input
                  type="checkbox"
                  checked={settings.focusElements?.history || false}
                  onChange={e => handleChange('focusElements', {
                    ...settings.focusElements || {},
                    history: e.target.checked
                  })}
                  className="form-checkbox"
                  disabled={isPlaying}
                />
                <span>History</span>
              </label>
              <label className="flex items-center space-x-3 p-3 rounded-lg hover:bg-muted/50 transition-colors">
                <input
                  type="checkbox"
                  checked={settings.focusElements?.stimuliButtons === undefined ? true : settings.focusElements.stimuliButtons}
                  onChange={e => handleChange('focusElements', {
                    ...settings.focusElements || {},
                    stimuliButtons: e.target.checked
                  })}
                  className="form-checkbox"
                  disabled={isPlaying}
                />
                <span>Stimuli Buttons</span>
              </label>
              <label className="flex items-center space-x-3 p-3 rounded-lg hover:bg-muted/50 transition-colors">
                <input
                  type="checkbox"
                  checked={settings.focusElements?.turnCounter === undefined ? true : settings.focusElements.turnCounter}
                  onChange={e => handleChange('focusElements', {
                    ...settings.focusElements || {},
                    turnCounter: e.target.checked
                  })}
                  className="form-checkbox"
                  disabled={isPlaying}
                />
                <span>Turn Counter</span>
              </label>
            </div>
          </SettingsGroup>
        )}

        {advancedMode && settings.is3D && (
          <SettingsGroup title="Rotation" defaultExpanded={false}>
            <div className="space-y-4">
              <label className="flex items-center space-x-3 p-3 rounded-lg hover:bg-muted/50 transition-colors">
                <input
                  type="checkbox"
                  checked={settings.autoRotate}
                  onChange={e => handleChange('autoRotate', e.target.checked)}
                  className="form-checkbox"
                  disabled={isPlaying}
                />
                <span>Auto-rotate <SettingTooltip text="Automatically rotate the 3D grid to provide different perspectives." /></span>
              </label>
              
              {settings.autoRotate && (
                <div className="space-y-4 ml-6 mt-2">
                  <div className="form-group">
                    <label className="form-label">X-Axis Rotation Speed <SettingTooltip text="Controls rotation around the X axis (horizontal)" /></label>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min="-10"
                        max="10"
                        step="0.1"
                        value={settings.rotationSpeedX !== undefined ? settings.rotationSpeedX : 1}
                        onChange={e => {
                          const value = e.target.value === "" ? 0 : parseFloat(e.target.value);
                          handleChange('rotationSpeedX', isNaN(value) ? 0 : value);
                        }}
                        className="form-input w-24"
                        disabled={isPlaying}
                      />
                    </div>
                  </div>
                  
                  <div className="form-group">
                    <label className="form-label">Y-Axis Rotation Speed <SettingTooltip text="Controls rotation around the Y axis (vertical)" /></label>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min="-10"
                        max="10"
                        step="0.1"
                        value={settings.rotationSpeedY !== undefined ? settings.rotationSpeedY : 1}
                        onChange={e => {
                          const value = e.target.value === "" ? 0 : parseFloat(e.target.value);
                          handleChange('rotationSpeedY', isNaN(value) ? 0 : value);
                        }}
                        className="form-input w-24"
                        disabled={isPlaying}
                      />
                    </div>
                  </div>
                  
                  <div className="form-group">
                    <label className="form-label">Z-Axis Rotation Speed <SettingTooltip text="Controls rotation around the Z axis (depth)" /></label>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min="-10"
                        max="10"
                        step="0.1"
                        value={settings.rotationSpeedZ !== undefined ? settings.rotationSpeedZ : 1}
                        onChange={e => {
                          const value = e.target.value === "" ? 0 : parseFloat(e.target.value);
                          handleChange('rotationSpeedZ', isNaN(value) ? 0 : value);
                        }}
                        className="form-input w-24"
                        disabled={isPlaying}
                      />
                    </div>
                  </div>
                  
                  <button
                    onClick={() => {
                      handleChange('resetRotation', Date.now());
                    }}
                    className="mt-4 w-full py-2 px-4 rounded-md font-medium transition-colors bg-muted hover:bg-muted/80"
                    disabled={isPlaying}
                  >
                    Reset Axes
                  </button>
                </div>
              )}
            </div>
          </SettingsGroup>
        )}

        <SettingsGroup title="Advanced" defaultExpanded={false}>
          <div className="space-y-4">
            <label className="flex items-center space-x-3 p-3 rounded-lg hover:bg-muted/50 transition-colors">
              <input
                type="checkbox"
                checked={settings.advancedMode || false}
                onChange={e => handleChange('advancedMode', e.target.checked)}
                className="form-checkbox"
                disabled={isPlaying}
              />
              <span>Advanced Mode <SettingTooltip text="Enables additional settings for fine-tuning the N-Back exercise, including timing controls, match chances, and display options." /></span>
            </label>
            
            {advancedMode && (
              <>
                <div className="form-group">
                  <label className="form-label">Guaranteed Matches Chance <SettingTooltip text="The probability that a stimulus will match the one from N positions back, creating a match that should be identified." /></label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      value={settings.guaranteedMatchesChance * 100}
                      onChange={e => handleChange('guaranteedMatchesChance', Math.max(0, Math.min(100, parseFloat(e.target.value))) / 100)}
                      className="form-input w-24"
                      step="0.1"
                      min="0"
                      max="100"
                      disabled={isPlaying}
                    />
                    <span className="text-sm text-muted-foreground">%</span>
                  </div>
                </div>
                <div className="form-group mt-4">
                  <label className="form-label">Interference Chance <SettingTooltip text="The probability that a stimulus will match one from a position other than N back, creating a potential false positive." /></label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      value={settings.interferenceChance * 100}
                      onChange={e => handleChange('interferenceChance', Math.max(0, Math.min(100, parseFloat(e.target.value))) / 100)}
                      className="form-input w-24"
                      step="0.1"
                      min="0"
                      max="100"
                      disabled={isPlaying}
                    />
                    <span className="text-sm text-muted-foreground">%</span>
                  </div>
                </div>
                
                <label className="flex items-center space-x-3 p-3 rounded-lg hover:bg-muted/50 transition-colors mt-4">
                  <input
                    type="checkbox"
                    checked={settings.disableTurnDisplay || false}
                    onChange={e => handleChange('disableTurnDisplay', e.target.checked)}
                    className="form-checkbox"
                    disabled={isPlaying}
                  />
                  <span>Disable Turn Display</span>
                </label>
              </>
            )}
          </div>
        </SettingsGroup>
      </div>
    </div>
  );
}