import "./Roller.scss";

import React from 'react';

import { RollCondition } from '../gamerules/rolls';
import { RuleSystem } from './baserules';
import OptionPanel from './OptionPanel';
import ProbabilityChart from './ProbabilityChart';
import Roll, { RollItem } from './Roll';
import { useGlobalPreferences } from "../globalPreference";


export type RollSpec = {
    [key: string]: number | boolean | string,
};

export type RollerState = {
    spec: RollSpec,
    rolls: RollItem[],
    amendmentTarget: RollItem | null,
}

type RollerProps = {
    ruleSystem: RuleSystem<any, RollCondition<any>>,
    state: RollerState,
    changeState: (change: (state: RollerState) => void) => void;
};
export default function Roller({ ruleSystem, state, changeState }: RollerProps): React.ReactElement {
    const { globalPreferences: { probabilityDefaultVisibility } } = useGlobalPreferences();

    function clearRolls() {
        changeState(((previous) => {
            previous.rolls = [];
        }))
    }

    function addNthRoll(expectedRollCount: number): () => void {
        return () => {
            changeState((previousState) => {
                const rolls = previousState.rolls;
                if (rolls.length !== expectedRollCount) return; // for idempotence

                const timestamp = Date.now();
                const key = String(rolls.length);
                const newItem: RollItem = {
                    key: key, timestamp: timestamp, spec: { ...previousState.spec },
                    dice: [], // The Roll component will push dice into this array on demand
                    isBeingAmended: false,
                };

                state.rolls = [newItem, ...rolls];
            });
        };
    }

    function changeAmendMode(key: string | null) {
        changeState(((previous) => {
            if (key === null) {
                previous.amendmentTarget = null;
                previous.rolls.forEach((roll) => { roll.isBeingAmended = false; });
            } else {
                previous.rolls.forEach((roll) => {
                    roll.isBeingAmended = (roll.key === key);
                    if (roll.isBeingAmended) {
                        previous.amendmentTarget = roll;
                        previous.spec = roll.spec;
                    }
                });
            }
        }))
    }

    return (<span className="Roller uiPanel">
        <section className="rollSpecPanel">
            <button type="button" onClick={addNthRoll(state.rolls.length)}>
                Roll
            </button>

            <OptionPanel
                parameters={ruleSystem.rollParameters}
                state={state} changeState={changeState}
            />

            {
                (probabilityDefaultVisibility === 'showChart') &&
                <div className="specProbability">
                    <ProbabilityChart ruleSystem={ruleSystem} spec={state.spec} />
                </div>
            }
        </section>

        <section className="rollListPanel">
            <button type="button" className="clearRollHistoryButton" onClick={clearRolls}>
                Clear Roll History
            </button>

            <div className="rollList">
                {state.rolls.map((item) => (
                    <Roll
                        key={item.key}
                        item={item}
                        ruleSystem={ruleSystem}
                        changeAmendMode={changeAmendMode}
                    />
                ))}
            </div>
        </section>
    </span>);
}
