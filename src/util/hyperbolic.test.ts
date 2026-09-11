import Color from "./Color";
import { createHyperbolicColorScheme, createHyperbolicProgression } from "./hyperbolic";

test("hyperbolic progression validates", () => {
    expect(() => createHyperbolicProgression(0, 1, 2)).toThrowError();
    expect(() => createHyperbolicProgression(1, 0, 2)).toThrowError();
    expect(() => createHyperbolicProgression(1, 1, 0)).toThrowError();
    expect(() => createHyperbolicProgression(1, 2, 1)).toThrowError();
    expect(() => createHyperbolicProgression(1, -1, 1)).toThrowError();

    const validProgression = createHyperbolicProgression(1, 1, 2);
    expect(() => validProgression(-1)).toThrowError();
});

test("calculates hyperbolic progression", () => {
    const prog = createHyperbolicProgression(1, 1, 10);
    expect(prog(0)).toEqual(0);
    expect(prog(1)).toEqual(1);
    expect(prog(1e50)).toBeCloseTo(10);

    expect(prog(0.5)).toBeCloseTo(0.5263157894736842);
    expect(prog(2)).toBeCloseTo(1.8181818181818181);
    expect(prog(10)).toBeCloseTo(5.2631578947368425);
    expect(prog(100)).toBeCloseTo(9.174311926605505);
    expect(prog(1000)).toBeCloseTo(9.910802775024777);
});

test("calculates sharper hyperbolic progression", () => {
    const prog = createHyperbolicProgression(2, 5, 10);
    expect(prog(0)).toEqual(0);
    expect(prog(2)).toEqual(5);
    expect(prog(1e50)).toBeCloseTo(10);

    expect(prog(0.1)).toBeCloseTo(0.47619047619047616)
    expect(prog(1)).toBeCloseTo(3.3333333333333335)
    expect(prog(5)).toBeCloseTo(7.142857142857143)
    expect(prog(10)).toBeCloseTo(8.333333333333334)
    expect(prog(100)).toBeCloseTo(9.803921568627452)
});

test("calculates hyperbolic progression in negative direction", () => {
    const prog = createHyperbolicProgression(1, -1, -10);
    expect(prog(0)).toEqual(0);

    expect(prog(1)).toEqual(-1);
    expect(prog(1e50)).toBeCloseTo(-10);

    expect(prog(0.5)).toBeCloseTo(-0.5263157894736842)
    expect(prog(1)).toBeCloseTo(-1)
    expect(prog(2)).toBeCloseTo(-1.8181818181818181)
    expect(prog(10)).toBeCloseTo(-5.2631578947368425)
    expect(prog(100)).toBeCloseTo(-9.174311926605505)
});

test("calculates hyperbolic color progression", () => {
    const zero = Color.fromCss("#888888");
    const anchor = Color.fromCss("#33aa88");
    const limit = Color.fromCss("#00ee88");
    const prog = createHyperbolicColorScheme(zero, 10, anchor, limit);

    expect(prog(0)).toEqual(Color.fromCss("#888888"));
    expect(prog(1)).toEqual(Color.fromCss("#758d88"));
    expect(prog(5)).toEqual(Color.fromCss("#4a9c88"));
    expect(prog(10)).toEqual(Color.fromCss("#33aa88"));
    expect(prog(20)).toEqual(Color.fromCss("#1fbb88"));
    expect(prog(50)).toEqual(Color.fromCss("#0fd188"));
    expect(prog(100)).toEqual(Color.fromCss("#08dd88"));
    expect(prog(1000)).toEqual(Color.fromCss("#01ec88"));
});
