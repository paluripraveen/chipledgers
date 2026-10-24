import { initializeApp } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import { onDocumentWritten } from 'firebase-functions/v2/firestore';
import { computeTableOdds } from './table.js';

initializeApp();
const db = getFirestore();

// Live odds tables. Players' hole cards live in oddsTables/{code}/hands/{uid}, readable only
// by their owner. This is the only place that sees every hand: on any change to the table it
// recomputes the odds and writes each player's result to oddsTables/{code}/odds/{uid}, and the
// hands the host has revealed to oddsTables/{code}/public/reveal.
// Clients always touch the table doc after changing their hand, so this trigger covers both.
export const tableOdds = onDocumentWritten(
  // Same region as the Firestore database
  { document: 'oddsTables/{code}', region: 'us-south1', memory: '512MiB', cpu: 1, maxInstances: 10 },
  async event => {
    const tableRef = db.doc(`oddsTables/${event.params.code}`);

    if (!event.data.after.exists) {
      // Table ended: remove everyone's cards and odds with it
      await db.recursiveDelete(tableRef);
      return;
    }

    const stateRef = tableRef.collection('private').doc('state');
    const [tableSnap, handsSnap, stateSnap] = await Promise.all([
      tableRef.get(),
      tableRef.collection('hands').get(),
      stateRef.get(),
    ]);
    if (!tableSnap.exists) return;

    const hands = Object.fromEntries(handsSnap.docs.map(d => [d.id, d.data()]));
    const { key, status, odds, reveal } = computeTableOdds(tableSnap.data(), hands);
    if (stateSnap.exists && stateSnap.get('key') === key) return;

    await db.runTransaction(async tx => {
      const latest = await tx.get(tableRef);
      // The table changed while we were computing; that write's own trigger will publish
      if (!latest.exists || !latest.updateTime.isEqual(tableSnap.updateTime)) return;
      const updatedAt = FieldValue.serverTimestamp();
      for (const [uid, data] of Object.entries(odds)) {
        tx.set(tableRef.collection('odds').doc(uid), { ...data, updatedAt });
      }
      tx.set(tableRef.collection('public').doc('status'), { ...status, updatedAt });
      tx.set(tableRef.collection('public').doc('reveal'), { ...reveal, updatedAt });
      tx.set(stateRef, { key });
    });
  },
);
