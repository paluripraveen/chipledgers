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

const COLLECTION = 'groups';

function groupsRef() {
  return collection(db, COLLECTION);
}

function groupDoc(id) {
  return doc(db, COLLECTION, id);
}

function normalizeGroup(id, data) {
  return {
    id,
    ...data,
    playerIds: data.playerIds || [],
  };
}

export async function getGroups() {
  const q = query(groupsRef(), orderBy('name', 'asc'));
  const snap = await getDocs(q);
  return snap.docs.map(d => normalizeGroup(d.id, d.data()));
}

export async function getGroup(id) {
  const snap = await getDoc(groupDoc(id));
  if (!snap.exists()) return null;
  return normalizeGroup(snap.id, snap.data());
}

export async function createGroup(name) {
  const id = crypto.randomUUID();
  const group = {
    name: name.trim(),
    playerIds: [],
    createdAt: new Date().toISOString(),
  };
  await setDoc(groupDoc(id), group);
  return { id, ...group };
}

export async function addPlayerToGroup(groupId, playerId) {
  const group = await getGroup(groupId);
  if (!group) return;
  if (group.playerIds.includes(playerId)) return;
  group.playerIds.push(playerId);
  await updateDoc(groupDoc(groupId), { playerIds: group.playerIds });
}

export async function removePlayerFromGroup(groupId, playerId) {
  const group = await getGroup(groupId);
  if (!group) return;
  group.playerIds = group.playerIds.filter(id => id !== playerId);
  await updateDoc(groupDoc(groupId), { playerIds: group.playerIds });
}

export async function deleteGroup(id) {
  await deleteDoc(groupDoc(id));
}
