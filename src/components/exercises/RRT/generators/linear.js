import { generateWords, getPremises } from './utils';

// Helper for consistent premise formatting
const createLinearPremise = (a, b, comparison, reverseComparison, useNegation = false) => {
    const statement = useNegation
        ? `<span class="subject">${a}</span> is <span class="is-negated">${reverseComparison}</span> <span class="subject">${b}</span>`
        : `<span class="subject">${a}</span> is ${comparison} <span class="subject">${b}</span>`;
    return statement;
};

// Helper to find two sufficiently distant words
const findTwoDistantWords = (words, minDistance = 2) => {
    const maxAttempts = 10;
    let attempts = 0;
    let start, end;

    do {
        start = Math.floor(Math.random() * words.length);
        end = Math.floor(Math.random() * words.length);
        attempts++;
    } while (Math.abs(end - start) < minDistance && attempts < maxAttempts);

    if (attempts === maxAttempts) {
        start = 0;
        end = words.length - 1;
    }

    return [words[start], words[end]];
};

class MoreLess {
    createLinearPremise(a, b, useNegation = false) {
        if (Math.random() > 0.5) {
            return createLinearPremise(a, b, 'less than', 'more than', useNegation);
        } else {
            return createLinearPremise(b, a, 'more than', 'less than', useNegation);
        }
    }

    createReverseLinearPremise(a, b, useNegation = false) {
        if (Math.random() > 0.5) {
            return createLinearPremise(a, b, 'more than', 'less than', useNegation);
        } else {
            return createLinearPremise(b, a, 'less than', 'more than', useNegation);
        }
    }

    getName() {
        return 'Comparison';
    }
}

class BeforeAfter {
    createLinearPremise(a, b, useNegation = false) {
        if (Math.random() > 0.5) {
            return createLinearPremise(a, b, 'before', 'after', useNegation);
        } else {
            return createLinearPremise(b, a, 'after', 'before', useNegation);
        }
    }

    createReverseLinearPremise(a, b, useNegation = false) {
        if (Math.random() > 0.5) {
            return createLinearPremise(a, b, 'after', 'before', useNegation);
        } else {
            return createLinearPremise(b, a, 'before', 'after', useNegation);
        }
    }

    getName() {
        return 'Temporal';
    }
}

class LinearQuestion {
    constructor(generator) {
        this.generator = generator;
    }

    createQuestion(settings) {
        const premises = getPremises(settings, this.generator.getName().toLowerCase());
        const items = generateWords(premises + 1, settings);
        const questionPremises = [];
        
        // Track relative positions
        const positions = new Map();
        items.forEach((item, index) => positions.set(item, index));

        // Generate premises
        for (let i = 0; i < items.length - 1; i++) {
            const currentItem = items[i];
            const nextItem = items[i + 1];
            const useNegation = settings.enableNegation && Math.random() > 0.5;
            
            if (Math.random() > 0.5) {
                questionPremises.push(
                    this.generator.createLinearPremise(currentItem, nextItem, useNegation)
                );
            } else {
                questionPremises.push(
                    this.generator.createReverseLinearPremise(nextItem, currentItem, useNegation)
                );
            }
        }

        // Find two distant items for conclusion
        const [startItem, endItem] = findTwoDistantWords(items);
        const startPos = positions.get(startItem);
        const endPos = positions.get(endItem);
        
        // Randomly decide if conclusion should be valid
        const stateActualRelationship = Math.random() > 0.5;
        const useNegation = settings.enableNegation && Math.random() > 0.5;

        let conclusion;
        if (stateActualRelationship) {
            conclusion = startPos < endPos
                ? this.generator.createLinearPremise(startItem, endItem, useNegation)
                : this.generator.createReverseLinearPremise(endItem, startItem, useNegation);
        } else {
            conclusion = startPos < endPos
                ? this.generator.createReverseLinearPremise(startItem, endItem, useNegation)
                : this.generator.createLinearPremise(endItem, startItem, useNegation);
        }

        return {
            type: this.generator.getName().toLowerCase(),
            category: this.generator.getName(),
            premises: questionPremises,
            conclusion,
            isValid: stateActualRelationship,
            positions: Object.fromEntries(positions)
        };
    }
}

export const generateComparisonQuestion = (settings) => {
    return new LinearQuestion(new MoreLess()).createQuestion(settings);
};

export const generateTemporalQuestion = (settings) => {
    return new LinearQuestion(new BeforeAfter()).createQuestion(settings);
};