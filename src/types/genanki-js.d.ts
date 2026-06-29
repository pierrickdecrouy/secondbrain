declare module 'genanki-js' {
    export class Model {
        constructor(options: any);
        note(fields: string[], tags?: string[]): any;
    }
    export class Deck {
        constructor(id: number | string, name: string);
        addNote(note: any): void;
    }
    export class Package {
        constructor();
        setSqlJs(sql: any): void;
        addDeck(deck: Deck): void;
        writeToFile(filename: string): void;
    }
}
