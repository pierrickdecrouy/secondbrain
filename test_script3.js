import { fsrs, Rating, createEmptyCard } from 'ts-fsrs';
const f = fsrs();
let card = createEmptyCard(new Date());
let r1 = f.repeat(card, new Date())[Rating.Good].card;
console.log("R1 JSON:", JSON.stringify(r1, null, 2));
let r2 = f.repeat(r1, new Date(Date.now() + 86400000))[Rating.Good].card;
console.log("R2 JSON:", JSON.stringify(r2, null, 2));
