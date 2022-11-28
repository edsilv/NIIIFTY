import { UserContext } from "@/utils/UserContext";
import { auth } from "@/utils/Firebase";
import { useTranslation } from "react-i18next";
import Link from "next/link";
import { useRouter } from "next/router";
import { useContext } from "react";

export function NavItems() {
  const { t } = useTranslation();
  const { username } = useContext(UserContext);
  const router = useRouter();

  const signOut = () => {
    auth.signOut();
    router.reload();
  };

  return (
    <>
      {/* {demoSite && !authoringState && (
        <li>
          <Link href="/features/">
            <a className="text-base text-black no-underline transition-colors duration-500 hover:text-gray-600">
              <>{t("features")}</>
            </a>
          </Link>
        </li>
      )} */}
      {username && (
        <li>
          <Link href="/admin/">
            <a className="text-base text-black no-underline transition-colors duration-500 hover:text-gray-600">
              <>{t("myFiles")}</>
            </a>
          </Link>
        </li>
      )}
      {/* <li>
        <Link href="/docs/">
          <a className="text-base text-black no-underline transition-colors duration-500 hover:text-gray-600">
            <>{t("docs")}</>
          </a>
        </Link>
      </li>
      {!authoringState && (
        <li>
          <Link href="/contact">
            <a className="text-base text-black no-underline transition-colors duration-500 hover:text-gray-600">
              <>{t("contact")}</>
            </a>
          </Link>
        </li>
      )} */}
      {username && (
        <li>
          <a
            onClick={signOut}
            role="menuitem"
            className="cursor-pointer text-base text-black no-underline transition-colors duration-500 hover:text-gray-600"
          >
            <>{t("signOut")}</>
          </a>
        </li>
      )}
    </>
  );
}
