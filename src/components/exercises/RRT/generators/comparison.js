import { generateWords, getPremises } from './utils';

// Helper to create a comparison premise statement
const createPremise = (a, b, comparison) => {
  return `<span class="subject">${a}</span> is ${comparison} than <span class="subject">${b}</span>`;
};

// Helper to find two items with sufficient distance between them
const findTwoDistantItems = (items, positions, minDistance = 2) => {
  const maxAttempts = 10;
  let attempts = 0;
  let start, end;

  do {
    start = Math.floor(Math.random() * items.length);
    end = Math.floor(Math.random() * items.length);
    attempts++;
  } while (
    (Math.abs(positions.get(items[end]) - positions.get(items[start])) < minDistance) &&
    attempts < maxAttempts
  );

  if (attempts === maxAttempts) {
    // Find the two items with maximum distance between them
    let maxDist = -1;
    for (let i = 0; i < items.length; i++) {
      for (let j = i + 1; j < items.length; j++) {
        const dist = Math.abs(positions.get(items[j]) - positions.get(items[i]));
        if (dist > maxDist) {
          maxDist = dist;
          start = i;
          end = j;
        }
      }
    }
  }

  return [items[start], items[end]];
};

export const generateComparisonQuestion = (settings) => {
  const premises = getPremises(settings, 'comparison');
  const items = generateWords(premises + 1, settings);
  const questionPremises = [];
  const order = [...items];
  
  // Track relationships between items (greater than relationships)
  const relationships = new Map();
  items.forEach(item => relationships.set(item, new Set()));

  // Helper to check if a is greater than b through any chain
  const isGreaterThan = (a, b, visited = new Set()) => {
    if (relationships.get(a).has(b)) return true;
    if (visited.has(a)) return false;
    
    visited.add(a);
    for (const middle of relationships.get(a)) {
      if (isGreaterThan(middle, b, visited)) return true;
    }
    return false;
  };

  // Generate premises and build relationships
  for (let i = 0; i < items.length - 1; i++) {
    const currentItem = items[i];
    const nextItem = items[i + 1];
    if (Math.random() > 0.5) {
      // Express relationship as "more than" (nextItem > currentItem)
      relationships.get(nextItem).add(currentItem);
      const statement = createPremise(
        nextItem,
        currentItem,
        'more'
      );
      questionPremises.push(statement);
    } else {
      // Express relationship as "less than" (currentItem < nextItem)
      relationships.get(nextItem).add(currentItem);
      const statement = createPremise(
        currentItem,
        nextItem,
        'less'
      );
      questionPremises.push(statement);
    }
  }

  // Find two items for the conclusion
  const [startItem, endItem] = [items[0], items[items.length - 1]];
  
  // Determine the actual relationship
  const endGreaterThanStart = isGreaterThan(endItem, startItem);
  
  // Randomly decide if we want to state the actual relationship or its opposite
  const stateActualRelationship = Math.random() > 0.5;
  
  const conclusion = createPremise(
    startItem,
    endItem,
    stateActualRelationship === endGreaterThanStart ? 'less' : 'more'
  );

  const isValid = stateActualRelationship;

  return {
    type: 'comparison',
    category: 'Comparison',
    premises: questionPremises,
    conclusion,
    isValid,
    order: items,
    relationships: Object.fromEntries([...relationships].map(([k, v]) => [k, Array.from(v)]))
  };
};