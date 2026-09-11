import { rollDice, rollDie } from "./rng";

test("produces a random number", () => {
    for (let i = 0; i < 5; i++) {
        const result = rollDie(10);
        expect(result).toBeGreaterThanOrEqual(1);
        expect(result).toBeLessThanOrEqual(10);
    }
});

test("produces an array of random numbers", () => {
    for (let i = 0; i < 5; i++) {
        const results = rollDice(2, 10);
        expect(results).toHaveLength(2);
        for (const result of results) {
            expect(result).toBeGreaterThanOrEqual(1);
            expect(result).toBeLessThanOrEqual(10);
        }
    }
});
