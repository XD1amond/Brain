import { generateWords, getPremises, getRandomItem } from './utils';
import { directionNames } from '../constants/directions';

export const generateDirectionQuestion = (settings, dimension = '2d') => {
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