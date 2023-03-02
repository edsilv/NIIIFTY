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

async function generateThumbnail(downloadedTempMP4FilePath, targetDirectory) {
  const uniqueId = path.basename(downloadedTempMP4FilePath, ".mp4");
  const tempThumbFileName = `${uniqueId}.jpg`;
  const targetTempThumbFilePath = path.join(os.tmpdir(), tempThumbFileName);
  const targetStorageThumbFilePath = path.join(targetDirectory, "thumb.jpg");

  const command = ffmpeg(downloadedTempMP4FilePath)
    .setFfmpegPath(ffmpeg_static)
    .seekInput("00:00:01") // seek to 1 second into the video
    .frames(1) // extract only one frame
    // .outputOptions("-vf", "scale=320:-1") // resize the frame to a width of 320 pixels
    .output(targetTempThumbFilePath);

  await promisifyCommand(command);

  console.log("thumbnail created at", targetTempThumbFilePath);

  // Upload the thumbnail.
  await gcsBucket.upload(targetTempThumbFilePath, {
    destination: targetStorageThumbFilePath,
  });

  console.log("thumbnail uploaded to", targetStorageThumbFilePath);

  // resize image
  const thumbnailFile = gcsBucket.file(targetStorageThumbFilePath);
  await resizeImage(thumbnailFile, "thumb", THUMB_WIDTH, THUMB_WIDTH);

  console.log("thumbnail resized");

  // Once the thumbnail has been uploaded delete the local file to free up disk space.
  fs.unlinkSync(targetTempThumbFilePath);
}

async function getDuration(downloadedTempMP4FilePath) {
  const info = await ffprobe(downloadedTempMP4FilePath, {
    path: ffprobeStatic.path,
  });

  if (info && info.streams && info.streams.length) {
    return Number(info.streams[0].duration);
  } else {
    throw new Error("couldn't retrieve video duration");
  }
}

async function generateStreamingFormats(
  downloadedTempMP4FilePath,
  targetDirectory
) {
  const uniqueId = path.basename(downloadedTempMP4FilePath, ".mp4");

  // Define output folder
  const tempOutputFolder = path.dirname(downloadedTempMP4FilePath);

  // Define output file names
  const targetTempDashFileName = `${uniqueId}.mpd`;
  const targetTempHLSFileName = `${uniqueId}.m3u8`;

  // Define output file paths
  const targetTempDashFilePath = path.join(
    tempOutputFolder,
    targetTempDashFileName
  );
  const targetTempHLSFilePath = path.join(
    tempOutputFolder,
    targetTempHLSFileName
  );

  // Define upload file paths
  const targetStorageDashFilePath = path.join(targetDirectory, "optimized.mpd");
  const targetStorageHLSFilePath = path.join(targetDirectory, "optimized.m3u8");

  const dashCommand = ffmpeg(downloadedTempMP4FilePath)
    .videoCodec("libx264")
    .audioCodec("aac")
    .audioBitrate("64k")
    .videoBitrate("550k")
    .addOption("-max_muxing_queue_size", "1024")
    .addOption("-preset", "veryfast")
    .addOption("-profile:v", "main")
    .format("dash")
    .output(targetTempDashFilePath);

  await promisifyCommand(dashCommand);
  console.log("dash created at", targetTempDashFilePath);

  // Upload the dash.
  // await gcsBucket.upload(targetTempDashFilePath, {
  //   destination: targetStorageDashFilePath,
  // });

  // console.log("Dash uploaded to", targetStorageDashFilePath);

  const hlsCommand = ffmpeg(downloadedTempMP4FilePath)
    .videoCodec("libx264")
    .audioCodec("aac")
    .audioBitrate("64k")
    .videoBitrate("550k")
    .addOption("-max_muxing_queue_size", "1024")
    .addOption("-preset", "veryfast")
    .addOption("-profile:v", "main")
    .format("hls")
    .output(targetTempHLSFilePath);

  await promisifyCommand(hlsCommand);
  console.log("hls created at", targetTempHLSFilePath);

  // Upload the HLS.
  // await gcsBucket.upload(targetTempHLSFilePath, {
  //   destination: targetStorageHLSFilePath,
  // });

  // console.log("HLS uploaded to", targetStorageHLSFilePath);

  fs.readdir(tempOutputFolder, (err, files) => {
    if (err) {
      console.error(err);
    } else {
      console.log("Files", files);
    }
  });
}

export default async function downloadAndProcessMP4(mp4) {
  const uniqueId = Date.now();
  const downloadedTempMP4FilePath = path.join(os.tmpdir(), `${uniqueId}.mp4`);

  await mp4.download({ destination: downloadedTempMP4FilePath });
  console.log("video downloaded locally to", downloadedTempMP4FilePath);

  await generateThumbnail(downloadedTempMP4FilePath, path.dirname(mp4.name));
  console.log("mp4 thumbnail generated");

  const duration = await getDuration(downloadedTempMP4FilePath);
  console.log("mp4 duration", duration);

  await generateStreamingFormats(
    downloadedTempMP4FilePath,
    path.dirname(mp4.name)
  );
  console.log("mp4 streaming formats generated");

  // Once the video has been processed, delete the temp files to free up disk space.
  fs.unlinkSync(downloadedTempMP4FilePath);

  return { duration };
}
