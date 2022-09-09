import { UserAdapter } from "@/hooks/UserAdapter";
import { User } from "firebase/auth";
import { createContext } from "react";

export interface UserContext {
  loaded: boolean;
  user: User | null;
  userAdapter: UserAdapter | null;
  username: string | null;
}

export const UserContext = createContext<UserContext>({
  loaded: false,
  user: null,
  userAdapter: null,
  username: null,
});
