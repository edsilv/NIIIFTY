import React, { useEffect, useRef } from "react";
// @ts-ignore
import classNames from "classnames";
import { Button } from "./FormControls";
import { useLocalStorage } from "react-use";

const CookiesPolicy = ({ classes }: { classes?: string | undefined }) => {
  const ref = useRef<HTMLDivElement>();
  const [cookiesAccepted, setCookiesAccepted] = useLocalStorage(
    "cookiesAccepted",
    false
  );
  const c = classNames(
    "fixed bottom-0 flex w-full text-gray-900 bg-white text-base p-2",
    classes
  );

  useEffect(() => {
    if (cookiesAccepted) {
      ref.current.classList.add("hidden");
    }
  }, [cookiesAccepted]);

  return (
    <div ref={ref} className={c} role="alert">
      <div className="w-8/12">
        <p className="py-4 px-2 text-sm lg:py-6 lg:px-4 lg:text-base">
          We use cookies to help give you the best experience on our website.
          Please read our <a href="/docs/cookies-policy">Cookies&nbsp;policy</a>{" "}
          to find out more.
        </p>
      </div>
      <div className="w-4/12">
        <Button
          text="Dismiss"
          classes="float-right m-4"
          onClick={() => {
            setCookiesAccepted(true);
          }}
        />
      </div>
    </div>
  );
};

export default CookiesPolicy;
