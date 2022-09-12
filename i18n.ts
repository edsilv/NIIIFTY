import i18n from "i18next";
// import LanguageDetector from "i18next-browser-languagedetector";
import { initReactI18next } from "react-i18next";

i18n
  // .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      en: {
        translations: {
          admin: "Admin",
          available: "Available",
          checking: "checking...",
          chooseAUsername: "Choose a username",
          confirmPostDeletion: 'Are you sure you want to delete "{{title}}"?',
          confirmRenameSlug:
            'Are you sure you want to change the title? This will mean that all existing links to "{{slug}}" will no longer work',
          contact: "Contact",
          createAccount: "Create Account",
          createAPost: "Create a Post",
          createPost: "Create Post",
          delete: "Delete",
          docs: "Docs",
          edit: "Edit",
          email: "hello@mnemoscene.io",
          postNotFound: "Post not found",
          postsFound: "{{val}} posts found.",
          fullName: "Full name",
          fullNameCannotBeEmpty: "Full name cannot be empty",
          help: "Help",
          iHaveReadAndAgreedToNIIIFTYs: "I have read and agreed to NIIIFTY's",
          isAvailable: '"{{val}}" is available.',
          isInvalid: '"{{val}}" is invalid.',
          isTaken: '"{{val}}" is taken, please try another.',
          loading: "Loading...",
          mnemosceneLtd: "Mnemoscene LTD",
          modified: "Modified",
          myPosts: "My Posts",
          next: "Next",
          noPostsFound: "No posts found.",
          noMorePosts: "No more posts.",
          pageNotFound: "Page not found",
          pageNotFoundMessage: "The page you are looking for does not exist.",
          pleaseEnterValue: "Please enter a value",
          pleaseLimitToChars: "Please limit to {{val, number}} characters",
          pleaseSignIn: "Please Sign In",
          preview: "Preview",
          privacyPolicy: "Privacy Policy",
          showMore: "Show More",
          signIn: "Sign in",
          signingIn: "Signing in...",
          signInWithGoogle: "Sign in with Google",
          signOut: "Sign Out",
          siteName: "NIIIFTY",
          termsOfService: "Terms of Service",
          usernameInvalid:
            "Please use 2 to 15 letters, numbers, underscores, or full stops. Underscores and full stops must not be at the start or end, or used sequentially.",
        },
      },
    },
    fallbackLng: "en",
    debug: false,

    // have a common namespace used around the full app
    ns: ["translations"],
    defaultNS: "translations",

    keySeparator: false, // we use content as keys

    interpolation: {
      escapeValue: false,
    },
  });

export default i18n;
