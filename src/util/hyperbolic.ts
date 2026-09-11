import Color from "./Color";

/**
 * Create a function _f_ that defines a hyperbolic curve with the properties that:
 * 
 * 1. _f_(0) = 0;
 * 2. _f_(`anchor_input`) = `anchor_output`; and 
 * 3. _f_(_x_) asymptotically approaches `limit` for large values of _x_.
 * 
 * @param anchorInput 
 * @param anchorOutput 
 * @param limit 
 * @returns 
 */
export function createHyperbolicProgression(
    anchorInput: number, anchorOutput: number, limit: number
): (value: number) => number {
    if (!Number.isFinite(anchorInput) || anchorInput <= 0) {
        throw new Error(`anchor_input must be finite and positive: ${anchorInput}`);
    }
    if (!Number.isFinite(anchorOutput) || anchorOutput === 0) {
        throw new Error(`anchor_output must be finite and nonzero: ${anchorOutput}`);
    }
    if (!Number.isFinite(limit) || limit === 0) {
        throw new Error(`limit must be finite and nonzero: ${limit}`);
    }
    ((anchor_ratio: number) => {
        if (anchor_ratio < 0) {
            throw new Error("anchor_output and limit must have the same sign");
        }
        if (anchor_ratio >= 1) {
            throw new Error("anchor_output must have a lesser absolute value than limit");
        }
    })(anchorOutput / limit);

    const sharpness = (limit - anchorOutput) * anchorInput / anchorOutput;
    return (value: number) => {
        if (value < 0) {
            throw new Error(`Argument must not be negative: ${value}`);
        }
        const quotient = limit * value / (value + sharpness);
        return quotient + 0; // in case of -0
    };
}

/**
 * Create a color scheme that represents nonnegative numbers with a progression from one color to
 * another as values go from zero to infinity.
 * 
 * @param zeroColor the color to represent an input of zero
 * @param anchorInput a particular number greater than zero
 * @param anchorColor the color to represent `anchorInput`
 * @param limitColor the color to approach for numbers growing greater than `anchorInput` to infinity
 * @returns a function that represents nonnegative numbers in the color scheme
 */
export function createHyperbolicColorScheme(
    zeroColor: Color, anchorInput: number, anchorColor: Color, limitColor: Color
): (value: number) => Color {
    function createProgressionForPrimaryColor(get: (color: Color) => number) {
        const zero = get(zeroColor);
        const anchor = get(anchorColor) - zero;
        const limit = get(limitColor) - zero;
        if (anchor === 0 && limit === 0) { return () => zero; }
        const progression = createHyperbolicProgression(anchorInput, anchor, limit);
        return (value: number) => Math.round(progression(value) + zero);
    }

    const [r, g, b] = Color.GETTERS.map(createProgressionForPrimaryColor);
    return (value: number) => {
        return new Color(r(value), g(value), b(value));
    };
}
