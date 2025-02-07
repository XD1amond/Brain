// Word banks for generating questions
const nouns = [
  'cat', 'dog', 'bird', 'fish', 'tree', 'book', 'car', 'house',
  'phone', 'computer', 'chair', 'table', 'door', 'window', 'person',
  'student', 'teacher', 'doctor', 'artist', 'musician'
];

const directions2D = ['left', 'right', 'above', 'below'];
const directions3D = ['in front of', 'behind', 'above', 'below', 'left of', 'right of'];
const directions4D = ['before', 'after', 'above', 'below', 'left of', 'right of', 'in front of', 'behind'];

// Utility functions
const getRandomItem = (array) => array[Math.floor(Math.random() * array.length)];
const getRandomItems = (array, count) => {
  const shuffled = [...array].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
};

// Question generators for different types
const generateDistinctionQuestion = (numPremises) => {
  const items = getRandomItems(nouns, numPremises + 1);
  const premises = [];
  const relationships = [];
  
  for (let i = 0; i < numPremises - 1; i++) {
    const isSame = Math.random() < 0.5;
    relationships.push(isSame);
    premises.push(`${items[i]} is ${isSame ? 'the same as' : 'different from'} ${items[i + 1]}`);
  }
  
  const lastRelationship = Math.random() < 0.5;
  relationships.push(lastRelationship);
  premises.push(`${items[numPremises - 1]} is ${lastRelationship ? 'the same as' : 'different from'} ${items[numPremises]}`);
  
  // Calculate if the conclusion is valid based on the chain of relationships
  const isValid = relationships.reduce((acc, curr) => acc === curr, true);
  
  return {
    type: 'distinction',
    premises,
    conclusion: `${items[0]} is ${isValid ? 'the same as' : 'different from'} ${items[numPremises]}`,
    isValid: true
  };
};

const generateTemporalQuestion = (numPremises) => {
  const events = getRandomItems(nouns.map(n => `the ${n}`), numPremises + 1);
  const premises = [];
  
  for (let i = 0; i < numPremises; i++) {
    premises.push(`${events[i]} happened before ${events[i + 1]}`);
  }
  
  const isValid = Math.random() < 0.5;
  const conclusion = isValid
    ? `${events[0]} happened before ${events[numPremises]}`
    : `${events[numPremises]} happened before ${events[0]}`;
  
  return {
    type: 'temporal',
    premises,
    conclusion,
    isValid
  };
};

const generateDirectionQuestion = (numPremises, dimensionType = '2d') => {
  const items = getRandomItems(nouns, numPremises + 1);
  const premises = [];
  const directions = dimensionType === '4d' ? directions4D : 
                    dimensionType === '3d' ? directions3D : 
                    directions2D;
  
  const relationships = [];
  for (let i = 0; i < numPremises; i++) {
    const direction = getRandomItem(directions);
    relationships.push(direction);
    premises.push(`${items[i]} is ${direction} ${items[i + 1]}`);
  }
  
  // For valid conclusions in spatial reasoning
  const isValid = Math.random() < 0.5;
  let conclusion;
  
  if (isValid) {
    // Create a valid spatial relationship conclusion
    if (relationships[0].includes('left') && relationships[1].includes('left')) {
      conclusion = `${items[0]} is left of ${items[2]}`;
    } else if (relationships[0].includes('above') && relationships[1].includes('above')) {
      conclusion = `${items[0]} is above ${items[2]}`;
    } else {
      conclusion = `${items[0]} is ${relationships[0]} ${items[2]}`;
    }
  } else {
    // Create an invalid spatial relationship conclusion
    const oppositeDirection = direction => {
      if (direction.includes('left')) return 'right of';
      if (direction.includes('right')) return 'left of';
      if (direction.includes('above')) return 'below';
      if (direction.includes('below')) return 'above';
      if (direction.includes('front')) return 'behind';
      if (direction.includes('behind')) return 'in front of';
      if (direction === 'before') return 'after';
      return 'before';
    };
    conclusion = `${items[0]} is ${oppositeDirection(relationships[0])} ${items[2]}`;
  }
  
  return {
    type: `direction${dimensionType.toUpperCase()}`,
    premises,
    conclusion,
    isValid
  };
};

const generateSyllogismQuestion = (numPremises) => {
  const categories = getRandomItems(nouns, numPremises + 1);
  const premises = [];
  const allStatements = Math.random() < 0.5;
  
  for (let i = 0; i < numPremises; i++) {
    if (allStatements) {
      premises.push(`All ${categories[i]}s are ${categories[i + 1]}s`);
    } else {
      premises.push(`Some ${categories[i]}s are ${categories[i + 1]}s`);
    }
  }
  
  const isValid = allStatements && Math.random() < 0.5;
  const conclusion = isValid
    ? `All ${categories[0]}s are ${categories[numPremises]}s`
    : `No ${categories[0]}s are ${categories[numPremises]}s`;
  
  return {
    type: 'syllogism',
    premises,
    conclusion,
    isValid
  };
};

const generateAnalogicalQuestion = (numPremises) => {
  const items = getRandomItems(nouns, numPremises * 2);
  const premises = [];
  const relationship = Math.random() < 0.5 ? 'similar to' : 'opposite of';
  
  for (let i = 0; i < numPremises - 1; i++) {
    premises.push(`${items[i * 2]} is to ${items[i * 2 + 1]} as ${items[(i + 1) * 2]} is to ${items[(i + 1) * 2 + 1]}`);
  }
  
  const isValid = Math.random() < 0.5;
  const conclusion = `${items[0]} is ${relationship} ${items[items.length - 1]}`;
  
  return {
    type: 'analogy',
    premises,
    conclusion,
    isValid
  };
};

export const generateQuestion = (settings) => {
  const { premises, questionTypes } = settings;
  const enabledTypes = Object.entries(questionTypes)
    .filter(([_, enabled]) => enabled)
    .map(([type]) => type);
  
  if (enabledTypes.length === 0) {
    throw new Error('No question types enabled');
  }
  
  const questionType = getRandomItem(enabledTypes);
  
  switch (questionType) {
    case 'distinction':
      return generateDistinctionQuestion(premises);
    case 'temporal':
      return generateTemporalQuestion(premises);
    case 'direction':
      return generateDirectionQuestion(premises, '2d');
    case 'direction3D':
      return generateDirectionQuestion(premises, '3d');
    case 'direction4D':
      return generateDirectionQuestion(premises, '4d');
    case 'syllogism':
      return generateSyllogismQuestion(premises);
    case 'analogy':
      return generateAnalogicalQuestion(premises);
    default:
      return generateDistinctionQuestion(premises);
  }
};