import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import QRCode from 'qrcode';
import {
  ensureSignedIn,
  joinTable,
  removePlayer,
  setMyCards,
  setFolded,
  setBoard,
  nextHand,
  endTable,
  subscribeTable,
  subscribeMyHand,
  subscribeMyOdds,
  subscribeStatus,
  NAME_KEY,
  LAST_TABLE_KEY,
} from '../store/oddsTables';
import PlayingCard from '../components/PlayingCard';
import CardPicker from '../components/CardPicker';
import DarkModeToggle from '../components/DarkModeToggle';
import { SUIT_STYLES, rankLabel } from '../components/cardStyles';

const STREETS = { 0: 'Pre-flop', 3: 'Flop', 4: 'Turn', 5: 'River' };
const NEXT_STREET = { 0: { label: 'Flop', count: 3 }, 3: { label: 'Turn', count: 1 }, 4: { label: 'River', count: 1 } };

const pct = x => `${x.toFixed(1)}%`;
const sameCards = (a, b) => !!a && !!b && a.length === b.length && a.every(c => b.includes(c));

const panel = 'bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4';
const smallBtn = 'px-3 py-1.5 rounded-lg text-sm font-medium transition-colors disabled:opacity-50';
const primaryBtn = `${smallBtn} bg-emerald-600 hover:bg-emerald-700 text-white`;
const secondaryBtn = `${smallBtn} border border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700`;

const centered = text => (
  <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center px-4">
    <p className="text-gray-400 text-center">{text}</p>
  </div>
);

function CardChip({ card }) {
  const suit = SUIT_STYLES[card[1]];
  return (
    <span className={`inline-block px-1 rounded bg-white border border-gray-200 text-xs font-bold ${suit.color}`}>
      {rankLabel(card[0])}{suit.symbol}
    </span>
  );
}

function SharePanel({ code }) {
  const url = `${window.location.origin}/odds/${code}`;
  const [qr, setQr] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    QRCode.toDataURL(url, { margin: 1, width: 240 }).then(setQr);
  }, [url]);

  function copy() {
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  return (
    <div className={`${panel} text-center space-y-3`}>
      <p className="text-sm text-gray-500 dark:text-gray-400">Players scan this or enter the code</p>
      {qr && <img src={qr} alt={`QR code for table ${code}`} className="mx-auto w-48 h-48 rounded bg-white" />}
      <p className="font-mono text-3xl font-bold tracking-[0.3em] text-gray-800 dark:text-gray-100">{code}</p>
      <button onClick={copy} className={secondaryBtn}>{copied ? 'Link copied!' : 'Copy link'}</button>
    </div>
  );
}

function BoardSection({ board, isHost, blocked, onSetBoard, onNextHand }) {
  const [picking, setPicking] = useState(null); // { label, count } while choosing the next street
  const [selection, setSelection] = useState([]);
  const next = NEXT_STREET[board.length];

  function startPicking() {
    setSelection([]);
    setPicking(next);
  }

  async function confirm() {
    await onSetBoard([...board, ...selection]);
    setPicking(null);
  }

  // Back to the previous street, e.g. after a mis-tap
  const undo = () => onSetBoard(board.length === 3 ? [] : board.slice(0, -1));

  const slots = [0, 1, 2, 3, 4].map(i => board[i] || (picking ? selection[i - board.length] : null));

  return (
    <div className={`${panel} space-y-3`}>
      <div className="flex items-center justify-between">
        <h2 className="font-semibold text-gray-700 dark:text-gray-300 text-sm">Board</h2>
        <span className="text-xs font-medium px-2 py-0.5 rounded bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300">
          {STREETS[board.length]}
        </span>
      </div>
      <div className="flex justify-center gap-2">
        {slots.map((card, i) => <PlayingCard key={i} card={card} />)}
      </div>

      {isHost && !picking && (
        <div className="flex flex-wrap gap-2 justify-center">
          {next && <button onClick={startPicking} className={primaryBtn}>Deal {next.label}</button>}
          {board.length > 0 && <button onClick={undo} className={secondaryBtn}>Undo {STREETS[board.length]}</button>}
          <button onClick={onNextHand} className={`${smallBtn} bg-amber-600 hover:bg-amber-700 text-white`}>New hand</button>
        </div>
      )}

      {isHost && picking && (
        <div className="space-y-3">
          <p className="text-sm text-gray-500 dark:text-gray-400 text-center">
            Tap the {picking.count === 3 ? '3 flop cards' : `${picking.label.toLowerCase()} card`}
          </p>
          <CardPicker selected={selection} onChange={setSelection} max={picking.count} unavailable={blocked} />
          <div className="flex gap-2 justify-center">
            <button onClick={() => setPicking(null)} className={secondaryBtn}>Cancel</button>
            <button onClick={confirm} disabled={selection.length !== picking.count} className={primaryBtn}>
              Confirm {picking.label}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function MyHandSection({ myCards, board, folded, onSave, onFold }) {
  const [editing, setEditing] = useState(false);
  const [selection, setSelection] = useState([]);
  const [hidden, setHidden] = useState(false);
  const picking = !myCards || editing;

  async function save() {
    await onSave(selection);
    setEditing(false);
    setSelection([]);
  }

  function startEditing() {
    setSelection(myCards);
    setEditing(true);
  }

  return (
    <div className={`${panel} space-y-3`}>
      <div className="flex items-center justify-between">
        <h2 className="font-semibold text-gray-700 dark:text-gray-300 text-sm">Your cards</h2>
        {myCards && !editing && (
          <button onClick={() => setHidden(h => !h)} className="text-xs text-gray-500 dark:text-gray-400 hover:underline">
            {hidden ? 'Show' : 'Hide'}
          </button>
        )}
      </div>

      {picking ? (
        <div className="space-y-3">
          <div className="flex justify-center gap-2">
            <PlayingCard card={selection[0]} size="lg" />
            <PlayingCard card={selection[1]} size="lg" />
          </div>
          <CardPicker selected={selection} onChange={setSelection} max={2} unavailable={board} />
          <div className="flex gap-2 justify-center">
            {editing && <button onClick={() => setEditing(false)} className={secondaryBtn}>Cancel</button>}
            <button onClick={save} disabled={selection.length !== 2} className={primaryBtn}>Lock in cards</button>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          <div className={`flex justify-center gap-2 ${folded ? 'opacity-40' : ''}`}>
            <PlayingCard card={myCards[0]} size="lg" faceDown={hidden} />
            <PlayingCard card={myCards[1]} size="lg" faceDown={hidden} />
          </div>
          <div className="flex gap-2 justify-center">
            <button onClick={startEditing} className={secondaryBtn}>Change cards</button>
            <button onClick={() => onFold(!folded)} className={folded ? primaryBtn : `${smallBtn} bg-red-600 hover:bg-red-700 text-white`}>
              {folded ? 'Back in hand' : 'Fold'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function OddsPanel({ odds, current }) {
  if (!current) {
    return (
      <div className={`${panel} text-center`}>
        <p className="text-gray-400 animate-pulse">Calculating odds...</p>
      </div>
    );
  }

  if (odds.status !== 'ok') {
    const text = {
      'no-cards': 'Tap in your two cards to see your odds.',
      folded: 'You folded this hand.',
    }[odds.status] || odds.message;
    const tone = odds.status === 'conflict'
      ? 'bg-red-50 dark:bg-red-900/30 border-red-200 dark:border-red-800 text-red-700 dark:text-red-300'
      : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400';
    return <div className={`rounded-xl border p-4 text-center text-sm ${tone}`}>{text}</div>;
  }

  const opponents = odds.knownOpponents + odds.unknownOpponents;
  const { outs } = odds;

  return (
    <div className={`${panel} space-y-4`}>
      <div className="grid grid-cols-3 gap-2 text-center">
        <div className="rounded-lg bg-emerald-50 dark:bg-emerald-900/30 py-2">
          <p className="text-xs text-emerald-700 dark:text-emerald-300">Win</p>
          <p className="text-2xl font-bold text-emerald-700 dark:text-emerald-300">{pct(odds.win)}</p>
        </div>
        <div className="rounded-lg bg-amber-50 dark:bg-amber-900/30 py-2">
          <p className="text-xs text-amber-700 dark:text-amber-300">Tie</p>
          <p className="text-2xl font-bold text-amber-700 dark:text-amber-300">{pct(odds.tie)}</p>
        </div>
        <div className="rounded-lg bg-red-50 dark:bg-red-900/30 py-2">
          <p className="text-xs text-red-700 dark:text-red-300">Lose</p>
          <p className="text-2xl font-bold text-red-700 dark:text-red-300">{pct(odds.lose)}</p>
        </div>
      </div>

      <div className="flex h-2.5 rounded-full overflow-hidden bg-gray-200 dark:bg-gray-700">
        <div className="bg-emerald-500" style={{ width: `${odds.win}%` }} />
        <div className="bg-amber-400" style={{ width: `${odds.tie}%` }} />
        <div className="bg-red-500" style={{ width: `${odds.lose}%` }} />
      </div>

      {odds.handName && (
        <p className="text-center text-gray-700 dark:text-gray-200">
          You have <span className="font-semibold">{odds.handName}</span>
        </p>
      )}

      {outs && outs.total > 0 && (
        <div className="space-y-2">
          <div className="flex items-baseline justify-between">
            <h3 className="font-semibold text-gray-700 dark:text-gray-300 text-sm">{outs.total} outs to improve</h3>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {pct(outs.nextCard)} next card{outs.byRiver != null && ` · ${pct(outs.byRiver)} by river`}
            </p>
          </div>
          {outs.groups.map(g => (
            <div key={g.name} className="rounded-lg bg-gray-50 dark:bg-gray-900/50 p-2 space-y-1">
              <div className="flex justify-between text-sm">
                <span className="text-gray-700 dark:text-gray-200">{g.name} <span className="text-gray-400">({g.count})</span></span>
                <span className="text-gray-500 dark:text-gray-400">
                  {pct(g.nextCard)}{g.byRiver != null && ` / ${pct(g.byRiver)}`}
                </span>
              </div>
              <div className="flex flex-wrap gap-1">{g.cards.map(c => <CardChip key={c} card={c} />)}</div>
            </div>
          ))}
        </div>
      )}

      <p className="text-xs text-gray-400 text-center">
        {opponents === 0
          ? 'Everyone else has folded.'
          : `Against ${opponents} player${opponents === 1 ? '' : 's'}`
            + (odds.unknownOpponents ? ` (${odds.unknownOpponents} without cards counted as random)` : '')
            + ` · ${odds.method === 'exact' ? 'exact' : `${odds.trials.toLocaleString()} simulated runouts`}`}
      </p>
    </div>
  );
}

function PlayersList({ table, uid, isHost, onFold, onRemove }) {
  const players = Object.entries(table.players || {}).sort(([, a], [, b]) => a.joinedAt - b.joinedAt);
  return (
    <div className={`${panel} space-y-2`}>
      <h2 className="font-semibold text-gray-700 dark:text-gray-300 text-sm">Players ({players.length})</h2>
      {players.map(([id, p]) => {
        const hasCards = p.cardsFor === table.handNumber;
        const [label, tone] = p.folded
          ? ['Folded', 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400']
          : hasCards
            ? ['Cards in', 'bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300']
            : ['No cards', 'bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-300'];
        return (
          <div key={id} className="flex items-center justify-between gap-2 py-1">
            <div className="min-w-0">
              <span className="text-gray-800 dark:text-gray-100 truncate">{p.name}</span>
              {id === uid && <span className="text-gray-400 text-sm"> (you)</span>}
              {id === table.hostUid && <span className="ml-1 text-xs text-amber-600 dark:text-amber-400">host</span>}
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <span className={`text-xs px-2 py-0.5 rounded ${tone}`}>{label}</span>
              {isHost && id !== uid && (
                <>
                  <button onClick={() => onFold(id, !p.folded)} className="text-xs text-gray-500 dark:text-gray-400 hover:underline">
                    {p.folded ? 'Unfold' : 'Fold'}
                  </button>
                  <button onClick={() => onRemove(id)} className="text-xs text-red-500 hover:underline">Remove</button>
                </>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function JoinForm({ code, onError }) {
  const [name, setName] = useState(() => localStorage.getItem(NAME_KEY) || '');
  const [busy, setBusy] = useState(false);

  async function join() {
    const trimmed = name.trim();
    if (!trimmed) return;
    setBusy(true);
    localStorage.setItem(NAME_KEY, trimmed);
    await joinTable(code, trimmed).catch(onError);
    setBusy(false);
  }

  return (
    <div className={`${panel} space-y-3`}>
      <h2 className="font-semibold text-gray-700 dark:text-gray-300">Join table {code}</h2>
      <div className="flex gap-2">
        <input
          value={name}
          onChange={e => setName(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && join()}
          maxLength={20}
          placeholder="Your name"
          className="flex-1 min-w-0 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
        />
        <button onClick={join} disabled={busy || !name.trim()} className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-lg disabled:opacity-50 transition-colors">
          Join
        </button>
      </div>
    </div>
  );
}

export default function OddsTable() {
  const { code } = useParams();
  const navigate = useNavigate();
  const [uid, setUid] = useState(null);
  const [table, setTable] = useState(undefined); // undefined while loading, null once ended
  const [hand, setHand] = useState(null);
  const [odds, setOdds] = useState(null);
  const [status, setStatus] = useState(null);
  const [showShare, setShowShare] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    ensureSignedIn().then(u => setUid(u.uid), e => setError(e.message));
  }, []);

  useEffect(() => {
    if (!uid) return;
    const onError = e => setError(e.message);
    const unsubs = [
      subscribeTable(code, setTable, onError),
      subscribeMyHand(code, uid, setHand, onError),
      subscribeMyOdds(code, uid, setOdds, onError),
      subscribeStatus(code, setStatus, onError),
    ];
    return () => unsubs.forEach(unsub => unsub());
  }, [code, uid]);

  const me = table?.players?.[uid];

  useEffect(() => {
    if (me) localStorage.setItem(LAST_TABLE_KEY, code);
    else if (table === null && localStorage.getItem(LAST_TABLE_KEY) === code) localStorage.removeItem(LAST_TABLE_KEY);
  }, [me, table, code]);

  function act(action) {
    setError('');
    return Promise.resolve().then(action).catch(e => setError(e.message || 'Something went wrong.'));
  }

  if (error && table === undefined) return centered(error);
  if (table === undefined || !uid) return centered('Loading...');
  if (table === null) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col items-center justify-center gap-4 px-4">
        <p className="text-gray-500 dark:text-gray-400">Table {code} has ended or doesn&apos;t exist.</p>
        <button onClick={() => navigate('/odds')} className={primaryBtn}>Back to Live Odds</button>
      </div>
    );
  }

  const isHost = table.hostUid === uid;
  const handNumber = table.handNumber;
  const board = table.board || [];
  const myCards = me && me.cardsFor === handNumber && hand?.handNumber === handNumber ? hand.cards : null;

  // The function's result is current once it reflects this hand, street, cards and fold
  const oddsCurrent = !!odds
    && odds.handNumber === handNumber
    && odds.street === { 0: 'preflop', 3: 'flop', 4: 'turn', 5: 'river' }[board.length]
    && (me?.folded
      ? odds.status === 'folded'
      : myCards
        ? odds.status !== 'folded' && odds.status !== 'no-cards' && sameCards(odds.cards, myCards)
        : odds.status === 'no-cards');

  async function leave() {
    if (isHost) {
      if (!confirm('End this table for everyone? All cards are cleared.')) return;
      await act(() => endTable(code));
    } else {
      await act(() => removePlayer(code, uid));
    }
    localStorage.removeItem(LAST_TABLE_KEY);
    navigate('/odds');
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <header className="bg-emerald-700 text-white py-4 px-4">
        <div className="max-w-lg mx-auto flex items-center justify-between">
          <DarkModeToggle />
          <div className="text-center">
            <h1 className="text-lg font-bold font-mono tracking-widest">{code}</h1>
            <p className="text-emerald-200 text-xs">Hand #{handNumber}</p>
          </div>
          <button onClick={() => setShowShare(s => !s)} className="text-emerald-200 hover:text-white text-sm font-medium">
            {showShare ? 'Close' : 'Invite'}
          </button>
        </div>
      </header>

      <main className="max-w-lg mx-auto p-4 space-y-4">
        {showShare && <SharePanel code={code} />}

        {status?.conflict && status.handNumber === handNumber && (
          <div className="rounded-xl border p-3 text-center text-sm bg-red-50 dark:bg-red-900/30 border-red-200 dark:border-red-800 text-red-700 dark:text-red-300">
            A card has been entered twice at this table. Odds are paused until it&apos;s fixed.
          </div>
        )}

        <BoardSection
          board={board}
          isHost={isHost}
          blocked={[...board, ...(myCards || [])]}
          onSetBoard={b => act(() => setBoard(code, b))}
          onNextHand={() => act(() => nextHand(code))}
        />

        {me ? (
          <>
            <MyHandSection
              key={handNumber}
              myCards={myCards}
              board={board}
              folded={!!me.folded}
              onSave={cards => act(() => setMyCards(code, handNumber, cards))}
              onFold={f => act(() => setFolded(code, uid, f))}
            />
            <OddsPanel odds={odds} current={oddsCurrent} />
          </>
        ) : isHost ? (
          <div className={`${panel} flex items-center justify-between`}>
            <p className="text-sm text-gray-500 dark:text-gray-400">You&apos;re dealing only.</p>
            <button onClick={() => act(() => joinTable(code, localStorage.getItem(NAME_KEY) || 'Host'))} className={primaryBtn}>
              Take a seat
            </button>
          </div>
        ) : (
          <JoinForm code={code} onError={e => setError(e.message)} />
        )}

        {error && <p className="text-red-500 text-sm text-center">{error}</p>}

        <PlayersList
          table={table}
          uid={uid}
          isHost={isHost}
          onFold={(id, f) => act(() => setFolded(code, id, f))}
          onRemove={id => act(() => removePlayer(code, id))}
        />

        {isHost && me && (
          <button onClick={() => act(() => removePlayer(code, uid))} className={`${secondaryBtn} w-full`}>
            Sit out (deal only)
          </button>
        )}
        {(me || isHost) && (
          <button onClick={leave} className="w-full py-2 text-sm text-red-500 hover:underline">
            {isHost ? 'End table' : 'Leave table'}
          </button>
        )}
      </main>
    </div>
  );
}
