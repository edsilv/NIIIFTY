import { useTranslation } from "react-i18next";
import Message from "./Message";

export const SigningInMessage = () => {
  const { t } = useTranslation();
  return <Message>{t("signingIn")}</Message>;
};
