import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getPlayers, createPlayer, updatePlayer, playerDisplayName } from '../store/players';
import { getSessions } from '../store/sessions';

export default function Players() {
  const navigate = useNavigate();
  const [players, setPlayers] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [form, setForm] = useState({ firstName: '', lastName: '', phone: '', email: '', paypalId: '' });
  const [error, setError] = useState('');

  useEffect(() => {
    Promise.all([getPlayers(), getSessions()]).then(([p, s]) => {
      setPlayers(p);
      setSessions(s);
      setLoading(false);
    });
  }, []);

  async function refresh() {
    setPlayers(await getPlayers());
  }

  function getPlayerStats(player) {
    const name = playerDisplayName(player).toLowerCase();
    const completed = sessions.filter(s => s.status === 'completed');
    let games = 0, wins = 0, losses = 0, net = 0, totalBuyIns = 0;
    completed.forEach(session => {
      session.players.forEach(p => {
        if (p.name.toLowerCase() === name) {
          games++;
          net += p.net ?? 0;
          totalBuyIns += (p.buyIns || []).length;
          if (p.net < 0) wins++;
          if (p.net > 0) losses++;
        }
      });
    });
    return { games, wins, losses, net, totalBuyIns };
  }

  function updateFormField(field, value) {
    setForm(prev => ({ ...prev, [field]: value }));
    setError('');
  }

  async function handleCreate(e) {
    e.preventDefault();
    if (!form.firstName.trim() || !form.lastName.trim()) {
      setError('First name and last name are required');
      return;
    }
    if (!/^[a-zA-Z ]+$/.test(form.firstName.trim()) || !/^[a-zA-Z ]+$/.test(form.lastName.trim())) {
      setError('Names can only contain letters and spaces');
      return;
    }
    const fullName = `${form.firstName.trim()} ${form.lastName.trim()}`.toLowerCase();
    if (players.some(p => `${p.firstName} ${p.lastName}`.toLowerCase() === fullName)) {
      setError('A player with this name already exists');
      return;
    }
    await createPlayer(form);
    setForm({ firstName: '', lastName: '', phone: '', email: '', paypalId: '' });
    setAdding(false);
    await refresh();
  }

  function startEdit(player) {
    setEditingId(player.id);
    setEditForm({
      firstName: player.firstName || '',
      lastName: player.lastName || '',
      phone: player.phone || '',
      email: player.email || '',
      paypalId: player.paypalId || '',
    });
  }

  async function handleSaveEdit() {
    if (!editForm.firstName.trim() || !editForm.lastName.trim()) return;
    await updatePlayer(editingId, {
      firstName: editForm.firstName.trim(),
      lastName: editForm.lastName.trim(),
      phone: editForm.phone.trim(),
      email: editForm.email.trim(),
      paypalId: editForm.paypalId.trim(),
    });
    setEditingId(null);
    await refresh();
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <header className="bg-emerald-700 text-white py-4 px-4">
        <div className="max-w-lg mx-auto flex items-center justify-between">
          <button onClick={() => navigate('/')} className="text-emerald-200 hover:text-white text-sm">&larr; Home</button>
          <h1 className="text-lg font-bold">Players</h1>
          <span className="text-emerald-200 text-xs">{players.length} total</span>
        </div>
      </header>

      <main className="max-w-lg mx-auto p-4 space-y-4">
        {!adding ? (
          <button
            onClick={() => setAdding(true)}
            className="w-full py-3 bg-emerald-600 text-white rounded-lg font-medium hover:bg-emerald-700 transition-colors"
          >
            + Register Player
          </button>
        ) : (
          <form onSubmit={handleCreate} className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700 space-y-3">
            <h2 className="font-semibold text-gray-900 dark:text-gray-100">New Player</h2>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">First Name *</label>
                <input type="text" value={form.firstName} onChange={e => updateFormField('firstName', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm dark:bg-gray-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500" autoFocus />
              </div>
              <div>
                <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Last Name *</label>
                <input type="text" value={form.lastName} onChange={e => updateFormField('lastName', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm dark:bg-gray-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500" />
              </div>
            </div>
            <div>
              <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Phone (optional)</label>
              <input type="tel" value={form.phone} onChange={e => updateFormField('phone', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm dark:bg-gray-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500" />
            </div>
            <div>
              <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Email (optional)</label>
              <input type="email" value={form.email} onChange={e => updateFormField('email', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm dark:bg-gray-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500" />
            </div>
            <div>
              <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">PayPal ID (optional)</label>
              <input type="text" value={form.paypalId} onChange={e => updateFormField('paypalId', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm dark:bg-gray-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500" />
            </div>
            {error && <p className="text-red-500 text-sm">{error}</p>}
            <div className="flex gap-2">
              <button type="submit" className="flex-1 py-2 bg-emerald-600 text-white rounded-lg font-medium hover:bg-emerald-700 transition-colors">
                Save Player
              </button>
              <button type="button" onClick={() => { setAdding(false); setError(''); }} className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                Cancel
              </button>
            </div>
          </form>
        )}

        <div className="space-y-2">
          {loading ? (
            <p className="text-gray-400 text-sm text-center py-8">Loading...</p>
          ) : players.length === 0 ? (
            <p className="text-gray-400 text-sm text-center py-8">No players registered yet.</p>
          ) : (
            players.map(p => {
              const stats = getPlayerStats(p);
              return (
                <div key={p.id} className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
                  <div className="p-3 flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-900 dark:text-gray-100">{playerDisplayName(p)}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {[p.phone, p.email, p.paypalId ? `PayPal: ${p.paypalId}` : ''].filter(Boolean).join(' · ') || 'No contact info'}
                      </p>
                      {stats.games > 0 && (
                        <p className="text-xs mt-1">
                          <span className="text-gray-500 dark:text-gray-400">{stats.games} game{stats.games !== 1 ? 's' : ''}</span>
                          {' · '}
                          <span className="text-green-600">{stats.wins}W</span>
                          {' '}
                          <span className="text-red-600">{stats.losses}L</span>
                          {' · '}
                          <span className={stats.net > 0 ? 'text-red-600 font-medium' : stats.net < 0 ? 'text-green-600 font-medium' : 'text-gray-600 dark:text-gray-400'}>
                            {stats.net > 0 ? `-$${stats.net.toFixed(2)}` : stats.net < 0 ? `+$${Math.abs(stats.net).toFixed(2)}` : '$0'}
                          </span>
                          {' · '}
                          <span className="text-purple-600">{stats.totalBuyIns} buy-ins</span>
                        </p>
                      )}
                    </div>
                    <button onClick={() => startEdit(p)} className="text-emerald-600 hover:text-emerald-800 text-xs font-medium">
                      Edit
                    </button>
                  </div>
                  {editingId === p.id && (
                    <div className="border-t border-gray-100 dark:border-gray-700 p-3 bg-gray-50 dark:bg-gray-800 space-y-2">
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">First Name *</label>
                          <input type="text" value={editForm.firstName} onChange={e => setEditForm(prev => ({ ...prev, firstName: e.target.value }))}
                            className="w-full px-3 py-1.5 border border-gray-300 dark:border-gray-600 rounded text-sm dark:bg-gray-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500" />
                        </div>
                        <div>
                          <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Last Name *</label>
                          <input type="text" value={editForm.lastName} onChange={e => setEditForm(prev => ({ ...prev, lastName: e.target.value }))}
                            className="w-full px-3 py-1.5 border border-gray-300 dark:border-gray-600 rounded text-sm dark:bg-gray-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500" />
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Phone</label>
                        <input type="tel" value={editForm.phone} onChange={e => setEditForm(prev => ({ ...prev, phone: e.target.value }))}
                          className="w-full px-3 py-1.5 border border-gray-300 dark:border-gray-600 rounded text-sm dark:bg-gray-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500" />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Email</label>
                        <input type="email" value={editForm.email} onChange={e => setEditForm(prev => ({ ...prev, email: e.target.value }))}
                          className="w-full px-3 py-1.5 border border-gray-300 dark:border-gray-600 rounded text-sm dark:bg-gray-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500" />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">PayPal ID</label>
                        <input type="text" value={editForm.paypalId} onChange={e => setEditForm(prev => ({ ...prev, paypalId: e.target.value }))}
                          className="w-full px-3 py-1.5 border border-gray-300 dark:border-gray-600 rounded text-sm dark:bg-gray-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500" />
                      </div>
                      <div className="flex gap-2">
                        <button onClick={handleSaveEdit}
                          className="flex-1 py-1.5 bg-emerald-600 text-white rounded text-sm font-medium hover:bg-emerald-700 transition-colors">
                          Save
                        </button>
                        <button onClick={() => setEditingId(null)}
                          className="px-3 py-1.5 border border-gray-300 dark:border-gray-600 rounded text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </main>
    </div>
  );
}
