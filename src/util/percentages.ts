export function formatPercentagesWithCommonPrecision(
    values: number[],
    maxPrecision: number = 1,
): (value: number) => string {
    function retainsPrecisionAt(value: number, precision: number): boolean {
        const truncated = value * (10 ** (precision + 2));
        return Math.abs(truncated - Math.round(truncated)) < 1e-12;
    }

    function findBestCommonPrecision(): number {
        let candidatePrecision: number = 0;
        for (; candidatePrecision < maxPrecision; candidatePrecision++) {
            if (values.every((value) => (
                retainsPrecisionAt(value, candidatePrecision)
            ))) { break; }
        }
        return candidatePrecision;
    }

    const commonPrecision = findBestCommonPrecision();
    const floor = (0).toFixed(commonPrecision);
    const floorMargin = (10 ** (-commonPrecision)).toFixed(commonPrecision);
    const ceiling = (100).toFixed(commonPrecision);
    const ceilingMargin = (100 - 10 ** (-commonPrecision)).toFixed(commonPrecision);

    function formatPercentage(value: number): string {
        if (value === 0) { return "0%"; }
        const percentage = ((value + 0) * 100).toFixed(commonPrecision);
        if (value > 0 && percentage === floor) { return `<${floorMargin}%`; }
        if (value < 1 && percentage === ceiling) { return `>${ceilingMargin}%`; }
        return percentage + '%';
    }

    return formatPercentage;
}
