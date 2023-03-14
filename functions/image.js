import resizeImage from "./resizeImage.js";
import { createImageIIIFDerivatives } from "./iiif.js";
import createThumbnails from "./thumbnails.js";
import { createTempDir, deleteDir } from "./fs.js";
import path from "path";
import { uploadTempFilesToWeb3Storage } from "./web3Storage.js";
import { uploadFilesToGCS } from "./gcs.js";

export default async function processImage(image, metadata) {
  console.log(`--- started processing image ${image.name} ---`);

  const tempDir = createTempDir();

  const imageFilePath = path.join(tempDir, path.basename(image.name));

  await image.download({ destination: imageFilePath });
  console.log("image downloaded to", imageFilePath);

  // optimised at 80% compression
  await resizeImage(imageFilePath, "optimized", null, null);

  await createThumbnails(imageFilePath);

  // generate IIIF manifest and image tiles
  await createImageIIIFDerivatives(imageFilePath, metadata);

  // upload the generated files to GCS
  await uploadFilesToGCS(tempDir, metadata.fileId);

  // upload the generated files to web3.storage
  const cid = await uploadTempFilesToWeb3Storage(tempDir);

  // Once the image has been processed, delete the temp directory.
  deleteDir(tempDir);

  console.log(`--- finished processing image ${image.name} ---`);

  return { cid };
}
