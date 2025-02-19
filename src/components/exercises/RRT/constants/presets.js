export const createPreset = (name, settings) => ({
  id: generateShortId(),
  name,
  settings: { ...settings },
  createdAt: Date.now()
});

export const validatePreset = (preset) => {
  if (!preset || typeof preset !== 'object') return false;
  if (!preset.name || typeof preset.name !== 'string') return false;
  if (!preset.settings || typeof preset.settings !== 'object') return false;
  
  // Validate required settings exist
  const requiredSettings = [
    'globalPremises',
    'generalTimer',
    'questionTypes'
  ];
  
  return requiredSettings.every(key => preset.settings.hasOwnProperty(key));
};

// Compressed keys for URL sharing
export const compressedSettings = {
  globalPremises: 'gp',
  generalTimer: 'gt',
  useNonsenseWords: 'nw',
  nonsenseWordLength: 'nl',
  useGarbageWords: 'gw',
  garbageWordLength: 'gl',
  useMeaningfulWords: 'mw',
  useNouns: 'un',
  useAdjectives: 'ua',
  useEmoji: 'ue',
  questionTypes: 'qt',
  distinctionPremises: 'dp',
  distinctionTimer: 'dt',
  comparisonPremises: 'cp',
  comparisonTimer: 'ct',
  temporalPremises: 'tp',
  temporalTimer: 'tt',
  directionPremises: 'drp',
  directionTimer: 'drt',
  direction3DPremises: 'd3p',
  direction3DTimer: 'd3t',
  enableCarouselMode: 'cm',
  randomizeButtons: 'rb',
  buttonNegation: 'bn',
  trueKey: 'tk',
  falseKey: 'fk',
  playPauseKey: 'ppk',
  newQuestionKey: 'nqk'
};

export const generateShortId = (length = 9) => {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    const randomIndex = Math.floor(Math.random() * characters.length);
    result += characters[randomIndex];
  }
  return result;
};

export const sanitizeInput = (value) => {
  if (typeof value === 'string') {
    return value.length < 40 ? value.replace(/<[^>]*>/g, '') : '';
  }
  return value;
};

export const compressSettings = (settings) => {
  const compressed = {};
  // First, create a deep clone of the settings to ensure we capture all properties
  const settingsClone = JSON.parse(JSON.stringify(settings));
  
  for (const [key, value] of Object.entries(settingsClone)) {
    const compressedKey = compressedSettings[key];
    if (compressedKey) {
      compressed[compressedKey] = value;
    }
  }
  return compressed;
};

export const decompressSettings = (compressed) => {
  const decompressed = {};
  const reverseMap = Object.entries(compressedSettings).reduce((acc, [key, value]) => {
    acc[value] = key;
    return acc;
  }, {});
  
  // First, create a deep clone of the compressed settings
  const compressedClone = JSON.parse(JSON.stringify(compressed));
  
  for (const [key, value] of Object.entries(compressedClone)) {
    const originalKey = reverseMap[key];
    if (originalKey) {
      decompressed[originalKey] = value;
    }
  }
  return decompressed;
};