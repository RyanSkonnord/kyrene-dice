import { DicePool, makeThresholdRule } from '../dice';
import { RollCondition, RollEffect, RollResult } from '../rolls';

export class ClassicRollResult extends RollResult {
    public constructor(public readonly successCount: number) {
        super();
    }

    public isSuccessful() { return this.successCount > 0; }
    public isBotch() { return this.successCount < 0; }

    public get mapKey(): number {
        return this.successCount;
    }
}

export type ClassicRollFlag = (
    'didPlayerSpendWillpower' |
    'isDamageRoll' |
    'usingPreRevisedBotchRules' |
    'hasCharmedExistence' |
    'ignoreOnes' |
    'areTensImmuneToOnes');

export class ClassicRollCondition extends RollCondition<ClassicRollResult> {
    public constructor(
        public readonly dicePoolSize: number,
        public readonly difficulty: number,
        public readonly flags: Record<ClassicRollFlag, boolean>,
    ) { super(); }

    public static create(dicePool: number, difficulty: number, ...flags: ClassicRollFlag[]) {
        const flagRecord: Record<ClassicRollFlag, boolean> = {
            didPlayerSpendWillpower: flags.includes('didPlayerSpendWillpower'),
            isDamageRoll: flags.includes('isDamageRoll'),
            usingPreRevisedBotchRules: flags.includes('usingPreRevisedBotchRules'),
            hasCharmedExistence: flags.includes('hasCharmedExistence'),
            ignoreOnes: flags.includes('ignoreOnes'),
            areTensImmuneToOnes: flags.includes('areTensImmuneToOnes')
        }
        return new ClassicRollCondition(dicePool, difficulty, flagRecord);
    }

    protected initializeDicePool(): DicePool {
        const { areTensImmuneToOnes, ignoreOnes } = this.flags;
        const criticalHitThreshold = (areTensImmuneToOnes && !ignoreOnes) ? 10 : null;
        const criticalMissThreshold = ignoreOnes ? null : 1;
        const rule = makeThresholdRule(
            this.difficulty, criticalHitThreshold, criticalMissThreshold
        );
        return DicePool.of(this.dicePoolSize, rule);
    }

    public resolveRoll(roll: RollEffect): ClassicRollResult {
        const {
            didPlayerSpendWillpower,
            hasCharmedExistence,
            usingPreRevisedBotchRules,
            areTensImmuneToOnes,
            isDamageRoll,
        } = this.flags;

        const { criticalMisses, totalHits, criticalHits } = roll.count();

        let successCount = totalHits
            + (didPlayerSpendWillpower ? 1 : 0)
            - Math.max(0, criticalMisses - (hasCharmedExistence ? 1 : 0));
        if (!usingPreRevisedBotchRules && totalHits > 0 && successCount < 0) { successCount = 0; }
        if (areTensImmuneToOnes && criticalHits > 0 && successCount < criticalHits) { successCount = criticalHits; }
        if (successCount < -1) { successCount = -1; }
        if (isDamageRoll && successCount < 0) { successCount = 0; }

        return new ClassicRollResult(successCount);
    }
}
