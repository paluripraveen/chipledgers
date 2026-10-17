import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getSession, setChipsReturned, endSession } from '../store/sessions';
import TallyBar from '../components/TallyBar';

export default function Summary() {
  const { groupId, id } = useParams();
  const navigate = useNavigate();
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [returnInputs, setReturnInputs] = useState({});
  const [finalizing, setFinalizing] = useState(false);
  const pendingSave = useRef(Promise.resolve());

  useEffect(() => {
    getSession(id).then(data => {
      setSession(data);
      if (data) {
        setReturnInputs(
          Object.fromEntries(data.players.map(p => [p.id, p.chipsReturned != null ? String(p.chipsReturned) : '']))
        );
      }
      setLoading(false);
    });
  }, [id]);

  if (loading) return <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center"><p className="text-gray-400">Loading...</p></div>;
  if (!session) return <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center"><p className="text-gray-500 dark:text-gray-400">Session not found.</p></div>;

  async function refresh() { setSession(await getSession(id)); }

  function parseReturn(value) {
    const num = parseFloat(value);
    return !isNaN(num) && num >= 0 ? num : null;
  }

  function syncInputs(updated) {
    setSession(updated);
    setReturnInputs(Object.fromEntries(updated.players.map(p => [p.id, p.chipsReturned != null ? String(p.chipsReturned) : ''])));
  }

  function handleReturnChange(playerId, value) {
    setReturnInputs(prev => ({ ...prev, [playerId]: value }));
  }

  // Save on blur (not per keystroke) so partial values never race each other
  function handleReturnSave(playerId) {
    pendingSave.current = pendingSave.current.then(() => saveReturn(playerId)).catch(() => refresh());
  }

  async function saveReturn(playerId) {
    const num = parseReturn(returnInputs[playerId]);
    if (num == null) return;
    const current = session.players.find(p => p.id === playerId);
    if (current && current.chipsReturned === num) return;
    let updated = await setChipsReturned(id, { [playerId]: num });
    if (!updated) return;

    const totalBuyIn = updated.players.reduce((sum, p) => sum + p.totalBuyIn, 0);
    const enteredTotal = updated.players.reduce((sum, p) => sum + (p.chipsReturned ?? 0), 0);
    const emptyPlayers = updated.players.filter(p => p.chipsReturned == null);
    if (emptyPlayers.length > 0 && Math.abs(totalBuyIn - enteredTotal) < 0.01) {
      updated = await setChipsReturned(id, Object.fromEntries(emptyPlayers.map(p => [p.id, 0])));
    }
    // Keep any other inputs the user is still editing
    setSession(updated);
    setReturnInputs(prev => {
      const next = { ...prev };
      for (const p of updated.players) {
        if (p.id === playerId || parseReturn(prev[p.id]) == null) {
          next[p.id] = p.chipsReturned != null ? String(p.chipsReturned) : '';
        }
      }
      return next;
    });
  }

  async function handleEndSession() {
    if (finalizing) return;
    setFinalizing(true);
    try {
      await pendingSave.current;
      // Persist every visible input in one transaction, then check the stored totals
      const amounts = {};
      for (const p of session.players) {
        const num = parseReturn(returnInputs[p.id]);
        if (num != null) amounts[p.id] = num;
      }
      const updated = await setChipsReturned(id, amounts);
      if (!updated) return;
      const total = updated.players.reduce((sum, p) => sum + p.totalBuyIn, 0);
      const returned = updated.players.reduce((sum, p) => sum + (p.chipsReturned ?? 0), 0);
      if (!updated.players.every(p => p.chipsReturned != null) || Math.abs(total - returned) >= 0.01) {
        syncInputs(updated);
        return;
      }
      await endSession(id);
      await refresh();
    } finally {
      setFinalizing(false);
    }
  }

  const isCompleted = session.status === 'completed';
  // Reflect what's typed in the inputs so totals and net update while editing
  const displayPlayers = isCompleted ? session.players : session.players.map(p => {
    const chipsReturned = parseReturn(returnInputs[p.id]);
    return { ...p, chipsReturned, net: chipsReturned != null ? p.totalBuyIn - chipsReturned : null };
  });
  const allReturned = displayPlayers.every(p => p.chipsReturned != null);
  const totalBuyIn = displayPlayers.reduce((sum, p) => sum + p.totalBuyIn, 0);
  const totalReturned = displayPlayers.reduce((sum, p) => sum + (p.chipsReturned ?? 0), 0);
  const balanced = allReturned && Math.abs(totalBuyIn - totalReturned) < 0.01;

  const backPath = groupId ? `/group/${groupId}` : '/';

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <header className="bg-emerald-700 text-white py-4 px-4">
        <div className="max-w-lg mx-auto flex items-center justify-between">
          <button onClick={() => navigate(backPath)} className="text-emerald-200 hover:text-white text-sm">&larr; Back</button>
          <div className="text-center">
            <h1 className="text-lg font-bold">Session Summary</h1>
            <p className="text-emerald-200 text-xs">{session.date}{session.place ? ` — ${session.place}` : ''}</p>
          </div>
          <span className={`px-2 py-1 rounded text-xs font-medium ${isCompleted ? 'bg-gray-500' : 'bg-green-500'}`}>
            {isCompleted ? 'Completed' : 'Live'}
          </span>
        </div>
      </header>

      <main className="max-w-lg mx-auto p-4 space-y-4">
        <TallyBar players={displayPlayers} />

        <div className="space-y-2">
          <div className="grid grid-cols-[1fr_80px_80px_80px] gap-2 text-xs font-semibold text-gray-500 dark:text-gray-400 px-1">
            <span>Player</span>
            <span className="text-right">Buy-In</span>
            <span className="text-right">Returned</span>
            <span className="text-right">Net</span>
          </div>
          {displayPlayers.map(player => (
            <div key={player.id} className="grid grid-cols-[1fr_80px_80px_80px] gap-2 items-center p-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg">
              <span className="font-medium text-gray-900 dark:text-gray-100 truncate">{player.name}</span>
              <span className="text-right text-sm text-gray-700 dark:text-gray-300">${player.totalBuyIn.toFixed(2)}</span>
              <div className="text-right">
                {isCompleted ? (
                  <span className="text-sm text-gray-700 dark:text-gray-300">${(player.chipsReturned ?? 0).toFixed(2)}</span>
                ) : (
                  <input type="number" min="0" step="any" value={returnInputs[player.id] ?? ''} onChange={e => handleReturnChange(player.id, e.target.value)} onBlur={() => handleReturnSave(player.id)} placeholder="$"
                    className="w-full px-1 py-1 border border-gray-300 dark:border-gray-600 rounded text-sm text-right dark:bg-gray-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500" />
                )}
              </div>
              <span className={`text-right text-sm font-medium ${player.net == null ? 'text-gray-400' : player.net > 0 ? 'text-red-600' : player.net < 0 ? 'text-green-600' : 'text-gray-600 dark:text-gray-400'}`}>
                {player.net != null ? (player.net > 0 ? `-$${player.net.toFixed(2)}` : player.net < 0 ? `+$${Math.abs(player.net).toFixed(2)}` : '$0.00') : '—'}
              </span>
            </div>
          ))}
        </div>

        <div className="text-xs text-gray-500 dark:text-gray-400 px-1">
          <p><strong>Net:</strong> Red = lost, Green = won. Net = Buy-In - Returned</p>
        </div>

        {session.notes && (
          <div className="bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-3">
            <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1">Session Notes</h3>
            <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{session.notes}</p>
          </div>
        )}

        {!isCompleted && (
          <button onClick={handleEndSession} disabled={!allReturned || !balanced || finalizing}
            className="w-full py-3 bg-emerald-600 text-white rounded-lg font-medium hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
            {!allReturned ? 'Enter all chip returns to finalize' : !balanced ? 'Totals must balance to finalize' : 'Finalize Session'}
          </button>
        )}

        {!isCompleted && groupId && (
          <button onClick={() => navigate(`/group/${groupId}/session/${id}`)}
            className="w-full py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-600 dark:text-gray-400 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
            &larr; Back to Game
          </button>
        )}
      </main>
    </div>
  );
}
