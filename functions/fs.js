import os from "os";
import fs from "fs";
import path from "path";
import gcsBucket from "./gcsBucket.js";

// Recursively get a list of all files in the directory
const getAllFiles = function (dirPath, arrayOfFiles) {
  const files = fs.readdirSync(dirPath);

  arrayOfFiles = arrayOfFiles || [];

  files.forEach(function (file) {
    if (fs.statSync(path.join(dirPath, file)).isDirectory()) {
      arrayOfFiles = getAllFiles(path.join(dirPath, file), arrayOfFiles);
    } else {
      arrayOfFiles.push(path.join(dirPath, file));
    }
  });

  return arrayOfFiles;
};

export async function uploadFilesToGCS(fsPath, gcsPath) {
  const files = getAllFiles(fsPath);

  // Loop through each file and upload it to the bucket
  for (const file of files) {
    const targetStorageFilePath = path.join(
      gcsPath,
      file.replace(`${fsPath}/`, "")
    );

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

export function createTempDir() {
  const uniqueId = String(Date.now());

  // Create a temp directory where the storage file will be downloaded.
  const dir = path.join(os.tmpdir(), uniqueId);

  fs.mkdirSync(dir);

  return dir;
}

export function deleteDir(dir) {
  fs.rmSync(dir, { recursive: true });
}
