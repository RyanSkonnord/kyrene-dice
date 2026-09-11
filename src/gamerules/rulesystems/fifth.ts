import { Record as ImmutableRecord, Set } from "immutable";

import { DicePool, DicePoolPart, DieTag, EffectCount, makeThresholdRule } from "../dice";
import { RollCondition, RollEffect, RollReport, RollResult } from "../rolls";

export enum FifthRollNature {
    FAILURE = 'FAILURE',
    WIN = 'WIN',
    CRITICAL_WIN = 'CRITICAL_WIN',
    BESTIAL_FAILURE = 'BESTIAL_FAILURE',
    MESSY_CRITICAL = 'MESSY_CRITICAL',
};

export class FifthRollResult extends RollResult {
    private static readonly SUCCESSFUL_NATURES = Set([
        FifthRollNature.WIN, FifthRollNature.CRITICAL_WIN, FifthRollNature.MESSY_CRITICAL,
    ]);
    private static readonly FAILING_NATURES = Set([
        FifthRollNature.FAILURE, FifthRollNature.BESTIAL_FAILURE,
    ]);

    public constructor(
        public readonly margin: number | null,
        public readonly nature: FifthRollNature,
    ) {
        super();
        this.validate();
    }

    private validate() {
        if (this.margin === null) {
            if (!FifthRollResult.FAILING_NATURES.includes(this.nature)) {
                throw new Error(`Margin must be non-null on a successful result (${this.nature})`);
            }
        } else {
            if (!FifthRollResult.SUCCESSFUL_NATURES.includes(this.nature)) {
                throw new Error(`Margin (${this.margin}) must be null on a failing result (${this.nature})`);
            }
        }
    }

    public isSuccessful() { return this.margin !== null; }

    public get mapKey() {
        const { margin, nature } = this;
        const key = { margin, nature };
        return ImmutableRecord(key)(key);
    }

    private static NATURE_ORDERING_KEYS: Record<FifthRollNature, number> = {
        BESTIAL_FAILURE: -2, FAILURE: -1, WIN: 0, MESSY_CRITICAL: 1, CRITICAL_WIN: 2,
    } as const;

    public get orderingKey(): number[] {
        return [this.margin ?? -1, FifthRollResult.NATURE_ORDERING_KEYS[this.nature]];
    }
}


class FifthRollBreakdown {
    public readonly allDice: EffectCount;
    public readonly hungerDice: EffectCount;
    public readonly normalDice: EffectCount;
    public constructor(roll: RollEffect) {
        this.allDice = roll.count();
        this.hungerDice = roll.count(tags => tags.includes(DieTag.HUNGER));
        this.normalDice = roll.count(tags => !tags.includes(DieTag.HUNGER));
    }
    public get criticalPairs() { return Math.floor(this.allDice.criticalHits / 2); }
    public get bonusHits() { return this.criticalPairs * 2; }
    public get totalHits() { return this.allDice.totalHits + this.bonusHits; }
}

export type FifthGoalItem = ('empty' | 'hit' | 'bestial' | 'messy' | 'critical' | 'bonus');
export type FifthGoalNode = {
    item: FifthGoalItem;
    isWithinDifficulty: boolean;
};

export class FifthRollCondition extends RollCondition<FifthRollResult> {
    public constructor(
        private readonly dicePoolSize: number,
        public readonly difficulty: number,
        public readonly hungerDice: number,
    ) {
        super();
    }

    private static readonly HUNGER = makeThresholdRule(6, 10, 1);
    private static readonly NORMAL = makeThresholdRule(6, 10, 0);

    protected initializeDicePool(): DicePool {
        const hungerPart = new DicePoolPart(
            Math.min(this.dicePoolSize, this.hungerDice),
            FifthRollCondition.HUNGER,
            DieTag.HUNGER,
        );
        const normalPart = new DicePoolPart(
            Math.max(0, this.dicePoolSize - this.hungerDice),
            FifthRollCondition.NORMAL,
        );
        return new DicePool([hungerPart, normalPart]);
    }

    public resolveRoll(roll: RollEffect): FifthRollResult {
        const { hungerDice, criticalPairs, totalHits } = new FifthRollBreakdown(roll);
        let margin = totalHits - this.difficulty;
        if (margin < 0) {
            const nature = (hungerDice.criticalMisses > 0)
                ? FifthRollNature.BESTIAL_FAILURE
                : FifthRollNature.FAILURE;
            return new FifthRollResult(null, nature);
        } else {
            const nature = (criticalPairs > 0)
                ? (hungerDice.criticalHits > 0)
                    ? FifthRollNature.MESSY_CRITICAL
                    : FifthRollNature.CRITICAL_WIN
                : FifthRollNature.WIN;
            return new FifthRollResult(margin, nature);
        }
    }

    public *buildGoalView(report: RollReport<FifthRollResult>): Iterable<FifthGoalNode> {
        const { difficulty } = this;
        const { allDice, hungerDice, normalDice, bonusHits } = new FifthRollBreakdown(report.effect);

        let position = 0;
        function* emitNodes(count: number, item: FifthGoalItem): Generator<FifthGoalNode> {
            for (let i = 0; i < count; i++) {
                const isWithinDifficulty = (position++) < difficulty;
                yield { item, isWithinDifficulty } as const;
            }
        }

        yield* emitNodes(hungerDice.criticalHits, 'messy');
        yield* emitNodes(normalDice.criticalHits, 'critical');
        yield* emitNodes(allDice.normalHits, 'hit');
        yield* emitNodes(bonusHits, 'bonus');
        yield* emitNodes(hungerDice.criticalMisses, 'bestial');
        yield* emitNodes(difficulty - position, 'empty');
    }
}
