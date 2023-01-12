import { createContext } from "react";
import { AuthoringFileContextState } from "./Types";

export const AuthoringFileContext = createContext<AuthoringFileContextState>({
  state: null,
  dispatch: null,
});