import path from "path";
import sharp from "sharp";
import fs from "fs";

export default async function resizeImage(imageFilePath, name, width, height) {
  const readStream = fs.createReadStream(imageFilePath);
  const writeStream = fs.createWriteStream(
    path.join(path.dirname(imageFilePath), `${name}.jpg`)
  );

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
    .pipe(writeStream);

  readStream.pipe(pipeline);

  return new Promise((resolve, reject) =>
    writeStream
      .on("finish", async () => {
        resolve();
      })
      .on("error", reject)
  );

  // const imageFilePath = path.join(path.dirname(image.name), `${name}.jpg`);
  // const imageUploadStream = gcsBucket.file(imageFilePath).createWriteStream({
  //   metadata: {
  //     contentType: "image/jpeg",
  //   },
  // });
  // const file = gcsBucket.file(image.name);

  // pipeline
  //   .jpeg()
  //   .resize({
  //     width,
  //     height,
  //     fit: sharp.fit.cover,
  //     format: "jpeg",
  //     quality: 80,
  //   })
  //   .pipe(imageUploadStream);

  // file.createReadStream().pipe(pipeline);

  // return new Promise((resolve, reject) =>
  //   imageUploadStream
  //     .on("finish", async () => {
  //       resolve();
  //     })
  //     .on("error", reject)
  // );
}
