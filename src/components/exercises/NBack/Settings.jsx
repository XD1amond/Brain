import { useState } from 'react';
import { cn } from '@/lib/utils';

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

export function Settings({ settings, onSettingsChange, isPlaying }) {
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

  return (
    <div className="space-y-6 bg-card rounded-xl p-6 shadow-lg">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Settings</h2>
      </div>

      <div className="space-y-4">
        <SettingsGroup title="General" defaultExpanded={false}>
          <div className="space-y-4">
            <div className="form-group">
              <label className="form-label">N-Back Level</label>
              <input
                type="number"
                value={settings.nBack}
                onChange={e => handleChange('nBack', Math.max(1, parseInt(e.target.value)))}
                min="1"
                max="5"
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
              <span>Individual N-Back Levels</span>
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
                          max="5"
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

            <label className="flex items-center space-x-3 p-3 rounded-lg hover:bg-muted/50 transition-colors">
              <input
                type="checkbox"
                checked={settings.is3D}
                onChange={e => handleChange('is3D', e.target.checked)}
                className="form-checkbox"
                disabled={isPlaying}
              />
              <span>3D Grid</span>
            </label>

            {settings.is3D && (
              <label className="flex items-center space-x-3 p-3 ml-6 rounded-lg hover:bg-muted/50 transition-colors">
                <input
                  type="checkbox"
                  checked={settings.autoRotate}
                  onChange={e => handleChange('autoRotate', e.target.checked)}
                  className="form-checkbox"
                  disabled={isPlaying}
                />
                <span>Auto-rotate</span>
              </label>
            )}
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
                  <div className="mt-2 ml-8 p-3 rounded-lg bg-muted/30">
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
                )}
              </div>
            ))}
          </div>
        </SettingsGroup>

        <SettingsGroup title="Timing" defaultExpanded={false}>
          <div className="space-y-4">
            <div className="form-group">
              <label className="form-label">Display Duration (ms)</label>
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
              <label className="form-label">Delay Between Turns (ms)</label>
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

        <SettingsGroup title="Advanced" defaultExpanded={false}>
          <div className="form-group">
            <label className="form-label">Guaranteed Matches Chance</label>
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
            <label className="form-label">Interference Chance</label>
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
        </SettingsGroup>
      </div>
    </div>
  );
}