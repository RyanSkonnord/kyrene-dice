import { List, OrderedMap } from "immutable";

/**
 * @param n a natural number
 * @returns log(n!)
 */
export const getLogarithmicFactorial: (n: number) => number = (() => {
    const memo = [0];
    return (n: number) => {
        if (!Number.isSafeInteger(n) || n < 0) {
            throw new Error(`Must be a natural number: ${n}`);
        }
        while (memo.length <= n) {
            const index = memo.length;
            const last = memo[index - 1];
            memo.push(last + Math.log(index));
        }
        return memo[n];
    };
})();

export type EventCount<T> = { event: T; count: number; };
export type MultinomialOutcome<T> = List<EventCount<T>>;

/**
 * Generate the set of all possible outcome multisets. It will yield every possible multiset made 
 * up of the values in `events` with size equal to `numberOfTrials`.
 * 
 * For example: I roll ten dice, each with red, green, and blue faces. To enumerate each possible
 * distribution of the three colors (each of which would add up to ten), do
 *     generateMultinomialOutcomes(10, ['red', 'green', 'blue'])
 * 
 * The total count of yielded outcomes is equal to (N+k)! / (N!*k!), where N is `numberOfTrials`
 * and k is `events.length - 1`.
 * 
 * @param numberOfTrials the total number of events to pick, allowing duplicates
 * @param events a set of distinct events
 */
export function* generateMultinomialOutcomes<T>(
    numberOfTrials: number, events: T[]
): IterableIterator<MultinomialOutcome<T>> {
    if (!Number.isSafeInteger(numberOfTrials) || numberOfTrials < 0) {
        throw new Error(`Must be a natural number: ${numberOfTrials}`);
    }
    if (events.length < 1 && numberOfTrials > 0) {
        throw new Error("Must have at least one event");
    }

    class PartialOutcome {
        constructor(
            readonly eventCounts: List<EventCount<T>>,

            /**
             * The number of unique events represented by this object. Each event in `events` at
             * a lower index than this number has already been covered. Equivalently, it's what
             * the length of `eventCounts` would be, if it included events with a count of 0.
             */
            readonly cardinality: number,
        ) { }

        static readonly EMPTY = new PartialOutcome(List(), 0);

        /**
         * Among events not yet added to this outcome, the total remaining event count needed to
         * reach `numberOfTrials`.
         */
        get remainingCapacity(): number {
            return this.eventCounts.reduce(
                (capacity, { count }) => (capacity - count),
                numberOfTrials,
            );
        }

        /**
         * Add a new count for a single event to the outcome being built.
         */
        fork(event: T, count: number): PartialOutcome {
            return new PartialOutcome(
                (count > 0) ? this.eventCounts.push({ event, count }) : this.eventCounts,
                this.cardinality + 1,
            );
        }

        isIncomplete(): boolean {
            return this.cardinality < events.length - 1;
        }
    }

    const stack: PartialOutcome[] = [PartialOutcome.EMPTY];
    let current: PartialOutcome | undefined;
    while (current = stack.pop()) {
        const eventToAdd = events[current.cardinality];
        const { remainingCapacity } = current;
        if (current.isIncomplete()) {
            for (let countToAdd = 0; countToAdd <= remainingCapacity; countToAdd++) {
                const next = current.fork(eventToAdd, countToAdd);
                stack.push(next);
            }
        } else {
            const next = current.fork(eventToAdd, remainingCapacity);
            yield next.eventCounts;
        }
    }
}

/**
 * A probability distribution for a certain number of independent trials picking from a set of
 * events with individually weighted probabilities.
 * 
 * For example, you have ten dice, each of which has one red face, six green faces, and three
 * blue faces. This class would model the likelihood of each possible outcome of rolling all
 * ten dice at once (such as "two reds, five greens, and three blues," which has a probability of
 * about 5.3%).
 */
export class MultinomialDistribution<T> {
    private readonly normalizedLogProbabilities: OrderedMap<T, number>;

    /**
     * @param numberOfTrials the total number of events to pick in each outcome
     * @param eventProbabilities the set of each possible event and its probability per trial
     */
    public constructor(
        public readonly numberOfTrials: number,
        eventProbabilities: { event: T; probability: number; }[],
    ) {
        const totalProbability = eventProbabilities.reduce(
            (prev, { probability }) => {
                if (probability < 0) {
                    throw new Error(`Probabilities can't be negative: ${probability}`);
                }
                return prev + probability;
            },
            0,
        );
        if (totalProbability === 0 && numberOfTrials > 0) {
            throw new Error("Must have a nonzero probability");
        }

        this.normalizedLogProbabilities = OrderedMap<T, number>(eventProbabilities
            .flatMap(({ event, probability }): [T, number][] => {
                if (probability === 0) { return []; }
                const normalizedLogProbability = Math.log(probability / totalProbability);
                return [[event, normalizedLogProbability]];
            }));
    }

    /**
     * @returns the set of all outcomes (with nonzero probability) in this distribution
     */
    public generateMultinomialOutcomes(): IterableIterator<MultinomialOutcome<T>> {
        return generateMultinomialOutcomes(
            this.numberOfTrials,
            Array.from(this.normalizedLogProbabilities.keys()),
        );
    }

    /**
     * Calculate the probability of one outcome in this distribution.
     * 
     * Only outcomes yielded by `this.generateMultinomialOutcomes()` will have a nonzero 
     * probability when passed to this method.
     * 
     * @param outcome a multinomial outcome
     * @returns its probability in this distribution
     */
    public calculateProbabilityOf(outcome: MultinomialOutcome<T>): number {
        const totalCount = outcome.reduce((sum, { count }) => (sum + count), 0);
        if (totalCount !== this.numberOfTrials) {
            // An outcome with the wrong number of trials is not in the distribution and thus has
            // a probability of 0.
            return 0;
        }

        /*
         * The mathematical formula here is:
         *   probability of this outcome
         *     equals
         *   numberOfTrials! / (∏ (count!) for all events)
         *     times
         *   (∏ (probability ** count) for all events)
         *
         * To keep the intermediate numbers small, we work with the logarithms of everything. Add
         * instead of multiplying; multiply instead of exponentiating; apply Math.exp when we're
         * done to convert back to the actual value.
         */
        let outcomeLogProb = getLogarithmicFactorial(this.numberOfTrials);
        for (const { event, count } of outcome) {
            const eventLogProb = this.normalizedLogProbabilities.get(event);
            if (eventLogProb === undefined) {
                // An event not in the table has a probability of 0, therefore the entire 
                // outcome's probability is also 0.
                return 0;
            }
            outcomeLogProb -= getLogarithmicFactorial(count);
            outcomeLogProb += count * eventLogProb;
        }

        return Math.exp(outcomeLogProb);
    }

    /**
     * Iterate over all outcomes in this distribution and their probabilities.
     */
    public *calculateFullDistribution(): IterableIterator<
        { outcome: MultinomialOutcome<T>; probability: number; }
    > {
        for (const outcome of this.generateMultinomialOutcomes()) {
            const probability = this.calculateProbabilityOf(outcome);
            yield { outcome, probability };
        }
    }
}
