import { getAuth, onAuthStateChanged, signOut, createUserWithEmailAndPassword, updateProfile, signInWithEmailAndPassword } from 'firebase/auth';
import { getApps, getApp, initializeApp } from 'firebase/app';
import { getFirestore, doc, onSnapshot, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyDukmQYg0yUctB-RjX6tvlXrm5lwNONjdU",
  authDomain: "po-app-9e289.firebaseapp.com",
  projectId: "po-app-9e289",
  storageBucket: "po-app-9e289.firebasestorage.app",
  messagingSenderId: "571887525881",
  appId: "1:571887525881:web:03f5e38a35802ea01b2728"
};
function getFirebaseApp() {
  if (getApps().length) return getApp();
  return initializeApp(firebaseConfig);
}
const app = getFirebaseApp();
const auth = getAuth(app);
const db = getFirestore(app);
if (typeof window !== "undefined") {
  const ok = !!firebaseConfig.apiKey && firebaseConfig.apiKey?.startsWith("AIza");
  console.log("[Firebase TEST]", {
    projectId: firebaseConfig.projectId,
    authDomain: firebaseConfig.authDomain,
    hasApiKey: ok
  });
}

async function ensureUserDoc(user, displayName) {
  const ref = doc(db, "users", user.uid);
  const existingDoc = await getDoc(ref);
  if (existingDoc.exists()) {
    await setDoc(
      ref,
      {
        uid: user.uid,
        email: user.email ?? "",
        displayName: displayName ?? user.displayName ?? (user.email?.split("@")[0] ?? ""),
        updatedAt: serverTimestamp()
      },
      { merge: true }
    );
  } else {
    await setDoc(ref, {
      uid: user.uid,
      email: user.email ?? "",
      displayName: displayName ?? user.displayName ?? (user.email?.split("@")[0] ?? ""),
      role: "buyer",
      // ตั้ง role เริ่มต้นเฉพาะตอนสร้างใหม่
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
  }
}
async function signUp(email, password, displayName) {
  const { user } = await createUserWithEmailAndPassword(auth, email, password);
  if (displayName) await updateProfile(user, { displayName });
  await ensureUserDoc(user, displayName);
  return user;
}
async function signIn(email, password) {
  const { user } = await signInWithEmailAndPassword(auth, email, password);
  try {
    const userRef = doc(db, "users", user.uid);
    const userDoc = await getDoc(userRef);
    if (!userDoc.exists()) {
      await ensureUserDoc(user);
    }
  } catch (error) {
    console.warn("Failed to check/create user document:", error);
  }
  return user;
}
async function signOutUser() {
  await signOut(auth);
}
function subscribeAuthAndRole(cb) {
  let offUserDoc = null;
  const offAuth = onAuthStateChanged(auth, (user) => {
    if (offUserDoc) {
      offUserDoc();
      offUserDoc = null;
    }
    if (!user) {
      cb(null, null);
      return;
    }
    const ref = doc(db, "users", user.uid);
    offUserDoc = onSnapshot(ref, (snap) => {
      if (snap.exists()) {
        const role = snap.data()?.role ?? "buyer";
        console.log("Auth subscription - User:", user.email, "Role:", role);
        cb(user, role);
      } else {
        console.warn("User document not found, creating...");
        ensureUserDoc(user).then(() => {
        }).catch(console.error);
      }
    }, (error) => {
      console.error("Auth subscription error:", error);
      cb(user, null);
    });
  });
  return () => {
    if (offUserDoc) offUserDoc();
    offAuth();
  };
}

export { signIn as a, auth as b, signOutUser as c, db as d, signUp as e, subscribeAuthAndRole as s };
