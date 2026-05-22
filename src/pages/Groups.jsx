import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getGroups, createGroup, removePlayerFromGroup, deleteGroup } from '../store/groups';
import { getPlayers, playerDisplayName } from '../store/players';
import { createInvite, getGroupInvites } from '../store/invites';
import { sendInviteEmail } from '../utils/email';
import { useAuth } from '../contexts/AuthContext';

export default function Groups() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [groups, setGroups] = useState([]);
  const [players, setPlayers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newName, setNewName] = useState('');
  const [nameError, setNameError] = useState('');
  const [expanded, setExpanded] = useState({});
  const [invitingTo, setInvitingTo] = useState(null);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteError, setInviteError] = useState('');
  const [inviteSuccess, setInviteSuccess] = useState('');
  const [groupInvites, setGroupInvites] = useState({});

  useEffect(() => {
    if (user) {
      Promise.all([getGroups(user.uid), getPlayers()]).then(([g, p]) => {
        setGroups(g);
        setPlayers(p);
        setLoading(false);
      }).catch(() => setLoading(false));
    }
  }, [user]);

  async function refresh() {
    const [g, p] = await Promise.all([getGroups(user.uid), getPlayers()]);
    setGroups(g);
    setPlayers(p);
  }

  async function handleCreateGroup(e) {
    e.preventDefault();
    if (!newName.trim()) return;
    if (groups.some(g => g.name.toLowerCase() === newName.trim().toLowerCase())) {
      setNameError('A group with this name already exists.');
      return;
    }
    setNameError('');
    await createGroup(newName.trim(), user.uid);
    setNewName('');
    await refresh();
  }

  async function handleToggleGroup(groupId) {
    const isOpen = expanded[groupId];
    setExpanded(prev => ({ ...prev, [groupId]: !isOpen }));
    if (!isOpen && !groupInvites[groupId]) {
      const inv = await getGroupInvites(groupId);
      setGroupInvites(prev => ({ ...prev, [groupId]: inv }));
    }
  }

  async function handleInvite(e, group) {
    e.preventDefault();
    setInviteError('');
    setInviteSuccess('');
    const email = inviteEmail.trim().toLowerCase();
    if (!email) return;

    const members = getGroupPlayers(group);
    if (members.some(p => p.email?.toLowerCase() === email)) {
      setInviteError('This person is already a member of the group.');
      return;
    }
    const pending = groupInvites[group.id] || [];
    if (pending.some(i => i.invitedEmail === email)) {
      setInviteError('An invite has already been sent to this email.');
      return;
    }

    const inviterName = user.displayName || user.email;
    const inviteId = await createInvite({
      groupId: group.id,
      groupName: group.name,
      inviterName,
      invitedEmail: email,
    });

    let emailOk = true;
    try {
      await sendInviteEmail({
        to_email: email,
        group_name: group.name,
        inviter_name: inviterName,
        invite_url: `${window.location.origin}/invite/${inviteId}`,
      });
    } catch (err) {
      emailOk = false;
      setInviteError(`Invite saved but email failed: ${err?.text || err?.message || 'Unknown error'}. Use Resend to try again.`);
    }

    const inv = await getGroupInvites(group.id);
    setGroupInvites(prev => ({ ...prev, [group.id]: inv }));
    setInviteEmail('');
    if (emailOk) setInviteSuccess(`Invite sent to ${email}`);
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
        <form onSubmit={handleCreateGroup} className="space-y-1">
          <div className="flex gap-2">
            <input
              type="text"
              value={newName}
              onChange={e => { setNewName(e.target.value); setNameError(''); }}
              placeholder="New group name (e.g. TOSO)"
              className={`flex-1 px-3 py-2 border rounded-lg text-sm dark:bg-gray-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 ${nameError ? 'border-red-400 dark:border-red-500' : 'border-gray-300 dark:border-gray-600'}`}
            />
            <button type="submit" className="px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700 transition-colors">
              Create
            </button>
          </div>
          {nameError && <p className="text-red-500 text-xs">{nameError}</p>}
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
                    onClick={() => handleToggleGroup(group.id)}
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

                      {/* Pending Invites */}
                      {(groupInvites[group.id] || []).length > 0 && (
                        <div className="border-t border-gray-100 dark:border-gray-700 pt-2 space-y-1">
                          <p className="text-xs font-medium text-gray-500 dark:text-gray-400">Pending Invites</p>
                          {(groupInvites[group.id] || []).map(inv => (
                            <div key={inv.id} className="flex items-center justify-between py-1 gap-2">
                              <span className="text-sm text-gray-600 dark:text-gray-400 truncate">{inv.invitedEmail}</span>
                              <div className="flex items-center gap-2 shrink-0">
                                <button
                                  onClick={async () => {
                                    try {
                                      await sendInviteEmail({
                                        to_email: inv.invitedEmail,
                                        group_name: group.name,
                                        inviter_name: user.displayName || user.email,
                                        invite_url: `${window.location.origin}/invite/${inv.id}`,
                                      });
                                      alert(`Invite resent to ${inv.invitedEmail}`);
                                    } catch {
                                      alert('Failed to resend. Please try again.');
                                    }
                                  }}
                                  className="text-xs text-emerald-600 dark:text-emerald-400 hover:underline"
                                >
                                  Resend
                                </button>
                                <span className="text-xs bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300 px-2 py-0.5 rounded-full">Pending</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Invite by Email */}
                      <div className="border-t border-gray-100 dark:border-gray-700 pt-2">
                        {invitingTo === group.id ? (
                          <form onSubmit={e => handleInvite(e, group)} className="space-y-2">
                            <input
                              type="email"
                              value={inviteEmail}
                              onChange={e => { setInviteEmail(e.target.value); setInviteError(''); setInviteSuccess(''); }}
                              placeholder="Enter email to invite"
                              className="w-full px-2 py-1.5 border border-gray-300 dark:border-gray-600 rounded text-sm dark:bg-gray-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                              autoFocus
                            />
                            {inviteError && <p className="text-red-500 text-xs">{inviteError}</p>}
                            {inviteSuccess && <p className="text-emerald-600 dark:text-emerald-400 text-xs">{inviteSuccess}</p>}
                            <div className="flex gap-2">
                              <button type="submit" className="flex-1 py-1.5 bg-emerald-600 text-white rounded text-xs font-medium hover:bg-emerald-700 transition-colors">
                                Send Invite
                              </button>
                              <button type="button" onClick={() => { setInvitingTo(null); setInviteEmail(''); setInviteError(''); setInviteSuccess(''); }} className="px-3 py-1.5 text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                                Cancel
                              </button>
                            </div>
                          </form>
                        ) : (
                          <div className="flex gap-2">
                            <button
                              onClick={() => { setInvitingTo(group.id); setInviteError(''); setInviteSuccess(''); }}
                              className="flex-1 py-1.5 bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300 rounded text-xs font-medium hover:bg-emerald-200 dark:hover:bg-emerald-800 transition-colors"
                            >
                              + Invite Member
                            </button>
                            <button
                              onClick={() => handleDeleteGroup(group.id)}
                              className="px-3 py-1.5 bg-red-100 text-red-600 dark:bg-red-900 dark:text-red-300 rounded text-xs font-medium hover:bg-red-200 dark:hover:bg-red-800 transition-colors"
                            >
                              Delete Group
                            </button>
                          </div>
                        )}
                      </div>
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
