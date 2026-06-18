import { initializeApp } from 'firebase/app'
import {
  getAuth, GoogleAuthProvider, signInWithPopup,
  signOut as fbSignOut, onAuthStateChanged,
} from 'firebase/auth'
import { getFirestore, doc, onSnapshot, setDoc, deleteDoc } from 'firebase/firestore'

// Public Firebase config — safe to ship in the client. Access is controlled
// by Firestore security rules (each user can only touch users/{their uid}),
// not by keeping this hidden.
const firebaseConfig = {
  apiKey: 'AIzaSyAf-R9EzVmyd8p6xsuHAhFWDQRMZH3z5cY',
  authDomain: 'timer-app-d3ada.firebaseapp.com',
  projectId: 'timer-app-d3ada',
  storageBucket: 'timer-app-d3ada.firebasestorage.app',
  messagingSenderId: '479845343600',
  appId: '1:479845343600:web:f8a07190fce33308412fb5',
}

const app = initializeApp(firebaseConfig)
const auth = getAuth(app)
const db = getFirestore(app)
const provider = new GoogleAuthProvider()

export function signInWithGoogle() {
  return signInWithPopup(auth, provider)
}
export function signOut() {
  return fbSignOut(auth)
}
export function watchAuth(cb) {
  return onAuthStateChanged(auth, cb)
}

// Realtime subscription to the user's single state document.
// cb(data, isLocalEcho) — isLocalEcho is true for our own un-acked writes.
export function watchUserDoc(uid, cb) {
  return onSnapshot(doc(db, 'users', uid), snap => {
    cb(snap.exists() ? snap.data() : null, snap.metadata.hasPendingWrites)
  })
}

// Overwrite the whole user document (last-write-wins).
export function pushUserDoc(uid, data) {
  return setDoc(doc(db, 'users', uid), data)
}

// ── Push notification docs ────────────────────────────────────────────────────
// Each signed-in device with notifications enabled has a doc in
// activeNotifications/{uid} that the notify worker reads every 5 minutes.

export function saveNotifyDoc(uid, pushSubscription) {
  return setDoc(doc(db, 'activeNotifications', uid), { uid, pushSubscription }, { merge: true })
}

export function updateNotifyTimer(uid, timerData) {
  return setDoc(doc(db, 'activeNotifications', uid), { uid, ...timerData }, { merge: true })
}

export function deleteNotifyDoc(uid) {
  return deleteDoc(doc(db, 'activeNotifications', uid))
}
