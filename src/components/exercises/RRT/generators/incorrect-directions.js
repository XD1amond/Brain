class IncorrectDirections {
    findUnused(combinations, correctCoord) {
        let unused = [];
        let permutation = correctCoord.map(d => 0);
        let permutate = (i) => {
            if (i >= permutation.length) {
                if (!this.arraysEqual(permutation, correctCoord) && 
                    !this.arraysEqual(permutation, correctCoord.slice(0, 3).map(d => 0)) &&
                    combinations.findIndex(combo => this.arraysEqual(permutation, combo)) === -1) {
                    unused.push(permutation.slice());
                }
                return;
            }
            for (let direction of [-1, 0, 1]) {
                permutation[i] = direction;
                permutate(i+1);
            }
        }
        permutate(0);
        return unused;
    }

    arraysEqual(a, b) {
        return a.length === b.length && a.every((v, i) => v === b[i]);
    }

    createIncorrectConclusionCoords(usedCoords, correctCoord, diffCoord) {
        let opposite = correctCoord.map(dir => -dir);
        
        if (usedCoords.length <= 2) {
            return [opposite]; // Few premises == anything that isn't the opposite tends to be easy.
        } else if (usedCoords.length <= 3 && Math.random() < 0.5) {
            return [opposite];
        }

        const dirCoords = [...new Set(usedCoords.map(JSON.stringify))].map(JSON.parse);
        const dimensionPool = correctCoord.map((c, i) => i);
        let bannedDimensions = new Set();

        // Don't shift dimensions that haven't been used
        for (const dimension of dimensionPool) {
            if (dirCoords.every(coord => coord[dimension] === 0)) {
                bannedDimensions.add(dimension);
            }
        }

        // Determine shift amounts based on the diff magnitude
        const highest = Math.max(...diffCoord.map(Math.abs));
        const allShiftedEqually = diffCoord.every(x => Math.abs(x) === highest);
        const shifts = allShiftedEqually ? [-1, 1] : [-2, -1, 1, 2];

        if (!allShiftedEqually) {
            dimensionPool
                .filter(d => Math.abs(diffCoord[d]) === highest)
                .forEach(d => bannedDimensions.add(d));
        }

        let combinations = [];
        for (const d of dimensionPool) {
            if (bannedDimensions.has(d)) continue;

            for (const shift of shifts) {
                let newCombo = [...correctCoord];
                newCombo[d] += shift;
                
                // Skip if any component is too large or if all components are zero
                if (newCombo.some(d => Math.abs(d) > 1) || 
                    newCombo.slice(0, 3).every(d => d === 0)) {
                    continue;
                }

                combinations.push(newCombo);
                // Weight smaller shifts more heavily
                if (Math.abs(shift) === 1) {
                    combinations.push(newCombo);
                    combinations.push(newCombo);
                }
            }
        }

        let backupPool = this.findUnused(combinations, correctCoord);
        // Add opposite direction as a fallback with higher weight
        backupPool.push(opposite, opposite, opposite);

        return combinations.length > 0 && Math.random() < 0.9
            ? combinations
            : backupPool;
    }

    chooseIncorrectCoord(usedCoords, correctCoord, diffCoord) {
        const incorrectCoords = this.createIncorrectConclusionCoords(usedCoords, correctCoord, diffCoord);
        return incorrectCoords[Math.floor(Math.random() * incorrectCoords.length)];
    }
}

export default IncorrectDirections;