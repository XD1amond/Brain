import { generateWords, getPremises } from './utils';

// Helper for consistent premise formatting
const createDistinctionPremise = (a, b, comparison) => {
    return `<span class="subject">${a}</span> is ${comparison} <span class="subject">${b}</span>`;
};

const createSamePremise = (a, b) => {
    return createDistinctionPremise(a, b, 'same as');
};

const createOppositePremise = (a, b) => {
    return createDistinctionPremise(a, b, 'opposite of');
};

class DistinctionQuestion {
    constructor() {
        this.buckets = [[], []];
        this.bucketMap = new Map();
        this.neighbors = new Map();
    }

    generate(settings) {
        const premises = getPremises(settings, 'distinction');
        const items = generateWords(premises + 1, settings);
        const questionPremises = [];

        // Initialize first item in bucket 0
        const first = items[0];
        this.bucketMap.set(first, 0);
        this.buckets[0].push(first);
        this.neighbors.set(first, new Set());

        // Generate premises and build relationships
        for (let i = 1; i < items.length; i++) {
            const source = this.pickSourceWord(items[i-1]);
            const target = items[i];
            // Initialize target's neighbors set
            this.neighbors.set(target, new Set());

            // Add bidirectional neighbor relationship
            this.neighbors.get(source).add(target);
            this.neighbors.get(target).add(source);

            if (Math.random() > 0.5) {
                // Same relationship
                questionPremises.push(createSamePremise(source, target));
                const sourceBucket = this.bucketMap.get(source);
                this.bucketMap.set(target, sourceBucket);
                this.buckets[sourceBucket].push(target);
            } else {
                // Opposite relationship
                questionPremises.push(createOppositePremise(source, target));
                const sourceBucket = this.bucketMap.get(source);
                const targetBucket = (sourceBucket + 1) % 2;
                this.bucketMap.set(target, targetBucket);
                this.buckets[targetBucket].push(target);
            }
        }

        // Find two distant items for conclusion
        const [startWord, endWord] = this.findDistantPair(items);
        
        // Randomly decide if conclusion should state actual relationship
        const stateActualRelationship = Math.random() > 0.5;
        
        // Generate conclusion
        const startBucket = this.bucketMap.get(startWord);
        const endBucket = this.bucketMap.get(endWord);
        const areSame = startBucket === endBucket;

        let conclusion;
        if (stateActualRelationship) {
            conclusion = areSame
                ? createSamePremise(startWord, endWord)
                : createOppositePremise(startWord, endWord);
        } else {
            conclusion = areSame
                ? createOppositePremise(startWord, endWord)
                : createSamePremise(startWord, endWord);
        }

        return {
            type: 'distinction',
            category: 'Distinction',
            premises: questionPremises,
            conclusion,
            isValid: stateActualRelationship,
            buckets: this.buckets.map(bucket => Array.from(bucket)),
            relationships: Object.fromEntries(
                Array.from(this.bucketMap).map(([k, v]) => [k, v])
            )
        };
    }

    pickSourceWord(defaultWord) {
        // Prefer words with fewer connections
        const candidates = Array.from(this.neighbors.entries())
            .filter(([_, neighbors]) => neighbors.size < 2)
            .map(([word]) => word);

        if (candidates.length === 0) {
            return defaultWord;
        }

        return candidates[Math.floor(Math.random() * candidates.length)];
    }

    findDistantPair(items) {
        // Try to find items in different buckets
        for (let attempts = 0; attempts < 10; attempts++) {
            const a = items[Math.floor(Math.random() * items.length)];
            const b = items[Math.floor(Math.random() * items.length)];
            
            if (a !== b && this.bucketMap.get(a) !== this.bucketMap.get(b)) {
                return [a, b];
            }
        }

        // Fallback to first and last items
        return [items[0], items[items.length - 1]];
    }
}

export const generateDistinctionQuestion = (settings) => {
    return new DistinctionQuestion().generate(settings);
};