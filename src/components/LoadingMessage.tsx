import { useTranslation } from "react-i18next";
import Message from "./Message";

export const LoadingMessage = () => {
  const { t } = useTranslation();
  return <Message><>{t("loading")}</></Message>;
};
