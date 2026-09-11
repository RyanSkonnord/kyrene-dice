import { Record } from "immutable";
import { RollCondition, RollEffect, RollResult } from "../rolls";
import { DicePool, DieEffect } from "../dice";

export class GenericRollResult extends RollResult {
    public constructor(public readonly margin: number | null) { super(); }

    public isSuccessful(): boolean {
        return this.margin !== null;
    }

    public get mapKey(): number | Record<any> {
        return this.margin ?? -1;
    }
}

export class GenericRollCondition extends RollCondition<GenericRollResult> {
    public constructor(
        dieSize: number,
        public readonly dicePoolSize: number,
        public readonly threshold: number,
        public readonly target: number,
    ) { super(dieSize); }

    protected initializeDicePool(): DicePool {
        const { threshold } = this;
        function rule(face: number) {
            return (face >= threshold) ? DieEffect.HIT : DieEffect.MISS;
        }
        return DicePool.of(this.dicePoolSize, rule);
    }

    public resolveRoll(roll: RollEffect): GenericRollResult {
        const { totalHits } = roll.count();
        const margin = totalHits - this.target;
        const isSuccess = (this.target > 0) ? (margin >= 0) : (margin > 0);
        return new GenericRollResult(isSuccess ? margin : null);
    }
}
