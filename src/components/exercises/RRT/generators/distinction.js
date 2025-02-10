import { generateWords, getPremises } from './utils';

export const generateDistinctionQuestion = (settings) => {
  const premises = getPremises(settings, 'distinction');
  const items = generateWords(premises + 1, settings);
  const relationships = new Map();
  const questionPremises = [];

  // Initialize relationships for all items
  items.forEach(item => {
    relationships.set(item, new Map());
  });

  // Helper to update relationships transitively
  const updateRelationships = (item1, item2, isSame) => {
    const processedPairs = new Set();

    const propagateRelation = (from, to, relation) => {
      const key = `${from}-${to}`;
      if (processedPairs.has(key)) return;
      processedPairs.add(key);
      processedPairs.add(`${to}-${from}`);

      // Set the relationship both ways
      relationships.get(from).set(to, relation);
      relationships.get(to).set(from, relation);

      // Propagate to all items related to 'to'
      relationships.get(to).forEach((existingRelation, relatedItem) => {
        if (relatedItem !== from) {
          const newRelation = existingRelation === relation;
          propagateRelation(from, relatedItem, newRelation);
        }
      });

      // Propagate to all items related to 'from'
      relationships.get(from).forEach((existingRelation, relatedItem) => {
        if (relatedItem !== to) {
          const newRelation = existingRelation === relation;
          propagateRelation(to, relatedItem, newRelation);
        }
      });
    };

    propagateRelation(item1, item2, isSame);
  };

  // Set each item as same as itself
  items.forEach(item => {
    relationships.get(item).set(item, true);
  });

  for (let i = 1; i < items.length; i++) {
    const isSameRelation = Math.random() > 0.5;
    const useNegation = settings.enableNegation && Math.random() > 0.5;
    const effectiveRelation = useNegation ? !isSameRelation : isSameRelation;

    // Create the premise statement
    const statement = useNegation
      ? `<span class="subject">${items[i-1]}</span> is <span class="is-negated">${isSameRelation ? 'opposite of' : 'same as'}</span> <span class="subject">${items[i]}</span>`
      : `<span class="subject">${items[i-1]}</span> is ${isSameRelation ? 'same as' : 'opposite of'} <span class="subject">${items[i]}</span>`;
    questionPremises.push(statement);

    // Update relationships
    updateRelationships(items[i-1], items[i], effectiveRelation);
  }

  // Get the actual relationship between first and last items
  const actualRelation = relationships.get(items[0]).get(items[items.length - 1]) || false;
  
  // Randomly decide what the conclusion will state
  const statesSameAs = Math.random() > 0.5;
  const useNegation = settings.enableNegation && Math.random() > 0.5;
  
  // If the conclusion states "same as" (or negated "opposite of"),
  // then it's valid when that matches the actual relation
  const isValid = useNegation ? (statesSameAs !== actualRelation) : (statesSameAs === actualRelation);
  
  const conclusion = useNegation
    ? `<span class="subject">${items[0]}</span> is <span class="is-negated">${statesSameAs ? 'opposite of' : 'same as'}</span> <span class="subject">${items[items.length - 1]}</span>`
    : `<span class="subject">${items[0]}</span> is ${statesSameAs ? 'same as' : 'opposite of'} <span class="subject">${items[items.length - 1]}</span>`;

  return {
    type: 'distinction',
    category: 'Distinction',
    premises: questionPremises,
    conclusion,
    isValid,
    relationships: Object.fromEntries([...relationships].map(([k, v]) => [k, Object.fromEntries(v)]))
  };
};