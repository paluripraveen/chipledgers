import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getGroup } from '../store/groups';
import { getPlayersByIds, playerDisplayName } from '../store/players';
import { getSessions, createSession } from '../store/sessions';

export default function GroupHome() {
  const { groupId } = useParams();
  const navigate = useNavigate();
  const [group, setGroup] = useState(null);
  const [members, setMembers] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [place, setPlace] = useState('');
  const [selectedPlayerIds, setSelectedPlayerIds] = useState([]);
  const [copied, setCopied] = useState(false);

  function shareLink() {
    const url = `${window.location.origin}/group/${groupId}/stats`;
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  useEffect(() => {
    Promise.all([getGroup(groupId), getSessions(groupId)]).then(async ([g, s]) => {
      setGroup(g);
      setSessions(s);
      if (g) {
        const m = await getPlayersByIds(g.playerIds);
        setMembers(m);
      }
      setLoading(false);
    });
  }, [groupId]);

  function togglePlayer(id) {
    setSelectedPlayerIds(prev =>
      prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]
    );
  }

  async function handleCreate(e) {
    e.preventDefault();
    if (selectedPlayerIds.length < 2) return;
    const names = selectedPlayerIds.map(id => {
      const p = members.find(m => m.id === id);
      return playerDisplayName(p);
    });
    const session = await createSession(date, names, place.trim(), groupId);
    navigate(`/group/${groupId}/session/${session.id}`);
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <p className="text-gray-400">Loading...</p>
      </div>
    );
  }

  if (!group) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <p className="text-gray-500 dark:text-gray-400">Group not found.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <header className="bg-emerald-700 text-white py-4 px-4">
        <div className="max-w-lg mx-auto flex items-center justify-between">
          <button onClick={() => navigate('/')} className="text-emerald-200 hover:text-white text-sm">&larr; Home</button>
          <div className="text-center">
            <h1 className="text-lg font-bold">{group.name}</h1>
            <p className="text-emerald-200 text-xs">{members.length} members</p>
          </div>
          <div className="flex gap-3">
            <button onClick={() => navigate(`/group/${groupId}/stats`)} className="text-emerald-200 hover:text-white text-sm font-medium">Stats</button>
            <button onClick={() => navigate(`/group/${groupId}/import`)} className="text-emerald-200 hover:text-white text-sm font-medium">Import</button>
            <button onClick={() => navigate(`/group/${groupId}/admin`)} className="text-emerald-200 hover:text-white text-sm font-medium">Settle</button>
          </div>
        </div>
      </header>

      <main className="max-w-lg mx-auto p-4 space-y-4">
        <div className="flex gap-2">
          <button onClick={shareLink}
            className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg text-sm font-medium hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors">
            {copied ? 'Link Copied!' : 'Share Stats Link'}
          </button>
        </div>

        {!creating ? (
          <button
            onClick={() => setCreating(true)}
            className="w-full py-3 bg-emerald-600 text-white rounded-lg font-medium hover:bg-emerald-700 transition-colors text-lg"
          >
            + New Session
          </button>
        ) : (
          <form onSubmit={handleCreate} className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700 space-y-4">
            <h2 className="font-semibold text-gray-900 dark:text-gray-100">Create Session</h2>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">Date</label>
                <input type="date" value={date} onChange={e => setDate(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm dark:bg-gray-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500" />
              </div>
              <div>
                <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">Place (optional)</label>
                <input type="text" value={place} onChange={e => setPlace(e.target.value)} placeholder="e.g. John's place"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm dark:bg-gray-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500" />
              </div>
            </div>
            <div>
              <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">Select Players ({selectedPlayerIds.length} selected)</label>
              <div className="space-y-1 max-h-48 overflow-y-auto">
                {members.map(p => (
                  <label key={p.id} className="flex items-center gap-2 p-2 rounded hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selectedPlayerIds.includes(p.id)}
                      onChange={() => togglePlayer(p.id)}
                      className="rounded border-gray-300 dark:border-gray-600 text-emerald-600 focus:ring-emerald-500"
                    />
                    <span className="text-sm text-gray-700 dark:text-gray-300">{playerDisplayName(p)}</span>
                  </label>
                ))}
              </div>
              {members.length === 0 && (
                <p className="text-amber-600 text-xs mt-1">No members in this group. <button onClick={() => navigate('/groups')} className="underline">Add players</button></p>
              )}
            </div>
            <div className="flex gap-2">
              <button type="submit" disabled={selectedPlayerIds.length < 2}
                className="flex-1 py-2 bg-emerald-600 text-white rounded-lg font-medium hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
                Start Game ({selectedPlayerIds.length} players)
              </button>
              <button type="button" onClick={() => { setCreating(false); setSelectedPlayerIds([]); }}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                Cancel
              </button>
            </div>
          </form>
        )}

        <div className="space-y-3">
          <h2 className="font-semibold text-gray-700 dark:text-gray-300">Sessions</h2>
          {sessions.length === 0 ? (
            <p className="text-gray-400 text-sm text-center py-8">No sessions yet. Start your first game!</p>
          ) : (
            sessions.map(s => (
              <button
                key={s.id}
                onClick={() => navigate(s.status === 'active' ? `/group/${groupId}/session/${s.id}` : `/group/${groupId}/summary/${s.id}`)}
                className="w-full bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700 text-left"
              >
                <p className="font-medium text-gray-900 dark:text-gray-100">{s.date}{s.place ? ` — ${s.place}` : ''}</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {s.players.length} players
                  <span className={`ml-2 px-2 py-0.5 rounded text-xs font-medium ${
                    s.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
                  }`}>
                    {s.status === 'active' ? 'Live' : 'Completed'}
                  </span>
                </p>
                {s.notes && (
                  <p className="text-xs text-gray-400 mt-1 truncate">{s.notes}</p>
                )}
              </button>
            ))
          )}
        </div>
      </main>
    </div>
  );
}
