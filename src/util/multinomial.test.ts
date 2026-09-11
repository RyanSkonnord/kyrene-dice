import { List } from "immutable";
import { generateMultinomialOutcomes, getLogarithmicFactorial, MultinomialDistribution, MultinomialOutcome } from "./multinomial";

test("calculates logarithmic factorials", () => {
    expect(getLogarithmicFactorial(0)).toEqual(0);
    expect(getLogarithmicFactorial(1)).toEqual(0);
    expect(getLogarithmicFactorial(2)).toEqual(0.6931471805599453);
    expect(getLogarithmicFactorial(3)).toEqual(1.791759469228055);
    expect(getLogarithmicFactorial(5)).toEqual(4.787491742782046);
    expect(getLogarithmicFactorial(10)).toEqual(15.104412573075518);
});

test("handles trivial set of multinomial outcomes", () => {
    expect(Array.from(generateMultinomialOutcomes(0, []))).toEqual([List()]);
    expect(Array.from(generateMultinomialOutcomes(0, ['a']))).toEqual([List()]);
    expect(() => Array.from(generateMultinomialOutcomes(1, []))).toThrowError();
    expect(Array.from(generateMultinomialOutcomes(1, ['a']))).toEqual([List([{ event: 'a', count: 1 }])]);
});

test("generates an exhaustive set of multinomial outcomes", () => {
    const outcomes = Array.from(generateMultinomialOutcomes(5, ['a', 'b', 'c']));
    expect(outcomes).toHaveLength(21);
    expect(outcomes[0]).toEqual(List([{ event: 'a', count: 5 }]));
    expect(outcomes[7]).toEqual(List([{ event: 'a', count: 2 }, { event: 'b', count: 2 }, { event: 'c', count: 1 }]));
    expect(outcomes[13]).toEqual(List([{ event: 'a', count: 1 }, { event: 'b', count: 1 }, { event: 'c', count: 3 }]));
    expect(outcomes.at(-1)).toEqual(List([{ event: 'c', count: 5 }]));
});

function calculateMultinomialDistribution<T>(
    numberOfTrials: number,
    eventProbabilities: { event: T; probability: number; }[],
) {
    return Array.from(
        new MultinomialDistribution(numberOfTrials, eventProbabilities)
            .calculateFullDistribution());
}

test("handles trivial multinomial distributions", () => {
    expect(calculateMultinomialDistribution(0, [])).toEqual([{ outcome: List(), probability: 1 }]);
    expect(calculateMultinomialDistribution(1, [{ event: 'a', probability: 1 }]))
        .toEqual([{ outcome: List([{ event: 'a', count: 1 }]), probability: 1 }]);
});

test("ignores zero-probability events in multinomial distributions", () => {
    expect(
        calculateMultinomialDistribution(1, [
            { event: 'a', probability: 1 }, { event: 'b', probability: 0 }
        ])
    ).toEqual([{ outcome: List([{ event: 'a', count: 1 }]), probability: 1 }]);
});

function validateMultinomial(multinomial: {
    outcome: MultinomialOutcome<string>;
    probability: number;
}[]): {
    withNumberOfTrials: ((numberOfTrials: number) => void)
} {
    const totalProbability = multinomial.map(({ probability }) => probability)
        .reduce((a, b) => (a + b), 0);
    expect(totalProbability).toBeCloseTo(1);
    return {
        withNumberOfTrials: (numberOfTrials: number): void => {
            for (const { outcome } of multinomial) {
                const totalCount = outcome.map(({ count }) => count)
                    .reduce((a, b) => (a + b), 0);
                expect(totalCount).toBeCloseTo(numberOfTrials);
            }
        }
    };
}

test("calculates multinomial distribution with 2 trials and equal events", () => {
    let multinomial = calculateMultinomialDistribution(
        2,
        [
            { event: 'a', probability: 1 },
            { event: 'b', probability: 1 },
        ]
    );
    validateMultinomial(multinomial).withNumberOfTrials(2);
    expect(multinomial).toEqual([
        { outcome: List([{ event: 'a', count: 2 }]), probability: 0.25 },
        { outcome: List([{ event: 'a', count: 1 }, { event: 'b', count: 1 }]), probability: 0.5 },
        { outcome: List([{ event: 'b', count: 2 }]), probability: 0.25 },
    ]);

    multinomial = calculateMultinomialDistribution(
        2,
        [
            { event: 'a', probability: 10 },
            { event: 'b', probability: 10 },
        ]
    );
    validateMultinomial(multinomial).withNumberOfTrials(2);
    expect(multinomial[0].probability).toBeCloseTo(0.25, 10);
    expect(multinomial[1].probability).toBeCloseTo(0.5, 10);
});

test("calculates multinomial distribution with 2 trials and unequal events", () => {
    const multinomial = calculateMultinomialDistribution(
        2,
        [
            { event: 'a', probability: 1 },
            { event: 'b', probability: 2 },
        ]
    );
    validateMultinomial(multinomial).withNumberOfTrials(2);
    expect(multinomial[0].outcome).toEqual(List([{ event: 'a', count: 2 }]));
    expect(multinomial[0].probability).toBeCloseTo(1 / 9, 10);
    expect(multinomial[1].outcome).toEqual(List([{ event: 'a', count: 1 }, { event: 'b', count: 1 }]));
    expect(multinomial[1].probability).toBeCloseTo(4 / 9, 10);
    expect(multinomial[2].outcome).toEqual(List([{ event: 'b', count: 2 }]));
    expect(multinomial[2].probability).toBeCloseTo(4 / 9, 10);
});

test("calculates substantial multinomial distribution", () => {
    const multinomial = new MultinomialDistribution(
        10,
        [
            { event: 'red', probability: 1 },
            { event: 'green', probability: 6 },
            { event: 'blue', probability: 3 },
        ]
    );

    const allOutcomes = Array.from(multinomial.generateMultinomialOutcomes());
    expect(allOutcomes).toHaveLength(66); // = (10+3-1)! / (10! * (3-1)!)

    const fullDistribution = Array.from(multinomial.calculateFullDistribution());
    expect(fullDistribution).toHaveLength(66);

    expect(multinomial.calculateProbabilityOf(List([
        { event: 'red', count: 2 },
        { event: 'green', count: 5 },
        { event: 'blue', count: 3 },
    ]))).toBeCloseTo(0.052907904, 9);
});
