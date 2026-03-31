import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getGroups, createGroup, addPlayerToGroup, removePlayerFromGroup, deleteGroup } from '../store/groups';
import { getPlayers, playerDisplayName } from '../store/players';

export default function Groups() {
  const navigate = useNavigate();
  const [groups, setGroups] = useState([]);
  const [players, setPlayers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newName, setNewName] = useState('');
  const [expanded, setExpanded] = useState({});
  const [addingTo, setAddingTo] = useState(null); // groupId currently adding player to

  useEffect(() => {
    Promise.all([getGroups(), getPlayers()]).then(([g, p]) => {
      setGroups(g);
      setPlayers(p);
      setLoading(false);
    });
  }, []);

  async function refresh() {
    const [g, p] = await Promise.all([getGroups(), getPlayers()]);
    setGroups(g);
    setPlayers(p);
  }

  async function handleCreateGroup(e) {
    e.preventDefault();
    if (!newName.trim()) return;
    if (groups.some(g => g.name.toLowerCase() === newName.trim().toLowerCase())) return;
    await createGroup(newName.trim());
    setNewName('');
    await refresh();
  }

  async function handleAddPlayer(groupId, playerId) {
    await addPlayerToGroup(groupId, playerId);
    setAddingTo(null);
    await refresh();
  }

  async function handleRemovePlayer(groupId, playerId) {
    await removePlayerFromGroup(groupId, playerId);
    await refresh();
  }

  async function handleDeleteGroup(id) {
    if (!confirm('Delete this group? Sessions in this group will become ungrouped.')) return;
    await deleteGroup(id);
    await refresh();
  }

  function getGroupPlayers(group) {
    const ids = group.playerIds || [];
    return players.filter(p => ids.includes(p.id));
  }

  function getAvailablePlayers(group) {
    const ids = group.playerIds || [];
    return players.filter(p => !ids.includes(p.id));
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <header className="bg-emerald-700 text-white py-4 px-4">
        <div className="max-w-lg mx-auto flex items-center justify-between">
          <button onClick={() => navigate('/')} className="text-emerald-200 hover:text-white text-sm">&larr; Home</button>
          <h1 className="text-lg font-bold">Groups</h1>
          <span className="text-emerald-200 text-xs">{groups.length} groups</span>
        </div>
      </header>

      <main className="max-w-lg mx-auto p-4 space-y-4">
        {/* Create Group */}
        <form onSubmit={handleCreateGroup} className="flex gap-2">
          <input
            type="text"
            value={newName}
            onChange={e => setNewName(e.target.value)}
            placeholder="New group name (e.g. TOSO)"
            className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm dark:bg-gray-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
          <button type="submit" className="px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700 transition-colors">
            Create
          </button>
        </form>

        {loading ? (
          <p className="text-gray-400 text-sm text-center py-8">Loading...</p>
        ) : groups.length === 0 ? (
          <p className="text-gray-400 text-sm text-center py-8">No groups yet. Create one above.</p>
        ) : (
          <div className="space-y-3">
            {groups.map(group => {
              const members = getGroupPlayers(group);
              const available = getAvailablePlayers(group);
              const isOpen = expanded[group.id];

              return (
                <div key={group.id} className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
                  <button
                    onClick={() => setExpanded(prev => ({ ...prev, [group.id]: !prev[group.id] }))}
                    className="w-full p-3 flex items-center justify-between text-left hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                  >
                    <div>
                      <p className="font-medium text-gray-900 dark:text-gray-100">{group.name}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">{members.length} player{members.length !== 1 ? 's' : ''}</p>
                    </div>
                    <span className="text-gray-400 text-xs">{isOpen ? '▼' : '▶'}</span>
                  </button>

                  {isOpen && (
                    <div className="border-t border-gray-100 dark:border-gray-700 p-3 space-y-2">
                      {/* Members */}
                      {members.length === 0 ? (
                        <p className="text-gray-400 text-xs text-center py-2">No players in this group yet.</p>
                      ) : (
                        members.map(p => (
                          <div key={p.id} className="flex items-center justify-between py-1">
                            <span className="text-sm text-gray-700 dark:text-gray-300">{playerDisplayName(p)}</span>
                            <button
                              onClick={() => handleRemovePlayer(group.id, p.id)}
                              className="text-gray-400 hover:text-red-500 text-xs"
                            >
                              Remove
                            </button>
                          </div>
                        ))
                      )}

                      {/* Add Player */}
                      {addingTo === group.id ? (
                        <div className="border-t border-gray-100 dark:border-gray-700 pt-2">
                          <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Select player to add:</p>
                          {available.length === 0 ? (
                            <p className="text-xs text-gray-400">All players are already in this group.</p>
                          ) : (
                            <div className="space-y-1 max-h-40 overflow-y-auto">
                              {available.map(p => (
                                <button
                                  key={p.id}
                                  onClick={() => handleAddPlayer(group.id, p.id)}
                                  className="w-full text-left px-2 py-1.5 text-sm rounded hover:bg-emerald-50 dark:hover:bg-emerald-900 text-gray-700 dark:text-gray-300 transition-colors"
                                >
                                  {playerDisplayName(p)}
                                </button>
                              ))}
                            </div>
                          )}
                          <button
                            onClick={() => setAddingTo(null)}
                            className="mt-2 text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <div className="flex gap-2 border-t border-gray-100 dark:border-gray-700 pt-2">
                          <button
                            onClick={() => setAddingTo(group.id)}
                            className="flex-1 py-1.5 bg-emerald-100 text-emerald-700 rounded text-xs font-medium hover:bg-emerald-200 transition-colors"
                          >
                            + Add Player
                          </button>
                          <button
                            onClick={() => handleDeleteGroup(group.id)}
                            className="px-3 py-1.5 bg-red-100 text-red-600 rounded text-xs font-medium hover:bg-red-200 transition-colors"
                          >
                            Delete Group
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {players.length === 0 && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-center">
            <p className="text-amber-700 text-sm">No players registered yet.</p>
            <button onClick={() => navigate('/players')} className="text-amber-600 text-xs underline mt-1">
              Register players first
            </button>
          </div>
        )}
      </main>
    </div>
  );
}
