import './ProbabilityChart.scss';

import { isEqual } from 'lodash';
import { useMemo } from 'react';

import { RollProbabilityDistribution } from "../gamerules/probability";
import { RollCondition, RollReport, RollResult } from "../gamerules/rolls";
import { formatPercentagesWithCommonPrecision } from "../util/percentages";
import { RuleSystem } from "./baserules";
import { RollSpec } from './Roller';
import { ROW_INDICATOR } from './util/symbols';
import { createHyperbolicColorScheme } from '../util/hyperbolic';
import Color from '../util/Color';

export function trimAllButLast<T>(elements: T[], predicate: (element: T) => boolean): T[] {
    if (elements.length < 2 || !predicate(elements.at(-1)!)) { return elements; }
    let cutoff: number;
    for (cutoff = elements.length - 2; cutoff >= 0; cutoff--) {
        if (!predicate(elements[cutoff])) { break; }
    }
    return elements.slice(0, cutoff + 2);

}

export abstract class ProbabilityReportOutput<R extends RollResult, C extends RollCondition<R>> {
    // Not needed if renderTable is overridden? TODO: Refactor.
    public abstract renderResult(result: R, condition: C): React.ReactNode;

    protected static readonly SUCCESS_COLOR_PROGRESSION = createHyperbolicColorScheme(
        Color.fromCss("#FFFFFF"),
        1,
        Color.fromCss("#F0FEFE"),
        Color.fromCss("#ADD8E6"),
    );

    public renderTable(distribution: RollProbabilityDistribution<R>, actualResult: R | null, condition: C): React.ReactElement {
        const parentOutput = this;

        function* unrollGroups() {
            for (const group of distribution.accumulateEvents()) {
                const { events, atLeast, atBest } = group;
                for (const event of events) {
                    const { result, probability } = event;
                    yield { result, probability, atLeast, atBest };
                }
            }
        }

        const rawRows = Array.from(unrollGroups());

        const percentageFormat = formatPercentagesWithCommonPrecision([
            distribution.totalFailureProbability,
            distribution.totalSuccessProbability,
            ...rawRows.flatMap(
                (group) => [group.probability, group.atLeast, group.atBest]
            ),
        ]);

        type DisplayRow = {
            result: R;
            probability: string;
            accumulation: string;
        };

        function buildDisplayRows(): DisplayRow[] {
            const displayRows = rawRows.map((row) => {
                const { result, probability } = row;
                return {
                    result,
                    probability: percentageFormat(probability),
                    accumulation: percentageFormat(row.atLeast),
                }
            });

            // If more than one row is a "<0.1%" probability, show only one.
            return trimAllButLast(displayRows, ({ probability }) => probability.startsWith("<"));
        }

        const displayRows = buildDisplayRows();
        const [failRows, successRows] = [false, true].map(target => displayRows.filter(
            ({ result }) => (result.isSuccessful() === target)
        ));
        const hasRowIndicator = actualResult !== null;
        const actualKey = (actualResult && actualResult.orderingKey);

        type ProbabilityRowProps = { row: DisplayRow, index: number };
        function ProbabilityRow({ row, index }: ProbabilityRowProps): React.ReactElement {
            const { result, probability, accumulation } = row;

            const isSuccess = result.isSuccessful();
            const isActualResult = isEqual(actualKey, result.orderingKey);
            const resultText = parentOutput.renderResult(result, condition);

            const classNames = ["ProbabilityRow"];
            classNames.push(result.isSuccessful() ? "successRow" : "failRow");
            if (isActualResult) { classNames.push("actualResult") };

            const style = isSuccess
                ? { backgroundColor: ProbabilityReportOutput.SUCCESS_COLOR_PROGRESSION(index).toString() }
                : {};

            return (<tr className={classNames.join(' ')} key={index} style={style}>
                {hasRowIndicator && <td className="rowIndicator">{isActualResult && ROW_INDICATOR}</td>}
                <td className="result">{resultText}</td>
                {isSuccess && <td className="probability accumulation">{accumulation}</td>}
                <td className="probability exact" colSpan={isSuccess ? 1 : 2}>{probability}</td>
            </ tr>);
        }

        return (<table className="ProbabilityTable">
            <tbody>
                {(failRows.length > 1) &&
                    <tr className="failRow sectionHeader">
                        {hasRowIndicator && <th className="rowIndicator" />}
                        <th className="result">Any Failure</th>
                        <th />
                        <th className="probability ">
                            {percentageFormat(distribution.totalFailureProbability)}
                        </th>
                    </tr>
                }
                {failRows.map((row, index) => <ProbabilityRow key={index} index={index} row={row} />)}
            </tbody>
            <tbody>
                {(successRows.length > 0) &&
                    < tr className="successRow sectionHeader">
                        {hasRowIndicator && <th className="rowIndicator" />}
                        <th className="result" />
                        <th className="probability accumulation">At Least</th>
                        <th className="probability exact">Exactly</th>
                    </tr>}
                {successRows.map((row, index) => <ProbabilityRow key={index} index={index} row={row} />)}
            </tbody>
        </table >);
    }
}

type ProbabilityChartProps<R extends RollResult, C extends RollCondition<R>> = {
    ruleSystem: RuleSystem<R, C>,
    spec: RollSpec,
    report?: RollReport<R>,
};
export default function ProbabilityChart<R extends RollResult, C extends RollCondition<R>>(
    { ruleSystem, spec, report }: ProbabilityChartProps<R, C>
): React.ReactElement {
    const condition = ruleSystem.makeRollCondition(spec);
    const output = ruleSystem.probabilityOutput;
    const actualResult = report ? report.result : null;

    const distribution: RollProbabilityDistribution<R> = useMemo(
        () => RollProbabilityDistribution.calculateFrom<R>(condition),
        [ruleSystem, spec],
    );

    return (<div className="ProbabilityChart">
        {output.renderTable(distribution, actualResult, condition)}
    </div>);
}
