import { collection, doc, getDoc, getDocs, setDoc, updateDoc, query, where } from 'firebase/firestore';
import { db } from '../firebase';

const COLLECTION = 'invites';

export async function getInvite(id) {
  const snap = await getDoc(doc(db, COLLECTION, id));
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() };
}

export async function createInvite({ groupId, groupName, inviterName, invitedEmail }) {
  const id = crypto.randomUUID();
  await setDoc(doc(db, COLLECTION, id), {
    groupId,
    groupName,
    inviterName,
    invitedEmail: invitedEmail.toLowerCase().trim(),
    status: 'pending',
    createdAt: new Date().toISOString(),
  });
  return id;
}

export async function getPendingInvitesForEmail(email) {
  const q = query(collection(db, COLLECTION), where('invitedEmail', '==', email.toLowerCase()));
  const snap = await getDocs(q);
  return snap.docs
    .map(d => ({ id: d.id, ...d.data() }))
    .filter(inv => inv.status === 'pending');
}

export async function getGroupInvites(groupId) {
  const q = query(collection(db, COLLECTION), where('groupId', '==', groupId));
  const snap = await getDocs(q);
  return snap.docs
    .map(d => ({ id: d.id, ...d.data() }))
    .filter(inv => inv.status === 'pending');
}

export async function acceptInvite(inviteId) {
  await updateDoc(doc(db, COLLECTION, inviteId), { status: 'accepted' });
}

export async function declineInvite(inviteId) {
  await updateDoc(doc(db, COLLECTION, inviteId), { status: 'declined' });
}
