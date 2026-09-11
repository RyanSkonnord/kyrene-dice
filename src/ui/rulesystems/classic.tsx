import { RollReport } from "../../gamerules/rolls";
import { ClassicRollCondition, ClassicRollFlag, ClassicRollResult } from "../../gamerules/rulesystems/classic";
import { RollFlagParameter, RollNumericParameter, RollParameter, RollRadioParameter, RuleSystem } from "../baserules";
import { InfoLabel } from "../InfoLabel";
import { ProbabilityReportOutput } from "../ProbabilityChart";
import { RollReportOutput } from "../Roll";
import { RollSpec } from "../Roller";
import { PluralWord } from "../util/words";

export class ClassicRuleSystem extends RuleSystem<ClassicRollResult, ClassicRollCondition> {
    public constructor() {
        super('classic', "Classic World of Darkness", (<span>Classic <em>World of Darkness</em></span>));
    }

    public get variantParameters(): RollParameter<any>[] {
        return [
            new RollRadioParameter('botchRules', "Rules for Botches", 'standard',
                [{
                    key: 'standard',
                    label: (
                        <InfoLabel
                            id="standardBotchRules"
                            label={<span>Standard (Revised/20<sup>th</sup>)</span>}
                        >
                            <p>Rules used in the Revised and 20<sup>th</sup> Anniversary Editions.</p>
                            <p>
                                A roll is a botch only if no dice score a success and at least one
                                die shows a 1. Just one success means the roll is not a botch, even
                                if there are more 1s than successes.
                            </p>
                        </InfoLabel>
                    ),
                }, {
                    key: 'oldSchool',
                    label: (
                        <InfoLabel
                            id="oldSchoolBotchRules"
                            label={<span>Old School (1<sup>st</sup>/2<sup>nd</sup> Edition)</span>}
                        >
                            <p>Rules used prior to the Revised Edition.</p>
                            <p>
                                A roll is a botch if the number of dice showing a 1 outnumber the
                                dice showing success, thereby causing the success count to go
                                negative.
                            </p>
                        </InfoLabel>
                    ),
                }, {
                    key: 'refuge',
                    label: (
                        <InfoLabel
                            id="refugeBotchRules"
                            label="&ldquo;Refuge&rdquo; Variant"
                        >
                            <p>A house rule that makes the old school rules more forgiving.</p>
                            <p>
                                Dice showing a 1 subtract successes, and a negative success count
                                is a botch. However, each die showing a 10 is &ldquo;immune&rdquo;
                                to being canceled out by a 1, and counts as a success no matter
                                what.
                            </p>
                        </InfoLabel>),
                }],
            ),
            new RollRadioParameter('damageSoakRules', "Rules for Damage & Soak Rolls", 'standard',
                [{
                    key: 'standard',
                    label: (
                        <InfoLabel
                            id="standardDamageRules"
                            label="Standard Rules"
                        >
                            Dice showing a 1 subtract successes, but a botch is treated as a
                            normal failure.
                        </InfoLabel>),
                }, {
                    key: 'flat',
                    label: (
                        <InfoLabel
                            id="flatDiceDamageRules"
                            label="Flat Dice"
                        >
                            <p>A house rule in which dice showing a 1 do not subtract successes.</p>
                            <p>
                                This is the behavior of
                                the <a href="https://realmofdarkness.app/20th/commands/"><code>no_botch</code> argument</a> in
                                the <a href="https://realmofdarkness.app/">Realm of Darkness</a> app.
                            </p>
                        </InfoLabel>
                    ),
                }],
            ),
        ];
    }

    public get rollParameters(): RollParameter<any>[] {
        return [
            new RollNumericParameter('dicePool', "Dice Pool", 1, 1, 20),
            new RollNumericParameter('difficulty', "Difficulty", 6, 2, 10),
            new RollFlagParameter('didPlayerSpendWillpower', "Spend Willpower"),
            new RollFlagParameter('isDamageRoll', "Damage/Soak Roll"),
            new RollFlagParameter('hasCharmedExistence', "Charmed Existence"),
        ];
    }

    public makeRollCondition(spec: RollSpec): ClassicRollCondition {
        const {
            dicePool, difficulty,
            didPlayerSpendWillpower, isDamageRoll, hasCharmedExistence,
            botchRules, damageSoakRules,
        } = spec as {
            dicePool: number,
            difficulty: number,
            didPlayerSpendWillpower: boolean,
            isDamageRoll: boolean,
            hasCharmedExistence: boolean,
            botchRules: string,
            damageSoakRules: string,
        };

        const flags: Record<ClassicRollFlag, boolean> = {
            didPlayerSpendWillpower: didPlayerSpendWillpower,
            isDamageRoll: isDamageRoll,
            hasCharmedExistence: hasCharmedExistence,
            usingPreRevisedBotchRules: ['oldSchool', 'refuge'].includes(botchRules),
            ignoreOnes: isDamageRoll && (damageSoakRules === 'flat'),
            areTensImmuneToOnes: (botchRules === 'refuge'),
        };
        return new ClassicRollCondition(dicePool, difficulty, flags);
    }

    private static renderResult(result: ClassicRollResult, condition: ClassicRollCondition): string {
        if (result.isBotch()) return "Botch";
        if (!result.isSuccessful() && !condition.flags.isDamageRoll) return "Failure";
        return `${result.successCount} ${PluralWord.SUCCESS.say(result.successCount, true)}`;
    }

    public get rollOutput(): RollReportOutput<ClassicRollResult, ClassicRollCondition> {
        return new class extends RollReportOutput<ClassicRollResult, ClassicRollCondition> {
            public renderCondition(condition: ClassicRollCondition): React.ReactNode {
                const dicePool = condition.totalDice;
                return `Rolled ${dicePool} ${PluralWord.DIE.say(dicePool)} at difficulty ${condition.difficulty}`;
            }

            public renderResult(report: RollReport<ClassicRollResult>, condition: ClassicRollCondition): React.ReactNode {
                return ClassicRuleSystem.renderResult(report.result, condition);
            }
        }();
    }

    public get probabilityOutput(): ProbabilityReportOutput<ClassicRollResult, ClassicRollCondition> {
        return new class extends ProbabilityReportOutput<ClassicRollResult, ClassicRollCondition> {
            public renderResult(result: ClassicRollResult, condition: ClassicRollCondition): React.ReactNode {
                return ClassicRuleSystem.renderResult(result, condition);
            }
        }();
    }
}
