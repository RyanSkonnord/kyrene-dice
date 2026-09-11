import { List } from "immutable";

/**
 * Basic representation of a point in the RGB color space.
 */ // because apparently hacking this up myself is simpler than several dependencies I tried 🙄
export default class Color {
    public constructor(
        public readonly r: number,
        public readonly g: number,
        public readonly b: number,
    ) {
        this.coords.forEach(Color.validate);
    }

    private static validate(value: number): void {
        if (!Number.isSafeInteger(value) || value < 0 || value >= 0x100) {
            throw new Error(`Invalid number (must be 0 to 255): ${value}`);
        }
    }

    public static fromCss(color: string): Color {
        const match = /^#([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i.exec(color);
        if (!match) { throw new Error(`Invalid CSS color format: ${JSON.stringify(color)}`) };
        const [r, g, b] = match.slice(1).map((c) => parseInt(c, 16));
        return new Color(r, g, b);
    }

    public get coords(): number[] { return [this.r, this.g, this.b]; }

    public static readonly GETTERS: List<(color: Color) => number> = List([
        ({ r }) => r, ({ g }) => g, ({ b }) => b
    ]);

    public toString(): string {
        const coords = this.coords.map((c) => c.toString(16).padStart(2, '0'));
        return '#' + coords.join('');
    }
}
