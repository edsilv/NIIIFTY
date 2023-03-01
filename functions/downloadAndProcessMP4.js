import ffmpeg from "fluent-ffmpeg";
import ffmpeg_static from "ffmpeg-static";
import { THUMB_WIDTH } from "./constants.js";
import gcsBucket from "./gcsBucket.js";
import path from "path";
import os from "os";
import fs from "fs";
import resizeImage from "./resizeImage.js";
import ffprobe from "ffprobe";
import ffprobeStatic from "ffprobe-static";

function promisifyCommand(command) {
  return new Promise((resolve, reject) => {
    command.on("end", resolve).on("error", reject).run();
  });
}

export default async function downloadAndProcessMP4(mp4) {
  const uniqueId = Date.now();
  const tempFilePath = path.join(os.tmpdir(), `${uniqueId}.mp4`);
  const targetTempFileName = `${uniqueId}.jpg`;
  const targetTempFilePath = path.join(os.tmpdir(), targetTempFileName);
  const targetStorageFilePath = path.join(path.dirname(mp4.name), "thumb.jpg");

  await mp4.download({ destination: tempFilePath });

  console.log("video downloaded locally to", tempFilePath);

  const command = ffmpeg(tempFilePath)
    .setFfmpegPath(ffmpeg_static)
    .seekInput("00:00:01") // seek to 1 second into the video
    .frames(1) // extract only one frame
    // .outputOptions("-vf", "scale=320:-1") // resize the frame to a width of 320 pixels
    .output(targetTempFilePath);

  await promisifyCommand(command);

  console.log("thumbnail created at", targetTempFilePath);

  // Upload the thumbnail.
  await gcsBucket.upload(targetTempFilePath, {
    destination: targetStorageFilePath,
  });

  console.log("thumbnail uploaded to", targetStorageFilePath);

  let duration;

  const info = await ffprobe(tempFilePath, { path: ffprobeStatic.path });

  if (info && info.streams && info.streams.length) {
    duration = Number(info.streams[0].duration);
    console.log("mp4 duration", duration);
  } else {
    console.log("couldn't retrieve video duration");
  }

  // Once the thumbnail has been uploaded delete the local files to free up disk space.
  fs.unlinkSync(tempFilePath);
  fs.unlinkSync(targetTempFilePath);

  // resize image
  const thumbnailFile = gcsBucket.file(targetStorageFilePath);
  await resizeImage(thumbnailFile, "thumb", THUMB_WIDTH, THUMB_WIDTH);

  console.log("thumbnail resized");

  return { duration };
}
