export class PluralWord {
    constructor(
        private readonly singular: string,
        private readonly plural: string,
    ) { }

    private static capitalize(word: string): string {
        return word.charAt(0).toUpperCase() + word.slice(1);
    }

    public say(count: number, capitalize: boolean = false): string {
        const word = (Math.abs(count) === 1) ? this.singular : this.plural;
        return capitalize ? PluralWord.capitalize(word) : word;
    }

    public static DIE: PluralWord = new PluralWord("die", "dice");
    public static SUCCESS: PluralWord = new PluralWord("success", "successes");
}