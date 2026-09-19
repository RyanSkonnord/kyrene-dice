import { RollReport } from "../../gamerules/rolls";
import { CodRollCondition, CodRollResult } from "../../gamerules/rulesystems/cod";
import { RollNumericParameter, RollParameter, RollRadioParameter, RuleSystem } from "../baserules";
import { InfoLabel } from "../InfoLabel";
import { ProbabilityReportOutput } from "../ProbabilityChart";
import { RollReportOutput } from "../Roll";
import { RollSpec } from "../Roller";
import { PluralWord } from "../util/words";

export class CodRuleSystem extends RuleSystem<CodRollResult, CodRollCondition> {
    public constructor() {
        super('cod', "Chronicles of Darkness", (<span><em>Chronicles of Darkness</em></span>));
    }

    public get rollParameters(): RollParameter<any>[] {
        return [
            new RollNumericParameter('dicePool', "Dice Pool", 1, 1, 20),
            new RollNumericParameter('modifier', "Modifier", 0, -5, 5),
            new RollRadioParameter('reroll', "Reroll Threshold", '10', [
                {
                    key: '10', label: (
                        <InfoLabel
                            id='10again'
                            label="10-Again"
                        >
                            <p>
                                For each die showing a 10, roll another die, potentially adding
                                another success. Most rolls are made this way.
                            </p>
                        </InfoLabel>
                    )
                }, {
                    key: '9', label: (
                        <InfoLabel
                            id='9again'
                            label="9-Again"
                        >
                            <p>Roll another die for each die showing 9 or higher.</p>
                            <p>
                                This bonus is given for attack rolls with certain weapons, and by
                                Merits including Trained Observer, Hobbyist Clique, and Takes One
                                to Know One.
                            </p>
                        </InfoLabel>
                    )
                }, {
                    key: '8', label: (
                        <InfoLabel
                            id='8again'
                            label="8-Again"
                        >
                            <p>Roll another die for each die showing 8 or higher.</p>
                            <p>
                                This bonus is given by Merits including Iron Will, Mind of a
                                Madman, and the three-dot version of Trained Observer.
                            </p>
                        </InfoLabel>
                    )
                }, {
                    key: 'none', label: (
                        <InfoLabel
                            id='noneAgain'
                            label="None"
                        >
                            <p>Do not roll any additional dice, even for a 10.</p>
                            <p>
                                This permutation applies at the Storyteller's discretion, and
                                rarely as a result of some traits (such as the Covert Operative
                                Merit from the <em>Hurt Locker</em> supplement).
                            </p>
                        </InfoLabel>
                    )
                },
            ]),
        ];
    }

    public makeRollCondition(spec: RollSpec): CodRollCondition {
        const { dicePool, modifier, reroll } = spec as {
            dicePool: number,
            modifier: number,
            reroll: string,
        };
        const criticalHitThreshold = (reroll === 'none') ? null : parseInt(reroll);
        return new CodRollCondition(dicePool, modifier, criticalHitThreshold);
    }

    private static renderResultAsPlainText(result: CodRollResult): string {
        if (result.isDramaticFailure()) return "Dramatic Failure";
        if (!result.isSuccessful()) return "Failure";

        const successWord = PluralWord.SUCCESS.say(result.successCount, true);
        const successPrefix = result.isExceptionalSuccess() ? "Exceptional " : '';
        return `${successPrefix}${result.successCount} ${successWord}`;
    }

    public get rollOutput(): RollReportOutput<CodRollResult, CodRollCondition> {
        return new class extends RollReportOutput<CodRollResult, CodRollCondition> {
            public renderConditionAsPlainText(condition: CodRollCondition): string {
                const { actualDicePool } = condition;
                const tokens = [
                    "Rolled", actualDicePool,
                    (condition.isChanceDie() ? "chance" : null),
                    PluralWord.DIE.say(actualDicePool),
                ];
                return tokens.filter(t => t !== null).join(' ');
            }

            public renderResultAsPlainText(report: RollReport<CodRollResult>): string {
                return CodRuleSystem.renderResultAsPlainText(report.result);
            }
        }();
    }

    public get probabilityOutput(): ProbabilityReportOutput<CodRollResult, CodRollCondition> {
        return new class extends ProbabilityReportOutput<CodRollResult, CodRollCondition> {
            public renderResult(result: CodRollResult): React.ReactNode {
                return CodRuleSystem.renderResultAsPlainText(result);
            }
        }();
    }
}
