import { parseCard, handName, calcEquity, calcOuts } from './poker.js';

const STREETS = { 0: 'preflop', 3: 'flop', 4: 'turn', 5: 'river' };

const round1 = x => Math.round(x * 10) / 10;

function validCards(cards, count) {
  return Array.isArray(cards) && cards.length === count && cards.every(c => parseCard(c) >= 0);
}

// Which win/tie/lose numbers a table may see:
// - 'solo': one player practising alone. Hand and outs only; there is nobody to beat.
// - 'hidden': the default with 2+ players. Win % against the real hands would tell a player
//   to fold a beaten hand, so it is held back until the host reveals (all-in or showdown).
// - 'live': the host turned on win % during the hand, e.g. for a practice or friendly game.
// - 'revealed': the host revealed the hands; everyone sees all live cards and win %.
export function oddsMode(table) {
  if (Object.keys(table.players || {}).length <= 1) return 'solo';
  if (table.revealed) return 'revealed';
  return table.liveOdds ? 'live' : 'hidden';
}

// Works out what every player at the table should see, from the public table doc and the
// private hand docs. Each odds result goes only to its own player; `reveal` is public and
// empty unless the host has revealed the hands. `key` changes only when an input that affects
// the results changes, so repeat triggers can be skipped.
export function computeTableOdds(table, hands, options = {}) {
  const handNumber = table.handNumber || 1;
  const board = Array.isArray(table.board) ? table.board : [];
  const street = STREETS[board.length] || null;
  const players = Object.entries(table.players || {}).sort(([a], [b]) => a.localeCompare(b));
  const mode = oddsMode(table);
  const showEquity = mode === 'live' || mode === 'revealed';

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
  const ready = !!street && validCards(board, board.length) && duplicates.size === 0;

  const key = JSON.stringify({
    handNumber,
    board,
    mode,
    players: players.map(([uid, p]) => [uid, !!p.folded, hasCards.has(uid) ? hands[uid].cards : null]),
  });

  const status = {
    handNumber,
    street,
    mode,
    livePlayers: live.length,
    playersWithCards: withCards.length,
    conflict: duplicates.size > 0,
  };

  // Only computed when someone is allowed to see it, so hidden numbers never leave the server
  const equity = ready && showEquity && withCards.length > 0
    ? calcEquity({ hands: withCards.map(([uid]) => hands[uid].cards), board, unknownCount, ...options })
    : null;

  const odds = {};
  const named = [];
  withCards.forEach(([uid, p], i) => {
    const cards = hands[uid].cards;
    // Echo the player's own cards so their screen can tell these odds are for their current hand
    const base = { handNumber, street, mode, cards };
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
    if (!ready) {
      odds[uid] = {
        ...base,
        status: 'waiting',
        message: duplicates.size ? 'Waiting for a duplicate card at the table to be fixed.' : 'Waiting for the board.',
      };
      return;
    }
    const result = {
      ...base,
      status: 'ok',
      handName: board.length >= 3 ? handName([...cards, ...board].map(parseCard)) : null,
      outs: calcOuts(cards, board),
    };
    if (equity) {
      const r = equity.results[i];
      Object.assign(result, {
        win: round1(r.win),
        tie: round1(r.tie),
        lose: round1(r.lose),
        method: equity.method,
        trials: equity.trials,
        knownOpponents: withCards.length - 1,
        unknownOpponents: unknownCount,
      });
      named.push({ uid, name: p.name, cards, handName: result.handName, win: result.win, tie: result.tie, lose: result.lose });
    }
    odds[uid] = result;
  });

  for (const [uid, p] of players) {
    if (odds[uid]) continue;
    odds[uid] = { handNumber, street, mode, status: p.folded ? 'folded' : 'no-cards' };
  }

  // Folded hands stay hidden, as at a real table
  const reveal = mode === 'revealed' && equity
    ? { handNumber, street, board, players: named, unknownPlayers: unknownCount, method: equity.method }
    : { handNumber, street, board, players: [] };

  return { key, status, odds, reveal };
}
