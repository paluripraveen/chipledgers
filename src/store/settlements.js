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

export async function getSettlements() {
  const q = query(settlementsRef(), orderBy('date', 'desc'));
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

export async function recordSettlement(from, to, amount) {
  const id = crypto.randomUUID();
  const settlement = {
    from,
    to,
    amount,
    date: new Date().toISOString().split('T')[0],
  };
  await setDoc(doc(db, COLLECTION, id), settlement);
  return { id, ...settlement };
}
