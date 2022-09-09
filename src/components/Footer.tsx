import { useTranslation } from "react-i18next";
import Link from "./Link";
// import { email } from "../utils/Config";
// import SocialIcon from "@/components/social-icons"

export default function Footer() {
  const { t } = useTranslation();
  return (
    <footer>
      <div className="mt-16 flex flex-col items-center">
        <div className="mb-3 flex space-x-4">
          {/* <SocialIcon
            kind="mail"
            href={`mailto:${email}`}
            size="6"
          />
          <SocialIcon kind="github" href={github} size="6" />
          <SocialIcon kind="facebook" href={facebook} size="6" />
          <SocialIcon kind="youtube" href={youtube} size="6" />
          <SocialIcon kind="linkedin" href={linkedin} size="6" />
          <SocialIcon kind="twitter" href={twitter} size="6" /> */}
        </div>
        <div className="mb-8 flex space-x-2 text-sm text-gray-500 dark:text-gray-400">
          <div>{`© ${new Date().getFullYear()}`}</div>
          <div>{t("mnemoscene")}</div>
          <div>{` • `}</div>
          <Link href="/">Home</Link>
          <span className="mr-2">|</span>
          <Link href="/docs/privacy-policy">Privacy Policy</Link>
          <span className="mr-2">|</span>
          <Link href="/docs/terms-of-service">Terms of Service</Link>
        </div>
      </div>
    </footer>
  );
}
