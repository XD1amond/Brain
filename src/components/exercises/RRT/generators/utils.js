import { nouns } from '../constants/nouns';
import { adjectives } from '../constants/adjectives';
import { emojis } from '../constants/emojis';

// Word generation utilities
export const generateRandomString = (length = 3) => {
  const chars = 'QWERTYUIOPASDFGHJKLZXCVBNM';
  return Array(length).fill(0).map(() => chars[Math.floor(Math.random() * chars.length)]).join('');
};

export const generateGarbageWord = (length = 3) => {
  const chars = '!@#$%^&*()_+-=[]{}|;:,.<>?/~`';
  return Array(length).fill(0).map(() => chars[Math.floor(Math.random() * chars.length)]).join('');
};

// Utility functions
export const getRandomItem = (array) => array[Math.floor(Math.random() * array.length)];

export const pickUniqueItems = (array, count) => {
  const shuffled = [...array].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
};

export const generateWord = (settings) => {
  const options = [];

  if (settings.useNonsenseWords) {
    options.push(() => generateRandomString(settings.nonsenseWordLength));
  }
  if (settings.useGarbageWords) {
    options.push(() => generateGarbageWord(settings.garbageWordLength));
  }
  if (settings.useMeaningfulWords) {
    if (settings.useNouns) options.push(() => getRandomItem(nouns));
    if (settings.useAdjectives) options.push(() => getRandomItem(adjectives));
  }
  if (settings.useEmoji) {
    options.push(() => getRandomItem(emojis));
  }

  // Default to meaningful words if no options are enabled
  if (options.length === 0) {
    return getRandomItem(nouns);
  }

  const generator = getRandomItem(options);
  return generator();
};

export const generateWords = (count, settings) => {
  const words = [];
  for (let i = 0; i < count; i++) {
    words.push(generateWord(settings));
  }
  return words;
};

// Helper to get premises count for a question type
export const getPremises = (settings, type) => {
  const specificPremises = settings[`${type}Premises`];
  // Use global premises when specific is 0 or null
  return specificPremises > 0 ? specificPremises : settings.globalPremises;
};