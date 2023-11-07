/** Using shuffle method described here: https://bost.ocks.org/mike/shuffle/ */

/** Shuffle the inputed array */
export function shuffleInPlace<T extends any>(array: T[]): T[] {
    let currentIndex = array.length;
    let randomIndex;
    let temp: T;

    while (currentIndex > 0) {
        // Increment currentIndex
        currentIndex -= 1;
        // Pick a random remaining position
        randomIndex = Math.floor(Math.random() * currentIndex);
        
        // swap positions
        temp = array[currentIndex];
        array[currentIndex] = array[randomIndex];
        array[randomIndex] = temp;
    }
    return array;
}
/** Return a copy of the array, shuffled */
export function shuffle<T extends any>(input: readonly T[]): T[] {
    return shuffleInPlace([...input]);
}