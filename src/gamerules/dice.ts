import { List, Map, Record, Set } from "immutable";
import { DieCount } from "./rolls";

export const WOD_DIE_SIZE = 10;

/**
 * The effect that the number showing on one die has on the overall roll.
 * 
 * This could logically be a generic type parameter to {@link RollCondition} similarly to
 * {@link RollResult}. But these values are general enough that we can get away with reusing
 * them across the implementations of different edition rules.
 */
export enum DieEffect {
    /**
     * A die that harms the outcome. Generally a 1.
     */
    CRITICAL_MISS = 'CRITICAL_MISS',

    /**
     * A die that falls below a success threshold and fails to help the outcome.
     */
    MISS = 'MISS',

    /**
     * A die that meets a success threshold and helps the outcome.
     */
    HIT = 'HIT',

    /**
     * A die that exceptionally helps the outcome. Generally a 10 but sometimes a 9 or even 8.
     */
    CRITICAL_HIT = 'CRITICAL_HIT',
}

export class EffectCount {
    private constructor(
        private readonly table: Map<DieEffect, number>,
    ) { }

    public static from(counts: Iterable<DieCount>): EffectCount {
        let table = Map<DieEffect, number>();
        for (const { die: { effect }, count } of counts) {
            table = table.update(effect, 0, (prev => prev + count));
        }
        return new EffectCount(table);
    }

    public get criticalMisses(): number {
        return this.table.get(DieEffect.CRITICAL_MISS, 0);
    }

    public get normalMisses(): number {
        return this.table.get(DieEffect.MISS, 0);
    }

    public get totalMisses(): number {
        return this.criticalMisses + this.normalMisses;
    }

    public get normalHits(): number {
        return this.table.get(DieEffect.HIT, 0);
    }

    public get criticalHits(): number {
        return this.table.get(DieEffect.CRITICAL_HIT, 0);
    }

    public get totalHits(): number {
        return this.criticalHits + this.normalHits;
    }
}

/**
 * Something that is unique about an individual die in the pool, as would be represented in
 * gameplay by a die of a different color.
 * 
 * As with {@link DieEffect}, these are logically bound to individual editions (Nightmare dice
 * are only in classic _Changeling_; Hunger dice are only in 5th Ed _Vampire_).
 */
export enum DieTag {
    AGAIN, NIGHTMARE, HUNGER
}

export type Die = {
    effect: DieEffect;
    tags: Set<DieTag>;
}

export class EffectiveDie implements Die {
    constructor(
        public readonly effect: DieEffect,
        public readonly tags: Set<DieTag> = Set(),
    ) { }
}

/**
 * Complete information describing an individual die that is part of an executed roll.
 */
export type DieReport = Die & {
    face: number;
};

// Stuff for the immutable lib
export const DieRecord = Record({ effect: DieEffect.MISS, tags: Set() } as Die);
export type DieRecord = ReturnType<typeof DieRecord>
export function dieRecordOf(die: Die): DieRecord {
    const { effect, tags } = die;
    return DieRecord({ effect, tags });
}

export type DieRule = (face: number) => DieEffect;

export function makeThresholdRule(
    successThreshold: number,
    criticalHitThreshold: number | null = null,
    criticalMissThreshold: number | null = 1,
): DieRule {
    return (face) => {
        if (criticalMissThreshold !== null && face <= criticalMissThreshold) {
            return DieEffect.CRITICAL_MISS;
        }
        if (criticalHitThreshold !== null && face >= criticalHitThreshold) {
            return DieEffect.CRITICAL_HIT;
        }
        return (face < successThreshold) ? DieEffect.MISS : DieEffect.HIT;
    }
}

export class DicePoolPart {
    public readonly tags: Set<DieTag>;
    public constructor(
        public readonly count: number,
        private readonly rule: DieRule,
        ...tags: DieTag[]
    ) {
        this.tags = Set(tags);
    }

    public evaluateFace(face: number): DieEffect {
        return this.rule(face);
    }


    public static readonly EMPTY = new DicePoolPart(0, () => {
        throw new Error("This DicePoolPart is empty")
    });
}

export class DicePool implements Iterable<DicePoolPart> {
    private readonly parts: List<DicePoolPart>;
    private readonly byDieIndex: List<DicePoolPart>;

    public constructor(
        parts: DicePoolPart[],
        public readonly rerollRule: DieRule | null = null,
    ) {
        this.parts = List(parts.filter(part => part.count > 0));

        this.byDieIndex = List(this.parts.flatMap((part) => (
            new Array(part.count).fill(part)
        )));
    }

    public static of(count: number, rule: DieRule): DicePool {
        return new DicePool([new DicePoolPart(count, rule)]);
    }

    *[Symbol.iterator](): Iterator<DicePoolPart> {
        yield* this.parts;
    }

    public get total(): number {
        return this.parts.reduce((sum, { count }) => (sum + count), 0);
    }

    public supportsRerolls(): boolean {
        return this.rerollRule !== null;
    }

    public getPartAtIndex(index: number): DicePoolPart {
        const part = this.byDieIndex.get(index);
        if (index >= this.byDieIndex.size) {
            if (this.rerollRule) {
                return new DicePoolPart(0, this.rerollRule);
            } else {
                throw new Error("Index outside of pool (no reroll rule)");
            }
        }
        if (part === undefined) { throw new Error(`Invalid index: ${index}`); }
        return part;
    }
}