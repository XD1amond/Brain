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

export function Settings({ settings, onSettingsChange }) {
  const handleChange = (key, value) => {
    onSettingsChange(prev => {
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

      return newSettings;
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
      
      return {
        ...prev,
        questionTypes: {
          ...prev.questionTypes,
          [type]: enabled
        }
      };
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
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Settings</h2>
      </div>

      <div className="space-y-4">
        <SettingsGroup title="General" defaultExpanded={true}>
          <div className="form-group">
            <label className="form-label">Default Premises</label>
            <input
              type="number"
              min="2"
              max="6"
              value={settings.globalPremises}
              onChange={e => handleChange('globalPremises', parseInt(e.target.value))}
              className="form-input w-20"
            />
            <p className="text-sm text-muted-foreground mt-1">
              Individual question type settings will override this
            </p>
          </div>
        </SettingsGroup>

        <SettingsGroup title="Timings" defaultExpanded={true}>
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

        <SettingsGroup title="Word Types" defaultExpanded={true}>
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

        <SettingsGroup title="Question Types" defaultExpanded={true}>
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
                  min="2"
                  max="6"
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
                    min="2"
                    max="6"
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
                    min="2"
                    max="6"
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
                  min="2"
                  max="6"
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
                  min="2"
                  max="6"
                  value={settings.direction3DPremises}
                  onChange={e => handleChange('direction3DPremises', parseInt(e.target.value))}
                  className="form-input w-20"
                />
              </div>
            )}
          </div>
        </SettingsGroup>

        <SettingsGroup title="Misc" defaultExpanded={true}>
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
              checked={settings.enableNegation}
              onChange={e => handleChange('enableNegation', e.target.checked)}
              className="form-checkbox"
            />
            <span className="font-medium">Enable Negation</span>
          </label>

          {settings.enableNegation && (
            <label className="flex items-center space-x-3 p-3 ml-8 rounded-lg hover:bg-muted/50 transition-colors">
              <input
                type="checkbox"
                checked={settings.removeNegationExplainer}
                onChange={e => handleChange('removeNegationExplainer', e.target.checked)}
                className="form-checkbox"
              />
              <span className="font-medium">Remove Negation Explainer</span>
            </label>
          )}

          <label className="flex items-center space-x-3 p-3 rounded-lg hover:bg-muted/50 transition-colors">
            <input
              type="checkbox"
              checked={settings.enableMeta}
              onChange={e => handleChange('enableMeta', e.target.checked)}
              className="form-checkbox"
            />
            <span className="font-medium">Enable Meta Relations</span>
          </label>

          <label className="flex items-center space-x-3 p-3 rounded-lg hover:bg-muted/50 transition-colors">
            <input
              type="checkbox"
              checked={settings.enableStroopEffect}
              onChange={e => handleChange('enableStroopEffect', e.target.checked)}
              className="form-checkbox"
            />
            <span className="font-medium">Enable Stroop Effect</span>
          </label>
        </SettingsGroup>

        <div className="p-4 bg-primary/5 rounded-lg">
          <h4 className="font-medium mb-2">Tips</h4>
          <ul className="text-sm text-muted-foreground space-y-2">
            <li>• Start with meaningful words before using nonsense or garbage words</li>
            <li>• Use carousel mode for better focus on each premise</li>
            <li>• Enable negation and meta relations for advanced practice</li>
            <li>• Mix different question types for varied practice</li>
            <li>• Use the Stroop effect to challenge your focus</li>
          </ul>
        </div>
      </div>
    </div>
  );
}