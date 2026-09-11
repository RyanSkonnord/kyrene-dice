import { DicePool, DicePoolPart, DieRule, makeThresholdRule } from "../dice";
import { RollCondition, RollEffect, RollResult } from "../rolls";

export class CodRollResult extends RollResult {
    public constructor(public readonly successCount: number) {
        super();
    }

    public isSuccessful() { return this.successCount > 0; }
    public isDramaticFailure() { return this.successCount < 0; }
    public isExceptionalSuccess() { return this.successCount >= 5; }

    public get mapKey(): number {
        return this.successCount;
    }
}

export class CodRollCondition extends RollCondition<CodRollResult> {
    public constructor(
        public readonly baseDicePool: number,
        public readonly modifier: number = 0,
        public readonly criticalHitThreshold: number | null = 10,
    ) {
        super();
    }

    private makeDieRule(isChanceDie: boolean): DieRule {
        return makeThresholdRule(
            8,
            this.criticalHitThreshold,
            (isChanceDie ? 1 : 0),
        );
    }

    public get actualDicePool() {
        return Math.max(1, this.baseDicePool + this.modifier);
    }

    protected initializeDicePool(): DicePool {
        const mainPart = new DicePoolPart(this.actualDicePool, this.makeDieRule(this.isChanceDie()));
        const rerollRule = this.makeDieRule(false);
        return new DicePool([mainPart], rerollRule);
    }

    public isChanceDie(): boolean {
        return this.baseDicePool + this.modifier < 1;
    }

    public resolveRoll(roll: RollEffect): CodRollResult {
        const effects = roll.count();
        if (this.isChanceDie() && effects.criticalMisses > 0) {
            return new CodRollResult(-1);
        }
        return new CodRollResult(effects.totalHits);
    }

    public calculateRerollDice(roll: RollEffect): number {
        const { criticalHits } = roll.count();
        const extraDiceRolledAlready = Math.max(0, roll.total - this.actualDicePool);
        const rerollDice = Math.max(0, criticalHits - extraDiceRolledAlready);
        return rerollDice;
    }
}
