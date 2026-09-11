import { ClassicRollCondition, ClassicRollResult } from "./classic";

test("basic rolls are correct", () => {
    let cond = ClassicRollCondition.create(2, 6);
    let report = cond.evaluateRawDice([6, 6]);
    expect(report.dice.size).toEqual(2);

    let { result } = report;
    expect(result).toEqual(new ClassicRollResult(2));
    expect(result.isSuccessful()).toBe(true);
    expect(result.isBotch()).toBe(false);

    ({ result } = cond.evaluateRawDice([2, 10]));
    expect(result).toEqual(new ClassicRollResult(1));
    expect(result.isSuccessful()).toBe(true);
    expect(result.isBotch()).toBe(false);

    ({ result } = cond.evaluateRawDice([8, 1]));
    expect(result).toEqual(new ClassicRollResult(0));
    expect(result.isSuccessful()).toBe(false);
    expect(result.isBotch()).toBe(false);

    ({ result } = cond.evaluateRawDice([1, 2]));
    expect(result).toEqual(new ClassicRollResult(-1));
    expect(result.isSuccessful()).toBe(false);
    expect(result.isBotch()).toBe(true);

    ({ result } = cond.evaluateRawDice([1, 1]));
    expect(result).toEqual(new ClassicRollResult(-1));
})

// TODO: Add test cases for isDamageRoll
// TODO: Add test cases for ignoreOnes

test("botch variant rules are correct", () => {
    let cond = ClassicRollCondition.create(3, 6);
    let { result } = cond.evaluateRawDice([7, 1, 1]);
    expect(result).toEqual(new ClassicRollResult(0));
    expect(result.isSuccessful()).toBe(false);
    expect(result.isBotch()).toBe(false);

    cond = ClassicRollCondition.create(3, 6, 'usingPreRevisedBotchRules');
    ({ result } = cond.evaluateRawDice([7, 1, 1]));
    expect(result).toEqual(new ClassicRollResult(-1));
    expect(result.isSuccessful()).toBe(false);
    expect(result.isBotch()).toBe(true);
});

test("'tens are immune to ones' rule is correct", () => {
    let cond = ClassicRollCondition.create(3, 6, 'areTensImmuneToOnes');
    let { result } = cond.evaluateRawDice([10, 1, 1]);
    expect(result).toEqual(new ClassicRollResult(1));
    expect(result.isSuccessful()).toBe(true);
    expect(result.isBotch()).toBe(false);

    ({ result } = cond.evaluateRawDice([10, 9, 1]));
    expect(result).toEqual(new ClassicRollResult(1));
    expect(result.isSuccessful()).toBe(true);
    expect(result.isBotch()).toBe(false);

    cond = ClassicRollCondition.create(3, 6, 'areTensImmuneToOnes', 'usingPreRevisedBotchRules');
    ({ result } = cond.evaluateRawDice([10, 1, 1]));
    expect(result).toEqual(new ClassicRollResult(1));
    expect(result.isSuccessful()).toBe(true);
    expect(result.isBotch()).toBe(false);
});

test("Charmed Existence is correct", () => {
    let cond = ClassicRollCondition.create(3, 6,
        'hasCharmedExistence', // Doo-doo-doo, doo-doo-doo-doo
    );

    let { result } = cond.evaluateRawDice([7, 7, 1]);
    expect(result).toEqual(new ClassicRollResult(2));

    ({ result } = cond.evaluateRawDice([7, 1, 1]));
    expect(result).toEqual(new ClassicRollResult(0));

    ({ result } = cond.evaluateRawDice([4, 4, 1]));
    expect(result).toEqual(new ClassicRollResult(0));

    ({ result } = cond.evaluateRawDice([4, 1, 1]));
    expect(result).toEqual(new ClassicRollResult(-1));
    expect(result.isBotch()).toBe(true);

    cond = ClassicRollCondition.create(4, 6, 'hasCharmedExistence', 'usingPreRevisedBotchRules');
    ({ result } = cond.evaluateRawDice([7, 1, 1, 1]));
    expect(result).toEqual(new ClassicRollResult(-1));
});
