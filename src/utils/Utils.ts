import { default as slug } from "slugify";

// stackoverflow.com/questions/1322732/convert-seconds-to-hh-mm-ss-with-javascript
export const toHHMMSS = (seconds: number) => {
  // console.log("seconds", seconds);
  return new Date(seconds * 1000).toISOString().substr(11, 8);
};

export const postToJson = (post) => {
  return {
    ...post,
    created: post.created?.toMillis() || 0,
    modified: post.modified?.toMillis() || 0,
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
