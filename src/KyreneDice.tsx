import './App.scss';
import './KyreneDice.scss';

import { useState } from 'react';

import { RollCondition } from './gamerules/rolls';
import { RuleSystem } from './ui/baserules';
import Roller, { RollerState } from './ui/Roller';
import RuleSystemPanel from './ui/RuleSystemPanel';
import { ClassicRuleSystem } from './ui/rulesystems/classic';
import { CodRuleSystem } from './ui/rulesystems/cod';
import { FifthRuleSystem } from './ui/rulesystems/fifth';
import { SixthRuleSystem } from './ui/rulesystems/sixth';
import { Footer } from './web/Footer';
import { Header } from './web/Header';

const RULE_SYSTEMS: RuleSystem<any, RollCondition<any>>[] = [
    new ClassicRuleSystem(), new CodRuleSystem(), new FifthRuleSystem(), new SixthRuleSystem(),
]

export default function KyreneDice() {
    const [ruleSystem, setRuleSystem] = useState<RuleSystem<any, RollCondition<any>>>(RULE_SYSTEMS[0]);

    const [rollerStates, setRollerStates] = useState<{ [ruleSystemKey: string]: RollerState }>(
        Object.fromEntries(
            RULE_SYSTEMS.map((ruleSystem): [string, RollerState] => [
                ruleSystem.key,
                { spec: ruleSystem.initializeRollSpec(), rolls: [], amendmentTarget: null },
            ])
        ));

    function makeStateChangeFunction(ruleSystemKey: string): (change: (state: RollerState) => void) => void {
        if (!(ruleSystemKey in rollerStates)) {
            throw new Error(`Invalid rule system key: ${ruleSystemKey}`);
        }

        return (change) => {
            setRollerStates((previous) => {
                const state = previous[ruleSystemKey];
                change(state);
                return { ...previous, ruleSystemKey: state };
            });
        };
    }

    // TODO: Refactor out state/changeState duplication
    return (
        <div className="KyreneDice">
            <Header />
            <main>
                <div className='workspace'>
                    <RuleSystemPanel
                        key={ruleSystem.key + "RuleSystemPanel"}
                        currentRuleSystem={ruleSystem}
                        allRuleSystems={RULE_SYSTEMS}
                        setRuleSystem={setRuleSystem}
                        state={rollerStates[ruleSystem.key]}
                        changeState={makeStateChangeFunction(ruleSystem.key)}
                    />

                    <Roller
                        key={ruleSystem.key + "Roller"}
                        ruleSystem={ruleSystem}
                        state={rollerStates[ruleSystem.key]}
                        changeState={makeStateChangeFunction(ruleSystem.key)}
                    />
                </div>
            </main>
            <Footer />
        </div>
    );
}
