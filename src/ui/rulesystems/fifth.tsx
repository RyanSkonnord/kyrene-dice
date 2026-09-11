import "./FifthRollReportOutput.scss";

import { Map } from "immutable";

import { EventGroup, RollEvent, RollProbabilityDistribution } from "../../gamerules/probability";
import { RollReport } from "../../gamerules/rolls";
import { FifthRollCondition, FifthRollNature, FifthRollResult } from "../../gamerules/rulesystems/fifth";
import { formatPercentagesWithCommonPrecision } from "../../util/percentages";
import { RollNumericParameter, RollParameter, RuleSystem } from "../baserules";
import GoalViz from "../GoalViz";
import { ProbabilityReportOutput, trimAllButLast } from "../ProbabilityChart";
import { RollReportOutput } from "../Roll";
import { RollSpec } from "../Roller";
import { COLUMN_INDICATOR, NATURE_EMOJIS, ROW_INDICATOR } from "../util/symbols";
import { PluralWord } from "../util/words";

const NATURE_LABELS: Record<FifthRollNature, string> = {
    [FifthRollNature.FAILURE]: "Failure",
    [FifthRollNature.WIN]: "Win",
    [FifthRollNature.CRITICAL_WIN]: "Critical Win",
    [FifthRollNature.BESTIAL_FAILURE]: "Bestial Failure",
    [FifthRollNature.MESSY_CRITICAL]: "Messy Critical",
};

export class FifthRuleSystem extends RuleSystem<FifthRollResult, FifthRollCondition> {
    public constructor() {
        super('fifth', "Fifth Edition");
    }

    public get rollParameters(): RollParameter<any>[] {
        return [
            new RollNumericParameter('dicePool', "Dice Pool", 1, 1, 20),
            new RollNumericParameter('hungerDice', "Hunger Dice", 0, 0, 5),
            new RollNumericParameter('difficulty', "Difficulty", 1, 1, 10),
        ];
    }

    public makeRollCondition(spec: RollSpec): FifthRollCondition {
        return new FifthRollCondition(
            spec.dicePool as number,
            spec.difficulty as number,
            spec.hungerDice as number,
        );
    }

    public get rollOutput(): RollReportOutput<FifthRollResult, FifthRollCondition> {
        return new FifthRollReportOutput();
    }

    public get probabilityOutput(): ProbabilityReportOutput<FifthRollResult, FifthRollCondition> {
        return new FifthProbabilityReportOutput();
    }
}

class FifthRollReportOutput extends RollReportOutput<FifthRollResult, FifthRollCondition> {
    public renderCondition(condition: FifthRollCondition): React.ReactNode {
        const { totalDice } = condition;
        return (<span>
            Rolled {totalDice} {PluralWord.DIE.say(totalDice)}{' '}
            at difficulty {condition.difficulty} with {condition.hungerDice} Hunger
        </span>);
    }

    public renderResult(report: RollReport<FifthRollResult>, condition: FifthRollCondition): React.ReactNode {
        const { result } = report;
        const { margin, nature } = result;

        const nodes = Array.from(condition.buildGoalView(report));

        return (<span>
            <GoalViz nodes={nodes} />
            {NATURE_EMOJIS[nature]} {NATURE_LABELS[nature]}
            {result.isSuccessful() && ` with a margin of ${margin}`}
        </span>);
    }
}

class FifthProbabilityReportOutput extends ProbabilityReportOutput<FifthRollResult, FifthRollCondition> {
    private static NATURE_WORDS: Record<FifthRollNature, string> = {
        BESTIAL_FAILURE: "Bestial Failure",
        FAILURE: "Failure",
        WIN: "Win",
        MESSY_CRITICAL: "Messy Critical",
        CRITICAL_WIN: "Critical Win",
    } as const;

    public renderResult({ margin, nature }: FifthRollResult): React.ReactNode {
        const natureWord = FifthProbabilityReportOutput.NATURE_WORDS[nature];
        const marginSuffix = (margin === null) ? '' : `: ${margin}`;
        return natureWord + marginSuffix;
    }

    public renderTable(
        distribution: RollProbabilityDistribution<FifthRollResult>,
        actualResult: FifthRollResult | null,
    ): React.ReactElement {
        type DisplayRow = {
            isSuccessful: boolean;
            margin?: number;
            totalProbability: number;
            accumulatedProbability?: number;
            probabilityOf: (nature: FifthRollNature) => number | undefined;
        };

        class ResultRow implements DisplayRow {
            private readonly byNature: Map<FifthRollNature, RollEvent<FifthRollResult>>;
            constructor(
                private readonly group: EventGroup<FifthRollResult>
            ) {
                this.byNature = Map<FifthRollNature, RollEvent<FifthRollResult>>(
                    this.group.events.map((event) => [event.result.nature, event])
                );
            }

            get isSuccessful() { return this.group.isSuccessful; }
            get margin() { return this.group.key; }
            get totalProbability() { return this.group.totalProbability; }
            get accumulatedProbability() { return this.group.atLeast; }

            get events() { return this.group.events; }
            probabilityOf(nature: FifthRollNature) { return this.byNature.get(nature)?.probability; }
        }
        let resultRows = Array.from(distribution.accumulateEvents())
            .map(group => new ResultRow(group));

        const percentageFormat = formatPercentagesWithCommonPrecision([
            distribution.totalFailureProbability,
            distribution.totalSuccessProbability,
            ...resultRows.flatMap((row) => [
                row.totalProbability, row.accumulatedProbability,
                ...row.events.map(({ probability }) => probability),
            ]),
        ]);

        resultRows = trimAllButLast(resultRows, ({ accumulatedProbability }) => (
            percentageFormat(accumulatedProbability).startsWith('<')
        ));

        const totalNatureDistribution = Map<FifthRollNature, number>().withMutations((mutable) => {
            resultRows.flatMap(({ events }) => Array.from(events))
                .forEach(({ result, probability }) => {
                    mutable.update(result.nature, 0, (prev => prev + probability));
                });
        });
        console.log(totalNatureDistribution.size);

        const failRow = resultRows[0];
        if (failRow.isSuccessful) { throw new Error(); }

        const successRows = resultRows.slice(1);
        if (successRows.some(row => !row.isSuccessful)) { throw new Error(); }

        const totalSuccess: DisplayRow = {
            isSuccessful: true,
            totalProbability: distribution.totalSuccessProbability,
            probabilityOf: (nature: FifthRollNature) => totalNatureDistribution.get(nature),
        }

        const hasActualResult = (actualResult !== null);

        type ProbabilityRowProps = { row: DisplayRow, index: number };
        function ProbabilityRow({ row, index }: ProbabilityRowProps): React.ReactElement {
            const { isSuccessful, margin, totalProbability, accumulatedProbability } = row;
            function probabilityOf(nature: FifthRollNature): number {
                return row.probabilityOf(nature) ?? 0;
            }

            const isActualResultRow = (actualResult !== null) && (
                (actualResult.margin === null)
                    ? !isSuccessful
                    : (actualResult.margin === margin)
            );
            const isOverallSuccessRow = isSuccessful && margin === undefined;

            const classNames = [
                "ProbabilityRow",
                (isSuccessful ? "successRow" : "failRow"),
                ...(isOverallSuccessRow ? ["overallSuccess"] : []),
            ];
            const style = (isOverallSuccessRow || !isSuccessful)
                ? {}
                : { backgroundColor: ProbabilityReportOutput.SUCCESS_COLOR_PROGRESSION(index).toString() };

            type ProbabilityCellProps = {
                valueKey: string,
                colSpan?: number,
                isTotal?: boolean,
                probability: number | undefined,
                isActualNature?: boolean,
            };
            function ProbabilityDatum({ valueKey, colSpan, isTotal, probability, isActualNature }: ProbabilityCellProps) {
                const classNames = [
                    "ProbabilityCell", "probability", valueKey,
                    ...(isTotal ? ["overall"] : []),
                    ...((isActualResultRow && isActualNature) ? ["actualResult"] : [])
                ];
                return (<td key={valueKey} className={classNames.join(' ')} colSpan={colSpan ?? 1}>
                    {percentageFormat(probability ?? 0)}
                </td>);
            }

            function* getProbabilityData(): Generator<React.ReactElement> {
                if (isSuccessful) {
                    if (isOverallSuccessRow) {
                        yield (<ProbabilityDatum valueKey="overall" colSpan={2} isTotal={true}
                            probability={totalProbability} />);
                    } else {
                        yield (<ProbabilityDatum valueKey="accumulation"
                            probability={accumulatedProbability}
                            isActualNature={isActualResultRow} />);
                        yield (<ProbabilityDatum valueKey="exact"
                            probability={totalProbability}
                            isActualNature={isActualResultRow} />);
                    }
                    yield (<ProbabilityDatum valueKey="normal"
                        probability={probabilityOf(FifthRollNature.WIN)}
                        isActualNature={actualResult?.nature === FifthRollNature.WIN} />);
                    yield (<ProbabilityDatum valueKey="anyCrit"
                        probability={
                            probabilityOf(FifthRollNature.MESSY_CRITICAL) +
                            probabilityOf(FifthRollNature.CRITICAL_WIN)
                        } />);
                    yield (<ProbabilityDatum valueKey="cleanCrit"
                        probability={probabilityOf(FifthRollNature.CRITICAL_WIN)}
                        isActualNature={actualResult?.nature === FifthRollNature.CRITICAL_WIN} />);
                    yield (<ProbabilityDatum valueKey="messy"
                        probability={probabilityOf(FifthRollNature.MESSY_CRITICAL)}
                        isActualNature={actualResult?.nature === FifthRollNature.MESSY_CRITICAL} />);
                } else {
                    yield (<ProbabilityDatum valueKey="exact" colSpan={2} isTotal={true}
                        probability={totalProbability} />);
                    yield (<ProbabilityDatum valueKey="normal" colSpan={2} isTotal={true}
                        probability={probabilityOf(FifthRollNature.FAILURE)}
                        isActualNature={actualResult?.nature === FifthRollNature.FAILURE} />);
                    yield (<ProbabilityDatum valueKey="messy" colSpan={2} isTotal={true}
                        probability={probabilityOf(FifthRollNature.BESTIAL_FAILURE)}
                        isActualNature={actualResult?.nature === FifthRollNature.BESTIAL_FAILURE} />);
                }
            }

            return (<tr className={classNames.join(' ')} key={index} style={style}>
                {hasActualResult && <td className="rowIndicator">{isActualResultRow && ROW_INDICATOR}</td>}
                <td key="result" className="result">
                    {isSuccessful && (row.margin ?? (isOverallSuccessRow && "Any"))}
                </td>
                {Array.from(getProbabilityData())}
            </ tr>);
        }

        function showColumnIndicatorIfNatureIs(nature: FifthRollNature): React.ReactNode {
            return (actualResult?.nature === nature) && (<span>{COLUMN_INDICATOR}</span>);
        }

        return (<table className="ProbabilityTable FifthProbabilityTable">
            <tbody>
                {(hasActualResult && !actualResult.isSuccessful()) &&
                    <tr className="failRow columnIndicator">
                        <th className="rowIndicator" />
                        <th className="result" />
                        <th className="exact" colSpan={2} />
                        <th className="normal" colSpan={2}>{showColumnIndicatorIfNatureIs(FifthRollNature.FAILURE)}</th>
                        <th className="messy" colSpan={2}>{showColumnIndicatorIfNatureIs(FifthRollNature.BESTIAL_FAILURE)}</th>
                    </tr>
                }
                <tr className="failRow sectionHeader">
                    {hasActualResult && <th className="rowIndicator" />}
                    <th className="result" />
                    <th className="exact" colSpan={2}>Failure</th>
                    <th className="normal" colSpan={2}>Normal Failure</th>
                    <th className="messy" colSpan={2}>Bestial Failure</th>
                </tr>
                <ProbabilityRow index={0} row={failRow} />
            </tbody>
            <tbody>
                {(hasActualResult && actualResult.isSuccessful()) &&
                    <tr className="successRow columnIndicator">
                        <th className="rowIndicator" />
                        <th className="result" />
                        <th colSpan={2} />
                        <th className="normal">{showColumnIndicatorIfNatureIs(FifthRollNature.WIN)}</th>
                        <th className="anyCrit" />
                        <th className="cleanCrit">{showColumnIndicatorIfNatureIs(FifthRollNature.CRITICAL_WIN)}</th>
                        <th className="messy">{showColumnIndicatorIfNatureIs(FifthRollNature.MESSY_CRITICAL)}</th>
                    </tr>
                }
                <tr className="successRow sectionHeader">
                    {hasActualResult && <th className="rowIndicator" />}
                    <th className="result">Margin</th>
                    <th colSpan={2}>Success</th>
                    <th className="normal">Normal<br />Win</th>
                    <th className="anyCrit">Any<br />Critical</th>
                    <th className="cleanCrit">&ldquo;Clean&rdquo;<br />Critical</th>
                    <th className="messy">Messy<br />Critical</th>
                </tr>

                <ProbabilityRow index={1} row={totalSuccess} />
                {(successRows.length > 0) &&
                    <tr className="successRow sectionMiniheader">
                        {hasActualResult && <th className="rowIndicator" />}
                        <th className="result" />
                        <th className="accumulation">At Least</th>
                        <th className="probability">Exactly</th>
                        <th className="normal" />
                        <th colSpan={3} />
                    </tr>
                }
                {successRows.map((row, index) => <ProbabilityRow index={index} row={row} />)}
            </tbody>
        </table>);
    }
}