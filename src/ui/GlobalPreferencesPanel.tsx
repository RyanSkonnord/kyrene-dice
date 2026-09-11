import "./GlobalPreferencesPanel.scss";
import { useState } from "react";

import { GlobalPreferenceTable, useGlobalPreferences } from "../globalPreference";

export default function GlobalPreferencesPanel() {
    const [visibility, setVisibility] = useState<boolean>(false);
    const { globalPreferences, updateGlobalPreferences } = useGlobalPreferences();

    type RadioOptionProps = { paramKey: keyof GlobalPreferenceTable, choiceKey: string, children: React.ReactNode };
    function RadioOption({ paramKey, choiceKey, children }: RadioOptionProps) {
        const currentValue = globalPreferences[paramKey];
        return (<label className="RadioOption" key={choiceKey}>
            <input type="radio"
                name={paramKey}
                value={choiceKey}
                checked={choiceKey === currentValue}
                onChange={(event) => {
                    updateGlobalPreferences({ key: paramKey, value: event.target.value });
                }}
            />
            {children}
        </label>);
    }

    function GlobalPreferencesMenu() {
        return (<div className="GlobalPreferencesMenu">
            <fieldset className="probabilityDefaultVisibility">
                <legend>Probability Charts</legend>
                <RadioOption paramKey="probabilityDefaultVisibility" choiceKey="showButton">
                    Hide probability charts by default
                </RadioOption>
                <RadioOption paramKey="probabilityDefaultVisibility" choiceKey="showChart">
                    Show probability charts by default
                </RadioOption>
                <RadioOption paramKey="probabilityDefaultVisibility" choiceKey="hideButton">
                    Hide probability chart buttons
                </RadioOption>
            </fieldset>
        </div>);
    }

    return (<div className="GlobalPreferencesPanel">
        <div className="interior">
            <div className="visibilityButton">
                {visibility
                    ? <button onClick={() => setVisibility(false)}>
                        Hide Preferences
                    </button>
                    : <button onClick={() => setVisibility(true)}>
                        Show Preferences
                    </button>
                }
            </div>
            {visibility && <GlobalPreferencesMenu />}
        </div>
    </div>);
}