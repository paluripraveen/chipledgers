import {
  collection,
  doc,
  getDocs,
  setDoc,
  query,
  orderBy,
} from 'firebase/firestore';
import { db } from '../firebase';

const COLLECTION = 'settlements';

function settlementsRef() {
  return collection(db, COLLECTION);
}

export async function getSettlements(groupId) {
  const q = query(settlementsRef(), orderBy('date', 'desc'));
  const snap = await getDocs(q);
  const all = snap.docs.map(d => ({ id: d.id, ...d.data() }));
  if (groupId) {
    return all.filter(s => s.groupId === groupId);
  }
  return all;
}

export async function recordSettlement(from, to, amount, groupId = '') {
  const id = crypto.randomUUID();
  const settlement = {
    from,
    to,
    amount,
    groupId,
    date: new Date().toISOString().split('T')[0],
  };
  await setDoc(doc(db, COLLECTION, id), settlement);
  return { id, ...settlement };
}
