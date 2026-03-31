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
} from 'firebase/firestore';
import { db } from '../firebase';

const COLLECTION = 'sessions';

function sessionsRef() {
  return collection(db, COLLECTION);
}

function sessionDoc(id) {
  return doc(db, COLLECTION, id);
}

// Normalize player data coming from Firestore
// Firestore drops null fields, so we restore defaults
function normalizePlayers(players) {
  return (players || []).map(p => ({
    ...p,
    buyIns: p.buyIns || [],
    totalBuyIn: p.totalBuyIn || 0,
    chipsReturned: typeof p.chipsReturned === 'number' && p.chipsReturned >= 0 ? p.chipsReturned : null,
    net: typeof p.net === 'number' && p.chipsReturned >= 0 ? p.net : null,
  }));
}

function normalizeSession(id, data) {
  return {
    id,
    ...data,
    players: normalizePlayers(data.players),
  };
}

export async function getSessions() {
  const q = query(sessionsRef(), orderBy('date', 'desc'));
  const snap = await getDocs(q);
  return snap.docs.map(d => normalizeSession(d.id, d.data()));
}

export async function getSession(id) {
  const snap = await getDoc(sessionDoc(id));
  if (!snap.exists()) return null;
  return normalizeSession(snap.id, snap.data());
}

export async function createSession(date, playerNames, place = '') {
  const id = crypto.randomUUID();
  const session = {
    date,
    place,
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
  const session = await getSession(sessionId);
  if (!session) return null;
  const player = {
    id: crypto.randomUUID(),
    name: name.trim(),
    buyIns: [10],
    totalBuyIn: 10,
    chipsReturned: -1,
    net: -1,
  };
  session.players.push(player);
  await updateDoc(sessionDoc(sessionId), { players: session.players });
  return player;
}

export async function removePlayer(sessionId, playerId) {
  const session = await getSession(sessionId);
  if (!session) return;
  session.players = session.players.filter(p => p.id !== playerId);
  await updateDoc(sessionDoc(sessionId), { players: session.players });
}

export async function addBuyIn(sessionId, playerId, amount) {
  const session = await getSession(sessionId);
  if (!session) return;
  const player = session.players.find(p => p.id === playerId);
  if (!player) return;
  player.buyIns.push(amount);
  player.totalBuyIn = player.buyIns.reduce((sum, v) => sum + v, 0);
  await updateDoc(sessionDoc(sessionId), { players: session.players });
}

export async function setChipsReturned(sessionId, playerId, amount) {
  const session = await getSession(sessionId);
  if (!session) return;
  const player = session.players.find(p => p.id === playerId);
  if (!player) return;
  player.chipsReturned = amount;
  player.net = player.totalBuyIn - amount;
  await updateDoc(sessionDoc(sessionId), { players: session.players });
}

// Import a completed session from parsed image data
// players: [{ name, buyIn, returned, net }]
export async function importSession(date, players, place = '') {
  const id = crypto.randomUUID();
  const session = {
    date,
    place,
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
