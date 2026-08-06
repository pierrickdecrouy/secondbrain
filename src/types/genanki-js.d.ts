declare module 'genanki-js' {
    export class Model {
        constructor(options: unknown);
        note(fields: string[], tags?: string[]): unknown;
    }
    export class Deck {
        constructor(id: number | string, name: string);
        addNote(note: unknown): void;
    }
    export class Package {
        constructor();
        setSqlJs(sql: unknown): void;
        addDeck(deck: Deck): void;
        writeToFile(filename: string): void;
    }
}
