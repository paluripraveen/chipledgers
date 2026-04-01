import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getSessions, deleteSession, archiveSeason } from '../store/sessions';
import { getSettlements, recordSettlement } from '../store/settlements';
import { getPlayers, deletePlayer, playerDisplayName } from '../store/players';

const ADMIN_PIN = import.meta.env.VITE_ADMIN_PIN || '1234';

// Calculate minimum transactions to settle all debts
function optimizePayouts(balances) {
  const debtors = [];
  const creditors = [];

  Object.entries(balances).forEach(([name, amount]) => {
    if (amount > 0.01) debtors.push({ name, amount });
    else if (amount < -0.01) creditors.push({ name, amount: Math.abs(amount) });
  });

  debtors.sort((a, b) => b.amount - a.amount);
  creditors.sort((a, b) => b.amount - a.amount);

  const transactions = [];
  let i = 0, j = 0;
  while (i < debtors.length && j < creditors.length) {
    const pay = Math.min(debtors[i].amount, creditors[j].amount);
    if (pay > 0.01) {
      transactions.push({
        from: debtors[i].name,
        to: creditors[j].name,
        amount: Math.round(pay * 100) / 100,
      });
    }
    debtors[i].amount -= pay;
    creditors[j].amount -= pay;
    if (debtors[i].amount < 0.01) i++;
    if (creditors[j].amount < 0.01) j++;
  }
  return transactions;
}

export default function Admin() {
  const { groupId } = useParams();
  const navigate = useNavigate();
  const [authenticated, setAuthenticated] = useState(false);
  const [pin, setPin] = useState('');
  const [pinError, setPinError] = useState('');
  const [sessions, setSessions] = useState([]);
  const [settlements, setSettlements] = useState([]);
  const [allPlayers, setAllPlayers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [settling, setSettling] = useState(null);
  const [settleAmount, setSettleAmount] = useState('');
  const [seasonLabel, setSeasonLabel] = useState('');
  const [archiveResult, setArchiveResult] = useState(null);

  useEffect(() => {
    if (sessionStorage.getItem('chipledgers_admin') === 'true') {
      setAuthenticated(true);
    }
  }, []);

  useEffect(() => {
    if (!authenticated) return;
    Promise.all([getSessions(groupId), getSettlements(groupId), getPlayers()])
      .then(([s, st, p]) => {
        setSessions(s);
        setSettlements(st);
        setAllPlayers(p);
        setLoading(false);
      })
      .catch(err => {
        console.error('Admin load error:', err);
        setLoading(false);
      });
  }, [authenticated, groupId]);

  function handleLogin(e) {
    e.preventDefault();
    if (pin === ADMIN_PIN) {
      sessionStorage.setItem('chipledgers_admin', 'true');
      setAuthenticated(true);
      setPinError('');
    } else {
      setPinError('Incorrect PIN');
    }
  }

  async function refresh() {
    const [s, st, p] = await Promise.all([getSessions(groupId), getSettlements(groupId), getPlayers()]);
    setSessions(s);
    setSettlements(st);
    setAllPlayers(p);
  }

  async function handleArchive() {
    if (!seasonLabel.trim()) return;
    if (!confirm(`Archive all completed sessions as "${seasonLabel.trim()}"? Stats will start fresh.`)) return;
    const count = await archiveSeason(groupId, seasonLabel.trim());
    setArchiveResult(`Archived ${count} sessions as "${seasonLabel.trim()}"`);
    setSeasonLabel('');
    await refresh();
    setTimeout(() => setArchiveResult(null), 3000);
  }

  async function handleDeletePlayer(id) {
    if (!confirm('Delete this player? Past session data is preserved but they will be removed from groups.')) return;
    await deletePlayer(id);
    setAllPlayers(prev => prev.filter(p => p.id !== id));
  }

  async function handleDelete(id) {
    if (!confirm('Are you sure you want to delete this session? This cannot be undone.')) return;
    await deleteSession(id);
    // Remove from local state immediately for instant UI update
    setSessions(prev => prev.filter(s => s.id !== id));
  }

  // Calculate balances from completed sessions
  const completed = sessions.filter(s => s.status === 'completed' && !s.archived);
  const balances = {};

  completed.forEach(session => {
    session.players.forEach(p => {
      const key = p.name.toLowerCase();
      if (!balances[key]) balances[key] = { name: p.name, amount: 0 };
      balances[key].amount += p.net ?? 0;
    });
  });

  // Adjust for past settlements
  settlements.forEach(s => {
    const fromKey = s.from.toLowerCase();
    const toKey = s.to.toLowerCase();
    if (balances[fromKey]) balances[fromKey].amount -= s.amount;
    if (balances[toKey]) balances[toKey].amount += s.amount;
  });

  const balanceMap = {};
  Object.values(balances).forEach(b => { balanceMap[b.name] = b.amount; });

  const suggestedPayouts = optimizePayouts({ ...balanceMap });
  const hasOutstanding = Object.values(balanceMap).some(v => Math.abs(v) > 0.01);

  function getPayPalLink(playerName, amount) {
    const player = allPlayers.find(p =>
      `${p.firstName} ${p.lastName}`.toLowerCase() === playerName.toLowerCase()
    );
    if (!player?.paypalId) return null;
    return `https://www.paypal.com/paypalme/${player.paypalId}/${amount.toFixed(2)}`;
  }

  function getVenmoLink(playerName, amount) {
    // Venmo deep link
    return `https://venmo.com/?txn=pay&amount=${amount.toFixed(2)}&note=ChipLedgers%20settlement`;
  }

  async function handleSettle() {
    if (!settling) return;
    const amount = parseFloat(settleAmount);
    if (isNaN(amount) || amount <= 0) return;
    await recordSettlement(settling.from, settling.to, amount, groupId);
    setSettling(null);
    setSettleAmount('');
    await refresh();
  }

  // PIN gate
  if (!authenticated) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <header className="bg-emerald-700 text-white py-4 px-4">
          <div className="max-w-lg mx-auto flex items-center justify-between">
            <button onClick={() => navigate(groupId ? `/group/${groupId}` : '/')} className="text-emerald-200 hover:text-white text-sm">
              &larr; Home
            </button>
            <h1 className="text-lg font-bold">Admin</h1>
            <div />
          </div>
        </header>
        <main className="max-w-sm mx-auto p-4 mt-20">
          <form onSubmit={handleLogin} className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700 space-y-4">
            <h2 className="font-semibold text-gray-900 dark:text-gray-100 text-center">Enter Admin PIN</h2>
            <input
              type="password"
              value={pin}
              onChange={e => { setPin(e.target.value); setPinError(''); }}
              placeholder="PIN"
              className="w-full px-3 py-3 border border-gray-300 dark:border-gray-600 rounded-lg text-center text-lg tracking-widest dark:bg-gray-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              autoFocus
            />
            {pinError && <p className="text-red-500 text-sm text-center">{pinError}</p>}
            <button
              type="submit"
              className="w-full py-3 bg-emerald-600 text-white rounded-lg font-medium hover:bg-emerald-700 transition-colors"
            >
              Unlock
            </button>
          </form>
        </main>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <p className="text-gray-400">Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <header className="bg-emerald-700 text-white py-4 px-4">
        <div className="max-w-lg mx-auto flex items-center justify-between">
          <button onClick={() => navigate(groupId ? `/group/${groupId}` : '/')} className="text-emerald-200 hover:text-white text-sm">
            &larr; Home
          </button>
          <h1 className="text-lg font-bold">Admin &middot; Settle Up</h1>
          <div />
        </div>
      </header>

      <main className="max-w-lg mx-auto p-4 space-y-6">
        {/* Outstanding Balances */}
        <div>
          <h2 className="font-semibold text-gray-700 dark:text-gray-300 text-sm mb-2">Outstanding Balances</h2>
          {!hasOutstanding ? (
            <div className="bg-green-50 border border-green-300 rounded-lg p-4 text-center">
              <p className="text-green-700 font-medium">All settled up!</p>
            </div>
          ) : (
            <div className="space-y-2">
              {Object.values(balances)
                .filter(b => Math.abs(b.amount) > 0.01)
                .sort((a, b) => a.amount - b.amount)
                .map(b => (
                  <div key={b.name} className="flex justify-between items-center p-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg">
                    <span className="font-medium text-gray-900 dark:text-gray-100">{b.name}</span>
                    <span className={`font-bold text-sm ${
                      b.amount > 0 ? 'text-red-600' : 'text-green-600'
                    }`}>
                      {b.amount > 0
                        ? `Owes $${b.amount.toFixed(2)}`
                        : `Gets $${Math.abs(b.amount).toFixed(2)}`}
                    </span>
                  </div>
                ))}
            </div>
          )}
        </div>

        {/* Suggested Payouts */}
        {suggestedPayouts.length > 0 && (
          <div>
            <h2 className="font-semibold text-gray-700 dark:text-gray-300 text-sm mb-2">
              Who Pays Whom
              <span className="text-gray-400 font-normal ml-1">({suggestedPayouts.length} transaction{suggestedPayouts.length !== 1 ? 's' : ''})</span>
            </h2>
            <div className="space-y-2">
              {suggestedPayouts.map((t, i) => {
                const paypalLink = getPayPalLink(t.to, t.amount);
                return (
                  <div key={i} className="p-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-sm">
                        <span className="font-medium text-red-600">{t.from}</span>
                        <span className="text-gray-400">&rarr;</span>
                        <span className="font-medium text-green-600">{t.to}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-gray-900 dark:text-gray-100">${t.amount.toFixed(2)}</span>
                        <button
                          onClick={() => { setSettling(t); setSettleAmount(String(t.amount)); }}
                          className="px-3 py-1 bg-emerald-600 text-white rounded text-xs font-medium hover:bg-emerald-700 transition-colors"
                        >
                          Settle
                        </button>
                      </div>
                    </div>
                    {paypalLink && (
                      <div className="mt-2 flex gap-2">
                        <a href={paypalLink} target="_blank" rel="noopener noreferrer"
                          className="flex-1 text-center px-2 py-1 bg-blue-600 text-white rounded text-xs font-medium hover:bg-blue-700 transition-colors">
                          Pay via PayPal
                        </a>
                        <a href={getVenmoLink(t.to, t.amount)} target="_blank" rel="noopener noreferrer"
                          className="flex-1 text-center px-2 py-1 bg-blue-400 text-white rounded text-xs font-medium hover:bg-blue-500 transition-colors">
                          Pay via Venmo
                        </a>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Settlement Form */}
        {settling && (
          <div className="bg-amber-50 border-2 border-amber-400 rounded-lg p-4 space-y-3">
            <h3 className="font-semibold text-gray-900 dark:text-gray-100">Record Settlement</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              <span className="font-medium text-red-600">{settling.from}</span>
              {' pays '}
              <span className="font-medium text-green-600">{settling.to}</span>
            </p>
            <div>
              <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Amount (suggested: ${settling.amount.toFixed(2)})</label>
              <input
                type="number"
                min="0.01"
                step="any"
                value={settleAmount}
                onChange={e => setSettleAmount(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm dark:bg-gray-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleSettle}
                className="flex-1 py-2 bg-emerald-600 text-white rounded-lg font-medium hover:bg-emerald-700 transition-colors"
              >
                Confirm Settlement
              </button>
              <button
                onClick={() => { setSettling(null); setSettleAmount(''); }}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Settlement History */}
        <div>
          <h2 className="font-semibold text-gray-700 dark:text-gray-300 text-sm mb-2">Settlement History</h2>
          {settlements.length === 0 ? (
            <p className="text-gray-400 text-sm text-center py-4">No settlements recorded yet.</p>
          ) : (
            <div className="space-y-2">
              {settlements.map(s => (
                <div key={s.id} className="p-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg flex items-center justify-between text-sm">
                  <div>
                    <span className="text-red-600 font-medium">{s.from}</span>
                    <span className="text-gray-400"> &rarr; </span>
                    <span className="text-green-600 font-medium">{s.to}</span>
                  </div>
                  <div className="text-right">
                    <span className="font-bold text-gray-900 dark:text-gray-100">${s.amount.toFixed(2)}</span>
                    <p className="text-xs text-gray-400">{s.date}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Manage Sessions */}
        <div>
          <h2 className="font-semibold text-gray-700 dark:text-gray-300 text-sm mb-2">Manage Sessions</h2>
          <div className="space-y-2">
            {sessions.length === 0 ? (
              <p className="text-gray-400 text-sm text-center py-4">No sessions.</p>
            ) : (
              sessions.map(s => (
                <div key={s.id} className="p-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-900 dark:text-gray-100 text-sm">
                      {s.date}{s.place ? ` — ${s.place}` : ''}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {s.players.length} players
                      <span className={`ml-2 px-2 py-0.5 rounded text-xs font-medium ${
                        s.status === 'active'
                          ? 'bg-green-100 text-green-700'
                          : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
                      }`}>
                        {s.status === 'active' ? 'Live' : 'Completed'}
                      </span>
                    </p>
                  </div>
                  <button
                    onClick={() => handleDelete(s.id)}
                    className="px-3 py-1 bg-red-100 text-red-600 rounded text-xs font-medium hover:bg-red-200 transition-colors"
                  >
                    Delete
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
        {/* Manage Players */}
        <div>
          <h2 className="font-semibold text-gray-700 dark:text-gray-300 text-sm mb-2">Manage Players</h2>
          <div className="space-y-2">
            {allPlayers.length === 0 ? (
              <p className="text-gray-400 text-sm text-center py-4">No players.</p>
            ) : (
              allPlayers.map(p => (
                <div key={p.id} className="p-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-900 dark:text-gray-100 text-sm">{playerDisplayName(p)}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {[p.phone, p.email].filter(Boolean).join(' · ') || 'No contact info'}
                    </p>
                  </div>
                  <button
                    onClick={() => handleDeletePlayer(p.id)}
                    className="px-3 py-1 bg-red-100 text-red-600 rounded text-xs font-medium hover:bg-red-200 transition-colors"
                  >
                    Delete
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Seasonal Reset */}
        <div>
          <h2 className="font-semibold text-gray-700 dark:text-gray-300 text-sm mb-2">Seasonal Reset</h2>
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
            Archive all completed sessions under a season label. Stats will start fresh but history is preserved.
          </p>
          <div className="flex gap-2">
            <input
              type="text"
              value={seasonLabel}
              onChange={e => setSeasonLabel(e.target.value)}
              placeholder="e.g. Q1 2026, March 2026"
              className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm dark:bg-gray-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
            <button
              onClick={handleArchive}
              disabled={!seasonLabel.trim()}
              className="px-4 py-2 bg-amber-600 text-white rounded-lg text-sm font-medium hover:bg-amber-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Archive Season
            </button>
          </div>
          {archiveResult && (
            <p className="text-green-600 text-sm mt-2">{archiveResult}</p>
          )}
        </div>
      </main>
    </div>
  );
}
