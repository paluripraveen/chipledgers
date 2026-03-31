import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getGroups } from '../store/groups';
import DarkModeToggle from '../components/DarkModeToggle';

export default function Home() {
  const navigate = useNavigate();
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getGroups().then(data => { setGroups(data); setLoading(false); });
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <header className="bg-emerald-700 text-white py-6 px-4">
        <div className="max-w-lg mx-auto flex items-center justify-between">
          <DarkModeToggle />
          <div className="text-center">
            <h1 className="text-2xl font-bold">ChipLedgers</h1>
            <p className="text-emerald-200 text-sm mt-1">Poker Session Tracker</p>
          </div>
          <div className="flex gap-3">
            <button onClick={() => navigate('/players')} className="text-emerald-200 hover:text-white text-sm font-medium">Players</button>
            <button onClick={() => navigate('/groups')} className="text-emerald-200 hover:text-white text-sm font-medium">Groups</button>
          </div>
        </div>
      </header>

      <main className="max-w-lg mx-auto p-4 space-y-4">
        <h2 className="font-semibold text-gray-700 dark:text-gray-300">Your Groups</h2>

        {loading ? (
          <p className="text-gray-400 text-sm text-center py-8">Loading...</p>
        ) : groups.length === 0 ? (
          <div className="text-center py-12 space-y-3">
            <p className="text-gray-400">No groups yet.</p>
            <p className="text-gray-400 text-sm">Start by registering players, then create a group.</p>
            <div className="flex gap-3 justify-center">
              <button onClick={() => navigate('/players')} className="px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700 transition-colors">
                Register Players
              </button>
              <button onClick={() => navigate('/groups')} className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                Create Group
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {groups.map(g => (
              <button
                key={g.id}
                onClick={() => navigate(`/group/${g.id}`)}
                className="w-full bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700 text-left hover:border-emerald-400 transition-colors"
              >
                <p className="font-medium text-gray-900 dark:text-gray-100 text-lg">{g.name}</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">{(g.playerIds || []).length} player{(g.playerIds || []).length !== 1 ? 's' : ''}</p>
              </button>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
