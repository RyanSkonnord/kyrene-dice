import { List, Map, Record } from "immutable";

import { MultinomialDistribution, MultinomialOutcome } from "../util/multinomial";
import { formatPercentagesWithCommonPrecision } from "../util/percentages";
import { comparingVectorKeys } from "../util/sort";
import { DicePoolPart, DieEffect, EffectiveDie } from "./dice";
import { RollCondition, RollEffect, RollResult } from "./rolls";

export class RollEvent<R extends RollResult> {
    public constructor(
        public readonly result: R,
        public readonly probability: number,
    ) { }
}

export class RollProbabilityDistribution<R extends RollResult> {
    private constructor(
        public readonly events: List<RollEvent<R>>,
    ) { }

    public static calculateFrom<R extends RollResult>(
        rollCondition: RollCondition<R>,
        rerollIterationLimit: number = 6,
        rerollProbabilityLimit: number = 1e-4,
    ): RollProbabilityDistribution<R> {
        const allDieFaces = rollCondition.getAllDieFaces();

        class MutableDistribution<T extends (RollEffect | R)> {
            constructor(
                private probabilities: Map<(number | Record<any>), { result: T, probability: number }> = Map(),
            ) { }

            get totalProbability(): number {
                return this.probabilities.valueSeq()
                    .reduce((sum, { probability }) => (sum + probability), 0);
            }

            entries(): IterableIterator<{ result: T; probability: number; }> {
                return this.probabilities.values();
            }

            add(resultToAdd: T, probabilityToAdd: number): this {
                this.probabilities = this.probabilities.update(
                    resultToAdd.mapKey,
                    { result: resultToAdd, probability: 0 },
                    ((prev) => ({
                        result: resultToAdd,
                        probability: prev.probability + probabilityToAdd,
                    })),
                );
                return this;
            }

            normalize(): this {
                const { totalProbability } = this;
                this.probabilities = this.probabilities.map(({ result, probability }) => ({
                    result,
                    probability: probability / totalProbability,
                }));
                return this;
            }
        }

        class PartDistribution {
            public readonly distribution: List<{
                outcome: MultinomialOutcome<DieEffect>;
                probability: number;
            }>;
            constructor(public readonly part: DicePoolPart) {
                const effects = PartDistribution.countEffects(part);
                this.distribution = List(new MultinomialDistribution(part.count, effects)
                    .calculateFullDistribution()
                );
            }

            public static readonly EMPTY = new PartDistribution(DicePoolPart.EMPTY);

            private static countEffects(part: DicePoolPart): { event: DieEffect; probability: number; }[] {
                if (part.count === 0) { return []; }
                const counts = Map<DieEffect, number>().withMutations((mutable) => {
                    for (const face of allDieFaces) {
                        const effect = part.evaluateFace(face);
                        mutable.update(effect, 0, (prev => prev + 1));
                    }
                })
                return Array.from(counts.entrySeq())
                    .map(([event, probability]) => ({ event, probability }));
            }
        }

        // A table of all logically equivalent rolls, mapped to their probability.
        // Initialize it with the base case: a roll of no dice at 100% probability.
        let rollEffectDistribution = new MutableDistribution<RollEffect>().add(RollEffect.from([]), 1);

        function addStage(
            getNextPart: (rollInProgress: RollEffect, probability: number) => PartDistribution,
        ): boolean {
            let wasModified = false;
            const nextStep = new MutableDistribution<RollEffect>()
            for (const { result: rollInProgress, probability: probInProgress } of rollEffectDistribution.entries()) {
                const { part, distribution } = getNextPart(rollInProgress, probInProgress);
                if (part.count === 0) {
                    nextStep.add(rollInProgress, probInProgress);
                } else {
                    wasModified = true;
                    for (const { outcome, probability } of distribution) {
                        let nextRoll = rollInProgress;
                        for (const { event, count } of outcome) {
                            const die = new EffectiveDie(event, part.tags);
                            nextRoll = nextRoll.add(die, count);
                        }
                        nextStep.add(nextRoll, probInProgress * probability)
                    }
                }
            }
            rollEffectDistribution = nextStep;
            return wasModified;
        }

        for (const part of rollCondition.dicePool) {
            const partDistribution = new PartDistribution(part);
            addStage(() => partDistribution);
        }

        let needToCheckForRerolls = rollCondition.dicePool.supportsRerolls();
        for (
            let rerollIterationCount = 0;
            needToCheckForRerolls && (rerollIterationCount < rerollIterationLimit);
            rerollIterationCount++
        ) {
            needToCheckForRerolls = addStage((rollInProgress, probability) => {
                if (probability < rerollProbabilityLimit) { return PartDistribution.EMPTY };
                const rerollPart = rollCondition.calculateReroll(rollInProgress);
                return new PartDistribution(rerollPart);
            })
        }

        let rollResultDistribution: MutableDistribution<R> = new MutableDistribution<R>()
        for (const { result: roll, probability } of rollEffectDistribution.entries()) {
            const result = rollCondition.resolveRoll(roll);
            rollResultDistribution = rollResultDistribution.add(result, probability);
        }

        const finalDistribution = List(rollResultDistribution.entries())
            .sort(comparingVectorKeys(({ result }) => result.orderingKey));
        return new RollProbabilityDistribution<R>(finalDistribution);
    }

    public get totalFailureProbability(): number {
        return this.events.reduce((sum, { result, probability }) => {
            const failProbability = result.isSuccessful() ? 0 : probability;
            return sum + failProbability;
        }, 0);
    }

    public get totalSuccessProbability(): number {
        /*
         * The sum of all probabilities will be slightly less than 1 in systems such as CoD that
         * allow for an unlimited number of rerolls, as we cut off populating the distribution with
         * very unlikely events.
         *
         * Due to the game rules, these missing events will generally be successes. The difference
         * should be small enough to disappear into the rounding we will do at the display layer
         * anyway. But, it is slightly more correct to define success as 1 minus failures than the
         * other way around.
         */
        return 1 - this.totalFailureProbability;
    }

    public *accumulateEvents(): IterableIterator<EventGroup<R>> {
        const { events } = this;

        function* groupEventsByFirstOrderingKey() {
            let lastSeenKey: number | null = null;
            let eventsWithLastSeenKey: RollEvent<R>[] = [];

            function* flush() {
                if (lastSeenKey === null) { throw new Error(); }
                if (eventsWithLastSeenKey.length) {
                    yield {
                        key: lastSeenKey,
                        events: List(eventsWithLastSeenKey),
                    }
                    eventsWithLastSeenKey = [];
                }
            }

            for (const event of events) {
                const [key] = event.result.orderingKey;
                if (key !== lastSeenKey) {
                    if (eventsWithLastSeenKey.length) {
                        yield* flush();
                    }
                }
                lastSeenKey = key;
                eventsWithLastSeenKey.push(event);
            }
            yield* flush();
        }

        let atLeast = 1;
        let atBest = 0;
        for (const { key, events } of groupEventsByFirstOrderingKey()) {
            const isSuccessful = events.get(0)!.result.isSuccessful();
            if (events.slice(1).some((event) => event.result.isSuccessful() !== isSuccessful)) {
                throw new Error("Grouped events must all have the same success status");
            }

            const totalProbability = events.reduce((sum, { probability }) => (sum + probability), 0);
            atBest += totalProbability;
            yield { key, isSuccessful, events, totalProbability, atLeast, atBest };
            atLeast -= totalProbability;
        }
    }
}

export type EventGroup<R extends RollResult> = {
    key: number,
    isSuccessful: boolean;
    events: List<RollEvent<R>>;
    totalProbability: number;
    atLeast: number;
    atBest: number;
};

export abstract class ProbabilityTableRenderer<R extends RollResult> {
    protected abstract getKey(result: R): number;
    protected abstract getLabel(result: R): string;

    public renderAsPlainText(table: RollProbabilityDistribution<R>): string {
        const rollPercentages: [R, number][] = Array.from(table.events)
            .map(({ result: roll, probability: prob }): [R, number] => [roll, prob]);

        const anySuccessProb = rollPercentages.reduce(
            (sum, [roll, prob]) => sum + (roll.isSuccessful() ? prob : 0),
            0);

        const percentageFormatter = formatPercentagesWithCommonPrecision(
            [anySuccessProb, ...rollPercentages.map(([_, p]) => p)]
        );

        function tableLine(label: string, value: number): string[] {
            let percentage = percentageFormatter(value);
            return [label.padStart(11), ' ', percentage.padStart(7)]
        }

        const text: string[] = [];
        text.push(...tableLine("Any Success", anySuccessProb));
        rollPercentages.forEach(([result, probability], index) => {
            text.push('\n');
            const label = this.getLabel(result);
            text.push(...tableLine(label, probability));
        });

        return text.join('');
    }
}
