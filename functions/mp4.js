import ffmpeg from "fluent-ffmpeg";
import ffmpeg_static from "ffmpeg-static";
import path from "path";
import ffprobe from "ffprobe";
import ffprobeStatic from "ffprobe-static";
import generateThumbnails from "./thumbnails.js";
import { createTempDir, deleteDir, deleteFile, createDir } from "./fs.js";
import { createMP4IIIFDerivatives } from "./iiif.js";
import { uploadFilesToWeb3Storage } from "./web3Storage.js";
import { uploadFilesToGCS } from "./gcs.js";

export default async function processMP4(mp4, metadata) {
  console.log(`--- started processing mp4 ${mp4.name} ---`);

  const tempDir = createTempDir();
  const gcsDir = path.dirname(mp4.name);

  const mp4FilePath = path.join(tempDir, "optimized.mp4");

  await mp4.download({ destination: mp4FilePath });
  console.log("mp4 downloaded to", mp4FilePath);

  await generateThumbs(mp4FilePath);
  console.log("mp4 thumbnails generated");

  const duration = await getDuration(mp4FilePath);
  console.log("mp4 duration", duration);

  await generateStreamingFormats(mp4FilePath);
  console.log("mp4 streaming formats generated");

  // set the duration on metadata (this will be updated in the db when processing completes)
  metadata.duration = duration;

  // generate IIIF manifest
  await createMP4IIIFDerivatives(mp4, metadata, tempDir);

  // upload the generated files to GCS
  await uploadFilesToGCS(tempDir, gcsDir);

  // upload the generated files to web3.storage
  await uploadFilesToWeb3Storage(tempDir);

  // Once the video has been processed, delete the temp directory.
  deleteDir(tempDir);

  console.log(`--- finished processing mp4 ${mp4.name} ---`);

  return { duration };
}

function promisifyCommand(command) {
  return new Promise((resolve, reject) => {
    command.on("end", resolve).on("error", reject).run();
  });
}

async function generateThumbs(mp4) {
  const frameFilePath = path.join(path.dirname(mp4), "frame.jpg");

  // const targetStorageFrameFilePath = path.join(targetDirectory, "frame.jpg");

  const command = ffmpeg(mp4)
    .setFfmpegPath(ffmpeg_static)
    .seekInput("00:00:01") // seek to 1 second into the video
    .frames(1) // extract only one frame
    // .outputOptions("-vf", "scale=320:-1") // resize the frame to a width of 320 pixels
    .output(frameFilePath);

  await promisifyCommand(command);

  console.log("frame created at", frameFilePath);

  await generateThumbnails(frameFilePath);

  // delete the temp frame file.
  deleteFile(frameFilePath);

  // Upload the frame.
  // await gcsBucket.upload(targetTempFrameFilePath, {
  //   destination: targetStorageFrameFilePath,
  // });

  // console.log("frame uploaded to", targetStorageFrameFilePath);

  // // resize image
  // const frameFile = gcsBucket.file(targetStorageFrameFilePath);
  // await generateThumbnails(frameFile);

  // // Once the thumbnails have been uploaded delete the temp files to free up disk space.
  // fs.unlinkSync(targetTempFrameFilePath);
  // frameFile.delete();
}

async function getDuration(mp4) {
  const info = await ffprobe(mp4, {
    path: ffprobeStatic.path,
  });

  if (info && info.streams && info.streams.length) {
    return Number(info.streams[0].duration);
  } else {
    throw new Error("couldn't retrieve video duration");
  }
}

async function generateStreamingFormats(mp4) {
  const dir = path.dirname(mp4);

  // Define output file paths
  const dashDir = path.join(dir, "dash");
  createDir(dashDir);

  const hlsDir = path.join(dir, "hls");
  createDir(hlsDir);

  // Define output file paths
  const dashFilePath = path.join(dashDir, "optimized.mpd");
  const hlsFilePath = path.join(hlsDir, "optimized.m3u8");

  const dashCommand = ffmpeg(mp4)
    .videoCodec("libx264")
    .audioCodec("aac")
    .audioBitrate("64k")
    .videoBitrate("550k")
    // .addOption("-max_muxing_queue_size", "1024")
    .addOption("-preset", "veryfast")
    .addOption("-profile:v", "main")
    .format("dash")
    .output(dashFilePath);

  await promisifyCommand(dashCommand);
  console.log("dash created at", dashFilePath);

  const hlsCommand = ffmpeg(mp4)
    .videoCodec("libx264")
    .audioCodec("aac")
    .audioBitrate("64k")
    .videoBitrate("550k")
    // .addOption("-max_muxing_queue_size", "1024")
    .addOption("-preset", "veryfast")
    .addOption("-profile:v", "main")
    .format("hls")
    .output(hlsFilePath);

  await promisifyCommand(hlsCommand);
  console.log("hls created at", hlsFilePath);
}
