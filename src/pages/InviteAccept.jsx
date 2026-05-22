import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { getInvite, acceptInvite, declineInvite } from '../store/invites';
import { joinGroup } from '../store/groups';

export default function InviteAccept() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const [invite, setInvite] = useState(null);
  const [status, setStatus] = useState('loading');

  useEffect(() => {
    if (loading) return;
    if (!user) {
      navigate(`/login?redirect=/invite/${id}`, { replace: true });
      return;
    }
    getInvite(id)
      .then(inv => {
        if (!inv || inv.status !== 'pending') {
          setStatus('invalid');
        } else {
          setInvite(inv);
          setStatus('ready');
        }
      })
      .catch(() => setStatus('invalid'));
  }, [id, user, loading]);

  async function handleAccept() {
    setStatus('accepting');
    await joinGroup(invite.groupId, user.uid, user.uid);
    await acceptInvite(invite.id);
    navigate(`/group/${invite.groupId}`, { replace: true });
  }

  async function handleDecline() {
    await declineInvite(invite.id);
    navigate('/', { replace: true });
  }

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <p className="text-gray-400">Loading invite...</p>
      </div>
    );
  }

  if (status === 'invalid') {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col items-center justify-center px-4">
        <div className="w-full max-w-sm bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 text-center space-y-4">
          <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">Invite Unavailable</h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm">This invite link has already been used or has expired.</p>
          <button onClick={() => navigate('/')} className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-lg transition-colors text-sm">
            Go to Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col items-center justify-center px-4">
      <div className="w-full max-w-sm bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 space-y-5">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-emerald-700 dark:text-emerald-500">ChipLedgers</h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">Group Invite</p>
        </div>

        <div className="text-center py-2 space-y-1">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            <span className="font-medium text-gray-700 dark:text-gray-300">{invite.inviterName}</span> invited you to join
          </p>
          <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{invite.groupName}</p>
        </div>

        <button
          onClick={handleAccept}
          disabled={status === 'accepting'}
          className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-medium rounded-lg transition-colors"
        >
          {status === 'accepting' ? 'Joining...' : 'Accept & Join Group'}
        </button>

        <button
          onClick={handleDecline}
          className="w-full py-2 text-sm text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
        >
          Decline
        </button>
      </div>
    </div>
  );
}
