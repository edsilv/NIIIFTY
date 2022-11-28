import { FirebaseApp, initializeApp } from "firebase/app";
import { EmailAuthProvider, getAuth, GoogleAuthProvider } from "firebase/auth";
import {
  collection,
  getFirestore,
  Timestamp,
  where,
  query,
  limit,
  getDocs,
  getDoc,
  doc,
} from "firebase/firestore";
import { getStorage } from "firebase/storage";
import config from "../../niiifty.config";
import { File } from "./Types";

const firebaseConfig = config.environments[config.environment].firebaseConfig;
const firebaseApp: FirebaseApp = initializeApp(firebaseConfig);

// Auth exports
export const auth = getAuth(firebaseApp);
export const googleAuthProvider = new GoogleAuthProvider();
export const emailAuthProvider = new EmailAuthProvider();

// Firestore exports
export const db = getFirestore(firebaseApp);

// Storage exports
export const storage = getStorage(firebaseApp);

// Helper functions
export async function getUserWithUsername(username: string) {
  const usersRef = collection(db, "users");
  const q = query(usersRef, where("username", "==", username), limit(1));

  const userSnapshot = await getDocs(q);

  if (userSnapshot.size > 0) {
    const doc = userSnapshot.docs[0];
    return {
      uid: doc.id,
      ...doc.data(),
    };
  }

  return null;
}

export async function getFileBySlug(uid, slug): Promise<File> {
  const fileSnap = await getDoc(doc(db, `users/${uid}/files/${slug}`));

  const exists: boolean = fileSnap.exists();

  if (!exists) {
    return null;
  }

  const file: File = fileSnap.data() as File;

  return file;
}

export const timestamp = () => {
  return Timestamp.now();
};
