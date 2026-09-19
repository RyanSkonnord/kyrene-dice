import "./Roll.scss";

import { DieReport } from "../gamerules/dice";
import { RollCondition, RollReport, RollResult } from '../gamerules/rolls';
import { rollDice } from "../util/rng";
import { RuleSystem } from "./baserules";
import DieGraphic from './DieGraphic';
import ProbabilityChart from './ProbabilityChart';
import { RollSpec } from "./Roller";
import { useState } from "react";
import { useGlobalPreferences } from "../globalPreference";


export abstract class RollReportOutput<R extends RollResult, C extends RollCondition<R>> {
    public abstract renderConditionAsPlainText(condition: C): string;

    public renderCondition(condition: C): React.ReactNode {
        return this.renderConditionAsPlainText(condition);
    }

    public renderDie(die: DieReport, index: number, condition: C): React.ReactNode {
        return <DieGraphic key={index} die={die} />;
    }

    protected renderDiceAsPlainText(dice: Iterable<DieReport>): string {
        return Array.from(dice).map(die => `[${die.face}]`).join(' ');
    }

    public abstract renderResultAsPlainText(report: RollReport<R>, condition: C): string;

    public renderResult(report: RollReport<R>, condition: C): React.ReactNode {
        return this.renderResultAsPlainText(report, condition);
    }

    public exportResultAsPlainTextBlock(report: RollReport<R>, condition: C): string[] {
        return [
            this.renderConditionAsPlainText(condition),
            this.renderDiceAsPlainText(report.dice),
            this.renderResultAsPlainText(report, condition),
        ]
    }
}

/**
 * Using already-rolled dice if available, set up an array of the correct number of dice for a
 * roll condition.
 * 
 * The length of `dice` may be any length: zero, if the roll is being newly initialized; greater
 * than the dice pool, if it has been amended downward; or less, if upward. If we have more dice
 * than we need, return an appropriately sized slice. If we have fewer dice than we need, we will
 * generate those numbers now and push them onto the array as a side effect.
 * 
 * @param dice a mutable array of any length containing raw die face numbers
 * @param rollCondition the roll condition that defines the number of needed dice
 * @returns a slice of `dice` containing the correct number of dice for the condition
 */
function coerceDiceToCorrectLength(dice: number[], rollCondition: RollCondition<any>): number[] {
    let relevantDiceCount;

    // This may loop for multiple iterations because rerolls can lead to more rerolls, 
    // as in a hot streak of "10 agains" in CoD.
    while ((relevantDiceCount = rollCondition.calculateRelevantDice(dice)) > dice.length) {
        const newDice = rollDice(relevantDiceCount - dice.length, rollCondition.dieSize);
        dice.push(...newDice);
    }

    return dice.slice(0, relevantDiceCount);
}

export type RollItem = {
    key: string;
    timestamp: number;
    spec: RollSpec;
    dice: number[];
    isBeingAmended: boolean;
}

type RollProps = {
    ruleSystem: RuleSystem<any, RollCondition<any>>,
    item: RollItem;
    changeAmendMode: (key: string | null) => void;
};
export default function Roll({
    ruleSystem,
    item: { key, timestamp, spec, dice, isBeingAmended },
    changeAmendMode,
}: RollProps) {
    const { globalPreferences: { probabilityDefaultVisibility } } = useGlobalPreferences();
    const [probTableVisibility, setProbTableVisibility] = useState(probabilityDefaultVisibility === 'showChart');

    const condition = ruleSystem.makeRollCondition(spec);
    const relevantDice = coerceDiceToCorrectLength(dice, condition);
    const report = condition.evaluateRawDice(relevantDice);
    const output = ruleSystem.rollOutput;

    const diceRows = Array.from((function* () {
        const rowSize = 10;
        const { dice } = report;
        const rowCount = Math.ceil(dice.size / rowSize);
        for (let rowIndex = 0; rowIndex < rowCount; rowIndex++) {
            yield dice.slice(
                rowSize * rowIndex,
                Math.min(dice.size, rowSize * (rowIndex + 1)),
            );
        }
    })());

    function ClipboardExportButton() {
        // Two options for Markdown appearance. Might make configurable later.
        const markdownStyles: Record<string, (lines: string[]) => string> = {
            'mono': (lines => ['```', ...lines, '```'].join('\n')),
            'quote': (lines => lines.map(line => '> ' + line).join('  \n')),
        };
        const style = markdownStyles['quote'];

        async function writeToClipboard() {
            const lines = output.exportResultAsPlainTextBlock(report, condition);
            const text = style(lines) + '\n';
            await navigator.clipboard.writeText(text);
            // TODO: Show async feedback?
        }

        return <div className="ClipboardExportButton">
            <button onClick={writeToClipboard}>
                Copy to Clipboard
            </button>
        </div>;
    }

    return (<div className="Roll">
        <div className="rollReport">
            <label className="amendButton">
                <input type="checkbox" checked={isBeingAmended}
                    onChange={(event) => {
                        if (event.target.checked) {
                            // A new roll (this one) was just marked for amendment. As a side 
                            // effect, unmark all other rolls and update the input panel to match
                            // this roll's parameters and flags.
                            changeAmendMode(key);
                        } else {
                            // This roll was just cleared from amend mode.
                            changeAmendMode(null);
                        }
                    }}
                />
                Amend
            </label>

            <div className="rollCondition">
                {output.renderCondition(condition)}
            </div>

            <div className="diceTray">
                {diceRows.map((row, rowIndex) => (
                    <div className="diceRow" key={rowIndex}>
                        {row.map((die, index) => (
                            <span className="die" key={index}>
                                {output.renderDie(die, index, condition)}
                            </span>
                        ))}
                    </div>
                ))}
            </div>

            <div className="rollResult">
                {output.renderResult(report, condition)}
            </div>

            <ClipboardExportButton />
        </div>

        {
            (probTableVisibility || probabilityDefaultVisibility !== 'hideButton') &&
            <div className="rollProbability">
                {probTableVisibility
                    ? (<div className="rollProbabilityDisplay">
                        <button onClick={() => setProbTableVisibility(false)}>
                            Hide Probability
                        </button>
                        <ProbabilityChart key={key} ruleSystem={ruleSystem} spec={spec} report={report} />
                    </div>)
                    : (<div className="rollProbabilityPrompt">
                        <button onClick={() => setProbTableVisibility(true)}>
                            Show Probability
                        </button>
                    </div>)
                }
            </div>
        }
    </div>);
};