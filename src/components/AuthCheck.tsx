import { useContext, useEffect } from "react";
import { UserContext } from "@/utils/UserContext";
import { auth } from "@/utils/Firebase";

export default function AuthCheck({
  signedInContent,
  fallbackContent,
}: {
  signedInContent: JSX.Element;
  fallbackContent?: JSX.Element;
}) {
  const { user, username, loaded } = useContext(UserContext);

  useEffect(() => {
    if (loaded && auth && !username) {
      window.location.href = "/enter";
    }
  }, [user, username, loaded]);

  if (loaded && user && username) {
    return signedInContent;
  }

  return fallbackContent;
}
