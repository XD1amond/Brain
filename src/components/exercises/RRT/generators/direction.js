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

// Helper to get conclusion coordinates
const getConclusionCoords = (wordCoordMap, startWord, endWord) => {
    const [start, end] = [wordCoordMap[startWord], wordCoordMap[endWord]];
    const diffCoord = diffCoords(start, end);
    const conclusionCoord = normalize(diffCoord);
    return [diffCoord, conclusionCoord];
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

// Helper to create a direction statement with proper grammar
const createDirectionStatement = (source, target, direction, useNegation = false) => {
    const statement = direction.toLowerCase().startsWith('above') || direction.toLowerCase().startsWith('below')
        ? `<span class="subject">${source}</span> is ${useNegation ? '<span class="is-negated">' : ''}${direction.toLowerCase()}${useNegation ? '</span>' : ''} <span class="subject">${target}</span>`
        : `<span class="subject">${source}</span> is ${useNegation ? '<span class="is-negated">' : ''}${direction}${useNegation ? '</span>' : ''} of <span class="subject">${target}</span>`;
    return statement;
};

// Helper to check if premises cancel each other
const getNetMovement = (premises) => {
    return premises.reduce((net, premise) => {
        return addCoords(net, premise);
    }, [0, 0, 0]);
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

    directionToCoord(direction) {
        switch(direction.toLowerCase()) {
            case 'north': return [0, 1, 0];
            case 'south': return [0, -1, 0];
            case 'east': return [1, 0, 0];
            case 'west': return [-1, 0, 0];
            case 'north-east': return [1, 1, 0];
            case 'north-west': return [-1, 1, 0];
            case 'south-east': return [1, -1, 0];
            case 'south-west': return [-1, -1, 0];
            default: return [0, 0, 0];
        }
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
        this.dirCoords = [
            ...this.dirCoords,
            [0, 0, 1],  // above
            [0, 0, -1]  // below
        ];
    }

    directionToCoord(direction) {
        switch(direction.toLowerCase()) {
            case 'above': return [0, 0, 1];
            case 'below': return [0, 0, -1];
            default: return super.directionToCoord(direction);
        }
    }

    coordToDirection(coord) {
        if (coord[2] === 1) return 'Above';
        if (coord[2] === -1) return 'Below';
        return super.coordToDirection(coord);
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
        
        // Track word coordinates, neighbors, and used directions
        const wordCoordMap = { [items[0]]: this.generator.initialCoord() };
        const neighbors = { [items[0]]: [] };
        const usedDirCoords = [];
        const premiseCoords = [];
        
        // For 3D questions, ensure exactly one height and one direction in 2-premise mode
        let hasVertical = false;
        let hasHorizontal = false;
        const is3DWith2Premises = dimension === '3d' && premises === 2;
        
        // Generate premises with branching paths
        for (let i = 0; i < items.length - 1; i++) {
            const currentItem = items[i];
            const nextItem = items[i + 1];
            
            let dirCoord;
            if (dimension === '3d') {
                if (is3DWith2Premises) {
                    // In 2-premise mode, randomly decide which comes first
                    const heightFirst = Math.random() < 0.5;
                    if ((heightFirst && i === 0) || (!heightFirst && i === 1)) {
                        // Height premise
                        dirCoord = [0, 0, Math.random() < 0.5 ? 1 : -1];
                        hasVertical = true;
                    } else {
                        // Direction premise
                        const horizontalDirs = this.generator.dirCoords.filter(c =>
                            (c[0] !== 0 || c[1] !== 0) && c[2] === 0
                        );
                        dirCoord = horizontalDirs[Math.floor(Math.random() * horizontalDirs.length)];
                        hasHorizontal = true;
                    }
                } else {
                    // For 3+ premises, ensure we have both types but allow more flexibility in order
                    if (!hasVertical && (i === premises - 2 || Math.random() < 0.5)) {
                        dirCoord = [0, 0, Math.random() < 0.5 ? 1 : -1];
                        hasVertical = true;
                    } else if (!hasHorizontal && (i === premises - 2 || Math.random() < 0.5)) {
                        const horizontalDirs = this.generator.dirCoords.filter(c =>
                            (c[0] !== 0 || c[1] !== 0) && c[2] === 0
                        );
                        dirCoord = horizontalDirs[Math.floor(Math.random() * horizontalDirs.length)];
                        hasHorizontal = true;
                    } else {
                        dirCoord = this.generator.pickDirection(currentItem, neighbors, wordCoordMap);
                        if (dirCoord[2] !== 0) hasVertical = true;
                        if (dirCoord[0] !== 0 || dirCoord[1] !== 0) hasHorizontal = true;
                    }
                }
            } else {
                // For 2D questions, use weighted random direction
                dirCoord = this.generator.pickDirection(currentItem, neighbors, wordCoordMap);
            }
            
            // Update position and neighbors
            wordCoordMap[nextItem] = addCoords(wordCoordMap[currentItem], dirCoord);
            usedDirCoords.push(dirCoord);
            premiseCoords.push(dirCoord);
            
            // Update neighbor relationships
            neighbors[currentItem] = neighbors[currentItem] || [];
            neighbors[currentItem].push(nextItem);
            neighbors[nextItem] = neighbors[nextItem] || [];
            neighbors[nextItem].push(currentItem);
            
            // Create premise statement with proper grammar
            const direction = this.generator.coordToDirection(dirCoord);
            const useNegation = settings.enableNegation && Math.random() > 0.5;
            questionPremises.push(createDirectionStatement(nextItem, currentItem, direction, useNegation));
        }

        // Check for canceling premises
        const netMovement = getNetMovement(premiseCoords);
        if (netMovement.every(v => v === 0)) {
            // If premises cancel out, regenerate the question
            return this.createQuestion(settings, dimension);
        }

        // Calculate conclusion direction
        const [diffCoord, conclusionCoord] = getConclusionCoords(wordCoordMap, items[0], items[items.length - 1]);
        
        // Randomly decide if conclusion should be valid or invalid
        const isValid = Math.random() > 0.5;
        let finalCoord;
        
        if (isValid) {
            finalCoord = conclusionCoord;
        } else {
            finalCoord = this.incorrectDirections.chooseIncorrectCoord(usedDirCoords, conclusionCoord, diffCoord);
        }

        // For 3D questions, split into vertical and horizontal conclusions
        if (dimension === '3d') {
            const verticalCoord = [0, 0, finalCoord[2]];
            const horizontalCoord = [finalCoord[0], finalCoord[1], 0];
            
            // Only create conclusions for non-zero dimensions
            const conclusions = [];
            
            if (verticalCoord[2] !== 0) {
                const verticalDirection = this.generator.coordToDirection(verticalCoord);
                const useNegationVertical = settings.enableNegation && Math.random() > 0.5;
                conclusions.push(createDirectionStatement(items[0], items[items.length - 1], verticalDirection, useNegationVertical));
            }
            
            if (horizontalCoord[0] !== 0 || horizontalCoord[1] !== 0) {
                const horizontalDirection = this.generator.coordToDirection(horizontalCoord);
                const useNegationHorizontal = settings.enableNegation && Math.random() > 0.5;
                conclusions.push(createDirectionStatement(items[0], items[items.length - 1], horizontalDirection, useNegationHorizontal));
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
            // For 2D questions, create a single conclusion
            const conclusionDirection = this.generator.coordToDirection(finalCoord);
            const useNegation = settings.enableNegation && Math.random() > 0.5;
            
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