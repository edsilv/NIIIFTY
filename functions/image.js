import resizeImage from "./resizeImage.js";
import { createImageIIIFDerivatives } from "./iiif.js";
import generateThumbnails from "./thumbnails.js";

export default async function processImage(image, metadata) {
  console.log(`--- started processing image ${image.name} ---`);

  // optimised at 80% compression
  await resizeImage(image, "optimized", null, null);

  await generateThumbnails(image);

  // generate IIIF manifest and image tiles
  await createImageIIIFDerivatives(image, metadata);

  console.log(`--- finished processing image ${image.name} ---`);

  return {};
}
