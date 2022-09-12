import { headerTitle } from "../utils/Config";
import Link from "./Link";
import SectionContainer from "./SectionContainer";
import Footer from "./Footer";
import MobileNav from "./MobileNav";
import ThemeSwitch from "./ThemeSwitch";
import { useTranslation } from "react-i18next";
import { useContext } from "react";
import { UserContext } from "@/utils/UserContext";
import { auth } from "@/utils/Firebase";
import router from "next/router";

const LayoutWrapper = ({ children }) => {
  const { username } = useContext(UserContext);

  const signOut = (e) => {
    e.preventDefault();
    auth.signOut();
    router.reload();
  };

  const { t } = useTranslation();
  return (
    <SectionContainer>
      <div className="flex h-screen flex-col justify-between">
        <header className="flex items-center justify-between py-10">
          <div>
            <Link href="/" aria-label={headerTitle}>
              <div className="flex items-center justify-between">
                <div className="mr-3 text-black dark:text-white">
                  <svg
                    className="h-5 w-auto"
                    width="461"
                    height="94"
                    viewBox="0 0 461 94"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <g>
                      <path
                        d="M80.2216 0.181815V94H58.9659L25.0668 44.7088H24.517V94H-0.953125V0.181815H20.669L54.0185 49.2898H54.7514V0.181815H80.2216ZM204.893 94V0.181815H270.858V20.7045H230.363V36.8295H266.827V57.3523H230.363V94H204.893ZM277.661 20.7045V0.181815H359.202V20.7045H330.984V94H305.88V20.7045H277.661ZM364.94 0.181815H393.342L411.666 38.2955H412.399L430.723 0.181815H459.125L424.676 64.4986V94H399.389V64.4986L364.94 0.181815Z"
                        fill="currentColor"
                      />
                      <path
                        d="M117.74 0.181815V94H92.2695V0.181815H117.74Z"
                        fill="#FF0000"
                      />
                      <path
                        d="M155.281 0.181815V94H129.811V0.181815H155.281Z"
                        fill="#00FF00"
                      />
                      <path
                        d="M192.822 0.181815V94H167.352V0.181815H192.822Z"
                        fill="#0000FF"
                      />
                    </g>
                  </svg>
                </div>
              </div>
            </Link>
          </div>
          <div className="flex items-center text-base leading-5">
            <div className="hidden sm:block">
              <Link
                href="/admin"
                className="p-1 font-medium text-gray-900 dark:text-gray-100 sm:p-4"
              >
                {t("myPosts")}
              </Link>
              {username && (
                <a
                  onClick={signOut}
                  role="menuitem"
                  className="cursor-pointer p-1 font-medium text-gray-900 dark:text-gray-100 sm:p-4"
                >
                  <>{t("signOut")}</>
                </a>
              )}
            </div>
            <ThemeSwitch />
            <MobileNav />
          </div>
        </header>
        <main className="mb-auto">{children}</main>
        <Footer />
      </div>
    </SectionContainer>
  );
};

export default LayoutWrapper;
