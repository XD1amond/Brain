import { getRandomItem } from './utils';
import { generateDistinctionQuestion } from './distinction';
import { generateComparisonQuestion } from './comparison';
import { generateTemporalQuestion } from './temporal';
import { generateDirectionQuestion } from './direction';

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

export {
  generateDistinctionQuestion,
  generateComparisonQuestion,
  generateTemporalQuestion,
  generateDirectionQuestion,
};