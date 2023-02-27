import path from "path";
import sharp from "sharp";
import gcsBucket from "./gcsBucket.js";

export default async function resizeImage(image, name, width, height) {
  const imageFilePath = path.join(path.dirname(image.name), `${name}.jpg`);
  const imageUploadStream = gcsBucket.file(imageFilePath).createWriteStream({
    metadata: {
      contentType: "image/jpeg",
    },
  });
  const file = gcsBucket.file(image.name);

  // Create Sharp pipeline for resizing the image and use pipe to read from bucket read stream
  const pipeline = sharp();

  pipeline
    .jpeg()
    .resize({
      width,
      height,
      fit: sharp.fit.cover,
      format: "jpeg",
      quality: 80,
    })
    .pipe(imageUploadStream);

  file.createReadStream().pipe(pipeline);

  return new Promise((resolve, reject) =>
    imageUploadStream
      .on("finish", async () => {
        resolve();
      })
      .on("error", reject)
  );
}
