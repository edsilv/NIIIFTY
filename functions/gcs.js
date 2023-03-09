import { Storage } from "@google-cloud/storage";
import { PROJECT_ID } from "./constants.js";
import { getAllFiles } from "./fs.js";
import path from "path";

const gcs = new Storage();

export const gcsBucket = gcs.bucket(`${PROJECT_ID}.appspot.com`);

export async function uploadFilesToGCS(dirPath, gcsPath) {
  const files = getAllFiles(dirPath);

  // Loop through each file and upload it to the bucket
  for (const file of files) {
    const targetStorageFilePath = path.join(
      gcsPath,
      file.replace(`${dirPath}/`, "")
    );

    // todo, set cache control on iiif index.json
    // cacheControl: "public, max-age=60", // cache for 1 minute
    await gcsBucket.upload(file, {
      destination: targetStorageFilePath,
      metadata: {
        contentType: file.contentType,
        // cacheControl: "public, max-age=31536000",
      },
      resumable: false, // todo: can this be removed?
    });
  }
}
