import { List, Map, Record, Set } from "immutable";

import { rollDice } from "../util/rng";
import { DicePool, DicePoolPart, Die, DieRecord, dieRecordOf, DieReport, DieTag, EffectCount, WOD_DIE_SIZE } from "./dice";

export const DieCount = Record({ die: DieRecord(), count: 0 });
export type DieCount = ReturnType<typeof DieCount>;
export const RollRecord = Record({ dice: Set<DieCount>() });
export type RollRecord = ReturnType<typeof RollRecord>;

/**
 * A snapshot of a roll that ignores face numbers but represents the effect and tag set of each 
 * die, counted by unique values.
 */
export class RollEffect {
    private constructor(
        private readonly counts: Map<DieRecord, number>,
    ) { }

    public static from(dice: Iterable<Die>) {
        const counts = Map<DieRecord, number>().withMutations((mutable) => {
            for (const die of dice) {
                const key = dieRecordOf(die);
                mutable.update(key, 0, (prev => prev + 1));
            }
        });
        return new RollEffect(counts);
    }

    public count(filter: (tags: Set<DieTag>) => boolean = () => true): EffectCount {
        const dieCounts = this.counts.entrySeq().flatMap(([die, count]) => (
            filter(die.tags) ? [DieCount({ die, count })] : []
        ));
        return EffectCount.from(dieCounts);
    }

    public get total(): number {
        return this.counts.valueSeq().reduce((prev, count) => (prev + count), 0);
    }

    public get mapKey(): RollRecord {
        const dice = this.counts.entrySeq().map(([die, count]) => DieCount({ die, count }));
        return RollRecord({ dice: Set(dice) });
    }

    public add(die: Die, count: number = 1): RollEffect {
        // The immutable Map class is optimized in a way that provides O(log n) performance
        // (should be very close to O(1) in practice if n is not huge).
        const newCounts = this.counts.update(dieRecordOf(die), 0, (prev => prev + count));

        return new RollEffect(newCounts);
    }
}

export abstract class RollResult {
    public abstract isSuccessful(): boolean;

    public abstract get mapKey(): number | Record<any>;

    public get orderingKey(): number[] {
        const { mapKey } = this;
        if (typeof mapKey === 'number') { return [mapKey]; }
        throw new Error("Classes with a non-number mapKey must override orderingKey");
    };
}


export abstract class RollCondition<R extends RollResult> {
    public constructor(
        public readonly dieSize: number = WOD_DIE_SIZE,
    ) { }

    public getAllDieFaces(): number[] {
        return Array.from({ length: this.dieSize }, (_, index) => (index + 1));
    }

    private dicePoolCache: DicePool | null = null;
    protected abstract initializeDicePool(): DicePool;
    public get dicePool(): DicePool {
        return this.dicePoolCache ?? (this.dicePoolCache = this.initializeDicePool());
    }

    public get totalDice() { return this.dicePool.total; }

    public abstract resolveRoll(roll: RollEffect): R;

    public calculateRelevantDice(dice: number[]): number {
        let candidateLength = this.dicePool.total;
        while (candidateLength <= dice.length) {
            const { effect } = this.evaluateRawDice(dice.slice(0, candidateLength));
            const extraDice = this.calculateRerollDice(effect);
            if (extraDice === 0) break;
            candidateLength += extraDice;
        }
        return candidateLength;
    }

    public calculateRerollDice(roll: RollEffect): number { return 0; }

    public calculateReroll(roll: RollEffect): DicePoolPart {
        const rerollDice = this.calculateRerollDice(roll);
        if (rerollDice === 0) { return DicePoolPart.EMPTY; }
        const { rerollRule } = this.dicePool;
        if (rerollRule === null) {
            throw new Error("calculateRerollDice must return 0 if the dice pool doesn't have a rerollRule");
        }
        return new DicePoolPart(rerollDice, rerollRule);
    }

    private evaluateDie(face: number, index: number): DieReport {
        const part = this.dicePool.getPartAtIndex(index);
        const effect = part.evaluateFace(face);
        const { tags } = part;
        return { face, effect, tags };
    }

    public evaluateRawDice(dice: number[]): RollReport<R> {
        const reports = dice.map((face, index): DieReport => this.evaluateDie(face, index));
        return RollReport.from(reports, this);
    }

    public generateRoll(existingDice: number[] = []): RollReport<R> {
        const dice = [...existingDice];
        const initialNeededDice = this.dicePool.total - dice.length;
        if (initialNeededDice > 0) {
            dice.push(...rollDice(initialNeededDice, this.dieSize));
        }
        while (true) {
            const report = this.evaluateRawDice(dice);
            const extraDice = this.calculateRerollDice(report.effect);
            if (extraDice > 0) {
                dice.push(...rollDice(extraDice, this.dieSize));
            } else {
                return report;
            }
        }
    }
}

export class RollReport<R extends RollResult> {
    private constructor(
        public readonly dice: List<DieReport>,
        public readonly effect: RollEffect,
        public readonly result: R,
    ) { }

    public static from<R extends RollResult>(dice: DieReport[], condition: RollCondition<R>) {
        const effect = RollEffect.from(dice);
        const result = condition.resolveRoll(effect);

        function addRerollTag(): List<DieReport> {
            const rerollThreshold = condition.totalDice;
            return (dice.length <= rerollThreshold)
                ? List(dice)
                : List(dice.map((die, index) => {
                    if (index < rerollThreshold) { return die; }
                    const { face, effect, tags } = die;
                    return { face, effect, tags: tags.add(DieTag.AGAIN) };
                }));
        }

        const massagedDice = addRerollTag();
        return new RollReport<R>(massagedDice, effect, result);
    }
}
