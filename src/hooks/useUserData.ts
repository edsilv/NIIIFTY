import { auth, db } from "../utils/Firebase";
import { useEffect, useState } from "react";
import { useAuthState } from "react-firebase-hooks/auth";
import { doc, getDoc } from "firebase/firestore";
import { UserAdapter } from "./UserAdapter";

// Custom hook to read auth record and user profile doc
export function useUserData() {
  const [user, loadingUser] = useAuthState(auth);
  const [username, setUsername] = useState<string | null>(null);
  const [loaded, setLoaded] = useState<boolean>(false);
  const [userAdapter, setUserAdapter] = useState<UserAdapter | null>(null);

  useEffect(() => {
    const fetchUsername: () => Promise<string> = async () => {
      const userRef = doc(db, "users", user!.uid);
      const userSnap = await getDoc(userRef);
      return userSnap.data()?.username || null;
    };

    if (user) {
      setUserAdapter(new UserAdapter(user));
      fetchUsername().then((uname) => {
        setUsername(uname);
        setLoaded(true);
      });
    }

    if (!user && !loadingUser) {
      // there's no user
      setLoaded(true);
    }
  }, [user, loadingUser]);

  return { user, username, loaded, userAdapter };
}
