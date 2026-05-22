import {
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
} from 'firebase/firestore';

import { db } from '../firebase';

const COLLECTION = 'players';

function playersRef() {
  return collection(db, COLLECTION);
}

function playerDoc(id) {
  return doc(db, COLLECTION, id);
}

export async function getPlayers() {
  const snap = await getDocs(playersRef());
  const players = snap.docs.map(d => ({ id: d.id, ...d.data() }));
  return players.sort((a, b) => (a.firstName || '').localeCompare(b.firstName || ''));
}

export async function getPlayer(id) {
  const snap = await getDoc(playerDoc(id));
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() };
}

export async function getPlayersByIds(ids) {
  if (!ids || ids.length === 0) return [];
  const all = await getPlayers();
  return all.filter(p => ids.includes(p.id));
}

export async function createPlayer({ firstName, lastName, phone = '', email = '', paypalId = '' }) {
  const id = crypto.randomUUID();
  const player = {
    firstName: firstName.trim(),
    lastName: lastName.trim(),
    phone: phone.trim(),
    email: email.trim(),
    paypalId: paypalId.trim(),
    createdAt: new Date().toISOString(),
  };
  await setDoc(playerDoc(id), player);
  return { id, ...player };
}

export async function updatePlayer(id, fields) {
  await updateDoc(playerDoc(id), fields);
  return getPlayer(id);
}

export async function deletePlayer(id) {
  await deleteDoc(playerDoc(id));
}

export async function findOrCreatePlayerForUser(user) {
  const snap = await getDoc(playerDoc(user.uid));
  if (snap.exists()) return { id: snap.id, ...snap.data() };

  const displayName = user.displayName || '';
  const nameParts = displayName.trim().split(/\s+/);
  const firstName = nameParts[0] || user.email?.split('@')[0] || '';
  const lastName = nameParts.slice(1).join(' ') || '';

  const player = {
    firstName,
    lastName,
    email: user.email || '',
    phone: '',
    paypalId: '',
    uid: user.uid,
    createdAt: new Date().toISOString(),
  };
  await setDoc(playerDoc(user.uid), player);
  return { id: user.uid, ...player };
}

export function playerDisplayName(player) {
  return `${player.firstName} ${player.lastName}`.trim();
}
