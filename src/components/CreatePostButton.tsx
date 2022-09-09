import Link from "next/link";
import { useTranslation } from "react-i18next";

const CreatePostButton = ({ href }) => {
  return <Large href={href} />;
};

const Large = ({ href }) => {
  const { t } = useTranslation();

  return (
    <Link href={href}>
      <a className="transition-color mx-auto flex cursor-pointer flex-row items-center rounded-md bg-black px-6 py-3 text-lg font-medium text-white no-underline shadow-md duration-500 hover:bg-white hover:text-black focus:outline-none lg:mx-0">
        <>
          {t("createAPost")}
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="ml-2 h-5 w-5"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fillRule="evenodd"
              d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z"
              clipRule="evenodd"
            />
          </svg>
        </>
      </a>
    </Link>
  );
};

const Small = ({ href }) => {
  const { t } = useTranslation();

  return (
    <Link href={href}>
      <a className="inline-flex items-center justify-center rounded-md border border-transparent bg-black px-4 py-2 text-sm font-medium text-white no-underline shadow-md duration-500 hover:bg-white hover:text-black focus:outline-none sm:w-auto">
        <>{t("createAPost")}</>
      </a>
    </Link>
  );
};

CreatePostButton.Large = Large;
CreatePostButton.Small = Small;

export default CreatePostButton;
