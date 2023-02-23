import { useContext, FormEvent, useState } from "react";
import { UserContext } from "@/utils/UserContext";
import Metatags from "@/components/Metatags";
import { useTranslation } from "react-i18next";
import { LoadingMessage } from "../LoadingMessage";
import { remove, useAuthoringFile } from "@/hooks/useFile";
import { AuthoringFile, LicenseURL } from "@/utils/Types";
import { useMounted } from "@/hooks/useMounted";
import Alert from "../Alert";
import { getFileUrl } from "@/utils/Utils";
import ImageWithRetry from "../ImageWithRetry";
import { ErrorMessage } from "../ErrorMessage";
import cx from "classnames";
import CopyText from "../CopyText";

type PageErrorType = "fileNotFound";

type FormErrorType = "title";

type FormErrors = {
  [key in FormErrorType]?: boolean;
};

export type License = {
  label: string;
  value: LicenseURL;
};

const licenses: License[] = [
  {
    label: "CC0 1.0 Universal (CC0 1.0) Public Domain Dedication",
    value: "https://creativecommons.org/publicdomain/zero/1.0/",
  },
  {
    label: "Attribution 4.0 International (CC BY 4.0)",
    value: "https://creativecommons.org/licenses/by/4.0/",
  },
  {
    label: "Attribution-ShareAlike 4.0 International (CC BY-SA 4.0)",
    value: "https://creativecommons.org/licenses/by-sa/4.0/",
  },
  {
    label: "Attribution-NoDerivates 4.0 International (CC BY-ND 4.0)",
    value: "https://creativecommons.org/licenses/by-nd/4.0/",
  },
  {
    label: "Attribution-NonCommercial 4.0 International (CC BY-NC 4.0)",
    value: "https://creativecommons.org/licenses/by-nc/4.0/",
  },
  {
    label:
      "Attribution-NonCommercial-ShareAlike 4.0 International (CC BY-NC-SA 4.0)",
    value: "https://creativecommons.org/licenses/by-nc-sa/4.0/",
  },
  {
    label:
      "Attribution-NonCommercial-NoDerivatives 4.0 International (CC BY-NC-ND 4.0)",
    value: "https://creativecommons.org/licenses/by-nc-nd/4.0/",
  },
];

export function EditFile({ id }: { id: string }) {
  const { user, userAdapter } = useContext(UserContext);
  const { t } = useTranslation();

  const [pageError, setPageError] = useState<PageErrorType>();
  const [formErrors, setFormErrors] = useState<FormErrors>({});
  const [title, setTitle] = useState<string>("");
  const [description, setDescription] = useState<string>("");
  const [attribution, setAttribution] = useState<string>("");
  const [license, setLicense] = useState<LicenseURL>();
  const [cid, setCid] = useState<string>("");

  const [_file, { update }] = useAuthoringFile(userAdapter!, id as string, {
    onData: (file) => {
      setTitle(file.title);
      setDescription(file.description || "");
      setAttribution(file.attribution || "");
      setLicense(file.license);
      setCid(file.cid);
    },
    onError: () => {
      setPageError("fileNotFound");
    },
  });

  const isMounted = useMounted();

  const handleValidation = () => {
    let tempErrors: FormErrors = {};
    let isValid = true;

    // https://stackoverflow.com/a/13283557
    const titleRegex = /^[\w\-\s]+$/;

    if (!titleRegex.test(title)) {
      tempErrors["title"] = true;
      isValid = false;
    }

    setFormErrors({ ...tempErrors });
    return isValid;
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    let isValidForm = handleValidation();

    if (isValidForm) {
      await update!(
        userAdapter!,
        id as string,
        {
          title,
          description,
          attribution,
          license,
        } as AuthoringFile
      );

      window.location.href = "/admin/";
    }
  };

  if (user) {
    if (isMounted() && pageError === "fileNotFound") {
      return (
        <>
          <Alert>
            <>{t("fileNotFound")}</>
          </Alert>
        </>
      );
    }

    const iiifManifest: string = getFileUrl(`${id}/iiif/index.json`);

    return (
      <>
        <Metatags
          title={`NIIIFTY | ${title} (edit)`}
          description={description}
        />
        <form onSubmit={handleSubmit} className="flex flex-col">
          {/* thumbnail */}
          <div className="w-64">
            <a href={getFileUrl(`${id}/thumb.jpg`)} target="_blank">
              <img src={getFileUrl(`${id}/thumb.jpg`)} alt={title} />
            </a>
          </div>
          {/* title */}
          <label
            htmlFor="title"
            className="mt-8 font-light text-gray-600 dark:text-white"
          >
            <>{t("title")}</>
            <span className="mt-1 ml-1 text-sm text-red-700">*</span>
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => {
              setTitle(e.target.value);
            }}
            name="title"
            maxLength={200}
            className="border-b border-gray-300 bg-transparent py-2 pl-4 font-light text-gray-600 ring-blue-500 focus:outline-none focus:ring-1 dark:border-gray-500 dark:text-white"
          />
          {formErrors?.title && (
            <ErrorMessage>
              <>{t("titleInvalid")}</>
            </ErrorMessage>
          )}
          {/* attribution */}
          <label
            htmlFor="attribution"
            className="mt-8 font-light text-gray-600 dark:text-white"
          >
            <>{t("attribution")}</>
          </label>
          <input
            type="text"
            value={attribution}
            onChange={(e) => {
              setAttribution(e.target.value);
            }}
            name="attribution"
            maxLength={200}
            className="border-b border-gray-300 bg-transparent py-2 pl-4 font-light text-gray-600 ring-blue-500 focus:outline-none focus:ring-1 dark:border-gray-500 dark:text-white"
          />
          {/* license */}
          <label
            htmlFor="license"
            className="mt-8 font-light text-gray-600 dark:text-white"
          >
            <>{t("license")}</>
          </label>
          <select
            value={license}
            className="border-b border-gray-300 bg-transparent py-2 pl-4 font-light text-gray-600 ring-blue-500 focus:outline-none focus:ring-1 dark:border-gray-500 dark:text-white"
            onChange={(event: React.FormEvent<HTMLSelectElement>) => {
              setLicense(event.currentTarget.value as LicenseURL);
            }}
          >
            {licenses.map((l: License, index: number) => {
              const { label, value } = l;
              return (
                <option key={index} value={value} className="dark:text-black">
                  {label}
                </option>
              );
            })}
          </select>

          {/* iiif manifest */}
          <label
            htmlFor="iiifManifest"
            className="mt-8 font-light text-gray-600 dark:text-white"
          >
            <>{t("iiifManifest")}</>
          </label>

          <div>
            <CopyText id="iiifManifest" text={iiifManifest} />
          </div>

          {/* cid */}
          <label
            htmlFor="cid"
            className="mt-8 font-light text-gray-600 dark:text-white"
          >
            <>{t("cid")}</>
          </label>

          <div>
            <CopyText id="cid" text={cid} />
            <a
              href={`https://${cid}.ipfs.w3s.link`}
              target="_blank"
              title={t("viewOnW3SLink")}
            >
              <svg
                className="w-6 pt-2 dark:fill-white"
                viewBox="0 0 27.2 27.18"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M13.6 27.18A13.59 13.59 0 1127.2 13.6a13.61 13.61 0 01-13.6 13.58zM13.6 2a11.59 11.59 0 1011.6 11.6A11.62 11.62 0 0013.6 2z"
                  fill="current"
                ></path>
                <path
                  d="M12.82 9.9v2.53h1.6V9.9l2.09 1.21.77-1.21-2.16-1.32 2.16-1.32-.77-1.21-2.09 1.21V4.73h-1.6v2.53l-2-1.21L10 7.26l2.2 1.32L10 9.9l.78 1.21zM18 17.79v2.52h1.56v-2.52L21.63 19l.78-1.2-2.16-1.33 2.16-1.28-.78-1.19-2.08 1.2v-2.58H18v2.56L15.9 14l-.77 1.2 2.16 1.32-2.16 1.33.77 1.15zM8.13 17.79v2.52h1.56v-2.52L11.82 19l.77-1.2-2.16-1.33 2.12-1.28-.73-1.24-2.13 1.23v-2.56H8.13v2.56L6.05 14l-.78 1.2 2.16 1.3-2.16 1.33.78 1.17z"
                  fill="current"
                ></path>
              </svg>
            </a>
          </div>

          <div className="flex flex-row items-center justify-start">
            <button
              type="submit"
              className={cx(
                "transition-color mt-8 flex flex-row items-center rounded-md bg-black px-6 py-3 text-lg font-medium text-white shadow-md duration-500 hover:bg-white hover:text-black focus:outline-none dark:bg-white dark:text-black"
              )}
            >
              <>{t("update")}</>
            </button>
            <button
              type="button"
              onClick={async () => {
                if (
                  window.confirm(
                    t("confirmFileDeletion", {
                      title: title,
                    })
                  )
                ) {
                  await remove(userAdapter, id);
                  window.location.href = "/admin/";
                }
              }}
              className={cx(
                "transition-color mt-8 ml-4 flex flex-row items-center rounded-md bg-gray-300 px-6 py-3 text-lg font-medium text-black shadow-md duration-500 hover:bg-white hover:text-black focus:outline-none dark:bg-gray-700 dark:text-white"
              )}
            >
              <>{t("delete")}</>
            </button>
          </div>
        </form>
      </>
    );
  } else {
    return <LoadingMessage />;
  }
}
