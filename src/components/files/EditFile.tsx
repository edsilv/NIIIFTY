import { useContext, useReducer, useCallback, useRef, FormEvent, useState } from "react";
import { UserContext } from "@/utils/UserContext";
import Metatags from "@/components/Metatags";
import { useTranslation } from "react-i18next";
import { LoadingMessage } from "../LoadingMessage";
import { useAuthoringFile } from "@/hooks/useFile";
import { AuthoringFile, AuthoringFileAction, AuthoringFileState, License } from "@/utils/Types";
import { useMounted } from "@/hooks/useMounted";
import Alert from "../Alert";
import { AuthoringFileContext } from "@/utils/AuthoringFileContext";
import { getFileUrl } from "@/utils/Utils";
import ImageWithRetry from "../ImageWithRetry";

export function EditFile({ id }: {
  id: string;
}) {
  const { user, userAdapter } = useContext(UserContext);
  const { t } = useTranslation();

  const [_file, { update }] = useAuthoringFile(
    userAdapter!,
    id as string,
    {
      onData: (file) => {
        dispatch({
          type: "sync",
          payload: file,
        });
      },
      onError: () => {
        dispatch({ type: "error" });
      },
    }
  );

  const initialState: AuthoringFileState = {
    error: false,
    file: null,
    id: id as string,
    initialised: false,
    syncing: false,
  };

  const reducer = (
    state: AuthoringFileState,
    action: AuthoringFileAction
  ): AuthoringFileState => {
    // console.log(action.type);

    if (action.type === "reset") {
      // console.log("reset");
      return {
        ...initialState,
      };
    }

    // sync is called whenever new data is received from the server
    // don't allow any new operations until sync is complete
    // todo: is this guard definitely needed?
    if (action.type !== "error" && action.type !== "sync" && state.syncing) {
      // console.log("syncing, rejected", action.type);
      return {
        ...state,
      };
    }

    switch (action.type) {
      case "sync": {
        // console.log("sync");

        const file: AuthoringFile = action.payload;

        return {
          ...state,
          initialised: true,
          syncing: false,
          file,
        };
      }
      case "error": {
        return {
          ...state,
          error: true,
        };
      }
      default: {
        throw new Error();
      }
    }
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const [state, dispatch] = useReducer(useCallback(reducer, []), initialState);

  const isMounted = useMounted();

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    // let isValidForm = handleValidation();

    // if (isValidForm) {
    //   setButtonText(t("sending"));
    //   const res = await fetch("/api/sendgrid", {
    //     body: JSON.stringify({
    //       email: email,
    //       fullname: fullname,
    //       subject: subject,
    //       message: message,
    //     }),
    //     headers: {
    //       "Content-Type": "application/json",
    //     },
    //     method: "POST",
    //   });

    //   const { error } = await res.json();
    //   if (error) {
    //     setShowSuccessMessage(false);
    //     setShowFailureMessage(true);
    //     setButtonText(t("send"));

    //     // Reset form fields
    //     setFullname("");
    //     setEmail("");
    //     setMessage("");
    //     setSubject("");
    //     return;
    //   }
    //   setShowSuccessMessage(true);
    //   setShowFailureMessage(false);
    //   setButtonText(t("send"));
    //   // Reset form fields
    //   setFullname("");
    //   setEmail("");
    //   setMessage("");
    //   setSubject("");
    // }
  };

  if (user) {
    if (isMounted() && (id === undefined || state.error)) {
      return (
        <>
          <Alert>
            <>{t("fileNotFound")}</>
          </Alert>
        </>
      );
    }

    const licenses: License[] = [
      {
        name: "CC0 1.0 Universal (CC0 1.0) Public Domain Dedication",
        url: "https://creativecommons.org/publicdomain/zero/1.0/",
      },
      {
        name: "Attribution 4.0 International (CC BY 4.0)",
        url: "https://creativecommons.org/licenses/by/4.0/",
      },
      {
        name: "Attribution-ShareAlike 4.0 International (CC BY-SA 4.0)",
        url: "https://creativecommons.org/licenses/by-sa/4.0/",
      },
      {
        name: "Attribution-NoDerivates 4.0 International (CC BY-ND 4.0)",
        url: "https://creativecommons.org/licenses/by-nd/4.0/",
      },
      {
        name: "Attribution-NonCommercial 4.0 International (CC BY-NC 4.0)",
        url: "https://creativecommons.org/licenses/by-nc/4.0/",
      },
      {
        name: "Attribution-NonCommercial-ShareAlike 4.0 International (CC BY-NC-SA 4.0)",
        url: "https://creativecommons.org/licenses/by-nc-sa/4.0/",
      },
      {
        name: "Attribution-NonCommercial-NoDerivatives 4.0 International (CC BY-NC-ND 4.0)",
        url: "https://creativecommons.org/licenses/by-nc-nd/4.0/",
      },
    ];

    const [license, setLicense] = useState<License>(licenses[0]);

    return (
      <AuthoringFileContext.Provider value={{ state, dispatch }}>
        <Metatags
          title={`NIIIFTY | ${state.file?.title} (edit)`}
          description={state.file?.description}
        />
        {state.syncing ? (
          <LoadingMessage />
        ) : (
          state.file && (
            <form
              onSubmit={handleSubmit}
            >
              {/* thumbnail */}
              <ImageWithRetry src={getFileUrl(`${state.file.id}/thumb.jpg`)} alt={state.file.title} />
              {/* title */}
              <h1>{state.file.title}</h1>
              {/* description */}
              <p>{state.file.description}</p>
              {/* attribution */}
              <p>{state.file.attribution}</p>
              {/* license */}
              <select
                className="ml-1 text-blue-600"
                defaultValue={license.url}
                onChange={(event: React.FormEvent<HTMLSelectElement>) => {
                  const license: License = licenses[Number(event.currentTarget.value)];
                  setLicense(license);
                }}
              >
                {licenses.map((license: License, index: number) => {
                  return (
                    <option key={index} value={license.url}>
                      {license.name}
                    </option>
                  );
                })}
              </select>
            </form>
          ))}
      </AuthoringFileContext.Provider>
    );
  } else {
    return <LoadingMessage />;
  }
}
