import { DropdownList } from 'react-widgets/cjs';
import { RollCondition } from '../gamerules/rolls';
import { RuleSystem } from './baserules';
import OptionPanel from './OptionPanel';
import { RollerState } from './Roller';
import GlobalPreferencesPanel from './GlobalPreferencesPanel';

type RuleSystemPanelProps = {
    currentRuleSystem: RuleSystem<any, RollCondition<any>>,
    allRuleSystems: RuleSystem<any, RollCondition<any>>[],
    setRuleSystem: (ruleSystem: RuleSystem<any, RollCondition<any>>) => void,
    state: RollerState,
    changeState: (change: (state: RollerState) => void) => void;
};
export default function RuleSystemPanel({
    currentRuleSystem, allRuleSystems, setRuleSystem, state, changeState
}: RuleSystemPanelProps) {
    return (
        <section className="RuleSystemPanel uiPanel">
            <GlobalPreferencesPanel />
            <DropdownList
                value={currentRuleSystem}
                data={allRuleSystems}
                dataKey='key'
                textField='textLabel'
                onChange={setRuleSystem}
            />
            <OptionPanel
                parameters={currentRuleSystem.variantParameters}
                state={state} changeState={changeState}
            />
        </section>
    );
}
