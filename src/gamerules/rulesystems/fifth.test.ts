import { FifthRollCondition, FifthRollNature, FifthRollResult } from "./fifth";

test("FifthRollResults are validated", () => {
    expect(() => new FifthRollResult(0, FifthRollNature.FAILURE)).toThrowError();
    expect(() => new FifthRollResult(null, FifthRollNature.WIN)).toThrowError();
    expect(() => new FifthRollResult(null, FifthRollNature.CRITICAL_WIN)).toThrowError();
    expect(() => new FifthRollResult(0, FifthRollNature.BESTIAL_FAILURE)).toThrowError();
    expect(() => new FifthRollResult(null, FifthRollNature.MESSY_CRITICAL)).toThrowError();
});

test("basic rolls are correct", () => {
    // The first two dice in every test case will be Hunger dice
    const condition = new FifthRollCondition(5, 3, 2);

    let { result } = condition.evaluateRawDice([5, 10, 1, 6, 7]);
    expect(result.isSuccessful()).toBe(true);
    expect(result.margin).toEqual(0);
    expect(result.nature).toEqual(FifthRollNature.WIN);

    ({ result } = condition.evaluateRawDice([3, 9, 4, 10, 4]));
    expect(result.isSuccessful()).toBe(false);
    expect(result.margin).toBeNull();
    expect(result.nature).toEqual(FifthRollNature.FAILURE);

    ({ result } = condition.evaluateRawDice([5, 4, 10, 10, 9]));
    expect(result.isSuccessful()).toBe(true);
    expect(result.margin).toEqual(2);
    expect(result.nature).toEqual(FifthRollNature.CRITICAL_WIN);

    ({ result } = condition.evaluateRawDice([1, 3, 8, 5, 3]));
    expect(result.isSuccessful()).toBe(false);
    expect(result.margin).toBeNull();
    expect(result.nature).toEqual(FifthRollNature.BESTIAL_FAILURE);

    ({ result } = condition.evaluateRawDice([10, 6, 8, 10, 1]));
    expect(result.isSuccessful()).toBe(true);
    expect(result.margin).toEqual(3);
    expect(result.nature).toEqual(FifthRollNature.MESSY_CRITICAL);
});
