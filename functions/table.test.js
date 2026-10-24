import { test } from 'node:test';
import assert from 'node:assert/strict';
import { computeTableOdds } from './table.js';

const player = (extra = {}) => ({ name: 'P', folded: false, cardsFor: 1, ...extra });
const hand = cards => ({ handNumber: 1, cards });
const flop = ['7h', '2c', '9s'];

test('with live odds on, gives each player their own equity against the real hands', () => {
  const table = { handNumber: 1, board: flop, liveOdds: true, players: { a: player(), b: player() } };
  const { odds, status } = computeTableOdds(table, { a: hand(['As', 'Ad']), b: hand(['Kc', 'Kd']) });
  assert.equal(odds.a.status, 'ok');
  assert.equal(odds.a.mode, 'live');
  assert.equal(odds.b.win, 8.4);
  assert.equal(odds.a.handName, 'Pair');
  assert.equal(odds.a.knownOpponents, 1);
  assert.equal(status.street, 'flop');
  assert.equal(status.conflict, false);
});

test('by default, players get their hand and outs but no win % until the reveal', () => {
  const table = { handNumber: 1, board: flop, players: { a: player(), b: player() } };
  const { odds, reveal } = computeTableOdds(table, { a: hand(['As', 'Ad']), b: hand(['Kc', 'Kd']) });
  assert.equal(odds.b.mode, 'hidden');
  assert.equal(odds.b.status, 'ok');
  assert.equal(odds.b.handName, 'Pair');
  assert.equal(odds.b.outs.total, 2);
  for (const field of ['win', 'tie', 'lose', 'knownOpponents', 'unknownOpponents']) {
    assert.ok(!(field in odds.b), `${field} must not reach the player`);
  }
  assert.deepEqual(reveal.players, []);
});

test('a player alone at the table gets hand and outs only', () => {
  const table = { handNumber: 1, board: ['Ah', 'Kh', '2c'], liveOdds: true, players: { a: player() } };
  const { odds } = computeTableOdds(table, { a: hand(['9h', '8h']) });
  assert.equal(odds.a.mode, 'solo');
  assert.equal(odds.a.status, 'ok');
  assert.ok(!('win' in odds.a));
  assert.equal(odds.a.outs.groups.find(g => g.name === 'Flush').count, 9);
});

test('revealing shows every live hand to the table, but not folded ones', () => {
  const table = {
    handNumber: 1,
    board: flop,
    revealed: true,
    players: { a: player({ name: 'Ann' }), b: player({ name: 'Bob' }), c: player({ name: 'Cy', folded: true }) },
  };
  const { odds, reveal } = computeTableOdds(table, { a: hand(['As', 'Ad']), b: hand(['Kc', 'Kd']), c: hand(['Qc', 'Qd']) });
  assert.equal(odds.a.mode, 'revealed');
  assert.equal(odds.a.win, 91.6);
  assert.deepEqual(reveal.players.map(p => [p.name, p.cards.join(''), p.win]), [['Ann', 'AsAd', 91.6], ['Bob', 'KcKd', 8.4]]);
  assert.ok(!JSON.stringify(reveal).includes('Qc'), 'folded cards stay hidden');
});

test('players without cards count as random hands and folded players drop out', () => {
  const table = {
    handNumber: 1,
    board: [],
    liveOdds: true,
    players: { a: player(), b: player({ cardsFor: 0 }), c: player({ folded: true }) },
  };
  const { odds } = computeTableOdds(table, { a: hand(['As', 'Ad']), c: hand(['Kc', 'Kd']) }, { simulations: 5000 });
  assert.equal(odds.a.unknownOpponents, 1);
  assert.equal(odds.a.knownOpponents, 0);
  assert.equal(odds.b.status, 'no-cards');
  assert.equal(odds.c.status, 'folded');
});

test('cards from an earlier hand are ignored', () => {
  const table = { handNumber: 2, board: [], liveOdds: true, players: { a: player({ cardsFor: 2 }), b: player({ cardsFor: 2 }) } };
  const { odds } = computeTableOdds(table, { a: { handNumber: 2, cards: ['As', 'Ad'] }, b: hand(['Kc', 'Kd']) }, { simulations: 2000 });
  assert.equal(odds.a.unknownOpponents, 1);
  assert.equal(odds.b.status, 'no-cards');
});

test('flags a duplicate card only to the players holding it', () => {
  const table = { handNumber: 1, board: ['As', '2c', '9s'], players: { a: player(), b: player(), c: player() } };
  const { odds, status } = computeTableOdds(table, {
    a: hand(['As', 'Ad']),
    b: hand(['Kc', 'Kd']),
    c: hand(['Qc', 'Kd']),
  });
  assert.equal(status.conflict, true);
  assert.equal(odds.a.status, 'conflict');
  assert.match(odds.a.message, /board shows As/);
  assert.equal(odds.b.status, 'conflict');
  assert.match(odds.c.message, /Someone else entered Kd/);
  assert.ok(!odds.b.message.includes('Qc'), 'never mentions other players’ cards');
});

test('key ignores names but changes with cards, board, folds and mode', () => {
  const t = { handNumber: 1, board: [], players: { a: player(), b: player() } };
  const h = { a: hand(['As', 'Ad']), b: hand(['Kc', 'Kd']) };
  const opts = { simulations: 100 };
  const k = computeTableOdds(t, h, opts).key;
  assert.equal(computeTableOdds({ ...t, players: { a: player({ name: 'X' }), b: player() } }, h, opts).key, k);
  assert.notEqual(computeTableOdds({ ...t, board: ['2c', '3c', '4c'] }, h, opts).key, k);
  assert.notEqual(computeTableOdds({ ...t, players: { a: player(), b: player({ folded: true }) } }, h, opts).key, k);
  assert.notEqual(computeTableOdds(t, { ...h, b: hand(['Qc', 'Qd']) }, opts).key, k);
  assert.notEqual(computeTableOdds({ ...t, liveOdds: true }, h, opts).key, k);
  assert.notEqual(computeTableOdds({ ...t, revealed: true }, h, opts).key, k);
});
