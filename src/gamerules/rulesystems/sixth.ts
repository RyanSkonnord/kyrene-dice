import { DicePool, DieRule, EffectCount, makeThresholdRule } from "../dice";
import { RollCondition, RollEffect, RollResult } from "../rolls";

export class SixthRollResult extends RollResult {
    public constructor(public readonly successCount: number) {
        super();
    }

    public isSuccessful(): boolean { return this.successCount > 0; }
    public isPainfulFailure(): boolean { return this.successCount < 0; }

    public get mapKey(): number {
        return this.successCount;
    }
}

export class SixthRollCondition extends RollCondition<SixthRollResult> {
    public constructor(
        public readonly baseDicePool: number,
        public readonly difficulty: number,
    ) { super(); }

    private static readonly RULE: DieRule = makeThresholdRule(8);

    protected initializeDicePool(): DicePool {
        const poolSize = Math.max(0, this.baseDicePool - this.difficulty);
        return DicePool.of(poolSize, SixthRollCondition.RULE);
    }

    public resolveRoll(roll: RollEffect): SixthRollResult {
        const effects: EffectCount = roll.count();
        let hits = effects.totalHits;
        if (hits === 0 && effects.criticalMisses > 0) { hits = -1; }
        return new SixthRollResult(hits);
    }

}
