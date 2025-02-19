import { useState } from 'react';
import { cn } from '@/lib/utils';
import { createPreset, validatePreset, compressSettings, generateShortId } from './constants/presets';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { toast } from 'sonner';

function KeybindInput({ label, value, onChange, defaultValue }) {
  const [isBinding, setIsBinding] = useState(false);
  const displayValue = value === ' ' ? 'Space' : value || defaultValue;

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

export function Settings({
  settings,
  onSettingsChange,
  userPresets,
  setUserPresets,
  presetName,
  setPresetName
}) {
  const [showDropdown, setShowDropdown] = useState(false);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  const updatePreset = (newSettings) => {
    if (presetName && presetName !== 'Default') {
      setUserPresets(prev => prev.map(p =>
        p.name === presetName
          ? { ...p, settings: newSettings }
          : p
      ));
    }
  };

  const handleChange = (key, value) => {
    // Update settings
    onSettingsChange(prev => {
      // For non-general premises inputs, skip value 1
      if (key.toLowerCase().includes('premises') && key !== 'globalPremises') {
        const oldValue = prev[key];
        // If decreasing from 2 to 1, jump to 0
        if (oldValue === 2 && value === 1) {
          value = 0;
        }
        // If increasing from 0 to 1, jump to 2
        if (oldValue === 0 && value === 1) {
          value = 2;
        }
      }

      const newSettings = {
        ...prev,
        [key]: value
      };

      // Check if at least one word type is enabled
      const hasWordType =
        newSettings.useNonsenseWords ||
        newSettings.useGarbageWords ||
        newSettings.useMeaningfulWords ||
        newSettings.useEmoji;

      // If trying to disable the last word type, prevent it
      if (!hasWordType && key.startsWith('use') && !value) {
        return prev;
      }

      const finalSettings = newSettings;
      updatePreset(finalSettings);
      return finalSettings;
    });
  };

  const handleQuestionTypeChange = (type, enabled) => {
    onSettingsChange(prev => {
      // If trying to disable a type, check if it would leave no types enabled
      if (!enabled) {
        const enabledCount = Object.values(prev.questionTypes).filter(Boolean).length;
        if (enabledCount <= 1 && prev.questionTypes[type]) {
          return prev;
        }
      }
      
      const finalSettings = {
        ...prev,
        questionTypes: {
          ...prev.questionTypes,
          [type]: enabled
        }
      };
      updatePreset(finalSettings);
      return finalSettings;
    });
  };

  // Check if at least one word type is enabled
  const hasWordType = 
    settings.useNonsenseWords ||
    settings.useGarbageWords ||
    settings.useMeaningfulWords ||
    settings.useEmoji;

  // Check if at least one question type is enabled
  const hasQuestionType = Object.values(settings.questionTypes).some(Boolean);

  return (
    <div className="space-y-6 bg-card rounded-xl p-6 shadow-lg">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold">Settings</h2>
      </div>

      <div className="flex items-center gap-2 mb-6">
        <div className="relative w-48">
          <div className="flex items-center justify-between px-3 py-2 bg-background border border-border rounded hover:bg-muted/50 transition-colors">
            {isEditing ? (
              <input
                type="text"
                value={presetName}
                onChange={(e) => {
                  const newName = e.target.value;
                  setPresetName(newName);
                  // Update the preset name in userPresets
                  setUserPresets(prev => prev.map(p =>
                    p.name === presetName ? { ...p, name: newName } : p
                  ));
                }}
                onBlur={() => {
                  if (presetName.trim()) {
                    setIsEditing(false);
                  }
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && presetName.trim()) {
                    setIsEditing(false);
                  }
                }}
                className="bg-transparent border-none outline-none w-full"
                autoFocus
                onClick={(e) => e.stopPropagation()}
              />
            ) : (
              <span
                className="truncate cursor-text flex-1"
                onClick={(e) => {
                  e.stopPropagation();
                  if (presetName !== 'Default') {
                    setIsEditing(true);
                  }
                }}
              >
                {presetName || 'Default'}
              </span>
            )}
            <div
              onClick={(e) => {
                e.stopPropagation();
                setShowDropdown(prev => !prev);
              }}
              className="cursor-pointer p-1 -mr-1 ml-2"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="w-4 h-4 ml-2 transition-transform duration-200"
                style={{ transform: showDropdown ? 'rotate(180deg)' : 'rotate(0)' }}
              >
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </div>
          </div>

          <div
            className={cn(
              "absolute top-full left-0 right-0 mt-1 bg-card border border-border rounded-lg shadow-lg overflow-hidden z-50 transition-all duration-200",
              showDropdown
                ? "opacity-100 translate-y-0"
                : "opacity-0 -translate-y-2 pointer-events-none"
            )}
          >
            <div className="max-h-48 overflow-y-auto">
              <div
                className="px-3 py-2 hover:bg-muted/50 cursor-pointer transition-colors"
                onClick={() => {
                  setPresetName('');
                  const defaultSettings = {
                    ...settings,
                    // Reset to default settings
                    globalPremises: 2,
                    generalTimer: 30,
                    questionTypes: { ...settings.questionTypes, distinction: true },
                    _lastUpdated: Date.now()
                  };
                  
                  // Update localStorage directly to ensure immediate sync
                  window.localStorage.setItem('rrt-settings', JSON.stringify(defaultSettings));
                  
                  // Update state after localStorage
                  onSettingsChange(defaultSettings);
                  
                  // Force re-render by updating a key in settings
                  setTimeout(() => {
                    onSettingsChange(prev => ({
                      ...prev,
                      _lastUpdated: Date.now()
                    }));
                  }, 0);
                  setShowDropdown(false);
                }}
              >
                Default
              </div>
              {userPresets.map((preset, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between px-3 py-2 hover:bg-muted/50 cursor-pointer transition-colors group"
                >
                  <span
                    className="flex-1"
                    onClick={() => {
                      // Force settings update and ensure localStorage sync
                      const newSettings = {
                        ...preset.settings,
                        _lastUpdated: Date.now()
                      };
                      
                      // Update localStorage directly to ensure immediate sync
                      window.localStorage.setItem('rrt-settings', JSON.stringify(newSettings));
                      
                      // Update state after localStorage
                      onSettingsChange(newSettings);
                      setPresetName(preset.name);
                      
                      // Force re-render by updating a key in settings
                      setTimeout(() => {
                        onSettingsChange(prev => ({
                          ...prev,
                          _lastUpdated: Date.now()
                        }));
                      }, 0);
                      setShowDropdown(false);
                    }}
                  >
                    {preset.name}
                  </span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (window.confirm(`Delete preset "${preset.name}"?`)) {
                        const newPresets = userPresets.filter((_, i) => i !== index);
                        setUserPresets(newPresets);
                        if (preset.name === presetName) {
                          setPresetName('');
                        }
                      }
                    }}
                    className="p-1 text-destructive opacity-0 group-hover:opacity-100 transition-opacity hover:bg-destructive/10 rounded"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
                      <path d="M3 6h18" />
                      <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
                      <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        <button
          onClick={() => setShowSaveModal(true)}
          className="p-2 bg-primary text-primary-foreground rounded hover:bg-primary/90 transition-colors"
          aria-label="Add Preset"
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
        </button>

        <button
          className="p-2 bg-primary text-primary-foreground rounded hover:bg-primary/90 transition-colors"
          aria-label="Share Settings"
          onClick={async () => {
            try {
              // Create a new preset with ID
              const preset = createPreset(presetName || 'Shared Settings', settings);
              
              // Ensure all settings are included
              const fullSettings = {
                ...settings,
                questionTypes: { ...settings.questionTypes }
              };
              
              // Compress settings for URL
              const compressedSettings = compressSettings(fullSettings);
              
              // Create share data with compressed settings
              const shareData = {
                id: preset.id,
                name: preset.name,
                settings: compressedSettings
              };
              
              // Create URL with preset parameter before hash
              const url = window.location.origin + '/Brain/?preset=' +
                encodeURIComponent(JSON.stringify(shareData)) + '#/rrt';
              
              // Copy to clipboard
              await navigator.clipboard.writeText(url);
              toast.success('Settings URL copied to clipboard');
              
              // Only save to presets if it's a new named preset
              if (presetName && !userPresets.some(p => p.name === presetName)) {
                setUserPresets(prev => [...prev, preset]);
              }
            } catch (error) {
              // Silently handle error and show toast
              toast.error('Failed to copy settings URL');
            }
          }}
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
            <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
          </svg>
        </button>

        {showSaveModal && (
          <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center">
            <div className="bg-card p-6 rounded-lg shadow-lg max-w-md w-full mx-4">
              <h3 className="text-lg font-medium mb-4">Save Preset</h3>
              <input
                type="text"
                value={presetName}
                onChange={(e) => setPresetName(e.target.value)}
                placeholder="Preset name"
                className="form-input w-full mb-4"
                autoFocus
              />
              <div className="flex justify-end gap-2">
                <button
                  onClick={() => {
                    setPresetName('');
                    setShowSaveModal(false);
                  }}
                  className="px-4 py-2 bg-muted hover:bg-muted/90 rounded transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    if (!presetName.trim()) return;
                    const preset = createPreset(presetName, settings);
                    setUserPresets([...userPresets, preset]);
                    setShowSaveModal(false);
                  }}
                  className="px-4 py-2 bg-primary text-primary-foreground rounded hover:bg-primary/90 transition-colors"
                >
                  Save
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="space-y-4">
        <SettingsGroup title="General" defaultExpanded={false}>
          <div className="form-group">
            <label className="form-label">Default Premises</label>
            <input
              type="number"
              min="2"
              value={settings.globalPremises}
              onChange={e => handleChange('globalPremises', parseInt(e.target.value))}
              className="form-input w-20"
            />
            <p className="text-sm text-muted-foreground mt-1">
              Individual question type settings will override this
            </p>
          </div>
        </SettingsGroup>

        <SettingsGroup title="Question Types" defaultExpanded={false}>
          {!hasQuestionType && (
            <div className="text-sm text-destructive mb-2">
              At least one question type must be enabled
            </div>
          )}
          {/* Distinction */}
          <div className="space-y-2">
            <label className="flex items-center space-x-3 p-3 rounded-lg hover:bg-muted/50 transition-colors">
              <input
                type="checkbox"
                checked={settings.questionTypes.distinction}
                onChange={e => handleQuestionTypeChange('distinction', e.target.checked)}
                className="form-checkbox"
              />
              <span className="font-medium">Enable Distinction</span>
            </label>
            {settings.questionTypes.distinction && (
              <div className="form-group ml-8">
                <label className="form-label">Premises</label>
                <input
                  type="number"
                  min="0"
                  value={settings.distinctionPremises}
                  onChange={e => handleChange('distinctionPremises', parseInt(e.target.value))}
                  className="form-input w-20"
                />
              </div>
            )}
          </div>

          {/* Comparison */}
          <div className="space-y-2">
            <label className="flex items-center space-x-3 p-3 rounded-lg hover:bg-muted/50 transition-colors">
              <input
                type="checkbox"
                checked={settings.questionTypes.comparison}
                onChange={e => handleQuestionTypeChange('comparison', e.target.checked)}
                className="form-checkbox"
              />
              <span className="font-medium">Enable Comparison</span>
            </label>
            {settings.questionTypes.comparison && (
              <div className="space-y-2 ml-8">
                <div className="form-group">
                  <label className="form-label">Premises</label>
                  <input
                    type="number"
                    min="0"
                    value={settings.comparisonPremises}
                    onChange={e => handleChange('comparisonPremises', parseInt(e.target.value))}
                    className="form-input w-20"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Temporal */}
          <div className="space-y-2">
            <label className="flex items-center space-x-3 p-3 rounded-lg hover:bg-muted/50 transition-colors">
              <input
                type="checkbox"
                checked={settings.questionTypes.temporal}
                onChange={e => handleQuestionTypeChange('temporal', e.target.checked)}
                className="form-checkbox"
              />
              <span className="font-medium">Enable Temporal</span>
            </label>
            {settings.questionTypes.temporal && (
              <div className="space-y-2 ml-8">
                <div className="form-group">
                  <label className="form-label">Premises</label>
                  <input
                    type="number"
                    min="0"
                    value={settings.temporalPremises}
                    onChange={e => handleChange('temporalPremises', parseInt(e.target.value))}
                    className="form-input w-20"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Space 2D */}
          <div className="space-y-2">
            <label className="flex items-center space-x-3 p-3 rounded-lg hover:bg-muted/50 transition-colors">
              <input
                type="checkbox"
                checked={settings.questionTypes.direction}
                onChange={e => handleQuestionTypeChange('direction', e.target.checked)}
                className="form-checkbox"
              />
              <span className="font-medium">Enable Space 2D</span>
            </label>
            {settings.questionTypes.direction && (
              <div className="form-group ml-8">
                <label className="form-label">Premises</label>
                <input
                  type="number"
                  min="0"
                  value={settings.directionPremises}
                  onChange={e => handleChange('directionPremises', parseInt(e.target.value))}
                  className="form-input w-20"
                />
              </div>
            )}
          </div>

          {/* Space 3D */}
          <div className="space-y-2">
            <label className="flex items-center space-x-3 p-3 rounded-lg hover:bg-muted/50 transition-colors">
              <input
                type="checkbox"
                checked={settings.questionTypes.direction3D}
                onChange={e => handleQuestionTypeChange('direction3D', e.target.checked)}
                className="form-checkbox"
              />
              <span className="font-medium">Enable Space 3D</span>
            </label>
            {settings.questionTypes.direction3D && (
              <div className="form-group ml-8">
                <label className="form-label">Premises</label>
                <input
                  type="number"
                  min="0"
                  value={settings.direction3DPremises}
                  onChange={e => handleChange('direction3DPremises', parseInt(e.target.value))}
                  className="form-input w-20"
                />
              </div>
            )}
          </div>
        </SettingsGroup>

        <SettingsGroup title="Word Types" defaultExpanded={false}>
          {!hasWordType && (
            <div className="text-sm text-destructive mb-2">
              At least one word type must be enabled
            </div>
          )}
          <label className="flex items-center space-x-3 p-3 rounded-lg hover:bg-muted/50 transition-colors">
            <input
              type="checkbox"
              checked={settings.useNonsenseWords}
              onChange={e => handleChange('useNonsenseWords', e.target.checked)}
              className="form-checkbox"
            />
            <span className="font-medium">Use Nonsense Words</span>
          </label>
          {settings.useNonsenseWords && (
            <div className="form-group ml-8">
              <label className="form-label">Word Length</label>
              <input
                type="number"
                min="2"
                max="15"
                value={settings.nonsenseWordLength}
                onChange={e => handleChange('nonsenseWordLength', parseInt(e.target.value))}
                className="form-input w-20"
              />
            </div>
          )}

          <label className="flex items-center space-x-3 p-3 rounded-lg hover:bg-muted/50 transition-colors">
            <input
              type="checkbox"
              checked={settings.useGarbageWords}
              onChange={e => handleChange('useGarbageWords', e.target.checked)}
              className="form-checkbox"
            />
            <span className="font-medium">Use Garbage Words</span>
          </label>
          {settings.useGarbageWords && (
            <div className="form-group ml-8">
              <label className="form-label">Word Length</label>
              <input
                type="number"
                min="2"
                max="10"
                value={settings.garbageWordLength}
                onChange={e => handleChange('garbageWordLength', parseInt(e.target.value))}
                className="form-input w-20"
              />
            </div>
          )}

          <label className="flex items-center space-x-3 p-3 rounded-lg hover:bg-muted/50 transition-colors">
            <input
              type="checkbox"
              checked={settings.useMeaningfulWords}
              onChange={e => handleChange('useMeaningfulWords', e.target.checked)}
              className="form-checkbox"
            />
            <span className="font-medium">Use Meaningful Words</span>
          </label>
          {settings.useMeaningfulWords && (
            <div className="space-y-2 ml-8">
              <label className="flex items-center space-x-3 p-2 rounded-lg hover:bg-muted/50 transition-colors">
                <input
                  type="checkbox"
                  checked={settings.useNouns}
                  onChange={e => handleChange('useNouns', e.target.checked)}
                  className="form-checkbox"
                />
                <span className="font-medium">Nouns</span>
              </label>
              <label className="flex items-center space-x-3 p-2 rounded-lg hover:bg-muted/50 transition-colors">
                <input
                  type="checkbox"
                  checked={settings.useAdjectives}
                  onChange={e => handleChange('useAdjectives', e.target.checked)}
                  className="form-checkbox"
                />
                <span className="font-medium">Adjectives</span>
              </label>
            </div>
          )}

          <label className="flex items-center space-x-3 p-3 rounded-lg hover:bg-muted/50 transition-colors">
            <input
              type="checkbox"
              checked={settings.useEmoji}
              onChange={e => handleChange('useEmoji', e.target.checked)}
              className="form-checkbox"
            />
            <span className="font-medium">Use Emoji 🎨</span>
          </label>
        </SettingsGroup>

        <SettingsGroup title="Timings" defaultExpanded={false}>
          <div className="grid gap-4">
            <div className="form-group">
              <label className="form-label">General Timer (sec)</label>
              <input
                type="number"
                min="5"
                max="60"
                value={settings.generalTimer}
                onChange={e => handleChange('generalTimer', parseInt(e.target.value))}
                className="form-input w-20"
              />
              <p className="text-sm text-muted-foreground mt-1">
                Used when individual timers are set to 0
              </p>
            </div>
            <div className="form-group">
              <label className="form-label">Distinction Timer (sec)</label>
              <input
                type="number"
                min="0"
                max="60"
                value={settings.distinctionTimer}
                onChange={e => handleChange('distinctionTimer', parseInt(e.target.value))}
                className="form-input w-20"
              />
              <p className="text-sm text-muted-foreground mt-1">
                Set to 0 to use general timer
              </p>
            </div>
            <div className="form-group">
              <label className="form-label">Comparison Timer (sec)</label>
              <input
                type="number"
                min="0"
                max="60"
                value={settings.comparisonTimer}
                onChange={e => handleChange('comparisonTimer', parseInt(e.target.value))}
                className="form-input w-20"
              />
              <p className="text-sm text-muted-foreground mt-1">
                Set to 0 to use general timer
              </p>
            </div>
            <div className="form-group">
              <label className="form-label">Temporal Timer (sec)</label>
              <input
                type="number"
                min="0"
                max="60"
                value={settings.temporalTimer}
                onChange={e => handleChange('temporalTimer', parseInt(e.target.value))}
                className="form-input w-20"
              />
              <p className="text-sm text-muted-foreground mt-1">
                Set to 0 to use general timer
              </p>
            </div>
            <div className="form-group">
              <label className="form-label">Space 2D Timer (sec)</label>
              <input
                type="number"
                min="0"
                max="60"
                value={settings.directionTimer}
                onChange={e => handleChange('directionTimer', parseInt(e.target.value))}
                className="form-input w-20"
              />
              <p className="text-sm text-muted-foreground mt-1">
                Set to 0 to use general timer
              </p>
            </div>
            <div className="form-group">
              <label className="form-label">Space 3D Timer (sec)</label>
              <input
                type="number"
                min="0"
                max="60"
                value={settings.direction3DTimer}
                onChange={e => handleChange('direction3DTimer', parseInt(e.target.value))}
                className="form-input w-20"
              />
              <p className="text-sm text-muted-foreground mt-1">
                Set to 0 to use general timer
              </p>
            </div>
          </div>
        </SettingsGroup>

        <SettingsGroup title="Keybinds" defaultExpanded={false}>
          <div className="grid gap-4">
            <KeybindInput
              label="True"
              value={settings.trueKey}
              onChange={value => handleChange('trueKey', value)}
              defaultValue="1"
            />
            <KeybindInput
              label="False"
              value={settings.falseKey}
              onChange={value => handleChange('falseKey', value)}
              defaultValue="2"
            />
            <KeybindInput
              label="New Question"
              value={settings.newQuestionKey}
              onChange={value => handleChange('newQuestionKey', value)}
              defaultValue="3"
            />
            <KeybindInput
              label="Play/Pause"
              value={settings.playPauseKey}
              onChange={value => handleChange('playPauseKey', value)}
              defaultValue="Space"
            />
          </div>
        </SettingsGroup>

        <SettingsGroup title="Misc" defaultExpanded={false}>
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
              checked={settings.randomizeButtons}
              onChange={e => handleChange('randomizeButtons', e.target.checked)}
              className="form-checkbox"
            />
            <span className="font-medium">Randomize Buttons</span>
          </label>

          {settings.randomizeButtons && (
            <label className="flex items-center space-x-3 p-3 ml-8 rounded-lg hover:bg-muted/50 transition-colors">
              <input
                type="checkbox"
                checked={settings.buttonNegation}
                onChange={e => handleChange('buttonNegation', e.target.checked)}
                className="form-checkbox"
              />
              <span className="font-medium">Button Negation</span>
            </label>
          )}
        </SettingsGroup>

      </div>
    </div>
  );
}