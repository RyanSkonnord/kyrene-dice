/**
 * Compare two sequences in lexicographic order for the `sort` interface.
 * 
 * @param a a sequence of numbers to compare
 * @param b a sequence of numbers to compare
 * @returns a comparison value whose sign indicates ordering to the `sort` function
 */
export function compareLexicographicVectors(a: number[], b: number[]): number {
    const length = Math.min(a.length, b.length);
    for (let i = 0; i < length; i++) {
        const cmp = a[i] - b[i];
        if (cmp !== 0) { return cmp; }
    }
    return a.length - b.length;
}

export function comparingVectorKeys<T>(keyExtractor: (value: T) => number[]): (a: T, b: T) => number {
    return (a: T, b: T) => {
        const aKey = keyExtractor(a);
        const bKey = keyExtractor(b);
        return compareLexicographicVectors(aKey, bKey);
    }
}