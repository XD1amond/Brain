import { generateWords, getPremises } from './utils';
import { directionNames } from '../constants/directions';
import IncorrectDirections from './incorrect-directions';

// Helper functions for coordinate manipulation
const diffCoords = (a, b) => b.map((c, i) => c - a[i]);
const addCoords = (a, b) => a.map((c, i) => c + b[i]);
const normalize = (a) => a.map(c => c/Math.abs(c) || 0);
const inverse = (a) => a.map(c => -c);

// Helper to find direction between two points
const findDirection = (a, b) => normalize(diffCoords(a, b));

// Helper to create a direction statement with proper grammar
const createDirectionStatement = (source, target, direction, isNegated = false) => {
    const isVertical = direction.toLowerCase().startsWith('above') || direction.toLowerCase().startsWith('below');
    let directionElement = direction;
    if (isNegated) {
        directionElement = `<span class="is-negated">${direction}</span>`;
    }
    
    if (isVertical) {
        return `<span class="subject">${source}</span> is ${directionElement} <span class="subject">${target}</span>`;
    } else {
        return `<span class="subject">${source}</span> is ${directionElement} of <span class="subject">${target}</span>`;
    }
};

// Helper to calculate taxicab distance between two points
const taxicabDistance = (a, b) => {
    return a.map((v,i) => Math.abs(b[i] - v)).reduce((left,right) => left + right);
};

// Helper to pick a weighted random direction based on neighbor distances
const pickWeightedRandomDirection = (dirCoords, baseWord, neighbors, wordCoordMap) => {
    const base = wordCoordMap[baseWord];
    const existingNeighbors = (neighbors[baseWord] ?? []).map(word => wordCoordMap[word]);
    
    let pool = [];
    for (const dirCoord of dirCoords) {
        const endLocation = dirCoord.map((d,i) => d + base[i]);
        const distanceToClosest = existingNeighbors
            .map(neighbor => taxicabDistance(neighbor, endLocation))
            .reduce((a,b) => Math.min(a,b), 999);
            
        // Weight directions based on distance to existing neighbors
        if (distanceToClosest === 0) {
            pool.push(dirCoord);
        } else if (distanceToClosest === 1) {
            pool.push(dirCoord, dirCoord, dirCoord, dirCoord, dirCoord);
        } else if (distanceToClosest === 2) {
            pool.push(dirCoord, dirCoord, dirCoord);
        } else if (distanceToClosest === 3) {
            pool.push(dirCoord, dirCoord);
        } else {
            pool.push(dirCoord);
        }
    }
    
    return pool[Math.floor(Math.random() * pool.length)];
};

class Direction2D {
    constructor() {
        this.directions = directionNames['2d'];
        this.dirCoords = [
            [0, 0, 0],    // origin
            [1, 0, 0],    // east
            [-1, 0, 0],   // west
            [0, 1, 0],    // north
            [0, -1, 0],   // south
            [1, 1, 0],    // north-east
            [-1, 1, 0],   // north-west
            [1, -1, 0],   // south-east
            [-1, -1, 0]   // south-west
        ];
    }

    initialCoord() {
        return [0, 0, 0];
    }

    coordToDirection(coord) {
        if (coord[0] === 1 && coord[1] === 1) return 'North-East';
        if (coord[0] === -1 && coord[1] === 1) return 'North-West';
        if (coord[0] === 1 && coord[1] === -1) return 'South-East';
        if (coord[0] === -1 && coord[1] === -1) return 'South-West';
        if (coord[0] === 1) return 'East';
        if (coord[0] === -1) return 'West';
        if (coord[1] === 1) return 'North';
        if (coord[1] === -1) return 'South';
        return '';
    }

    pickDirection(baseWord, neighbors, wordCoordMap) {
        return pickWeightedRandomDirection(this.dirCoords.slice(1), baseWord, neighbors, wordCoordMap);
    }
}

class Direction3D extends Direction2D {
    constructor() {
        super();
        this.directions = directionNames['3d'];
        // In 3D space:
        // x: east(+)/west(-)
        // y: north(+)/south(-)
        // z: above(+)/below(-)
        this.dirCoords = [
            [0, 0, 0],    // origin
            [1, 0, 0],    // east
            [-1, 0, 0],   // west
            [0, 1, 0],    // north
            [0, -1, 0],   // south
            [1, 1, 0],    // north-east
            [-1, 1, 0],   // north-west
            [1, -1, 0],   // south-east
            [-1, -1, 0],  // south-west
            [0, 0, 1],    // above
            [0, 0, -1]    // below
        ];
    }

    coordToDirection(coord) {
        // Handle vertical direction first
        if (coord[2] === 1) return 'Above';
        if (coord[2] === -1) return 'Below';
        
        // Then handle horizontal directions
        if (coord[0] === 0 && coord[1] === 0) return '';
        
        // For horizontal movement, use 2D directions
        const horizontalCoord = [coord[0], coord[1], 0];
        return super.coordToDirection(horizontalCoord);
    }

    pickDirection(baseWord, neighbors, wordCoordMap) {
        // For 3D questions, we want to encourage some vertical movement
        const hasVerticalNeighbor = (neighbors[baseWord] ?? [])
            .some(word => {
                const diff = diffCoords(wordCoordMap[baseWord], wordCoordMap[word]);
                return diff[2] !== 0;
            });

        // If no vertical neighbors yet, increase chance of vertical movement
        if (!hasVerticalNeighbor && Math.random() < 0.3) {
            return this.dirCoords[Math.random() < 0.5 ? 9 : 10]; // above or below
        }

        return pickWeightedRandomDirection(this.dirCoords.slice(1), baseWord, neighbors, wordCoordMap);
    }
}

class DirectionQuestion {
    constructor(directionGenerator) {
        this.generator = directionGenerator;
        this.incorrectDirections = new IncorrectDirections();
    }

    createQuestion(settings, dimension = '2d') {
        const premises = getPremises(settings, dimension === '2d' ? 'direction' : 'direction3D');
        const items = generateWords(premises + 1, settings);
        const questionPremises = [];
        
        // Track word coordinates and neighbors
        const wordCoordMap = { [items[0]]: this.generator.initialCoord() };
        const neighbors = { [items[0]]: [] };
        const usedDirCoords = [];
        
        // Generate premises
        for (let i = 0; i < items.length - 1; i++) {
            const currentItem = items[i];
            const nextItem = items[i + 1];
            
            // Pick direction and update coordinates
            const dirCoord = this.generator.pickDirection(currentItem, neighbors, wordCoordMap);
            wordCoordMap[nextItem] = addCoords(wordCoordMap[currentItem], dirCoord);
            usedDirCoords.push(dirCoord);
            
            // Update neighbor relationships
            neighbors[currentItem] = neighbors[currentItem] || [];
            neighbors[currentItem].push(nextItem);
            neighbors[nextItem] = neighbors[nextItem] || [];
            neighbors[nextItem].push(currentItem);
            
            // Create premise statement
            const direction = this.generator.coordToDirection(dirCoord);
            const useNegation = settings.enableNegation && Math.random() > 0.5;
            questionPremises.push(createDirectionStatement(currentItem, nextItem, direction, useNegation));
        }
        
        // Get actual direction and difference between start and end points
        const [start, end] = [items[0], items[items.length - 1]];
        const startCoord = wordCoordMap[start];
        const endCoord = wordCoordMap[end];
        const diffCoord = diffCoords(startCoord, endCoord);
        const actualDirection = normalize(diffCoord);
        
        // If there's no direction (points are the same), regenerate
        if (actualDirection.every(v => v === 0)) {
            return this.createQuestion(settings, dimension);
        }
        
        // Randomly decide if the conclusion should be valid
        const isValid = Math.random() > 0.5;
        let finalCoord;
        
        if (dimension === '3d') {
            // Split into vertical and horizontal components
            const verticalCoord = [0, 0, actualDirection[2]];
            const horizontalCoord = [actualDirection[0], actualDirection[1], 0];
            
            const conclusions = [];
            
            // Handle vertical movement if present
            if (verticalCoord[2] !== 0) {
                const verticalFinalCoord = isValid ? verticalCoord : [0, 0, -verticalCoord[2]];
                const verticalDirection = this.generator.coordToDirection(verticalFinalCoord);
                const useNegation = settings.enableNegation && !isValid;
                conclusions.push(createDirectionStatement(items[0], items[items.length - 1], verticalDirection, useNegation));
            }
            
            // Handle horizontal movement if present
            if (horizontalCoord[0] !== 0 || horizontalCoord[1] !== 0) {
                let horizontalFinalCoord;
                if (isValid) {
                    horizontalFinalCoord = horizontalCoord;
                } else {
                    // Generate incorrect horizontal direction while preserving magnitude
                    horizontalFinalCoord = this.incorrectDirections.chooseIncorrectCoord(
                        usedDirCoords.map(coord => [coord[0], coord[1], 0]),
                        horizontalCoord,
                        [diffCoord[0], diffCoord[1], 0]
                    );
                }
                const horizontalDirection = this.generator.coordToDirection(horizontalFinalCoord);
                const useNegation = settings.enableNegation && !isValid;
                conclusions.push(createDirectionStatement(items[0], items[items.length - 1], horizontalDirection, useNegation));
            }
            
            // If no movement in any direction, regenerate
            if (conclusions.length === 0) {
                return this.createQuestion(settings, dimension);
            }
            
            return {
                type: 'direction3D',
                category: 'Space 3D',
                premises: questionPremises,
                conclusions,
                isValid,
                wordCoordMap,
                neighbors
            };
        } else {
            // For 2D questions, generate a single conclusion
            let finalCoord;
            if (isValid) {
                finalCoord = actualDirection;
            } else {
                finalCoord = this.incorrectDirections.chooseIncorrectCoord(usedDirCoords, actualDirection, diffCoord);
            }
            
            const conclusionDirection = this.generator.coordToDirection(finalCoord);
            const useNegation = settings.enableNegation && !isValid;
            
            return {
                type: 'direction',
                category: 'Space 2D',
                premises: questionPremises,
                conclusion: createDirectionStatement(items[0], items[items.length - 1], conclusionDirection, useNegation),
                isValid,
                wordCoordMap,
                neighbors
            };
        }
    }
}

export const generateDirectionQuestion = (settings, dimension = '2d') => {
    const generator = dimension === '2d' ? new Direction2D() : new Direction3D();
    return new DirectionQuestion(generator).createQuestion(settings, dimension);
};