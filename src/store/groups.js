import {
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
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
    memberUids: data.memberUids || [],
    adminUids: data.adminUids || [],
  };
}

export async function getGroups(uid) {
  const q = query(groupsRef(), where('memberUids', 'array-contains', uid));
  const snap = await getDocs(q);
  const groups = snap.docs.map(d => normalizeGroup(d.id, d.data()));
  return groups.sort((a, b) => a.name.localeCompare(b.name));
}

export async function getGroup(id) {
  const snap = await getDoc(groupDoc(id));
  if (!snap.exists()) return null;
  return normalizeGroup(snap.id, snap.data());
}

export async function createGroup(name, uid) {
  const id = crypto.randomUUID();
  const group = {
    name: name.trim(),
    playerIds: [],
    createdBy: uid,
    memberUids: [uid],
    adminUids: [uid],
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

export async function joinGroup(groupId, uid, playerId) {
  const group = await getGroup(groupId);
  if (!group) return;
  const memberUids = group.memberUids.includes(uid) ? group.memberUids : [...group.memberUids, uid];
  const playerIds = playerId && !group.playerIds.includes(playerId)
    ? [...group.playerIds, playerId]
    : group.playerIds;
  await updateDoc(groupDoc(groupId), { memberUids, playerIds });
}

export async function deleteGroup(id) {
  await deleteDoc(groupDoc(id));
}
