import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createTable, joinTable, normalizeCode, NAME_KEY, LAST_TABLE_KEY } from '../store/oddsTables';
import DarkModeToggle from '../components/DarkModeToggle';

export default function OddsLobby() {
  const navigate = useNavigate();
  const [name, setName] = useState(() => localStorage.getItem(NAME_KEY) || '');
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const lastTable = localStorage.getItem(LAST_TABLE_KEY);
  const isMember = !!localStorage.getItem('cl_auth');

  async function run(action) {
    const trimmed = name.trim();
    if (!trimmed) { setError('Enter your name first.'); return; }
    setBusy(true);
    setError('');
    localStorage.setItem(NAME_KEY, trimmed);
    try {
      await action(trimmed);
    } catch (e) {
      setError(e.message || 'Something went wrong.');
    } finally {
      setBusy(false);
    }
  }

  const start = () => run(async n => navigate(`/odds/${await createTable(n)}`));

  const join = () => run(async n => {
    const c = normalizeCode(code);
    if (c.length !== 6) { setError('Table codes are 6 characters.'); return; }
    if (!(await joinTable(c, n))) { setError('No table with that code.'); return; }
    navigate(`/odds/${c}`);
  });

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <header className="bg-emerald-700 text-white py-6 px-4">
        <div className="max-w-lg mx-auto flex items-center justify-between">
          <DarkModeToggle />
          <div className="text-center">
            <h1 className="text-2xl font-bold">Live Odds</h1>
            <p className="text-emerald-200 text-sm mt-1">Your cards, your win %, your screen only</p>
          </div>
          {isMember
            ? <button onClick={() => navigate('/')} className="text-emerald-200 hover:text-white text-sm font-medium">Home</button>
            : <span className="w-8" />}
        </div>
      </header>

      <main className="max-w-lg mx-auto p-4 space-y-4">
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Your name</label>
          <input
            value={name}
            onChange={e => { setName(e.target.value); setError(''); }}
            maxLength={20}
            placeholder="Name shown at the table"
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 space-y-3">
          <h2 className="font-semibold text-gray-700 dark:text-gray-300">Join a table</h2>
          <div className="flex gap-2">
            <input
              value={code}
              onChange={e => { setCode(normalizeCode(e.target.value).slice(0, 6)); setError(''); }}
              onKeyDown={e => e.key === 'Enter' && join()}
              placeholder="Table code"
              autoCapitalize="characters"
              className="flex-1 min-w-0 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 font-mono tracking-widest uppercase focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
            <button
              onClick={join}
              disabled={busy}
              className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-lg disabled:opacity-50 transition-colors"
            >
              Join
            </button>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 space-y-3">
          <h2 className="font-semibold text-gray-700 dark:text-gray-300">Host a table</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">You get a code and QR to share. You enter the flop, turn and river; everyone taps in their own cards.</p>
          <button
            onClick={start}
            disabled={busy}
            className="w-full py-2 bg-amber-600 hover:bg-amber-700 text-white font-medium rounded-lg disabled:opacity-50 transition-colors"
          >
            Start a table
          </button>
        </div>

        {lastTable && (
          <button
            onClick={() => navigate(`/odds/${lastTable}`)}
            className="w-full py-2 text-sm text-emerald-700 dark:text-emerald-400 hover:underline"
          >
            Back to table {lastTable}
          </button>
        )}

        {error && <p className="text-red-500 text-sm text-center">{error}</p>}
      </main>
    </div>
  );
}
