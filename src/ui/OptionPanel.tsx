import "./OptionPanel.scss";

import { RollParameter } from "./baserules";
import { RollerState, RollSpec } from "./Roller";

type OptionPanelProps = {
    parameters: RollParameter<any>[],
    state: RollerState,
    changeState: (change: (state: RollerState) => void) => void;
};
export default function OptionPanel({ parameters, state, changeState }: OptionPanelProps) {
    function changeSpec(change: (spec: RollSpec) => void) {
        changeState((previous: RollerState) => {
            const newSpec = { ...previous.spec };
            change(newSpec);
            previous.spec = newSpec;

            if (previous.amendmentTarget !== null) {
                previous.amendmentTarget.spec = previous.spec;
            }
        });
    }

    return (<div className="OptionPanel">
        {parameters.map(p => p.getUi(state.spec[p.key], changeSpec))}
    </div>);
}
