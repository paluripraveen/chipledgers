import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getSessions } from '../store/sessions';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts';

function formatNet(net) {
  if (net > 0) return { text: `-$${net.toFixed(2)}`, cls: 'text-red-600' };
  if (net < 0) return { text: `+$${Math.abs(net).toFixed(2)}`, cls: 'text-green-600' };
  return { text: '$0.00', cls: 'text-gray-600 dark:text-gray-400' };
}

const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316'];

function getStreak(sessionDetails) {
  let streak = 0;
  let type = null;
  for (let i = sessionDetails.length - 1; i >= 0; i--) {
    const won = sessionDetails[i].net < 0;
    if (type === null) type = won;
    if (won === type) streak++;
    else break;
  }
  if (streak === 0) return null;
  return { count: streak, type: type ? 'win' : 'loss' };
}

function exportCSV(players, completed) {
  const headers = ['Player', 'Games', 'Wins', 'Losses', 'Total Buy-In', 'Total Returned', 'Net', 'Buy-In Count'];
  const rows = players.map(p => [
    p.name, p.sessionDetails.length, p.wins, p.losses,
    p.totalBuyIn.toFixed(2), p.totalReturned.toFixed(2), p.net.toFixed(2), p.totalBuyInCount
  ]);
  const csv = [headers, ...rows].map(r => r.join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `chipledgers-stats-${new Date().toISOString().split('T')[0]}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export default function Stats() {
  const { groupId } = useParams();
  const navigate = useNavigate();
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState({});
  const [search, setSearch] = useState('');
  const [showChart, setShowChart] = useState(false);
  const [h2hMode, setH2hMode] = useState(false);
  const [h2hPlayers, setH2hPlayers] = useState([null, null]);

  useEffect(() => {
    getSessions(groupId).then(data => { setSessions(data); setLoading(false); });
  }, [groupId]);

  const completed = sessions.filter(s => s.status === 'completed' && !s.archived);

  const playerMap = {};
  completed.forEach(session => {
    session.players.forEach(p => {
      const key = p.name.toLowerCase();
      if (!playerMap[key]) {
        playerMap[key] = {
          name: p.name,
          totalBuyIn: 0,
          totalReturned: 0,
          totalBuyInCount: 0,
          net: 0,
          wins: 0,
          losses: 0,
          sessionDetails: [],
        };
      }
      const entry = playerMap[key];
      entry.totalBuyIn += p.totalBuyIn;
      entry.totalReturned += p.chipsReturned ?? 0;
      entry.totalBuyInCount += (p.buyIns || []).length;
      entry.net += p.net ?? 0;
      if (p.net < 0) entry.wins += 1;
      if (p.net > 0) entry.losses += 1;
      entry.sessionDetails.push({
        date: session.date,
        buyIn: p.totalBuyIn,
        buyInCount: (p.buyIns || []).length,
        returned: p.chipsReturned ?? 0,
        net: p.net ?? 0,
      });
    });
  });

  const allPlayers = Object.values(playerMap).sort((a, b) => a.net - b.net);
  const players = search.trim()
    ? allPlayers.filter(p => p.name.toLowerCase().includes(search.trim().toLowerCase()))
    : allPlayers;

  const topWinnerByAmount = [...allPlayers].filter(p => p.net < 0).sort((a, b) => a.net - b.net)[0] || null;
  const consistentWinner = [...allPlayers]
    .filter(p => p.sessionDetails.length >= 2 && p.wins > 0)
    .sort((a, b) => {
      const rateA = a.wins / a.sessionDetails.length;
      const rateB = b.wins / b.sessionDetails.length;
      if (rateB !== rateA) return rateB - rateA;
      return a.net - b.net;
    })[0] || null;
  const mostBuyIns = [...allPlayers].sort((a, b) => b.totalBuyInCount - a.totalBuyInCount)[0] || null;

  // Chart data: cumulative net over time per player
  const chartData = (() => {
    const dates = [...new Set(completed.map(s => s.date))].sort();
    return dates.map(date => {
      const point = { date };
      allPlayers.forEach(p => {
        const sessionsUpTo = p.sessionDetails.filter(s => s.date <= date);
        point[p.name] = -sessionsUpTo.reduce((sum, s) => sum + s.net, 0); // flip: positive = won
      });
      return point;
    });
  })();

  // Head-to-head
  const h2hData = (() => {
    if (!h2hPlayers[0] || !h2hPlayers[1]) return null;
    const p1 = allPlayers.find(p => p.name === h2hPlayers[0]);
    const p2 = allPlayers.find(p => p.name === h2hPlayers[1]);
    if (!p1 || !p2) return null;
    // Find sessions where both played
    const sharedSessions = [];
    completed.forEach(session => {
      const sp1 = session.players.find(p => p.name.toLowerCase() === p1.name.toLowerCase());
      const sp2 = session.players.find(p => p.name.toLowerCase() === p2.name.toLowerCase());
      if (sp1 && sp2) {
        sharedSessions.push({
          date: session.date,
          p1Net: sp1.net ?? 0,
          p2Net: sp2.net ?? 0,
        });
      }
    });
    const p1Wins = sharedSessions.filter(s => s.p1Net < s.p2Net).length;
    const p2Wins = sharedSessions.filter(s => s.p2Net < s.p1Net).length;
    return { p1, p2, sharedSessions, p1Wins, p2Wins, ties: sharedSessions.length - p1Wins - p2Wins };
  })();

  function toggle(name) {
    setExpanded(prev => ({ ...prev, [name]: !prev[name] }));
  }

  if (loading) {
    return <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center"><p className="text-gray-400">Loading...</p></div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <header className="bg-emerald-700 text-white py-4 px-4">
        <div className="max-w-lg mx-auto flex items-center justify-between">
          <button onClick={() => navigate(groupId ? `/group/${groupId}` : '/')} className="text-emerald-200 hover:text-white text-sm">&larr; Back</button>
          <h1 className="text-lg font-bold">Player Stats</h1>
          <span className="text-emerald-200 text-xs">{completed.length} session{completed.length !== 1 ? 's' : ''}</span>
        </div>
      </header>

      <main className="max-w-lg mx-auto p-4 space-y-3">
        {allPlayers.length === 0 ? (
          <p className="text-gray-400 text-sm text-center py-8">No completed sessions yet.</p>
        ) : (
          <>
            {/* Leaderboard */}
            {(topWinnerByAmount || consistentWinner || mostBuyIns) && (
              <div className="space-y-3 mb-4">
                <h2 className="font-semibold text-gray-700 dark:text-gray-300 text-sm">Leaderboard</h2>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {topWinnerByAmount && (
                    <div className="bg-gradient-to-br from-yellow-50 to-amber-50 dark:from-yellow-900/30 dark:to-amber-900/30 border-2 border-yellow-400 rounded-lg p-4 text-center">
                      <p className="text-yellow-600 text-xs font-semibold uppercase tracking-wide">Top Winner</p>
                      <p className="text-2xl mt-1">&#127942;</p>
                      <p className="font-bold text-gray-900 dark:text-gray-100 text-lg mt-1">{topWinnerByAmount.name}</p>
                      <p className="text-green-600 font-bold text-lg">+${Math.abs(topWinnerByAmount.net).toFixed(2)}</p>
                    </div>
                  )}
                  {consistentWinner && (
                    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/30 dark:to-indigo-900/30 border-2 border-blue-400 rounded-lg p-4 text-center">
                      <p className="text-blue-600 text-xs font-semibold uppercase tracking-wide">Most Consistent</p>
                      <p className="text-2xl mt-1">&#128293;</p>
                      <p className="font-bold text-gray-900 dark:text-gray-100 text-lg mt-1">{consistentWinner.name}</p>
                      <p className="text-blue-700 font-bold text-lg">
                        {consistentWinner.wins}/{consistentWinner.sessionDetails.length} wins
                      </p>
                    </div>
                  )}
                  {mostBuyIns && (
                    <div className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/30 dark:to-pink-900/30 border-2 border-purple-400 rounded-lg p-4 text-center">
                      <p className="text-purple-600 text-xs font-semibold uppercase tracking-wide">Most Buy-Ins</p>
                      <p className="text-2xl mt-1">&#128176;</p>
                      <p className="font-bold text-gray-900 dark:text-gray-100 text-lg mt-1">{mostBuyIns.name}</p>
                      <p className="text-purple-700 font-bold text-lg">{mostBuyIns.totalBuyInCount} buy-ins</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Action bar */}
            <div className="flex gap-2 flex-wrap">
              <button onClick={() => setShowChart(!showChart)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${showChart ? 'bg-emerald-600 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'}`}>
                {showChart ? 'Hide Chart' : 'Profit Chart'}
              </button>
              <button onClick={() => { setH2hMode(!h2hMode); setH2hPlayers([null, null]); }}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${h2hMode ? 'bg-emerald-600 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'}`}>
                {h2hMode ? 'Close H2H' : 'Head-to-Head'}
              </button>
              <button onClick={() => exportCSV(allPlayers, completed)}
                className="px-3 py-1.5 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg text-xs font-medium hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors">
                Export CSV
              </button>
            </div>

            {/* Profit Chart */}
            {showChart && chartData.length > 1 && (
              <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-3">
                <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Cumulative Profit Over Time</h3>
                <ResponsiveContainer width="100%" height={250}>
                  <LineChart data={chartData}>
                    <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                    <YAxis tick={{ fontSize: 10 }} tickFormatter={v => `$${v}`} />
                    <Tooltip formatter={(v) => `$${v.toFixed(2)}`} />
                    <Legend wrapperStyle={{ fontSize: 11 }} />
                    {allPlayers.map((p, i) => (
                      <Line key={p.name} type="monotone" dataKey={p.name} stroke={COLORS[i % COLORS.length]}
                        strokeWidth={2} dot={{ r: 3 }} connectNulls />
                    ))}
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}

            {/* Head-to-Head */}
            {h2hMode && (
              <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 space-y-3">
                <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Head-to-Head Comparison</h3>
                <div className="grid grid-cols-2 gap-3">
                  {[0, 1].map(idx => (
                    <select key={idx} value={h2hPlayers[idx] || ''}
                      onChange={e => setH2hPlayers(prev => { const n = [...prev]; n[idx] = e.target.value || null; return n; })}
                      className="px-2 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm dark:bg-gray-700 dark:text-white">
                      <option value="">Select Player {idx + 1}</option>
                      {allPlayers.map(p => (
                        <option key={p.name} value={p.name} disabled={h2hPlayers[1 - idx] === p.name}>{p.name}</option>
                      ))}
                    </select>
                  ))}
                </div>
                {h2hData && (
                  <div className="space-y-2">
                    <div className="flex justify-between items-center text-sm">
                      <span className="font-medium text-blue-600">{h2hData.p1.name}</span>
                      <span className="text-gray-400 text-xs">{h2hData.sharedSessions.length} shared games</span>
                      <span className="font-medium text-orange-600">{h2hData.p2.name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 bg-blue-100 dark:bg-blue-900 rounded-l-full h-6 flex items-center justify-center text-xs font-bold text-blue-700 dark:text-blue-300"
                        style={{ flex: h2hData.p1Wins || 1 }}>
                        {h2hData.p1Wins}W
                      </div>
                      {h2hData.ties > 0 && (
                        <div className="bg-gray-200 dark:bg-gray-600 h-6 flex items-center justify-center text-xs font-bold text-gray-600 dark:text-gray-300 px-2">
                          {h2hData.ties}T
                        </div>
                      )}
                      <div className="flex-1 bg-orange-100 dark:bg-orange-900 rounded-r-full h-6 flex items-center justify-center text-xs font-bold text-orange-700 dark:text-orange-300"
                        style={{ flex: h2hData.p2Wins || 1 }}>
                        {h2hData.p2Wins}W
                      </div>
                    </div>
                    {h2hData.sharedSessions.map((s, i) => (
                      <div key={i} className="grid grid-cols-3 text-xs text-center py-1 border-t border-gray-100 dark:border-gray-700">
                        <span className={s.p1Net < s.p2Net ? 'text-green-600 font-medium' : 'text-gray-500 dark:text-gray-400'}>
                          {s.p1Net > 0 ? `-$${s.p1Net.toFixed(0)}` : `+$${Math.abs(s.p1Net).toFixed(0)}`}
                        </span>
                        <span className="text-gray-400">{s.date}</span>
                        <span className={s.p2Net < s.p1Net ? 'text-green-600 font-medium' : 'text-gray-500 dark:text-gray-400'}>
                          {s.p2Net > 0 ? `-$${s.p2Net.toFixed(0)}` : `+$${Math.abs(s.p2Net).toFixed(0)}`}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Search */}
            <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search player..."
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm dark:bg-gray-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500" />

            {/* Player List */}
            <h2 className="font-semibold text-gray-700 dark:text-gray-300 text-sm">
              {search.trim() ? `Results (${players.length})` : 'All Players'}
            </h2>
            {players.length === 0 ? (
              <p className="text-gray-400 text-sm text-center py-4">No players match "{search}"</p>
            ) : (
              players.map(p => {
                const net = formatNet(p.net);
                const isOpen = expanded[p.name];
                const streak = getStreak(p.sessionDetails);

                return (
                  <div key={p.name} className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
                    <button onClick={() => toggle(p.name)}
                      className="w-full p-3 flex items-center gap-3 text-left hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                      <span className="text-gray-400 text-xs">{isOpen ? '▼' : '▶'}</span>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-900 dark:text-gray-100 truncate">
                          {p.name}
                          {streak && (
                            <span className={`ml-2 text-xs px-1.5 py-0.5 rounded ${
                              streak.type === 'win' ? 'bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300' : 'bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300'
                            }`}>
                              {streak.count} {streak.type} streak
                            </span>
                          )}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {p.sessionDetails.length} game{p.sessionDetails.length !== 1 ? 's' : ''}
                          {' · '}<span className="text-green-600">{p.wins}W</span>{' '}<span className="text-red-600">{p.losses}L</span>
                          {' · '}<span className="text-purple-600">{p.totalBuyInCount} buy-ins</span>
                        </p>
                      </div>
                      <span className={`text-sm font-bold ${net.cls}`}>{net.text}</span>
                    </button>

                    {isOpen && (
                      <div className="border-t border-gray-100 dark:border-gray-700">
                        <div className="grid grid-cols-[1fr_50px_70px_70px_80px] gap-1 text-xs font-semibold text-gray-400 px-3 py-2 bg-gray-50 dark:bg-gray-800">
                          <span>Date</span><span className="text-center">Buys</span><span className="text-right">Buy-In</span>
                          <span className="text-right">Returned</span><span className="text-right">Net</span>
                        </div>
                        {p.sessionDetails.map((s, i) => {
                          const sNet = formatNet(s.net);
                          return (
                            <div key={i} className="grid grid-cols-[1fr_50px_70px_70px_80px] gap-1 text-sm px-3 py-2 border-t border-gray-50 dark:border-gray-700">
                              <span className="text-gray-700 dark:text-gray-300">{s.date}</span>
                              <span className="text-center text-purple-600">{s.buyInCount}</span>
                              <span className="text-right text-gray-600 dark:text-gray-400">${s.buyIn.toFixed(2)}</span>
                              <span className="text-right text-gray-600 dark:text-gray-400">${s.returned.toFixed(2)}</span>
                              <span className={`text-right font-medium ${sNet.cls}`}>{sNet.text}</span>
                            </div>
                          );
                        })}
                        <div className="grid grid-cols-[1fr_50px_70px_70px_80px] gap-1 text-sm font-bold px-3 py-2 border-t border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-800">
                          <span className="text-gray-700 dark:text-gray-300">Total</span>
                          <span className="text-center text-purple-700">{p.totalBuyInCount}</span>
                          <span className="text-right text-gray-700 dark:text-gray-300">${p.totalBuyIn.toFixed(2)}</span>
                          <span className="text-right text-gray-700 dark:text-gray-300">${p.totalReturned.toFixed(2)}</span>
                          <span className={`text-right ${net.cls}`}>{net.text}</span>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </>
        )}
      </main>
    </div>
  );
}
