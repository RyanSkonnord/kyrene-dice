import { ClassicRollCondition, ClassicRollResult } from './rulesystems/classic';
import { RollProbabilityDistribution } from './probability';

function checkProbabilityTable(
    actualResult: RollProbabilityDistribution<ClassicRollResult>,
    ...expectedProbabilities: number[]
) {
    const orderedResults = Array.from(actualResult.events);
    expect(orderedResults).toHaveLength(expectedProbabilities.length);
    expectedProbabilities.forEach((expectedProbability, index) => {
        const { result: actualResult, probability: actualProbability } = orderedResults[index];
        expect(actualResult.successCount).toEqual(index - 1);
        expect(actualProbability).toBeCloseTo(expectedProbability, 4);
    });

    const totalProbability = orderedResults.map(({ probability }) => probability).reduce((a, b) => a + b, 0);
    expect(totalProbability).toBeCloseTo(1, 12);
}

test("builds probability tables", () => {
    let condition = ClassicRollCondition.create(1, 6);
    let table = RollProbabilityDistribution.calculateFrom(condition);
    checkProbabilityTable(table, 0.1, 0.4, 0.5);

    condition = ClassicRollCondition.create(2, 6);
    table = RollProbabilityDistribution.calculateFrom(condition);
    checkProbabilityTable(table, 0.09, 0.26, 0.4, 0.25);

    condition = ClassicRollCondition.create(3, 8);
    table = RollProbabilityDistribution.calculateFrom(condition);
    checkProbabilityTable(table, 0.127, 0.333, 0.351, 0.162, 0.027);
})

test("reflects Classic WOD variant rules", () => {
    let condition = ClassicRollCondition.create(3, 8);
    let table = RollProbabilityDistribution.calculateFrom(condition);
    checkProbabilityTable(table, 0.127, 0.333, 0.351, 0.162, 0.027);

    condition = ClassicRollCondition.create(3, 8, 'usingPreRevisedBotchRules');
    table = RollProbabilityDistribution.calculateFrom(condition);
    checkProbabilityTable(table, 0.136, 0.324, 0.351, 0.162, 0.027);
});
