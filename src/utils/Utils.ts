import { default as slug } from "slugify";
import crypto from "crypto";
import { SavedFile } from "./Types";
import config from "../../niiifty.config";

// stackoverflow.com/questions/1322732/convert-seconds-to-hh-mm-ss-with-javascript
export const toHHMMSS = (seconds: number) => {
  // console.log("seconds", seconds);
  return new Date(seconds * 1000).toISOString().substr(11, 8);
};

export const fileToJson = (file: SavedFile) => {
  return {
    ...file,
    created: file.created?.toMillis() || 0,
    modified: file.modified?.toMillis() || 0,
  };
};

export const capitalizeFirstLetter = (string) => {
  return string.charAt(0).toUpperCase() + string.slice(1);
};

export const slugify = (title: string): string => {
  return slug(title, {
    replacement: "-", // replace spaces with replacement character, defaults to `-`
    remove: undefined, // remove characters that match regex, defaults to `undefined`
    lower: true, // convert to lower case, defaults to `false`
    strict: true, // strip special characters except replacement, defaults to `false`
    locale: "en", // language code of the locale to use
    trim: true, // trim leading and trailing replacement chars, defaults to `true`
  });
};

// crypto module doesn't work in middleware yet https://github.com/frontegg/frontegg-nextjs/issues/95
export const hash = (value: string) => {
  return crypto.createHash("sha1").update(value).digest("hex");
};

// https://stackoverflow.com/questions/7616461/generate-a-hash-from-string-in-javascript/34842797#34842797
export const hash2 = (value: string) => {
  return value.split('').reduce((prevHash, currVal) =>
    (((prevHash << 5) - prevHash) + currVal.charCodeAt(0)) | 0, 0);
};

export const getFileUrl = (name: string) => {
  // name example: BgV2gRaOStRzwc6uMTZu/original.jpeg
  const firebaseConfig = config.environments[config.environment].firebaseConfig;
  return `https://${firebaseConfig.storageBucket}.storage.googleapis.com/${name}`;
};

export const getThumbnailUrl = (id: string) => {
  return getFileUrl(`${id}/thumb.jpg`);
};

export const copyText = (text: string) => {
  const textArea = document.createElement("textarea");
  textArea.value = text;
  document.body.appendChild(textArea);
  textArea.focus();
  textArea.select();
  document.execCommand("copy");
  document.body.removeChild(textArea);
};