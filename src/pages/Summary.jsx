import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getSession, setChipsReturned, endSession } from '../store/sessions';
import TallyBar from '../components/TallyBar';

export default function Summary() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [returnInputs, setReturnInputs] = useState({});

  useEffect(() => {
    getSession(id).then(data => {
      setSession(data);
      if (data) {
        setReturnInputs(
          Object.fromEntries(
            data.players.map(p => [p.id, p.chipsReturned != null ? String(p.chipsReturned) : ''])
          )
        );
      }
      setLoading(false);
    });
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-400">Loading...</p>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-500">Session not found.</p>
      </div>
    );
  }

  async function refresh() {
    setSession(await getSession(id));
  }

  async function handleReturnChange(playerId, value) {
    setReturnInputs(prev => ({ ...prev, [playerId]: value }));
    const num = parseFloat(value);
    if (!isNaN(num) && num >= 0) {
      await setChipsReturned(id, playerId, num);
      const updated = await getSession(id);
      setSession(updated);

      // Auto-fill zeros: if entered returns already equal total buy-in, set remaining to 0
      const totalBuyIn = updated.players.reduce((sum, p) => sum + p.totalBuyIn, 0);
      const enteredPlayers = updated.players.filter(p => p.chipsReturned != null);
      const emptyPlayers = updated.players.filter(p => p.chipsReturned == null);

      if (emptyPlayers.length > 0) {
        const enteredTotal = enteredPlayers.reduce((sum, p) => sum + p.chipsReturned, 0);
        if (Math.abs(totalBuyIn - enteredTotal) < 0.01) {
          for (const p of emptyPlayers) {
            await setChipsReturned(id, p.id, 0);
          }
          const final = await getSession(id);
          setSession(final);
          setReturnInputs(
            Object.fromEntries(final.players.map(p => [p.id, p.chipsReturned != null ? String(p.chipsReturned) : '']))
          );
        }
      }
    }
  }

  async function handleEndSession() {
    await endSession(id);
    await refresh();
  }

  const isCompleted = session.status === 'completed';
  const allReturned = session.players.every(p => p.chipsReturned != null);
  const totalBuyIn = session.players.reduce((sum, p) => sum + p.totalBuyIn, 0);
  const totalReturned = session.players.reduce((sum, p) => sum + (p.chipsReturned ?? 0), 0);
  const balanced = allReturned && Math.abs(totalBuyIn - totalReturned) < 0.01;

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-emerald-700 text-white py-4 px-4">
        <div className="max-w-lg mx-auto flex items-center justify-between">
          <button onClick={() => navigate('/')} className="text-emerald-200 hover:text-white text-sm">
            &larr; Home
          </button>
          <div className="text-center">
            <h1 className="text-lg font-bold">Session Summary</h1>
            <p className="text-emerald-200 text-xs">{session.date}{session.place ? ` — ${session.place}` : ''}</p>
          </div>
          <span className={`px-2 py-1 rounded text-xs font-medium ${
            isCompleted ? 'bg-gray-500' : 'bg-green-500'
          }`}>
            {isCompleted ? 'Completed' : 'Live'}
          </span>
        </div>
      </header>

      <main className="max-w-lg mx-auto p-4 space-y-4">
        <TallyBar players={session.players} />

        <div className="space-y-2">
          <div className="grid grid-cols-[1fr_80px_80px_80px] gap-2 text-xs font-semibold text-gray-500 px-1">
            <span>Player</span>
            <span className="text-right">Buy-In</span>
            <span className="text-right">Returned</span>
            <span className="text-right">Net</span>
          </div>

          {session.players.map(player => (
            <div
              key={player.id}
              className="grid grid-cols-[1fr_80px_80px_80px] gap-2 items-center p-3 bg-white border border-gray-200 rounded-lg"
            >
              <span className="font-medium text-gray-900 truncate">{player.name}</span>
              <span className="text-right text-sm text-gray-700">${player.totalBuyIn.toFixed(2)}</span>
              <div className="text-right">
                {isCompleted ? (
                  <span className="text-sm text-gray-700">${(player.chipsReturned ?? 0).toFixed(2)}</span>
                ) : (
                  <input
                    type="number"
                    min="0"
                    step="any"
                    value={returnInputs[player.id] ?? ''}
                    onChange={e => handleReturnChange(player.id, e.target.value)}
                    placeholder="$"
                    className="w-full px-1 py-1 border border-gray-300 rounded text-sm text-right focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                )}
              </div>
              <span className={`text-right text-sm font-medium ${
                player.net === null
                  ? 'text-gray-400'
                  : player.net > 0
                  ? 'text-red-600'
                  : player.net < 0
                  ? 'text-green-600'
                  : 'text-gray-600'
              }`}>
                {player.net != null
                  ? player.net > 0
                    ? `-$${player.net.toFixed(2)}`
                    : player.net < 0
                    ? `+$${Math.abs(player.net).toFixed(2)}`
                    : '$0.00'
                  : '—'}
              </span>
            </div>
          ))}
        </div>

        <div className="text-xs text-gray-500 px-1">
          <p><strong>Net meaning:</strong> Positive net (red) = player lost money. Negative net (green) = player won money.</p>
          <p className="mt-1">Net = Buy-In - Chips Returned</p>
        </div>

        {!isCompleted && (
          <button
            onClick={handleEndSession}
            disabled={!allReturned || !balanced}
            className="w-full py-3 bg-emerald-600 text-white rounded-lg font-medium hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {!allReturned
              ? 'Enter all chip returns to finalize'
              : !balanced
              ? 'Totals must balance to finalize'
              : 'Finalize Session'}
          </button>
        )}

        {!isCompleted && (
          <button
            onClick={() => navigate(`/session/${id}`)}
            className="w-full py-2 border border-gray-300 rounded-lg text-gray-600 text-sm hover:bg-gray-100 transition-colors"
          >
            &larr; Back to Game
          </button>
        )}
      </main>
    </div>
  );
}
