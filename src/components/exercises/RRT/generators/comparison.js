import { generateWords, getPremises } from './utils';

export const generateComparisonQuestion = (settings) => {
  const premises = getPremises(settings, 'comparison');
  const items = generateWords(premises + 1, settings);
  const questionPremises = [];
  const order = [...items];
  const relationships = new Map();

  // Initialize relationships map
  items.forEach(item => {
    relationships.set(item, new Set());
  });

  // Helper to check if establishing this relationship would create a contradiction
  const wouldCreateContradiction = (greater, lesser) => {
    // If lesser > greater already exists (directly or transitively), this would be a contradiction
    return isGreaterThan(lesser, greater, new Set());
  };

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

  // Helper to update relationships
  const updateRelationships = (greater, lesser, force = false) => {
    // If force is true, add the relationship regardless of contradictions
    if (force) {
      relationships.get(greater).add(lesser);
      return true;
    }

    // Check for contradictions before adding
    if (wouldCreateContradiction(greater, lesser)) {
      // If this would create a contradiction, try reversing the relationship
      if (!wouldCreateContradiction(lesser, greater)) {
        relationships.get(lesser).add(greater);
        return true;
      }
      // If both directions would create contradictions, skip this relationship
      return false;
    }
    // Only store direct relationships
    relationships.get(greater).add(lesser);
    return true;
  };

  // Helper to find two items with an established relationship path
  const findConnectedPair = () => {
    for (let i = 0; i < items.length; i++) {
      for (let j = i + 1; j < items.length; j++) {
        const a = items[i];
        const b = items[j];
        if (isGreaterThan(a, b) || isGreaterThan(b, a)) {
          return [a, b];
        }
      }
    }
    return [items[0], items[1]]; // Fallback to first two items if no path found
  };

  // Generate premises and build relationships
  for (let i = 0; i < items.length - 1; i++) {
    let statement;
    let relationshipEstablished = false;
    let attempts = 0;
    const maxAttempts = 4;

    while (!relationshipEstablished && attempts < maxAttempts) {
      const useNegation = settings.enableNegation && Math.random() > 0.5;
      const reverseOrder = Math.random() > 0.5;

      const a = items[i];
      const b = items[i+1];
      let greater, lesser;

      if (useNegation) {
        if (reverseOrder) {
          // "B is NOT less than A" means B > A
          greater = b;
          lesser = a;
          if (updateRelationships(greater, lesser)) {
            statement = `<span class="subject">${b}</span> is <span class="is-negated">less</span> than <span class="subject">${a}</span>`;
            relationshipEstablished = true;
          }
        } else {
          // "A is NOT more than B" means B > A
          greater = b;
          lesser = a;
          if (updateRelationships(greater, lesser)) {
            statement = `<span class="subject">${a}</span> is <span class="is-negated">more</span> than <span class="subject">${b}</span>`;
            relationshipEstablished = true;
          }
        }
      } else {
        if (reverseOrder) {
          // "B is more than A" means B > A
          greater = b;
          lesser = a;
          if (updateRelationships(greater, lesser)) {
            statement = `<span class="subject">${b}</span> is more than <span class="subject">${a}</span>`;
            relationshipEstablished = true;
          }
        } else {
          // "A is less than B" means B > A
          greater = b;
          lesser = a;
          if (updateRelationships(greater, lesser)) {
            statement = `<span class="subject">${a}</span> is less than <span class="subject">${b}</span>`;
            relationshipEstablished = true;
          }
        }
      }
      attempts++;
    }

    // If we couldn't establish a valid relationship after max attempts,
    // just pick one direction and force it
    if (!relationshipEstablished) {
      updateRelationships(items[i+1], items[i], true);
      statement = `<span class="subject">${items[i]}</span> is less than <span class="subject">${items[i+1]}</span>`;
    }
    questionPremises.push(statement);
  }

  // Select two items that have an established relationship path
  const [a, b] = findConnectedPair();

  // Determine if b is greater than a through any chain of relationships
  const bGreaterThanA = isGreaterThan(b, a);
  const aGreaterThanB = isGreaterThan(a, b);
  
  // If neither has a relationship to the other, force one
  if (!bGreaterThanA && !aGreaterThanB) {
    updateRelationships(b, a, true);
  }

  const useNegation = settings.enableNegation && Math.random() > 0.5;
  const reverseConclusion = Math.random() > 0.5;

  let conclusion;
  if (reverseConclusion) {
    conclusion = useNegation
      ? `<span class="subject">${a}</span> is <span class="is-negated">${bGreaterThanA ? 'more' : 'less'}</span> than <span class="subject">${b}</span>`
      : `<span class="subject">${a}</span> is ${bGreaterThanA ? 'less' : 'more'} than <span class="subject">${b}</span>`;
  } else {
    conclusion = useNegation
      ? `<span class="subject">${b}</span> is <span class="is-negated">${bGreaterThanA ? 'less' : 'more'}</span> than <span class="subject">${a}</span>`
      : `<span class="subject">${b}</span> is ${bGreaterThanA ? 'more' : 'less'} than <span class="subject">${a}</span>`;
  }

  return {
    type: 'comparison',
    category: 'Comparison',
    premises: questionPremises,
    conclusion,
    isValid: reverseConclusion ? !bGreaterThanA : bGreaterThanA,
    order,
    relationships: Object.fromEntries([...relationships].map(([k, v]) => [k, Array.from(v)]))
  };
};