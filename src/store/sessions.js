import {
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
  runTransaction,
} from 'firebase/firestore';
import { db } from '../firebase';

const COLLECTION = 'sessions';

function sessionsRef() {
  return collection(db, COLLECTION);
}

function sessionDoc(id) {
  return doc(db, COLLECTION, id);
}

function normalizePlayers(players) {
  return (players || []).map(p => {
    const totalBuyIn = p.totalBuyIn || 0;
    const chipsReturned = typeof p.chipsReturned === 'number' && p.chipsReturned >= 0 ? p.chipsReturned : null;
    return {
      ...p,
      buyIns: p.buyIns || [],
      totalBuyIn,
      chipsReturned,
      // Always derive net; the stored value can be stale if buy-ins changed after chips were returned
      net: chipsReturned != null ? totalBuyIn - chipsReturned : null,
    };
  });
}

function normalizeSession(id, data) {
  return {
    id,
    ...data,
    players: normalizePlayers(data.players),
  };
}

// Keep a player's derived fields in sync with their buy-ins and chips returned
function recalcPlayer(player) {
  player.totalBuyIn = player.buyIns.reduce((sum, v) => sum + v, 0);
  if (player.chipsReturned != null) player.net = player.totalBuyIn - player.chipsReturned;
}

// Read-modify-write the players array inside a transaction so concurrent
// updates (rapid taps, multiple devices) retry instead of overwriting each other
async function updatePlayers(sessionId, mutate) {
  return runTransaction(db, async tx => {
    const ref = sessionDoc(sessionId);
    const snap = await tx.get(ref);
    if (!snap.exists()) return null;
    const session = normalizeSession(snap.id, snap.data());
    const result = mutate(session);
    if (result === false) return null;
    tx.update(ref, { players: session.players });
    return result;
  });
}

export async function getSessions(groupId) {
  const q = query(sessionsRef(), orderBy('date', 'desc'));
  const snap = await getDocs(q);
  const all = snap.docs.map(d => normalizeSession(d.id, d.data()));
  if (groupId) {
    return all.filter(s => s.groupId === groupId);
  }
  return all;
}

export async function getSession(id) {
  const snap = await getDoc(sessionDoc(id));
  if (!snap.exists()) return null;
  return normalizeSession(snap.id, snap.data());
}

export async function createSession(date, playerNames, place = '', groupId = '') {
  const id = crypto.randomUUID();
  const session = {
    date,
    place,
    groupId,
    status: 'active',
    players: playerNames.map(name => ({
      id: crypto.randomUUID(),
      name: name.trim(),
      buyIns: [10],
      totalBuyIn: 10,
      chipsReturned: -1,
      net: -1,
    })),
  };
  await setDoc(sessionDoc(id), session);
  return normalizeSession(id, session);
}

export async function addPlayer(sessionId, name) {
  const player = {
    id: crypto.randomUUID(),
    name: name.trim(),
    buyIns: [10],
    totalBuyIn: 10,
    chipsReturned: -1,
    net: -1,
  };
  return updatePlayers(sessionId, session => {
    session.players.push(player);
    return player;
  });
}

export async function removePlayer(sessionId, playerId) {
  await updatePlayers(sessionId, session => {
    session.players = session.players.filter(p => p.id !== playerId);
  });
}

export async function addBuyIn(sessionId, playerId, amount) {
  await updatePlayers(sessionId, session => {
    const player = session.players.find(p => p.id === playerId);
    if (!player) return false;
    player.buyIns.push(amount);
    recalcPlayer(player);
  });
}

export async function undoBuyIn(sessionId, playerId) {
  await updatePlayers(sessionId, session => {
    const player = session.players.find(p => p.id === playerId);
    if (!player || player.buyIns.length <= 1) return false; // keep at least initial buy-in
    player.buyIns.pop();
    recalcPlayer(player);
  });
}

export async function updateSessionNotes(sessionId, notes) {
  await updateDoc(sessionDoc(sessionId), { notes });
}

// amounts: { [playerId]: chipsReturned } -- applied together in one transaction
export async function setChipsReturned(sessionId, amounts) {
  return updatePlayers(sessionId, session => {
    for (const player of session.players) {
      if (!(player.id in amounts)) continue;
      player.chipsReturned = amounts[player.id];
      recalcPlayer(player);
    }
    return session;
  });
}

export async function importSession(date, players, place = '', groupId = '') {
  const id = crypto.randomUUID();
  const session = {
    date,
    place,
    groupId,
    status: 'completed',
    players: players.map(p => ({
      id: crypto.randomUUID(),
      name: p.name.trim(),
      buyIns: [p.buyIn],
      totalBuyIn: p.buyIn,
      chipsReturned: p.returned,
      net: p.net,
    })),
  };
  await setDoc(sessionDoc(id), session);
  return normalizeSession(id, session);
}

export async function endSession(sessionId) {
  await updateDoc(sessionDoc(sessionId), { status: 'completed' });
  return getSession(sessionId);
}

export async function deleteSession(sessionId) {
  await deleteDoc(sessionDoc(sessionId));
}

// Archive all completed sessions for a group by marking them as archived
export async function archiveSeason(groupId, seasonLabel) {
  const sessions = await getSessions(groupId);
  const completed = sessions.filter(s => s.status === 'completed' && !s.archived);
  for (const session of completed) {
    await updateDoc(sessionDoc(session.id), { archived: true, season: seasonLabel });
  }
  return completed.length;
}
