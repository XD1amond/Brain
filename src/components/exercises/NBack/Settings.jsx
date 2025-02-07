import { cn } from '@/lib/utils';

export function Settings({ settings, onSettingsChange }) {
  const handleStimuliChange = (type) => {
    onSettingsChange(prev => ({
      ...prev,
      stimuli: {
        ...prev.stimuli,
        [type]: !prev.stimuli[type]
      }
    }));
  };

  return (
    <div className="space-y-6 bg-card rounded-xl p-6 shadow-lg">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Settings</h2>
      </div>

      <div className="space-y-4">
        <label className="flex items-center space-x-3 p-3 rounded-lg hover:bg-muted/50 transition-colors">
          <input
            type="checkbox"
            checked={settings.is3D}
            onChange={(e) => onSettingsChange(prev => ({
              ...prev,
              is3D: e.target.checked
            }))}
            className="form-checkbox"
          />
          <span className="font-medium">3D Grid</span>
        </label>

        <div className="form-group">
          <label className="form-label">N-Back Level</label>
          <select
            value={settings.nBack}
            onChange={(e) => onSettingsChange(prev => ({
              ...prev,
              nBack: parseInt(e.target.value)
            }))}
            className="form-select"
          >
            {[1, 2, 3, 4, 5].map(n => (
              <option key={n} value={n}>{n}</option>
            ))}
          </select>
        </div>

        <div className="space-y-2">
          <h3 className="text-sm font-medium text-muted-foreground">Stimuli</h3>
          <div className="space-y-2">
            {Object.entries({
              position: 'Position',
              color: 'Color',
              audio: 'Audio',
              shape: 'Shape',
              number: 'Number'
            }).map(([type, label]) => (
              <label key={type} className="flex items-center space-x-3 p-3 rounded-lg hover:bg-muted/50 transition-colors">
                <input
                  type="checkbox"
                  checked={settings.stimuli[type]}
                  onChange={() => handleStimuliChange(type)}
                  className="form-checkbox"
                />
                <span className="font-medium">{label}</span>
              </label>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <h3 className="text-sm font-medium text-muted-foreground">Controls</h3>
          <div className="grid grid-cols-2 gap-4">
            {Object.entries({
              position: 'A',
              color: 'S',
              audio: 'D',
              number: 'F'
            }).map(([type, key]) => (
              <div key={type} className="flex items-center justify-between">
                <span className="capitalize">{type}:</span>
                <kbd className="px-2 py-1.5 text-xs font-semibold text-muted-foreground bg-muted rounded border border-border">
                  {key}
                </kbd>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="p-4 bg-primary/5 rounded-lg">
        <h4 className="font-medium mb-2">Tips</h4>
        <ul className="text-sm text-muted-foreground space-y-1">
          <li>• Start with a lower N-Back level and gradually increase</li>
          <li>• Begin with single or dual N-Back before adding more stimuli</li>
          <li>• Practice regularly for best results</li>
          <li>• Take breaks if you feel mentally fatigued</li>
        </ul>
      </div>
    </div>
  );
}