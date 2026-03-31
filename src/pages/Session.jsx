import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getSession, getSessions, addPlayer, addBuyIn, removePlayer } from '../store/sessions';
import PlayerRow from '../components/PlayerRow';
import NewPlayerForm from '../components/NewPlayerForm';

export default function Session() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [session, setSession] = useState(null);
  const [allKnownNames, setAllKnownNames] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([getSession(id), getSessions()]).then(([data, all]) => {
      setSession(data);
      setAllKnownNames([...new Set(all.flatMap(s => s.players.map(p => p.name)))].sort());
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

  if (session.status === 'completed') {
    navigate(`/summary/${id}`, { replace: true });
    return null;
  }

  async function refresh() {
    setSession(await getSession(id));
  }

  async function handleAddPlayer(name) {
    await addPlayer(id, name);
    await refresh();
  }

  async function handleBuyIn(playerId, amount) {
    await addBuyIn(id, playerId, amount);
    await refresh();
  }

  async function handleRemove(playerId) {
    await removePlayer(id, playerId);
    await refresh();
  }

  const totalBuyIn = session.players.reduce((sum, p) => sum + p.totalBuyIn, 0);

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-emerald-700 text-white py-4 px-4">
        <div className="max-w-lg mx-auto flex items-center justify-between">
          <button onClick={() => navigate('/')} className="text-emerald-200 hover:text-white text-sm">
            &larr; Home
          </button>
          <div className="text-center">
            <h1 className="text-lg font-bold">Game Session</h1>
            <p className="text-emerald-200 text-xs">{session.date}{session.place ? ` — ${session.place}` : ''}</p>
          </div>
          <span className="px-2 py-1 bg-green-500 rounded text-xs font-medium">Live</span>
        </div>
      </header>

      <main className="max-w-lg mx-auto p-4 space-y-4">
        <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3 text-center">
          <p className="text-sm text-emerald-700">
            Total Buy-In Pool: <span className="text-lg font-bold">${totalBuyIn.toFixed(2)}</span>
          </p>
          <p className="text-xs text-emerald-600">{session.players.length} players</p>
        </div>

        <div className="space-y-2">
          <h2 className="font-semibold text-gray-700 text-sm">Players & Buy-Ins</h2>
          {session.players.map(player => (
            <PlayerRow key={player.id} player={player} onBuyIn={handleBuyIn} onRemove={handleRemove} />
          ))}
        </div>

        <div>
          <h2 className="font-semibold text-gray-700 text-sm mb-2">Add Player</h2>
          <NewPlayerForm onAdd={handleAddPlayer} existingNames={session.players.map(p => p.name)} allKnownNames={allKnownNames} />
        </div>

        <button
          onClick={() => navigate(`/summary/${id}`)}
          disabled={session.players.every(p => p.totalBuyIn === 0)}
          className="w-full py-3 bg-amber-600 text-white rounded-lg font-medium hover:bg-amber-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          End Session &rarr;
        </button>
      </main>
    </div>
  );
}
