import { generateWords, getPremises } from './utils';

export const generateTemporalQuestion = (settings) => {
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

  const isValid = a < b;
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