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

const COLLECTION = 'players';

function playersRef() {
  return collection(db, COLLECTION);
}

function playerDoc(id) {
  return doc(db, COLLECTION, id);
}

export async function getPlayers() {
  const q = query(playersRef(), orderBy('firstName', 'asc'));
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
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

export function playerDisplayName(player) {
  return `${player.firstName} ${player.lastName}`.trim();
}
