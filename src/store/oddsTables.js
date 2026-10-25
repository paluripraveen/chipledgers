import {
  doc,
  getDoc,
  updateDoc,
  deleteDoc,
  deleteField,
  onSnapshot,
  runTransaction,
  serverTimestamp,
  writeBatch,
} from 'firebase/firestore';
import { getAuth, connectAuthEmulator, onAuthStateChanged, signInAnonymously } from 'firebase/auth';
import { app, db } from '../firebase';

// Auth lives here rather than in firebase.js so only the odds pages load it
const auth = getAuth(app);
if (import.meta.env.DEV) {
  connectAuthEmulator(auth, 'http://localhost:9099', { disableWarnings: true });
}

const COLLECTION = 'oddsTables';
// No 0/O or 1/I, so a code is easy to read out across the table
const CODE_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

// Remembered on this device so players don't retype their name or lose their table
export const NAME_KEY = 'cl_odds_name';
export const LAST_TABLE_KEY = 'cl_odds_table';

export const RANKS = 'AKQJT98765432';
export const SUITS = 'shdc';

function tableDoc(code) {
  return doc(db, COLLECTION, code);
}

function randomCode() {
  return Array.from({ length: 6 }, () => CODE_CHARS[Math.floor(Math.random() * CODE_CHARS.length)]).join('');
}

export function normalizeCode(code) {
  return (code || '').toUpperCase().replace(/[^A-Z0-9]/g, '');
}

let signingIn = null;

// Each device gets an anonymous Firebase user; its uid is what keeps a player's cards private.
// Callers share one sign-in: two parallel signInAnonymously calls create two users, and a
// listener opened as the first is then denied and stops for good once the second takes over.
export function ensureSignedIn() {
  signingIn ??= new Promise((resolve, reject) => {
    const unsub = onAuthStateChanged(auth, user => {
      unsub();
      if (user) resolve(user);
      else signInAnonymously(auth).then(cred => resolve(cred.user), reject);
    }, reject);
  }).catch(e => {
    signingIn = null; // let the next call retry, e.g. after being offline
    throw e;
  });
  return signingIn;
}

function newPlayer(name) {
  return { name, folded: false, cardsFor: 0, joinedAt: Date.now() };
}

export async function createTable(name) {
  const { uid } = await ensureSignedIn();
  for (let attempt = 0; attempt < 5; attempt++) {
    const code = randomCode();
    const created = await runTransaction(db, async tx => {
      const ref = tableDoc(code);
      if ((await tx.get(ref)).exists()) return false;
      tx.set(ref, {
        hostUid: uid,
        handNumber: 1,
        board: [],
        players: { [uid]: newPlayer(name) },
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      return true;
    });
    if (created) return code;
  }
  throw new Error('Could not create a table. Please try again.');
}

// Returns false if there is no such table
export async function joinTable(code, name) {
  const { uid } = await ensureSignedIn();
  const snap = await getDoc(tableDoc(code));
  if (!snap.exists()) return false;
  const existing = snap.data().players?.[uid];
  await updateDoc(tableDoc(code), existing
    ? { [`players.${uid}.name`]: name, updatedAt: serverTimestamp() }
    : { [`players.${uid}`]: newPlayer(name), updatedAt: serverTimestamp() });
  return true;
}

// Players remove themselves; the host can remove anyone
export function removePlayer(code, uid) {
  return updateDoc(tableDoc(code), { [`players.${uid}`]: deleteField(), updatedAt: serverTimestamp() });
}

export async function setMyCards(code, handNumber, cards) {
  const { uid } = await ensureSignedIn();
  // One batch, so it's a single round trip and the table never points at cards not yet saved.
  // Touching the table is what tells the odds function to recompute.
  const batch = writeBatch(db);
  batch.set(doc(db, COLLECTION, code, 'hands', uid), { cards, handNumber, updatedAt: serverTimestamp() });
  batch.update(tableDoc(code), {
    [`players.${uid}.cardsFor`]: handNumber,
    [`players.${uid}.cardsAt`]: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  await batch.commit();
}

export function setFolded(code, uid, folded) {
  return updateDoc(tableDoc(code), { [`players.${uid}.folded`]: folded, updatedAt: serverTimestamp() });
}

export function setBoard(code, board) {
  return updateDoc(tableDoc(code), { board, updatedAt: serverTimestamp() });
}

// Host setting: show win % during the hand. Off by default, since players can use it to
// fold beaten hands.
export function setLiveOdds(code, liveOdds) {
  return updateDoc(tableDoc(code), { liveOdds, updatedAt: serverTimestamp() });
}

// Host reveals every live hand and the true win % to the whole table, e.g. at all-in
export function setRevealed(code, revealed) {
  return updateDoc(tableDoc(code), { revealed, updatedAt: serverTimestamp() });
}

// Clears the board, folds and any reveal; everyone picks new cards for the next hand
export function nextHand(code) {
  return runTransaction(db, async tx => {
    const ref = tableDoc(code);
    const snap = await tx.get(ref);
    if (!snap.exists()) return;
    const data = snap.data();
    const players = Object.fromEntries(
      Object.entries(data.players || {}).map(([uid, p]) => [uid, { ...p, folded: false }]),
    );
    tx.update(ref, { handNumber: (data.handNumber || 1) + 1, board: [], players, revealed: false, updatedAt: serverTimestamp() });
  });
}

// The odds function cleans up everyone's cards and odds when the table is deleted
export function endTable(code) {
  return deleteDoc(tableDoc(code));
}

function subscribe(ref, onData, onError) {
  return onSnapshot(ref, snap => onData(snap.exists() ? { id: snap.id, ...snap.data() } : null), onError);
}

export function subscribeTable(code, onData, onError) {
  return subscribe(tableDoc(code), onData, onError);
}

export function subscribeMyHand(code, uid, onData, onError) {
  return subscribe(doc(db, COLLECTION, code, 'hands', uid), onData, onError);
}

export function subscribeMyOdds(code, uid, onData, onError) {
  return subscribe(doc(db, COLLECTION, code, 'odds', uid), onData, onError);
}

export function subscribeStatus(code, onData, onError) {
  return subscribe(doc(db, COLLECTION, code, 'public', 'status'), onData, onError);
}

export function subscribeReveal(code, onData, onError) {
  return subscribe(doc(db, COLLECTION, code, 'public', 'reveal'), onData, onError);
}
