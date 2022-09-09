import "@fontsource/inter/variable-full.css";
import "../css/main.css";
import "../../i18n";
import type { AppProps } from "next/app";
import Head from "next/head";
import { UserContext } from "../utils/UserContext";
import { useUserData } from "../hooks/useUserData";
import { ThemeProvider } from "next-themes";
import LayoutWrapper from "@/components/LayoutWrapper";
import { theme } from "@/utils/Config";

function MyApp({ Component, pageProps }: AppProps) {
  const userData = useUserData();
  return (
    <ThemeProvider attribute="class" defaultTheme={theme}>
      <UserContext.Provider value={userData}>
        <Head>
          <meta content="width=device-width, initial-scale=1" name="viewport" />
        </Head>
        <LayoutWrapper>
          <Component {...pageProps} />
        </LayoutWrapper>
      </UserContext.Provider>
    </ThemeProvider>
  );
}

export default MyApp;
