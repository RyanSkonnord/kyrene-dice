import { List } from "immutable";

import Color from "./Color";

test("parses CSS strings", () => {
    const color = Color.fromCss("#12abCD");
    expect(color.r).toEqual(0x12);
    expect(color.g).toEqual(0xab);
    expect(color.b).toEqual(0xcd);

    expect(Color.fromCss(String(color))).toEqual(color);

    expect(color.coords).toEqual([0x12, 0xab, 0xcd]);
    expect(Color.GETTERS.map((getter) => getter(color))).toEqual(List([0x12, 0xab, 0xcd]));
});