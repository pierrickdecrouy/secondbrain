import { fsrs, Rating, createEmptyCard, State } from 'ts-fsrs';
const f = fsrs();
let card = createEmptyCard(new Date());

let r1 = f.repeat(card, new Date())[Rating.Good].card;
console.log("R1 state:", r1.state);

let r2 = f.repeat(r1, new Date(Date.now() + 86400000))[Rating.Good].card;
console.log("R2 state:", r2.state);

let r3 = f.repeat(r2, new Date(Date.now() + 86400000 * 3))[Rating.Again].card;
console.log("R3 state:", r3.state);
