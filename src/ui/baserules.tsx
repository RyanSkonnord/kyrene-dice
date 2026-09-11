import React from 'react';
import { NumberPicker } from 'react-widgets/cjs';

import { RollCondition, RollResult } from '../gamerules/rolls';
import { ProbabilityReportOutput } from './ProbabilityChart';
import { RollReportOutput } from './Roll';
import { RollSpec } from './Roller';
import { DECREMENT, INCREMENT } from './util/symbols';

export type SpecChange = (change: (previous: RollSpec) => void) => void;

export abstract class RollParameter<T> {
    protected constructor(
        public readonly key: string,
        public readonly initialValue: T,
    ) { }

    public abstract getUi(currentValue: T, changeSpec: SpecChange): React.ReactNode;
}

export class RollFlagParameter extends RollParameter<boolean> {
    public constructor(
        key: string,
        private readonly label: React.ReactNode,
        initialValue?: boolean,
    ) {
        super(key, initialValue ?? false);
    }

    public getUi(currentValue: boolean, changeSpec: SpecChange): React.ReactElement {
        return (
            <div className="RollFlagParameter" key={this.key}>
                <label>
                    <input type="checkbox" checked={currentValue}
                        onChange={(event) => {
                            const nextValue = event.target.checked;
                            changeSpec(spec => { spec[this.key] = nextValue; });
                        }} />
                    {this.label}
                </label>
            </div>
        );
    }
}

export class RollNumericParameter extends RollParameter<number> {
    public constructor(
        key: string,
        private readonly label: React.ReactNode,
        initialValue: number,
        private readonly min: number,
        private readonly max: number,
    ) {
        super(key, initialValue);
    }

    public getUi(currentValue: number, changeSpec: SpecChange): React.ReactElement {
        return (
            <label className="RollNumericParameter" key={this.key}>
                {this.label}
                <NumberPicker
                    value={currentValue}
                    min={this.min} max={this.max}
                    incrementIcon={INCREMENT}
                    decrementIcon={DECREMENT}
                    step={1} precision={0}
                    onChange={(nextValue) => {
                        if (nextValue !== null && Number.isInteger(nextValue)) {
                            changeSpec((spec) => { spec[this.key] = nextValue; });
                        }
                    }}
                />
            </label>
        );
    }
}

export type RollRadioParameterChoice = {
    key: string,
    label: React.ReactNode,
    info?: React.ReactNode,
};

export class RollRadioParameter extends RollParameter<string> {
    public constructor(
        key: string,
        private readonly legend: React.ReactNode,
        initialValue: string,
        private readonly choices: { key: string, label: React.ReactNode }[],
    ) {
        super(key, initialValue);
        if (this.choices.filter(({ key }) => (key === initialValue)).length !== 1) {
            throw new Error("initialValue must match exactly one choice key");
        }
    }

    public getUi(currentValue: string, changeSpec: SpecChange): React.ReactNode {
        const paramKey = this.key;
        return (
            <fieldset className="RollRadioParameter" key={this.key}>
                <legend>{this.legend}</legend>
                {this.choices.map(({ key, label }) => (
                    <label key={key}>
                        <input type="radio"
                            name={paramKey}
                            value={key}
                            checked={key === currentValue}
                            onChange={(event) => {
                                changeSpec((previous) => {
                                    previous[paramKey] = event.target.value;
                                });
                            }}
                        />
                        {label}
                    </label>
                ))}
            </fieldset>
        );
    }
}


export abstract class RuleSystem<R extends RollResult, C extends RollCondition<R>> {
    public readonly nodeLabel: React.ReactNode;

    protected constructor(
        public readonly key: string,
        public readonly textLabel: string,
        nodeLabel?: React.ReactNode,
    ) {
        this.nodeLabel = nodeLabel ?? textLabel;
    }

    public get variantParameters(): RollParameter<any>[] { return []; }

    public abstract get rollParameters(): RollParameter<any>[];

    public initializeRollSpec(): RollSpec {
        const params = [...this.variantParameters, ...this.rollParameters];
        return Object.fromEntries(params.map(p => [p.key, p.initialValue]));
    }

    public abstract makeRollCondition(spec: RollSpec): C;

    public abstract get rollOutput(): RollReportOutput<R, C>;

    public abstract get probabilityOutput(): ProbabilityReportOutput<R, C>;
}
