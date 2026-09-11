export function rollDie(size: number): number {
    return Math.floor(Math.random() * size) + 1;
}

export function rollDice(count: number, size: number): number[] {
    return Array.from({ length: count }, () => rollDie(size));
}
