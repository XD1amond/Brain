import { generateWords, getPremises } from './utils';

// Helper to create a temporal premise statement
const createPremise = (a, b, comparison) => {
  return `<span class="subject">${a}</span> is ${comparison} <span class="subject">${b}</span>`;
};

// Helper to find two items with sufficient distance between them
const findTwoDistantItems = (items, minDistance = 2) => {
  const maxAttempts = 10;
  let attempts = 0;
  let start, end;

  do {
    start = Math.floor(Math.random() * items.length);
    end = Math.floor(Math.random() * items.length);
    attempts++;
  } while (Math.abs(end - start) < minDistance && attempts < maxAttempts);

  if (attempts === maxAttempts) {
    start = 0;
    end = items.length - 1;
  }

  return [start, end];
};

export const generateTemporalQuestion = (settings) => {
  const premises = getPremises(settings, 'temporal');
  const items = generateWords(premises + 1, settings);
  const questionPremises = [];
  const timeline = [...items];
  
  // Track relationships between items (after relationships)
  const relationships = new Map();
  items.forEach(item => relationships.set(item, new Set()));

  // Helper to check if a is after b through any chain
  const isAfter = (a, b, visited = new Set()) => {
    if (relationships.get(a).has(b)) return true;
    if (visited.has(a)) return false;
    
    visited.add(a);
    for (const middle of relationships.get(a)) {
      if (isAfter(middle, b, visited)) return true;
    }
    return false;
  };

  // Generate premises and build relationships
  for (let i = 0; i < items.length - 1; i++) {
    const currentItem = items[i];
    const nextItem = items[i + 1];
    if (Math.random() > 0.5) {
      // Express relationship as "after" (nextItem after currentItem)
      relationships.get(nextItem).add(currentItem);
      const statement = createPremise(
        nextItem,
        currentItem,
        'after'
      );
      questionPremises.push(statement);
    } else {
      // Express relationship as "before" (currentItem before nextItem)
      relationships.get(nextItem).add(currentItem);
      const statement = createPremise(
        currentItem,
        nextItem,
        'before'
      );
      questionPremises.push(statement);
    }
  }

  // Find two items for the conclusion
  const [startItem, endItem] = [items[0], items[items.length - 1]];
  
  // Determine the actual relationship
  const endAfterStart = isAfter(endItem, startItem);
  
  // Randomly decide if we want to state the actual relationship or its opposite
  const stateActualRelationship = Math.random() > 0.5;
  
  const conclusion = createPremise(
    startItem,
    endItem,
    stateActualRelationship === endAfterStart ? 'before' : 'after'
  );

  return {
    type: 'temporal',
    category: 'Temporal',
    premises: questionPremises,
    conclusion,
    isValid: stateActualRelationship,
    timeline: items,
    relationships: Object.fromEntries([...relationships].map(([k, v]) => [k, Array.from(v)]))
  };
};