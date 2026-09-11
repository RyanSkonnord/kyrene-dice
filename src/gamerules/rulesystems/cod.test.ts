import { RollProbabilityDistribution } from "../probability";
import { CodRollCondition } from "./cod";

test("basic rolls are correct", () => {
    const condition = new CodRollCondition(6);

    let report = condition.evaluateRawDice([5, 7, 1, 3, 3, 4]);
    expect(report.dice.size).toEqual(6);
    let { result } = report;
    expect(result.successCount).toEqual(0);
    expect(result.isSuccessful()).toBe(false);
    expect(result.isDramaticFailure()).toBe(false);
    expect(result.isExceptionalSuccess()).toBe(false);

    ({ result } = condition.evaluateRawDice([9, 2, 1, 2, 5, 7]));
    expect(result.successCount).toEqual(1);
    expect(result.isSuccessful()).toBe(true);
    expect(result.isDramaticFailure()).toBe(false);
    expect(result.isExceptionalSuccess()).toBe(false);

    ({ result } = condition.evaluateRawDice([8, 8, 7, 8, 9, 7]));
    expect(result.successCount).toEqual(4);
    expect(result.isSuccessful()).toBe(true);
    expect(result.isDramaticFailure()).toBe(false);
    expect(result.isExceptionalSuccess()).toBe(false);

    ({ result } = condition.evaluateRawDice([9, 9, 8, 9, 9, 3]));
    expect(result.successCount).toEqual(5);
    expect(result.isSuccessful()).toBe(true);
    expect(result.isDramaticFailure()).toBe(false);
    expect(result.isExceptionalSuccess()).toBe(true);
});

test("dramatic failure is identified", () => {
    const condition = new CodRollCondition(1, -1);

    let { result } = condition.evaluateRawDice([1]);
    expect(result.successCount).toEqual(-1);
    expect(result.isSuccessful()).toBe(false);
    expect(result.isDramaticFailure()).toBe(true);
    expect(result.isExceptionalSuccess()).toBe(false);

    ({ result } = condition.evaluateRawDice([7]));
    expect(result.successCount).toEqual(0);
    expect(result.isSuccessful()).toBe(false);
    expect(result.isDramaticFailure()).toBe(false);
    expect(result.isExceptionalSuccess()).toBe(false);

    ({ result } = condition.evaluateRawDice([8]));
    expect(result.successCount).toEqual(1);
    expect(result.isSuccessful()).toBe(true);
    expect(result.isDramaticFailure()).toBe(false);
    expect(result.isExceptionalSuccess()).toBe(false);
});

test("applies 'ten again' rerolls", () => {
    let condition = new CodRollCondition(2);
    let { result, effect } = condition.evaluateRawDice([9, 10]);
    let rerollCount = condition.calculateRerollDice(effect);
    expect(result.successCount).toEqual(2);
    expect(rerollCount).toEqual(1);

    const rerolledCond = condition.evaluateRawDice([9, 10, 8]);
    ({ result, effect } = rerolledCond);
    rerollCount = condition.calculateRerollDice(effect);
    expect(result.successCount).toEqual(3);
    expect(rerollCount).toEqual(0);
});


test("represents rerolls in probability tables", () => {
    const condition = new CodRollCondition(2);
    const { events } = RollProbabilityDistribution.calculateFrom(condition);
    expect(Array.from(events.map(({ result }) => result.successCount))).toEqual([0, 1, 2, 3, 4, 5, 6]);
    expect(events.get(0)?.probability).toBeCloseTo(0.49);
    expect(events.get(1)?.probability).toBeCloseTo(0.378);
    expect(events.get(2)?.probability).toBeCloseTo(0.1107);
    expect(events.get(3)?.probability).toBeCloseTo(0.01836);
    expect(events.get(4)?.probability).toBeCloseTo(0.002565);
    expect(events.get(5)?.probability).toBeCloseTo(0.000366);
    expect(events.get(6)?.probability).toBeCloseTo(0.000009);
});
