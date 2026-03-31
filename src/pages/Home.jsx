import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getSessions, createSession } from '../store/sessions';
import NewPlayerForm from '../components/NewPlayerForm';

export default function Home() {
  const navigate = useNavigate();
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [place, setPlace] = useState('');
  const [players, setPlayers] = useState([]);

  useEffect(() => {
    getSessions().then(data => { setSessions(data); setLoading(false); });
  }, []);

  // Collect all unique player names from past sessions for autocomplete
  const allKnownNames = [...new Set(
    sessions.flatMap(s => s.players.map(p => p.name))
  )].sort();

  async function handleCreate(e) {
    e.preventDefault();
    if (players.length < 2) return;
    const session = await createSession(date, players, place.trim());
    navigate(`/session/${session.id}`);
  }


  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-emerald-700 text-white py-6 px-4">
        <div className="max-w-lg mx-auto flex items-center justify-between">
          <div />
          <div className="text-center">
            <h1 className="text-2xl font-bold">ChipLedgers</h1>
            <p className="text-emerald-200 text-sm mt-1">Poker Session Tracker</p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => navigate('/stats')}
              className="text-emerald-200 hover:text-white text-sm font-medium"
            >
              Stats
            </button>
            <button
              onClick={() => navigate('/import')}
              className="text-emerald-200 hover:text-white text-sm font-medium"
            >
              Import
            </button>
            <button
              onClick={() => navigate('/admin')}
              className="text-emerald-200 hover:text-white text-sm font-medium"
            >
              Settle
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-lg mx-auto p-4 space-y-6">
        {!creating ? (
          <button
            onClick={() => setCreating(true)}
            className="w-full py-3 bg-emerald-600 text-white rounded-lg font-medium hover:bg-emerald-700 transition-colors text-lg"
          >
            + New Session
          </button>
        ) : (
          <form onSubmit={handleCreate} className="bg-white p-4 rounded-lg border border-gray-200 space-y-4">
            <h2 className="font-semibold text-gray-900">Create Session</h2>
            <div>
              <label className="block text-sm text-gray-600 mb-1">Date</label>
              <input
                type="date"
                value={date}
                onChange={e => setDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">Place (optional)</label>
              <input
                type="text"
                value={place}
                onChange={e => setPlace(e.target.value)}
                placeholder="e.g. John's place"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">
                Players ({players.length} added)
              </label>
              <NewPlayerForm onAdd={name => setPlayers(prev => [...prev, name])} existingNames={players} allKnownNames={allKnownNames} />
              {players.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-2">
                  {players.map((p, i) => (
                    <span key={i} className="inline-flex items-center gap-1 px-2 py-1 bg-emerald-100 text-emerald-800 rounded text-sm">
                      {p}
                      <button
                        type="button"
                        onClick={() => setPlayers(prev => prev.filter((_, j) => j !== i))}
                        className="text-emerald-600 hover:text-red-600 font-bold"
                      >
                        x
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>
            <div className="flex gap-2">
              <button
                type="submit"
                disabled={players.length < 2}
                className="flex-1 py-2 bg-emerald-600 text-white rounded-lg font-medium hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Start Game ({players.length} players)
              </button>
              <button
                type="button"
                onClick={() => { setCreating(false); setPlayers([]); setPlace(''); }}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-100 transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        )}

        <div className="space-y-3">
          <h2 className="font-semibold text-gray-700">Past Sessions</h2>
          {loading ? (
            <p className="text-gray-400 text-sm text-center py-8">Loading...</p>
          ) : sessions.length === 0 ? (
            <p className="text-gray-400 text-sm text-center py-8">No sessions yet. Start your first game!</p>
          ) : (
            sessions.map(s => (
              <div
                key={s.id}
                className="bg-white p-4 rounded-lg border border-gray-200 flex items-center justify-between"
              >
                <button
                  onClick={() => navigate(s.status === 'active' ? `/session/${s.id}` : `/summary/${s.id}`)}
                  className="flex-1 text-left"
                >
                  <p className="font-medium text-gray-900">
                    {s.date}{s.place ? ` — ${s.place}` : ''}
                  </p>
                  <p className="text-sm text-gray-500">
                    {s.players.length} players
                    <span className={`ml-2 px-2 py-0.5 rounded text-xs font-medium ${
                      s.status === 'active'
                        ? 'bg-green-100 text-green-700'
                        : 'bg-gray-100 text-gray-600'
                    }`}>
                      {s.status === 'active' ? 'Live' : 'Completed'}
                    </span>
                  </p>
                </button>
              </div>
            ))
          )}
        </div>
      </main>
    </div>
  );
}
