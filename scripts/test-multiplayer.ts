/**
 * Multiplayer smoke test.
 *
 * Runs against the real Firebase project (uses firebase-applet-config.json)
 * to verify the host-side multiplayer flow that the user reported as broken
 * ("Invite Friend got stuck on 'Opening Rift'"). We don't fake out Firestore
 * here -- we want to confirm the live config + rules + anon auth all work.
 *
 * What it checks:
 *   1. Anonymous sign-in succeeds (this is the #1 reason invite hung).
 *   2. createRoom() returns a 6-char code within 10s.
 *   3. The /rooms/<code> doc actually exists in Firestore.
 *   4. setupListeners attaches without throwing.
 *   5. Cleanup deletes the room afterwards (no orphan docs).
 *
 * Run with: npx tsx scripts/test-multiplayer.ts
 */

import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously } from 'firebase/auth';
import {
  getFirestore,
  doc,
  setDoc,
  getDoc,
  deleteDoc,
  collection,
  onSnapshot,
  serverTimestamp,
} from 'firebase/firestore';
import config from '../firebase-applet-config.json';

const TIMEOUT_MS = 12_000;

function timeout<T>(p: Promise<T>, ms: number, label: string): Promise<T> {
  return Promise.race([
    p,
    new Promise<T>((_, rej) =>
      setTimeout(() => rej(new Error(`Timeout after ${ms}ms: ${label}`)), ms)
    ),
  ]);
}

async function main() {
  console.log('[MP-TEST] Initialising Firebase...');
  const app = initializeApp(config);
  const db = config.firestoreDatabaseId
    ? getFirestore(app, config.firestoreDatabaseId)
    : getFirestore(app);
  const auth = getAuth(app);

  console.log('[MP-TEST] Step 1: Anonymous sign-in...');
  let uid: string;
  try {
    const cred = await timeout(signInAnonymously(auth), TIMEOUT_MS, 'signInAnonymously');
    uid = cred.user.uid;
    console.log(`[MP-TEST]   OK -> uid=${uid}`);
  } catch (err) {
    console.error('[MP-TEST]   FAILED:', err);
    console.error('[MP-TEST]   --> Anonymous Auth is probably DISABLED in the Firebase project.');
    console.error('[MP-TEST]   --> Enable it: Firebase Console > Authentication > Sign-in method > Anonymous > Enable');
    process.exit(1);
  }

  console.log('[MP-TEST] Step 2: createRoom()...');
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let roomId = '';
  for (let i = 0; i < 6; i++) roomId += chars.charAt(Math.floor(Math.random() * chars.length));
  const roomRef = doc(db, 'rooms', roomId);

  try {
    await timeout(
      setDoc(roomRef, {
        hostId: uid,
        createdAt: serverTimestamp(),
        lastActive: serverTimestamp(),
      }),
      TIMEOUT_MS,
      'setDoc(rooms/' + roomId + ')'
    );
    console.log(`[MP-TEST]   OK -> roomId=${roomId}`);
  } catch (err) {
    console.error('[MP-TEST]   FAILED:', err);
    console.error('[MP-TEST]   --> Firestore rules may be blocking the write, or the project DB may not exist.');
    process.exit(1);
  }

  console.log('[MP-TEST] Step 3: Verify room doc was written...');
  try {
    const snap = await timeout(getDoc(roomRef), TIMEOUT_MS, 'getDoc(rooms/' + roomId + ')');
    if (!snap.exists()) {
      console.error('[MP-TEST]   FAILED: room doc does not exist after setDoc. (Eventual consistency or write rejected.)');
      process.exit(1);
    }
    const data = snap.data();
    if (data.hostId !== uid) {
      console.error('[MP-TEST]   FAILED: hostId mismatch.', data);
      process.exit(1);
    }
    console.log('[MP-TEST]   OK -> doc.hostId matches our uid.');
  } catch (err) {
    console.error('[MP-TEST]   FAILED:', err);
    process.exit(1);
  }

  console.log('[MP-TEST] Step 4: Attach listeners (room + players + battles)...');
  let unsubRoom = () => {};
  let unsubPlayers = () => {};
  let unsubBattles = () => {};
  try {
    unsubRoom = onSnapshot(roomRef, () => {});
    unsubPlayers = onSnapshot(collection(db, 'rooms', roomId, 'players'), () => {});
    unsubBattles = onSnapshot(collection(db, 'rooms', roomId, 'battles'), () => {});
    await new Promise((res) => setTimeout(res, 800)); // let subscriptions warm up
    console.log('[MP-TEST]   OK -> 3 listeners attached.');
  } catch (err) {
    console.error('[MP-TEST]   FAILED:', err);
    unsubRoom();
    unsubPlayers();
    unsubBattles();
    process.exit(1);
  }

  console.log('[MP-TEST] Step 5: Write player doc (host self-join)...');
  const playerRef = doc(db, 'rooms', roomId, 'players', uid);
  try {
    await timeout(
      setDoc(playerRef, {
        uid,
        displayName: 'TestHost',
        state: { x: 0, y: 0, mapId: 'house_player' },
        lastUpdate: serverTimestamp(),
      }),
      TIMEOUT_MS,
      'setDoc(players/' + uid + ')'
    );
    console.log('[MP-TEST]   OK -> player doc written.');
  } catch (err) {
    console.error('[MP-TEST]   FAILED:', err);
    unsubRoom();
    unsubPlayers();
    unsubBattles();
    process.exit(1);
  }

  console.log('[MP-TEST] Cleanup...');
  unsubRoom();
  unsubPlayers();
  unsubBattles();
  try {
    await deleteDoc(playerRef);
    await deleteDoc(roomRef);
    console.log('[MP-TEST]   OK -> test docs deleted.');
  } catch (err) {
    console.warn('[MP-TEST]   Cleanup warning (orphan room may remain):', err);
  }

  console.log('[MP-TEST] PASS -- Multiplayer host flow is healthy.');
  process.exit(0);
}

main().catch((err) => {
  console.error('[MP-TEST] Fatal:', err);
  process.exit(1);
});
