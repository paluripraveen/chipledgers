import { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { getSessions } from '../store/sessions';
import { getGroup } from '../store/groups';
import { computeAwards, recapText } from '../utils/awards';

const CURRENT = 'current';
const ALL_TIME = 'all';

export default function Awards() {
  const { groupId } = useParams();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [sessions, setSessions] = useState([]);
  const [group, setGroup] = useState(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    Promise.all([getSessions(groupId), getGroup(groupId)]).then(([s, g]) => {
      setSessions(s);
      setGroup(g);
      setLoading(false);
    });
  }, [groupId]);

  if (loading) {
    return <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center"><p className="text-gray-400">Loading...</p></div>;
  }

  const completed = sessions.filter(s => s.status === 'completed');
  const current = completed.filter(s => !s.archived);
  // Archived seasons, most recent first (sessions are already newest-first)
  const seasonNames = [...new Set(completed.filter(s => s.archived && s.season).map(s => s.season))];

  const options = [
    ...(current.length ? [{ id: CURRENT, label: 'Current Season' }] : []),
    ...seasonNames.map(name => ({ id: name, label: name })),
    { id: ALL_TIME, label: 'All Time' },
  ];
  const requested = searchParams.get('season');
  const selected = options.find(o => o.id === requested) || options[0];

  const seasonSessions = selected.id === CURRENT ? current
    : selected.id === ALL_TIME ? completed
    : completed.filter(s => s.archived && s.season === selected.id);
  const awards = computeAwards(seasonSessions);

  function selectSeason(id) {
    setSearchParams({ season: id }, { replace: true });
  }

  function copyRecap() {
    const text = recapText({
      groupName: group?.name || 'ChipLedgers',
      seasonName: selected.label,
      sessionCount: seasonSessions.length,
      awards,
    });
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <header className="bg-emerald-700 text-white py-4 px-4">
        <div className="max-w-lg mx-auto flex items-center justify-between">
          <button onClick={() => navigate(`/group/${groupId}`)} className="text-emerald-200 hover:text-white text-sm">&larr; Back</button>
          <div className="text-center">
            <h1 className="text-lg font-bold">Season Awards</h1>
            {group && <p className="text-emerald-200 text-xs">{group.name}</p>}
          </div>
          <span className="text-emerald-200 text-xs">{seasonSessions.length} game{seasonSessions.length !== 1 ? 's' : ''}</span>
        </div>
      </header>

      <main className="max-w-lg mx-auto p-4 space-y-4">
        {/* Season picker */}
        <div className="flex gap-2 flex-wrap">
          {options.map(o => (
            <button key={o.id} onClick={() => selectSeason(o.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${o.id === selected.id ? 'bg-emerald-600 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'}`}>
              {o.label}
            </button>
          ))}
        </div>

        {awards.length === 0 ? (
          <p className="text-gray-400 text-sm text-center py-8">No completed games in this season yet.</p>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {awards.map(a => (
                <div key={a.key} className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 text-center">
                  <p className="text-3xl" aria-hidden="true">{a.emoji}</p>
                  <p className="text-emerald-700 dark:text-emerald-400 text-xs font-semibold uppercase tracking-wide mt-1">{a.title}</p>
                  <p className="font-bold text-gray-900 dark:text-gray-100 text-lg mt-1">{a.winners.join(' & ')}</p>
                  <p className="text-gray-700 dark:text-gray-300 text-sm font-semibold">{a.stat}</p>
                  <p className="text-gray-400 dark:text-gray-500 text-xs mt-1">{a.blurb}</p>
                </div>
              ))}
            </div>

            <button onClick={copyRecap}
              className="w-full py-3 bg-emerald-600 text-white rounded-lg font-medium hover:bg-emerald-700 transition-colors">
              {copied ? 'Copied! Paste it in the group chat' : 'Copy Recap for Group Chat'}
            </button>
          </>
        )}
      </main>
    </div>
  );
}
