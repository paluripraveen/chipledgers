// Season awards computed from completed sessions.
// Convention (same as the rest of the app): net = buy-in - chips returned, so a negative net is a win.

export function formatMoney(amount) {
  const abs = Math.abs(amount);
  return `$${Number.isInteger(abs) ? abs : abs.toFixed(2)}`;
}

function formatDate(date) {
  if (!date) return '';
  const d = new Date(`${date}T00:00:00`);
  return isNaN(d) ? date : d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

// Collect each player's nights in date order, keyed case-insensitively like Stats
function buildPlayers(sessions) {
  const chronological = [...sessions].sort((a, b) => (a.date || '').localeCompare(b.date || ''));
  const map = {};
  chronological.forEach(session => {
    session.players.forEach(p => {
      const key = p.name.toLowerCase();
      if (!map[key]) map[key] = { name: p.name, nights: [] };
      map[key].nights.push({
        date: session.date,
        won: -(p.net ?? 0), // positive = money won
        rebuys: Math.max(0, (p.buyIns || []).length - 1),
        buyIn: p.totalBuyIn || 0,
      });
    });
  });
  return Object.values(map);
}

function longestWinStreak(nights) {
  let best = 0;
  let current = 0;
  for (const n of nights) {
    if (n.won === 0) continue; // break-even neither extends nor ends a streak
    current = n.won > 0 ? current + 1 : 0;
    best = Math.max(best, current);
  }
  return best;
}

// Everyone tied for the top score wins; nothing is awarded if the best score doesn't qualify
function pickWinners(players, score, qualifies = s => s > 0) {
  let best = null;
  let winners = [];
  for (const p of players) {
    const s = score(p);
    if (s == null || !qualifies(s)) continue;
    if (best === null || s > best) { best = s; winners = [p]; }
    else if (s === best) winners.push(p);
  }
  return best === null ? null : { best, winners };
}

export function computeAwards(sessions) {
  const players = buildPlayers(sessions);
  if (players.length === 0) return [];

  const total = p => p.nights.reduce((sum, n) => sum + n.won, 0);
  const wins = p => p.nights.filter(n => n.won > 0).length;
  const bestNight = p => Math.max(...p.nights.map(n => n.won));
  const minGamesForRate = Math.max(3, Math.ceil(sessions.length * 0.25));

  const awards = [];
  function add(key, emoji, title, blurb, result, stat) {
    if (!result) return;
    awards.push({ key, emoji, title, blurb, winners: result.winners.map(p => p.name), stat: stat(result) });
  }

  add('shark', '🏆', 'The Shark', 'Most money won', pickWinners(players, total),
    r => `+${formatMoney(r.best)}`);

  add('atm', '🏧', 'The ATM', 'Most generous donor to the table', pickWinners(players, p => -total(p)),
    r => `-${formatMoney(r.best)}`);

  add('biggest-night', '💥', 'Biggest Night', 'Largest single-night win', pickWinners(players, bestNight),
    r => {
      const night = r.winners.length === 1 ? r.winners[0].nights.find(n => n.won === r.best) : null;
      return `+${formatMoney(r.best)}${night ? ` on ${formatDate(night.date)}` : ''}`;
    });

  add('rebuy-king', '🔁', 'Rebuy King', 'Most re-buys', pickWinners(players, p => p.nights.reduce((s, n) => s + n.rebuys, 0)),
    r => `${r.best} re-buy${r.best !== 1 ? 's' : ''}`);

  add('comeback', '🦸', 'Comeback Kid', 'Biggest win on a night they had to re-buy',
    pickWinners(players, p => {
      const comebacks = p.nights.filter(n => n.rebuys > 0 && n.won > 0);
      return comebacks.length ? Math.max(...comebacks.map(n => n.won)) : null;
    }),
    r => `+${formatMoney(r.best)} after re-buying`);

  add('consistent', '🎯', 'Mr. Consistent', `Best win rate (min ${minGamesForRate} games)`,
    pickWinners(players.filter(p => p.nights.length >= minGamesForRate), p => wins(p) / p.nights.length),
    r => r.winners.length === 1
      ? `${wins(r.winners[0])}/${r.winners[0].nights.length} wins`
      : `${Math.round(r.best * 100)}% wins`);

  add('hot-streak', '🔥', 'Hot Streak', 'Longest run of wins in a row',
    pickWinners(players, p => longestWinStreak(p.nights), s => s >= 2),
    r => `${r.best} wins in a row`);

  add('break-even', '😐', 'Break-Even Bandit', 'Most nights finishing within $5 of even',
    pickWinners(players, p => p.nights.filter(n => Math.abs(n.won) <= 5).length, s => s >= 2),
    r => `${r.best} nights`);

  add('rollercoaster', '🎢', 'Rollercoaster', 'Biggest gap between best and worst night',
    pickWinners(players, p => {
      const results = p.nights.map(n => n.won);
      const hi = Math.max(...results);
      const lo = Math.min(...results);
      return hi > 0 && lo < 0 ? hi - lo : null;
    }),
    r => `${formatMoney(r.best)} swing`);

  add('iron-man', '🗓️', 'Iron Man', 'Most games played', pickWinners(players, p => p.nights.length),
    r => `${r.best} games`);

  return awards;
}

export function recapText({ groupName, seasonName, sessionCount, awards }) {
  const lines = [`🏅 ${groupName} · ${seasonName} Awards (${sessionCount} game${sessionCount !== 1 ? 's' : ''})`, ''];
  awards.forEach(a => lines.push(`${a.emoji} ${a.title}: ${a.winners.join(' & ')} (${a.stat})`));
  return lines.join('\n');
}
