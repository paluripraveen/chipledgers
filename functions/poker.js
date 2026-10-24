// Texas Hold'em hand evaluation, equity and outs. Pure JS with no dependencies.
// Cards are strings like 'As', 'Td', '9h', '2c' at the edges, and ints (rank * 4 + suit) inside.

export const RANKS = '23456789TJQKA';
export const SUITS = 'cdhs';

export const HAND_NAMES = [
  'High Card', 'Pair', 'Two Pair', 'Three of a Kind', 'Straight',
  'Flush', 'Full House', 'Four of a Kind', 'Straight Flush',
];

export function parseCard(str) {
  if (typeof str !== 'string' || str.length !== 2) return -1;
  const r = RANKS.indexOf(str[0]);
  const s = SUITS.indexOf(str[1]);
  return r < 0 || s < 0 ? -1 : r * 4 + s;
}

export function cardToString(c) {
  return RANKS[c >> 2] + SUITS[c & 3];
}

// Scores pack the category and up to five tiebreak ranks into one comparable number
function score(category, ranks) {
  let s = category;
  for (let i = 0; i < 5; i++) s = s * 16 + (ranks[i] ?? 0);
  return s;
}

export function categoryOf(s) {
  return Math.floor(s / 16 ** 5);
}

// Highest rank of a 5-card run in a 13-bit rank mask, or -1. Handles the A-2-3-4-5 wheel.
function straightHigh(mask) {
  const ext = (mask << 1) | ((mask >> 12) & 1); // bit 0 is a low ace
  for (let hi = 13; hi >= 4; hi--) {
    if (((ext >> (hi - 4)) & 0x1f) === 0x1f) return hi - 1;
  }
  return -1;
}

function topRanks(mask, n, exclude = []) {
  const out = [];
  for (let r = 12; r >= 0 && out.length < n; r--) {
    if ((mask >> r) & 1 && !exclude.includes(r)) out.push(r);
  }
  return out;
}

const counts = new Uint8Array(13);
const suitMasks = new Uint16Array(4);

// Best hand from 1-7 card ints. Higher score wins; equal scores split.
export function evaluate(cards) {
  counts.fill(0);
  suitMasks.fill(0);
  let rankMask = 0;
  for (const c of cards) {
    const r = c >> 2;
    counts[r]++;
    suitMasks[c & 3] |= 1 << r;
    rankMask |= 1 << r;
  }

  let flushMask = 0;
  for (let s = 0; s < 4; s++) {
    let m = suitMasks[s], bits = 0;
    while (m) { bits++; m &= m - 1; }
    if (bits >= 5) flushMask = suitMasks[s];
  }
  if (flushMask) {
    const sf = straightHigh(flushMask);
    if (sf >= 0) return score(8, [sf]);
  }

  let quad = -1;
  const trips = [], pairs = [];
  for (let r = 12; r >= 0; r--) {
    if (counts[r] === 4) quad = r;
    else if (counts[r] === 3) trips.push(r);
    else if (counts[r] === 2) pairs.push(r);
  }

  if (quad >= 0) return score(7, [quad, ...topRanks(rankMask, 1, [quad])]);
  if (trips.length && (trips.length > 1 || pairs.length)) {
    return score(6, [trips[0], Math.max(trips[1] ?? -1, pairs[0] ?? -1)]);
  }
  if (flushMask) return score(5, topRanks(flushMask, 5));
  const st = straightHigh(rankMask);
  if (st >= 0) return score(4, [st]);
  if (trips.length) return score(3, [trips[0], ...topRanks(rankMask, 2, [trips[0]])]);
  if (pairs.length >= 2) return score(2, [pairs[0], pairs[1], ...topRanks(rankMask, 1, [pairs[0], pairs[1]])]);
  if (pairs.length) return score(1, [pairs[0], ...topRanks(rankMask, 3, [pairs[0]])]);
  return score(0, topRanks(rankMask, 5));
}

export function handName(cards) {
  const s = evaluate(cards);
  const cat = categoryOf(s);
  if (cat === 8 && Math.floor(s / 16 ** 4) % 16 === 12) return 'Royal Flush';
  return HAND_NAMES[cat];
}

function remainingDeck(used) {
  const taken = new Set(used);
  const deck = [];
  for (let c = 0; c < 52; c++) if (!taken.has(c)) deck.push(c);
  return deck;
}

function choose(n, k) {
  if (k < 0 || k > n) return 0;
  let r = 1;
  for (let i = 0; i < k; i++) r = (r * (n - i)) / (i + 1);
  return Math.round(r);
}

// Calls fn with every k-card combination of deck (reusing one array)
function forEachCombo(deck, k, fn) {
  const pick = new Array(k);
  (function rec(start, depth) {
    if (depth === k) { fn(pick); return; }
    for (let i = start; i <= deck.length - (k - depth); i++) {
      pick[depth] = deck[i];
      rec(i + 1, depth + 1);
    }
  })(0, 0);
}

export const EXACT_LIMIT = 50000;
export const SIMULATIONS = 40000;

// Win/tie/lose % for each known hand against the other known hands plus `unknownCount`
// players holding random cards. Exact when the runouts are few enough, otherwise simulated.
export function calcEquity({ hands, board = [], unknownCount = 0, simulations = SIMULATIONS, random = Math.random }) {
  const known = hands.map(h => h.map(parseCard));
  const boardInts = board.map(parseCard);
  const deck = remainingDeck([...known.flat(), ...boardInts]);
  const need = 5 - boardInts.length;
  const n = known.length;
  const win = new Array(n).fill(0), tie = new Array(n).fill(0);
  const seven = known.map(h => [...h, ...boardInts, 0, 0, 0, 0, 0].slice(0, 7));
  const scores = new Array(n);
  let trials = 0;

  function settle(runout, unknownScores) {
    let best = -1;
    for (let i = 0; i < n; i++) {
      const cards = seven[i];
      for (let j = 0; j < need; j++) cards[2 + boardInts.length + j] = runout[j];
      scores[i] = evaluate(cards);
      if (scores[i] > best) best = scores[i];
    }
    for (const s of unknownScores) if (s > best) best = s;
    let winners = 0;
    for (let i = 0; i < n; i++) if (scores[i] === best) winners++;
    for (const s of unknownScores) if (s === best) winners++;
    for (let i = 0; i < n; i++) {
      if (scores[i] !== best) continue;
      if (winners === 1) win[i]++; else tie[i]++;
    }
    trials++;
  }

  const exact = unknownCount === 0 && choose(deck.length, need) <= EXACT_LIMIT;
  if (exact) {
    forEachCombo(deck, need, runout => settle(runout, []));
  } else {
    const draw = need + unknownCount * 2;
    const pool = deck.slice();
    const runout = new Array(need);
    const unknownScores = new Array(unknownCount);
    const fullBoard = [...boardInts, ...new Array(need)];
    for (let t = 0; t < simulations; t++) {
      // Partial Fisher-Yates: the first `draw` slots become a random sample
      for (let i = 0; i < draw; i++) {
        const j = i + Math.floor(random() * (pool.length - i));
        const tmp = pool[i]; pool[i] = pool[j]; pool[j] = tmp;
      }
      for (let j = 0; j < need; j++) runout[j] = pool[j];
      for (let j = 0; j < need; j++) fullBoard[boardInts.length + j] = runout[j];
      for (let u = 0; u < unknownCount; u++) {
        unknownScores[u] = evaluate([pool[need + u * 2], pool[need + u * 2 + 1], ...fullBoard]);
      }
      settle(runout, unknownScores);
    }
  }

  return {
    method: exact ? 'exact' : 'simulated',
    trials,
    results: known.map((_, i) => ({
      win: (win[i] / trials) * 100,
      tie: (tie[i] / trials) * 100,
      lose: ((trials - win[i] - tie[i]) / trials) * 100,
    })),
  };
}

// Classic poker outs from one player's point of view (only their cards and the board):
// next cards that lift their hand to a better category using their hole cards.
// Grouped by what each card makes, with the chance of hitting by the next card and by the river.
export function calcOuts(hole, board) {
  if (board.length < 3 || board.length > 4) return null;
  const holeInts = hole.map(parseCard);
  const boardInts = board.map(parseCard);
  const current = categoryOf(evaluate([...holeInts, ...boardInts]));
  const currentEdge = current - categoryOf(evaluate(boardInts));
  const unseen = remainingDeck([...holeInts, ...boardInts]);
  const groups = new Map();

  for (const c of unseen) {
    const mine = categoryOf(evaluate([...holeInts, ...boardInts, c]));
    if (mine <= current) continue;
    // Only count cards that widen the gap between your hand and the board. A card that pairs
    // the board (AA on 9-7-2 becoming "two pair" with a 2) helps every player just as much.
    if (mine - categoryOf(evaluate([...boardInts, c])) <= currentEdge) continue;
    const name = HAND_NAMES[mine];
    if (!groups.has(name)) groups.set(name, { name, category: mine, cards: [] });
    groups.get(name).cards.push(cardToString(c));
  }

  const total = [...groups.values()].reduce((sum, g) => sum + g.cards.length, 0);
  const n = unseen.length;
  const pct = outs => ({
    nextCard: (outs / n) * 100,
    // With two cards to come, miss both to fail
    byRiver: board.length === 3 ? (1 - ((n - outs) * (n - outs - 1)) / (n * (n - 1))) * 100 : null,
  });

  return {
    total,
    ...pct(total),
    groups: [...groups.values()]
      .sort((a, b) => b.category - a.category)
      .map(g => ({ name: g.name, count: g.cards.length, cards: g.cards, ...pct(g.cards.length) })),
  };
}
