import { fsrs, Rating, createEmptyCard } from 'ts-fsrs';
const f = fsrs();
let card = createEmptyCard(new Date());
let r = f.repeat(card, new Date())[Rating.Good].card;
console.log(r.state);
r = f.repeat(r, new Date(Date.now() + 86400000))[Rating.Good].card;
console.log(r.state);
