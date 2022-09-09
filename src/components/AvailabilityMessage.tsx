import { useTranslation } from "react-i18next";

export function AvailabilityMessage({
  item,
  exists,
  checkingExists,
  isValid,
  invalidMessage,
}: {
  item: string;
  exists: boolean;
  checkingExists: boolean;
  isValid: boolean;
  invalidMessage: string;
}) {
  const { t } = useTranslation();

  if (checkingExists) {
    return (
      <p className="mt-2 text-sm">
        <>{t("checking")}</>
      </p>
    );
  } else if (!exists && isValid) {
    return (
      <p className="mt-2 overflow-hidden text-ellipsis text-sm text-green-600">
        <>
          {t("isAvailable", {
            val: item,
          })}
        </>
      </p>
    );
  } else if (item && exists) {
    return (
      <p className="mt-2 overflow-hidden text-ellipsis text-sm text-red-700">
        <>
          {t("isTaken", {
            val: item,
          })}
        </>
      </p>
    );
  } else if (!isValid) {
    return (
      <p className="mt-2 overflow-hidden text-ellipsis text-sm text-red-700">
        {invalidMessage}
      </p>
    );
  } else {
    return <p></p>;
  }
}
