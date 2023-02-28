import ffmpeg from "fluent-ffmpeg";
import ffmpeg_static from "ffmpeg-static";
import sharp from "sharp";
import { THUMB_WIDTH } from "./constants.js";
import gcsBucket from "./gcsBucket.js";
import path from "path";
import os from "os";
import fs from "fs";

function promisifyCommand(command) {
  return new Promise((resolve, reject) => {
    command.on("end", resolve).on("error", reject).run();
  });
}

export default async function generateMP4Thumbnail(mp4) {
  const filePath = mp4.name; // File path in the bucket.
  const fileName = path.basename(filePath);
  // Download file from bucket.
  const tempFilePath = path.join(os.tmpdir(), fileName);
  // We add a '_output.flac' suffix to target audio file name. That's where we'll upload the converted audio.
  const targetTempFileName =
    fileName.replace(/\.[^/.]+$/, "") + "_optimized.mp4";
  const targetTempFilePath = path.join(os.tmpdir(), targetTempFileName);
  const targetStorageFilePath = path.join(
    path.dirname(filePath),
    targetTempFileName
  );

  await gcsBucket.file(filePath).download({ destination: tempFilePath });

  console.log("video downloaded locally to", tempFilePath);

  const command = ffmpeg(tempFilePath)
    .setFfmpegPath(ffmpeg_static)
    .format("mp4")
    .output(targetTempFilePath);

  await promisifyCommand(command);

  console.log("Output mp4 created at", targetTempFilePath);

  // Uploading the mp4.
  await gcsBucket.upload(targetTempFilePath, {
    destination: targetStorageFilePath,
  });

  console.log("Output mp4 uploaded to", targetStorageFilePath);

  // Once the audio has been uploaded delete the local file to free up disk space.
  fs.unlinkSync(tempFilePath);
  fs.unlinkSync(targetTempFilePath);

  return console.log("Temporary files removed.", targetTempFilePath);
}

export async function _generateMP4Thumbnail(mp4) {
  const filePath = mp4.name;
  // const fileName = path.basename(filePath);
  // const tempFilePath = path.join(os.tmpdir(), fileName);

  const mp4File = gcsBucket.file(filePath);
  const outputFileName = path.join(path.dirname(filePath), "thumb.jpg");
  // const outputFileName = `${fileName.split(".mp4")[0]}-thumbnail.jpg`;
  const outputFile = gcsBucket.file(outputFileName);

  // const inputOptions = { seek: "00:00:01" };
  // const outputOptions = { endOffset: 1, format: "jpeg" };

  const inputOptions = ["-ss", "00:00:01"];
  const outputOptions = ["-vframes", "1", "-f", "image2"];

  const ffmpegCommand = ffmpeg(mp4File.createReadStream())
    .setFfmpegPath(ffmpeg_static)
    .inputOptions(inputOptions)
    .outputOptions(outputOptions)
    .output(
      // outputFileName
      //outputFile.createWriteStream({ resumable: false, validation: false })
      outputFile.createWriteStream()
    );

  return new Promise((resolve, reject) => {
    ffmpegCommand
      .on("end", () => {
        console.log(`Thumbnail saved to ${outputFileName}`);
        resolve();
      })
      .on("error", (err, stdout, stderr) => {
        console.error(`Error generating thumbnail: ${err.message}`);
        console.error(`stdout: ${stdout}`);
        console.error(`stderr: ${stderr}`);
        reject();
      });

    ffmpegCommand.run();

    // ffmpeg()
    //   .input(mp4File.createReadStream())
    //   .seekInput("00:00:01") // seek to 1 second into the video
    //   .frames(1) // extract only one frame
    //   .outputOptions("-vf", "scale=320:-1") // resize the frame to a width of 320 pixels
    //   .output(outputFile.createWriteStream())
    //   .on("end", async () => {
    //     const [thumbnailFile] = await outputFile.get();
    //     const thumbnailBuffer = await thumbnailFile.download();
    //     const thumbnail = sharp(thumbnailBuffer);
    //     thumbnail
    //       .resize({
    //         THUMB_WIDTH,
    //         THUMB_WIDTH,
    //         fit: sharp.fit.cover,
    //         format: "jpeg",
    //         quality: 80,
    //       })
    //       .toBuffer((err, data) => {
    //         if (err) {
    //           console.log(err);
    //           reject();
    //         }
    //         outputFile
    //           .save(data, { metadata: { contentType: "image/jpeg" } })
    //           .then(() => {
    //             console.log(`Thumbnail saved to ${outputFileName}`);
    //             resolve();
    //           })
    //           .catch((err) => {
    //             console.log(`Error saving thumbnail: ${err}`);
    //             reject();
    //           });
    //       });
    //   })
    //   .run();
  });
}
