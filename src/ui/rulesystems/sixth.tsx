import { RollReport } from "../../gamerules/rolls";
import { SixthRollCondition, SixthRollResult } from "../../gamerules/rulesystems/sixth";
import { RollNumericParameter, RollParameter, RuleSystem } from "../baserules";
import { ProbabilityReportOutput } from "../ProbabilityChart";
import { RollReportOutput } from "../Roll";
import { RollSpec } from "../Roller";
import { MINUS } from "../util/symbols";
import { PluralWord } from "../util/words";

export class SixthRuleSystem extends RuleSystem<SixthRollResult, SixthRollCondition> {
    public constructor() {
        super('sixth', "Sixth Edition");
    }

    public get rollParameters(): RollParameter<any>[] {
        return [
            new RollNumericParameter('dicePool', "Dice Pool", 1, 1, 20),
            new RollNumericParameter('difficulty', "Difficulty", 0, 1, 10),
        ];
    }

    public makeRollCondition(spec: RollSpec): SixthRollCondition {
        return new SixthRollCondition(spec.dicePool as number, spec.difficulty as number);
    }

    private static renderResult(result: SixthRollResult, condition: SixthRollCondition): string {
        if (!condition.totalDice) return "Not Attempted";
        if (result.isPainfulFailure()) return "Painful Failure";
        if (!result.isSuccessful()) return "Failure";
        return `${result.successCount} ${PluralWord.SUCCESS.say(result.successCount, true)}`;
    }

    public get rollOutput(): RollReportOutput<SixthRollResult, SixthRollCondition> {
        return new class extends RollReportOutput<SixthRollResult, SixthRollCondition> {
            public renderConditionAsPlainText(condition: SixthRollCondition): string {
                const { totalDice } = condition;
                if (totalDice === 0) return "Unable to attempt";
                const tokens = [
                    "Rolled", totalDice, PluralWord.DIE.say(totalDice),
                    "(=", condition.baseDicePool, MINUS, condition.difficulty, "Difficulty)",
                ];
                return tokens.join(' ');
            }

            public renderResultAsPlainText(report: RollReport<SixthRollResult>, condition: SixthRollCondition): string {
                return SixthRuleSystem.renderResult(report.result, condition);
            }
        }();
    }

    public get probabilityOutput(): ProbabilityReportOutput<SixthRollResult, SixthRollCondition> {
        return new class extends ProbabilityReportOutput<SixthRollResult, SixthRollCondition> {
            public renderResult(result: SixthRollResult, condition: SixthRollCondition): React.ReactNode {
                return SixthRuleSystem.renderResult(result, condition);
            }
        }();
    }
}
