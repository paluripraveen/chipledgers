import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getSession, addPlayer, addBuyIn, undoBuyIn, removePlayer, updateSessionNotes } from '../store/sessions';
import { getGroup } from '../store/groups';
import { getPlayersByIds, playerDisplayName } from '../store/players';
import PlayerRow from '../components/PlayerRow';
import NewPlayerForm from '../components/NewPlayerForm';

function formatDuration(seconds) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `${h}h ${m}m`;
  if (m > 0) return `${m}m ${s}s`;
  return `${s}s`;
}

export default function Session() {
  const { groupId, id } = useParams();
  const navigate = useNavigate();
  const [session, setSession] = useState(null);
  const [groupMembers, setGroupMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [elapsed, setElapsed] = useState(0);
  const [notes, setNotes] = useState('');
  const [notesSaved, setNotesSaved] = useState(false);

  useEffect(() => {
    Promise.all([getSession(id), getGroup(groupId)]).then(async ([s, g]) => {
      setSession(s);
      setNotes(s?.notes || '');
      if (g) {
        const m = await getPlayersByIds(g.playerIds || []);
        setGroupMembers(m);
      }
      setLoading(false);
    });
  }, [id, groupId]);

  // Session timer
  useEffect(() => {
    if (!session || session.status === 'completed') return;
    const start = session.createdAt ? new Date(session.createdAt).getTime() : Date.now();
    const interval = setInterval(() => {
      setElapsed(Math.floor((Date.now() - start) / 1000));
    }, 1000);
    return () => clearInterval(interval);
  }, [session]);

  if (loading) return <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center"><p className="text-gray-400">Loading...</p></div>;
  if (!session) return <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center"><p className="text-gray-500">Session not found.</p></div>;
  if (session.status === 'completed') { navigate(`/group/${groupId}/summary/${id}`, { replace: true }); return null; }

  async function refresh() { setSession(await getSession(id)); }
  async function handleAddPlayer(name) { await addPlayer(id, name); await refresh(); }
  async function handleBuyIn(playerId, amount) { await addBuyIn(id, playerId, amount); await refresh(); }
  async function handleUndo(playerId) { await undoBuyIn(id, playerId); await refresh(); }
  async function handleRemove(playerId) { await removePlayer(id, playerId); await refresh(); }

  async function handleSaveNotes() {
    await updateSessionNotes(id, notes);
    setNotesSaved(true);
    setTimeout(() => setNotesSaved(false), 2000);
  }

  const sessionNames = session.players.map(p => p.name.toLowerCase());
  const availableMembers = groupMembers.filter(m => !sessionNames.includes(playerDisplayName(m).toLowerCase()));
  const totalBuyIn = session.players.reduce((sum, p) => sum + p.totalBuyIn, 0);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <header className="bg-emerald-700 text-white py-4 px-4">
        <div className="max-w-lg mx-auto flex items-center justify-between">
          <button onClick={() => navigate(`/group/${groupId}`)} className="text-emerald-200 hover:text-white text-sm">&larr; Back</button>
          <div className="text-center">
            <h1 className="text-lg font-bold">Game Session</h1>
            <p className="text-emerald-200 text-xs">{session.date}{session.place ? ` — ${session.place}` : ''}</p>
          </div>
          <span className="px-2 py-1 bg-green-500 rounded text-xs font-medium">Live</span>
        </div>
      </header>

      <main className="max-w-lg mx-auto p-4 space-y-4">
        {/* Timer + Pool */}
        <div className="bg-emerald-50 dark:bg-emerald-900/30 border border-emerald-200 dark:border-emerald-800 rounded-lg p-3">
          <div className="flex justify-between items-center">
            <div className="text-center flex-1">
              <p className="text-sm text-emerald-700 dark:text-emerald-300">
                Total Pool: <span className="text-lg font-bold">${totalBuyIn.toFixed(2)}</span>
              </p>
              <p className="text-xs text-emerald-600 dark:text-emerald-400">{session.players.length} players</p>
            </div>
            <div className="text-center px-3 py-1 bg-emerald-100 dark:bg-emerald-800 rounded-lg">
              <p className="text-xs text-emerald-600 dark:text-emerald-300">Duration</p>
              <p className="text-sm font-bold text-emerald-800 dark:text-emerald-200 font-mono">{formatDuration(elapsed)}</p>
            </div>
          </div>
        </div>

        {/* Players */}
        <div className="space-y-2">
          <h2 className="font-semibold text-gray-700 dark:text-gray-300 text-sm">Players & Buy-Ins</h2>
          {session.players.map(player => (
            <PlayerRow key={player.id} player={player} onBuyIn={handleBuyIn} onUndo={handleUndo} onRemove={handleRemove} />
          ))}
        </div>

        {/* Add from group */}
        {availableMembers.length > 0 && (
          <div>
            <h2 className="font-semibold text-gray-700 dark:text-gray-300 text-sm mb-2">Add Player from Group</h2>
            <div className="flex flex-wrap gap-2">
              {availableMembers.map(m => (
                <button key={m.id} onClick={() => handleAddPlayer(playerDisplayName(m))}
                  className="px-3 py-1.5 bg-emerald-100 dark:bg-emerald-800 text-emerald-700 dark:text-emerald-300 rounded-lg text-sm font-medium hover:bg-emerald-200 dark:hover:bg-emerald-700 transition-colors">
                  + {playerDisplayName(m)}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Add guest */}
        <div>
          <h2 className="font-semibold text-gray-700 dark:text-gray-300 text-sm mb-2">Add Guest Player</h2>
          <NewPlayerForm onAdd={handleAddPlayer} existingNames={session.players.map(p => p.name)} allKnownNames={groupMembers.map(m => playerDisplayName(m))} />
        </div>

        {/* Session Notes */}
        <div>
          <h2 className="font-semibold text-gray-700 dark:text-gray-300 text-sm mb-2">Session Notes</h2>
          <textarea
            value={notes}
            onChange={e => setNotes(e.target.value)}
            placeholder="e.g. John left early, used 2 decks..."
            rows={2}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 dark:bg-gray-800 dark:text-white"
          />
          <button onClick={handleSaveNotes}
            className="mt-1 px-3 py-1 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded text-xs hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors">
            {notesSaved ? 'Saved!' : 'Save Notes'}
          </button>
        </div>

        <button onClick={() => navigate(`/group/${groupId}/summary/${id}`)}
          disabled={session.players.every(p => p.totalBuyIn === 0)}
          className="w-full py-3 bg-amber-600 text-white rounded-lg font-medium hover:bg-amber-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
          End Session &rarr;
        </button>
      </main>
    </div>
  );
}
