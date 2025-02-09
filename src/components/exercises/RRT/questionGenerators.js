import { nouns, adjectives, emojis, directionNames } from './constants';

// Word generation utilities
const generateRandomString = (length = 3) => {
  const chars = 'QWERTYUIOPASDFGHJKLZXCVBNM';
  return Array(length).fill(0).map(() => chars[Math.floor(Math.random() * chars.length)]).join('');
};

const generateGarbageWord = (length = 3) => {
  const chars = '!@#$%^&*()_+-=[]{}|;:,.<>?/~`';
  return Array(length).fill(0).map(() => chars[Math.floor(Math.random() * chars.length)]).join('');
};

// Utility functions
const getRandomItem = (array) => array[Math.floor(Math.random() * array.length)];
const pickUniqueItems = (array, count) => {
  const shuffled = [...array].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
};

const generateWord = (settings) => {
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

const generateWords = (count, settings) => {
  const words = [];
  for (let i = 0; i < count; i++) {
    words.push(generateWord(settings));
  }
  return words;
};

// Helper to get premises count for a question type
const getPremises = (settings, type) => {
  const specificPremises = settings[`${type}Premises`];
  // Use global premises when specific is 0 or null
  return specificPremises > 0 ? specificPremises : settings.globalPremises;
};

// Question generators
const generateDistinctionQuestion = (settings) => {
  const premises = getPremises(settings, 'distinction');
  const items = generateWords(premises + 1, settings);
  const buckets = [[items[0]], []];
  const questionPremises = [];
  let prevBucket = 0;

  for (let i = 1; i < items.length; i++) {
    if (Math.random() > 0.5) {
      const statement = settings.enableNegation && Math.random() > 0.5
        ? `<span class="subject">${items[i-1]}</span> is <span class="is-negated">opposite of</span> <span class="subject">${items[i]}</span>`
        : `<span class="subject">${items[i-1]}</span> is same as <span class="subject">${items[i]}</span>`;
      questionPremises.push(statement);
      buckets[prevBucket].push(items[i]);
    } else {
      const statement = settings.enableNegation && Math.random() > 0.5
        ? `<span class="subject">${items[i-1]}</span> is <span class="is-negated">same as</span> <span class="subject">${items[i]}</span>`
        : `<span class="subject">${items[i-1]}</span> is opposite of <span class="subject">${items[i]}</span>`;
      questionPremises.push(statement);
      prevBucket = (prevBucket + 1) % 2;
      buckets[prevBucket].push(items[i]);
    }
  }

  const isValid = buckets[0].includes(items[items.length - 1]);
  const conclusion = settings.enableNegation && Math.random() > 0.5
    ? `<span class="subject">${items[0]}</span> is <span class="is-negated">${isValid ? 'opposite of' : 'same as'}</span> <span class="subject">${items[items.length - 1]}</span>`
    : `<span class="subject">${items[0]}</span> is ${isValid ? 'same as' : 'opposite of'} <span class="subject">${items[items.length - 1]}</span>`;

  return {
    type: 'distinction',
    category: 'Distinction',
    premises: questionPremises,
    conclusion,
    isValid,
    buckets
  };
};

const generateComparisonQuestion = (settings) => {
  const premises = getPremises(settings, 'comparison');
  const items = generateWords(premises + 1, settings);
  const questionPremises = [];
  const order = [...items];
  
  for (let i = 0; i < items.length - 1; i++) {
    if (Math.random() > 0.5) {
      const statement = settings.enableNegation && Math.random() > 0.5
        ? `<span class="subject">${items[i+1]}</span> is <span class="is-negated">less</span> than <span class="subject">${items[i]}</span>`
        : `<span class="subject">${items[i+1]}</span> is more than <span class="subject">${items[i]}</span>`;
      questionPremises.push(statement);
    } else {
      const statement = settings.enableNegation && Math.random() > 0.5
        ? `<span class="subject">${items[i]}</span> is <span class="is-negated">more</span> than <span class="subject">${items[i+1]}</span>`
        : `<span class="subject">${items[i]}</span> is less than <span class="subject">${items[i+1]}</span>`;
      questionPremises.push(statement);
    }
  }

  const a = Math.floor(Math.random() * items.length);
  let b = Math.floor(Math.random() * items.length);
  while (a === b) b = Math.floor(Math.random() * items.length);

  const isValid = settings.comparison180Mode ? (a > b) : (a < b);
  const conclusion = settings.enableNegation && Math.random() > 0.5
    ? `<span class="subject">${items[a]}</span> is <span class="is-negated">${isValid ? 'more' : 'less'}</span> than <span class="subject">${items[b]}</span>`
    : `<span class="subject">${items[a]}</span> is ${isValid ? 'less' : 'more'} than <span class="subject">${items[b]}</span>`;

  return {
    type: 'comparison',
    category: 'Comparison',
    premises: questionPremises,
    conclusion,
    isValid,
    order
  };
};

const generateTemporalQuestion = (settings) => {
  const premises = getPremises(settings, 'temporal');
  const items = generateWords(premises + 1, settings);
  const questionPremises = [];
  const timeline = [...items];

  for (let i = 0; i < items.length - 1; i++) {
    if (Math.random() > 0.5) {
      const statement = settings.enableNegation && Math.random() > 0.5
        ? `<span class="subject">${items[i+1]}</span> is <span class="is-negated">before</span> <span class="subject">${items[i]}</span>`
        : `<span class="subject">${items[i+1]}</span> is after <span class="subject">${items[i]}</span>`;
      questionPremises.push(statement);
    } else {
      const statement = settings.enableNegation && Math.random() > 0.5
        ? `<span class="subject">${items[i]}</span> is <span class="is-negated">after</span> <span class="subject">${items[i+1]}</span>`
        : `<span class="subject">${items[i]}</span> is before <span class="subject">${items[i+1]}</span>`;
      questionPremises.push(statement);
    }
  }

  const a = Math.floor(Math.random() * items.length);
  let b = Math.floor(Math.random() * items.length);
  while (a === b) b = Math.floor(Math.random() * items.length);

  const isValid = settings.temporal180Mode ? (a > b) : (a < b);
  const conclusion = settings.enableNegation && Math.random() > 0.5
    ? `<span class="subject">${items[a]}</span> is <span class="is-negated">${isValid ? 'after' : 'before'}</span> <span class="subject">${items[b]}</span>`
    : `<span class="subject">${items[a]}</span> is ${isValid ? 'before' : 'after'} <span class="subject">${items[b]}</span>`;

  return {
    type: 'temporal',
    category: 'Temporal',
    premises: questionPremises,
    conclusion,
    isValid,
    timeline
  };
};

const generateDirectionQuestion = (settings, dimension = '2d') => {
  const premises = getPremises(settings, dimension === '2d' ? 'direction' : 'direction3D');
  const items = generateWords(premises + 1, settings);
  const questionPremises = [];
  const directions = directionNames[dimension];
  
  const positions = new Map();
  positions.set(items[0], [0, 0, 0]);

  for (let i = 0; i < items.length - 1; i++) {
    const direction = getRandomItem(directions);
    const currentPos = positions.get(items[i]);
    const newPos = [...currentPos];
    
    // Update position based on direction
    switch(direction.toLowerCase()) {
      case 'north': newPos[1]++; break;
      case 'south': newPos[1]--; break;
      case 'east': newPos[0]++; break;
      case 'west': newPos[0]--; break;
      case 'above': newPos[2]++; break;
      case 'below': newPos[2]--; break;
    }
    
    positions.set(items[i + 1], newPos);
    
    const statement = settings.enableNegation && Math.random() > 0.5
      ? `<span class="subject">${items[i+1]}</span> is <span class="is-negated">${direction}</span> of <span class="subject">${items[i]}</span>`
      : `<span class="subject">${items[i+1]}</span> is ${direction} of <span class="subject">${items[i]}</span>`;
    questionPremises.push(statement);
  }

  // Generate conclusion
  const start = positions.get(items[0]);
  const end = positions.get(items[items.length - 1]);
  let conclusionDirection = '';
  
  // Determine the overall direction
  if (Math.abs(end[0] - start[0]) > Math.abs(end[1] - start[1])) {
    conclusionDirection = end[0] > start[0] ? 'East' : 'West';
  } else {
    conclusionDirection = end[1] > start[1] ? 'North' : 'South';
  }

  const isValid = Math.random() > 0.5;
  const conclusion = settings.enableNegation && Math.random() > 0.5
    ? `<span class="subject">${items[0]}</span> is <span class="is-negated">${isValid ? conclusionDirection : 'opposite'}</span> of <span class="subject">${items[items.length - 1]}</span>`
    : `<span class="subject">${items[0]}</span> is ${isValid ? conclusionDirection : 'opposite'} of <span class="subject">${items[items.length - 1]}</span>`;

  return {
    type: dimension === '2d' ? 'direction' : 'direction3D',
    category: `Space ${dimension.toUpperCase()}`,
    premises: questionPremises,
    conclusion,
    isValid,
    positions
  };
};

export const generateQuestion = (settings) => {
  const enabledTypes = Object.entries(settings.questionTypes)
    .filter(([_, enabled]) => enabled)
    .map(([type]) => type);

  if (enabledTypes.length === 0) {
    throw new Error('No question types enabled');
  }

  const type = getRandomItem(enabledTypes);
  const question = (() => {
    switch (type) {
      case 'distinction':
        return generateDistinctionQuestion(settings);
      case 'comparison':
        return generateComparisonQuestion(settings);
      case 'temporal':
        return generateTemporalQuestion(settings);
      case 'direction':
        return generateDirectionQuestion(settings, '2d');
      case 'direction3D':
        return generateDirectionQuestion(settings, '3d');
      default:
        return generateDistinctionQuestion(settings);
    }
  })();

  // Add creation timestamp
  question.createdAt = Date.now();
  
  return question;
};