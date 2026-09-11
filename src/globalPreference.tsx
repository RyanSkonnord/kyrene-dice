import { createContext, Dispatch, useContext, useEffect, useMemo, useReducer } from "react";

export type ProbabilityDefaultVisibility = ('showButton' | 'showChart' | 'hideButton');
export type GlobalPreferenceTable = {
    probabilityDefaultVisibility: ProbabilityDefaultVisibility;
};
export type GlobalPreferenceTableUpdate = {
    key: keyof GlobalPreferenceTable;
    value: any;
};

const DEFAULT_PREFERENCES: GlobalPreferenceTable = {
    probabilityDefaultVisibility: "showButton",
};
const STORAGE_KEY = 'globalPreferences';

export type GlobalPreferenceContextValue = {
    globalPreferences: GlobalPreferenceTable;
    updateGlobalPreferences: Dispatch<GlobalPreferenceTableUpdate>;
}
const GlobalPreferenceContext = createContext<GlobalPreferenceContextValue | undefined>(undefined);

type GlobalPreferenceProviderProps = { children: React.ReactNode };
export function GlobalPreferenceProvider({ children }: GlobalPreferenceProviderProps) {
    function reducer(state: GlobalPreferenceTable, { key, value }: GlobalPreferenceTableUpdate) {
        return { ...state, [key]: value } as GlobalPreferenceTable;
    }

    function getStoredPreferences(): GlobalPreferenceTable {
        const stored = localStorage.getItem(STORAGE_KEY);
        try {
            return {
                ...DEFAULT_PREFERENCES,
                ...JSON.parse(stored || '{}'),
            } as GlobalPreferenceTable;
        } catch (error) {
            console.error(error);
            return DEFAULT_PREFERENCES;
        }
    }

    const [globalPreferences, updateGlobalPreferences] = useReducer(
        reducer, DEFAULT_PREFERENCES, getStoredPreferences
    );

    useEffect(
        () => {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(globalPreferences));
        },
        [globalPreferences],
    );

    const value: GlobalPreferenceContextValue = useMemo(
        () => ({ globalPreferences, updateGlobalPreferences }),
        [globalPreferences],
    );

    return <GlobalPreferenceContext.Provider value={value}>
        {children}
    </GlobalPreferenceContext.Provider>;
}

export function useGlobalPreferences(): GlobalPreferenceContextValue {
    const context = useContext(GlobalPreferenceContext);
    if (!context) { throw new Error("Not inside GlobalPreferenceProvider") };
    return context;
}

