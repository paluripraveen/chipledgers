import { test } from 'node:test';
import assert from 'node:assert/strict';
import { evaluate, parseCard, handName, calcEquity, calcOuts } from './poker.js';

const ev = str => evaluate(str.split(' ').map(parseCard));

test('names hands', () => {
  assert.equal(handName(['As', 'Ks', 'Qs', 'Js', 'Ts', '2d', '3c'].map(parseCard)), 'Royal Flush');
  assert.equal(handName(['5h', '4h', '3h', '2h', 'Ah', 'Kd', 'Kc'].map(parseCard)), 'Straight Flush');
  assert.equal(handName(['9c', '9d', '9h', '9s', '2c'].map(parseCard)), 'Four of a Kind');
  assert.equal(handName(['9c', '9d', '9h', '2s', '2c', '2d', 'Ac'].map(parseCard)), 'Full House');
  assert.equal(handName(['Ac', 'Tc', '7c', '4c', '2c', 'Kd', 'Qh'].map(parseCard)), 'Flush');
  assert.equal(handName(['Ad', '2c', '3h', '4s', '5c', 'Kd', 'Kh'].map(parseCard)), 'Straight');
  assert.equal(handName(['Qd', 'Qc', 'Qh', '4s', '7c'].map(parseCard)), 'Three of a Kind');
  assert.equal(handName(['Qd', 'Qc', '7h', '7s', '4c', '4d', 'Ah'].map(parseCard)), 'Two Pair');
  assert.equal(handName(['Qd', 'Qc', '7h', '5s', '2c'].map(parseCard)), 'Pair');
  assert.equal(handName(['Ad', 'Jc', '7h', '5s', '2c'].map(parseCard)), 'High Card');
});

test('ranks hands within and across categories', () => {
  assert.ok(ev('As Ad Kc Kd 2h') > ev('As Ad Qc Qd Kh'), 'higher second pair wins');
  assert.ok(ev('6d 5c 4h 3s 2c') > ev('5d 4c 3h 2s Ac'), 'six-high straight beats the wheel');
  assert.ok(ev('Ad Kd 9d 8d 2d') > ev('Kc Qc Jc Tc 8c'), 'flush ranks by top card');
  assert.ok(ev('Kc Kd Kh As Ad') > ev('2c 2d 2h 3s 3c'), 'kings full beats twos full');
  assert.ok(ev('As Ac Kd Qh 9s') > ev('As Ac Kd Qh 8s'), 'kicker decides');
  assert.equal(ev('As Kc Qd Jh 9s 3c 2d'), ev('Ac Kd Qh Js 9d 4h 2c'), 'same five ranks split');
  assert.ok(ev('8c 8d 8h 7s 7c 7d 2h') === ev('8s 8d 8h 7s 7c 2c 2h'), 'best full house from two sets of trips');
});

test('a 7-card score equals the best of its 21 five-card hands', () => {
  for (let t = 0; t < 20000; t++) {
    const deck = Array.from({ length: 52 }, (_, i) => i);
    for (let i = 0; i < 7; i++) {
      const j = i + Math.floor(Math.random() * (52 - i));
      [deck[i], deck[j]] = [deck[j], deck[i]];
    }
    const seven = deck.slice(0, 7);
    let best = -1;
    for (let a = 0; a < 7; a++) {
      for (let b = a + 1; b < 7; b++) {
        best = Math.max(best, evaluate(seven.filter((_, i) => i !== a && i !== b)));
      }
    }
    assert.equal(evaluate(seven), best, seven.join(','));
  }
});

test('exact equity matches well-known matchups', () => {
  // AA vs KK on a dry flop: kings need a king (87 of 990 runouts) but not a king and an ace (4)
  const { method, results } = calcEquity({ hands: [['As', 'Ad'], ['Kc', 'Kd']], board: ['7h', '2c', '9s'] });
  assert.equal(method, 'exact');
  assert.ok(Math.abs(results[1].win - (83 / 990) * 100) < 1e-9, `KK win ${results[1].win}`);
  assert.ok(Math.abs(results[0].win + results[0].tie + results[0].lose - 100) < 1e-9);

  // Board plays for both: always a split
  const split = calcEquity({ hands: [['2c', '3d'], ['2h', '3s']], board: ['Ac', 'Kd', 'Qh', 'Js', 'Tc'] });
  assert.equal(split.results[0].tie, 100);
});

test('simulated preflop equity is close to known values', () => {
  // AA vs KK preflop is about 81.9% / 17.7%
  const { method, results } = calcEquity({ hands: [['As', 'Ad'], ['Kc', 'Kd']] });
  assert.equal(method, 'simulated');
  assert.ok(Math.abs(results[0].win - 81.9) < 1.5, `AA win ${results[0].win}`);

  // A hand vs one random hand: AA is about 85%
  const vsRandom = calcEquity({ hands: [['As', 'Ad']], unknownCount: 1 });
  assert.ok(Math.abs(vsRandom.results[0].win - 85) < 1.5, `AA vs random ${vsRandom.results[0].win}`);
});

test('counts flush draw outs', () => {
  const outs = calcOuts(['9h', '8h'], ['Ah', 'Kh', '2c']);
  const flush = outs.groups.find(g => g.name === 'Flush');
  assert.equal(flush.count, 9);
  assert.ok(Math.abs(flush.nextCard - (9 / 47) * 100) < 1e-9);
  assert.ok(Math.abs(flush.byRiver - 34.97) < 0.05, `by river ${flush.byRiver}`);
});

test('open-ended straight draw has 8 straight outs and ignores board pairs', () => {
  const outs = calcOuts(['9c', '8d'], ['7h', '6s', '2c']);
  assert.equal(outs.groups.find(g => g.name === 'Straight').count, 8);
  // Pairing the 2 on the board helps nobody, so it is not an out
  assert.ok(!outs.groups.some(g => g.cards.includes('2d')));
});

test('cards that only pair the board are not outs', () => {
  // Overpair: only the two remaining aces improve it
  const aa = calcOuts(['As', 'Ad'], ['7h', '2c', '9s']);
  assert.deepEqual(aa.groups.map(g => [g.name, g.count]), [['Three of a Kind', 2]]);

  // Set: pairing the board makes a full house, which is a real improvement
  const set = calcOuts(['Kc', 'Kd'], ['Ks', '7h', '2c']);
  assert.equal(set.groups.find(g => g.name === 'Full House').count, 6);
  assert.equal(set.groups.find(g => g.name === 'Four of a Kind').count, 1);

  // Top two pair: pairing the 2 counterfeits nothing and is not an out
  const twoPair = calcOuts(['9c', '7d'], ['9h', '7s', '2c']);
  assert.ok(!twoPair.groups.some(g => g.cards.some(c => c[0] === '2')));
  assert.equal(twoPair.groups.find(g => g.name === 'Full House').count, 4);
});

test('no outs on the river or preflop', () => {
  assert.equal(calcOuts(['As', 'Ad'], []), null);
  assert.equal(calcOuts(['As', 'Ad'], ['2c', '3d', '4h', '5s', '9c']), null);
});
