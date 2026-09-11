import { formatPercentagesWithCommonPrecision } from "./percentages";

function testPercentages(
    inputValues: number[],
    maxPrecision: number,
    expectedFormats: string[]
) {
    expect(inputValues).toHaveLength(expectedFormats.length);
    const formatFunction = formatPercentagesWithCommonPrecision(inputValues, maxPrecision);
    inputValues.forEach((value, index) => {
        const expectedFormat = expectedFormats[index];
        const actualFormat = formatFunction(value);
        expect(actualFormat).toEqual(expectedFormat);
    });
}

test("rounds to integer", () => {
    testPercentages([0.25, 0.5, 0.75], 3, ["25%", "50%", "75%"]);
});

test("rounds to one place", () => {
    testPercentages([0.251, 0.5, 0.752], 2, ["25.1%", "50.0%", "75.2%"]);
});

test("rounds to max of two places", () => {
    testPercentages([0.251111, 0.5, 0.749999], 2, ["25.11%", "50.00%", "75.00%"]);
});

test("flat zero shows no decimal places", () => {
    testPercentages([0], 2, ["0%"]);
});

test("small positive values are not rounded to zero", () => {
    testPercentages([0.0001, 0.00001, 0], 2, ["0.01%", "<0.01%", "0%"]);
});

test("values are not rounded up to 100%", () => {
    testPercentages([0.9999, 0.99999, 1], 2, ["99.99%", ">99.99%", "100.00%"]);
});
