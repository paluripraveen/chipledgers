import { parseCard, handName, calcEquity, calcOuts } from './poker.js';

const STREETS = { 0: 'preflop', 3: 'flop', 4: 'turn', 5: 'river' };

const round1 = x => Math.round(x * 10) / 10;

function validCards(cards, count) {
  return Array.isArray(cards) && cards.length === count && cards.every(c => parseCard(c) >= 0);
}

// Works out what every player at the table should see, from the public table doc and the
// private hand docs. Each result goes only to its own player. `key` changes only when an
// input that affects the odds changes, so repeat triggers can be skipped.
export function computeTableOdds(table, hands, options = {}) {
  const handNumber = table.handNumber || 1;
  const board = Array.isArray(table.board) ? table.board : [];
  const street = STREETS[board.length];
  const players = Object.entries(table.players || {}).sort(([a], [b]) => a.localeCompare(b));

  const live = players.filter(([, p]) => !p.folded);
  const withCards = live.filter(([uid, p]) => {
    const hand = hands[uid];
    return p.cardsFor === handNumber && hand?.handNumber === handNumber && validCards(hand.cards, 2);
  });
  const hasCards = new Set(withCards.map(([uid]) => uid));
  const unknownCount = live.length - withCards.length;

  // A card can only be in one place: the board or one player's hand
  const seen = new Map();
  for (const c of board) seen.set(c, (seen.get(c) || 0) + 1);
  for (const [uid] of withCards) for (const c of hands[uid].cards) seen.set(c, (seen.get(c) || 0) + 1);
  const duplicates = new Set([...seen].filter(([, n]) => n > 1).map(([c]) => c));
  const boardOk = street && validCards(board, board.length);

  const key = JSON.stringify({
    handNumber,
    board,
    players: players.map(([uid, p]) => [uid, !!p.folded, hasCards.has(uid) ? hands[uid].cards : null]),
  });

  const status = {
    handNumber,
    street: street || null,
    livePlayers: live.length,
    playersWithCards: withCards.length,
    conflict: duplicates.size > 0,
  };

  const odds = {};
  let equity = null;
  if (boardOk && duplicates.size === 0 && withCards.length > 0) {
    equity = calcEquity({ hands: withCards.map(([uid]) => hands[uid].cards), board, unknownCount, ...options });
  }

  withCards.forEach(([uid], i) => {
    const cards = hands[uid].cards;
    // Echo the player's own cards so their screen can tell these odds are for their current hand
    const base = { handNumber, street: street || null, cards };
    const mine = cards.filter(c => duplicates.has(c));
    if (mine.length) {
      const onBoard = mine.find(c => board.includes(c));
      odds[uid] = {
        ...base,
        status: 'conflict',
        message: onBoard
          ? `The board shows ${onBoard}, which you entered as one of your cards. Check your cards or ask the host to fix the board.`
          : `Someone else entered ${mine[0]} too. Check your cards.`,
      };
      return;
    }
    if (!equity) {
      odds[uid] = {
        ...base,
        status: 'waiting',
        message: duplicates.size ? 'Waiting for a duplicate card at the table to be fixed.' : 'Waiting for the board.',
      };
      return;
    }
    const r = equity.results[i];
    odds[uid] = {
      ...base,
      status: 'ok',
      win: round1(r.win),
      tie: round1(r.tie),
      lose: round1(r.lose),
      method: equity.method,
      trials: equity.trials,
      knownOpponents: withCards.length - 1,
      unknownOpponents: unknownCount,
      handName: board.length >= 3 ? handName([...cards, ...board].map(parseCard)) : null,
      outs: calcOuts(cards, board),
    };
  });

  for (const [uid, p] of players) {
    if (odds[uid]) continue;
    odds[uid] = { handNumber, street: street || null, status: p.folded ? 'folded' : 'no-cards' };
  }

  return { key, status, odds };
}
