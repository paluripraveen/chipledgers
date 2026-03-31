import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getSessions } from '../store/sessions';

function formatNet(net) {
  if (net > 0) return { text: `-$${net.toFixed(2)}`, cls: 'text-red-600' };
  if (net < 0) return { text: `+$${Math.abs(net).toFixed(2)}`, cls: 'text-green-600' };
  return { text: '$0.00', cls: 'text-gray-600' };
}

export default function Stats() {
  const navigate = useNavigate();
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState({});
  const [search, setSearch] = useState('');

  useEffect(() => {
    getSessions().then(data => { setSessions(data); setLoading(false); });
  }, []);

  const completed = sessions.filter(s => s.status === 'completed');

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

  // Filter by search
  const players = search.trim()
    ? allPlayers.filter(p => p.name.toLowerCase().includes(search.trim().toLowerCase()))
    : allPlayers;

  // Leaderboard: top winner by amount
  const topWinnerByAmount = [...allPlayers].filter(p => p.net < 0).sort((a, b) => a.net - b.net)[0] || null;

  // Leaderboard: most consistent winner (highest win rate, min 2 games)
  const consistentWinner = [...allPlayers]
    .filter(p => p.sessionDetails.length >= 2 && p.wins > 0)
    .sort((a, b) => {
      const rateA = a.wins / a.sessionDetails.length;
      const rateB = b.wins / b.sessionDetails.length;
      if (rateB !== rateA) return rateB - rateA;
      return a.net - b.net;
    })[0] || null;

  // Leaderboard: most buy-ins
  const mostBuyIns = [...allPlayers].sort((a, b) => b.totalBuyInCount - a.totalBuyInCount)[0] || null;

  function toggle(name) {
    setExpanded(prev => ({ ...prev, [name]: !prev[name] }));
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-400">Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-emerald-700 text-white py-4 px-4">
        <div className="max-w-lg mx-auto flex items-center justify-between">
          <button onClick={() => navigate('/')} className="text-emerald-200 hover:text-white text-sm">
            &larr; Home
          </button>
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
                <h2 className="font-semibold text-gray-700 text-sm">Leaderboard</h2>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {topWinnerByAmount && (
                    <div className="bg-gradient-to-br from-yellow-50 to-amber-50 border-2 border-yellow-400 rounded-lg p-4 text-center">
                      <p className="text-yellow-600 text-xs font-semibold uppercase tracking-wide">Top Winner</p>
                      <p className="text-2xl mt-1">&#127942;</p>
                      <p className="font-bold text-gray-900 text-lg mt-1">{topWinnerByAmount.name}</p>
                      <p className="text-green-600 font-bold text-lg">+${Math.abs(topWinnerByAmount.net).toFixed(2)}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        {topWinnerByAmount.sessionDetails.length} game{topWinnerByAmount.sessionDetails.length !== 1 ? 's' : ''}
                      </p>
                    </div>
                  )}
                  {consistentWinner && (
                    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-400 rounded-lg p-4 text-center">
                      <p className="text-blue-600 text-xs font-semibold uppercase tracking-wide">Most Consistent</p>
                      <p className="text-2xl mt-1">&#128293;</p>
                      <p className="font-bold text-gray-900 text-lg mt-1">{consistentWinner.name}</p>
                      <p className="text-blue-700 font-bold text-lg">
                        {consistentWinner.wins}/{consistentWinner.sessionDetails.length} wins
                        ({Math.round(consistentWinner.wins / consistentWinner.sessionDetails.length * 100)}%)
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        Net: <span className="text-green-600 font-medium">+${Math.abs(consistentWinner.net).toFixed(2)}</span>
                      </p>
                    </div>
                  )}
                  {mostBuyIns && (
                    <div className="bg-gradient-to-br from-purple-50 to-pink-50 border-2 border-purple-400 rounded-lg p-4 text-center">
                      <p className="text-purple-600 text-xs font-semibold uppercase tracking-wide">Most Buy-Ins</p>
                      <p className="text-2xl mt-1">&#128176;</p>
                      <p className="font-bold text-gray-900 text-lg mt-1">{mostBuyIns.name}</p>
                      <p className="text-purple-700 font-bold text-lg">
                        {mostBuyIns.totalBuyInCount} buy-ins
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        ${mostBuyIns.totalBuyIn.toFixed(2)} total
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Search / Filter */}
            <div>
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search player..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            {/* Player List */}
            <h2 className="font-semibold text-gray-700 text-sm">
              {search.trim() ? `Results (${players.length})` : 'All Players'}
            </h2>
            {players.length === 0 ? (
              <p className="text-gray-400 text-sm text-center py-4">No players match "{search}"</p>
            ) : (
              players.map(p => {
                const net = formatNet(p.net);
                const isOpen = expanded[p.name];

                return (
                  <div key={p.name} className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                    <button
                      onClick={() => toggle(p.name)}
                      className="w-full p-3 flex items-center gap-3 text-left hover:bg-gray-50 transition-colors"
                    >
                      <span className="text-gray-400 text-xs">{isOpen ? '▼' : '▶'}</span>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-900 truncate">{p.name}</p>
                        <p className="text-xs text-gray-500">
                          {p.sessionDetails.length} game{p.sessionDetails.length !== 1 ? 's' : ''}
                          {' · '}
                          <span className="text-green-600">{p.wins}W</span>
                          {' '}
                          <span className="text-red-600">{p.losses}L</span>
                          {' · '}
                          <span className="text-purple-600">{p.totalBuyInCount} buy-ins</span>
                        </p>
                      </div>
                      <span className={`text-sm font-bold ${net.cls}`}>{net.text}</span>
                    </button>

                    {isOpen && (
                      <div className="border-t border-gray-100">
                        <div className="grid grid-cols-[1fr_50px_70px_70px_80px] gap-1 text-xs font-semibold text-gray-400 px-3 py-2 bg-gray-50">
                          <span>Date</span>
                          <span className="text-center">Buys</span>
                          <span className="text-right">Buy-In</span>
                          <span className="text-right">Returned</span>
                          <span className="text-right">Net</span>
                        </div>
                        {p.sessionDetails.map((s, i) => {
                          const sNet = formatNet(s.net);
                          return (
                            <div key={i} className="grid grid-cols-[1fr_50px_70px_70px_80px] gap-1 text-sm px-3 py-2 border-t border-gray-50">
                              <span className="text-gray-700">{s.date}</span>
                              <span className="text-center text-purple-600">{s.buyInCount}</span>
                              <span className="text-right text-gray-600">${s.buyIn.toFixed(2)}</span>
                              <span className="text-right text-gray-600">${s.returned.toFixed(2)}</span>
                              <span className={`text-right font-medium ${sNet.cls}`}>{sNet.text}</span>
                            </div>
                          );
                        })}
                        <div className="grid grid-cols-[1fr_50px_70px_70px_80px] gap-1 text-sm font-bold px-3 py-2 border-t border-gray-200 bg-gray-50">
                          <span className="text-gray-700">Total</span>
                          <span className="text-center text-purple-700">{p.totalBuyInCount}</span>
                          <span className="text-right text-gray-700">${p.totalBuyIn.toFixed(2)}</span>
                          <span className="text-right text-gray-700">${p.totalReturned.toFixed(2)}</span>
                          <span className={`text-right ${net.cls}`}>{net.text}</span>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })
            )}

            <p className="text-xs text-gray-400 px-1">
              Tap a player to see per-session breakdown. Green = won, Red = lost.
            </p>
          </>
        )}
      </main>
    </div>
  );
}
