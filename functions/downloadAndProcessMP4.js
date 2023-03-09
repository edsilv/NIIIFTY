import ffmpeg from "fluent-ffmpeg";
import ffmpeg_static from "ffmpeg-static";
import gcsBucket from "./gcsBucket.js";
import path from "path";
import os from "os";
import fs from "fs";
import ffprobe from "ffprobe";
import ffprobeStatic from "ffprobe-static";
import generateThumbnails from "./generateThumbnails.js";

function promisifyCommand(command) {
  return new Promise((resolve, reject) => {
    command.on("end", resolve).on("error", reject).run();
  });
}

async function generateThumbs(downloadedTempMP4FilePath, targetDirectory) {
  const targetTempFrameFilePath = path.join(
    path.dirname(downloadedTempMP4FilePath),
    "frame.jpg"
  );
  const targetStorageFrameFilePath = path.join(targetDirectory, "frame.jpg");

  const command = ffmpeg(downloadedTempMP4FilePath)
    .setFfmpegPath(ffmpeg_static)
    .seekInput("00:00:01") // seek to 1 second into the video
    .frames(1) // extract only one frame
    // .outputOptions("-vf", "scale=320:-1") // resize the frame to a width of 320 pixels
    .output(targetTempFrameFilePath);

  await promisifyCommand(command);

  console.log("frame created at", targetTempFrameFilePath);

  // Upload the frame.
  await gcsBucket.upload(targetTempFrameFilePath, {
    destination: targetStorageFrameFilePath,
  });

  console.log("frame uploaded to", targetStorageFrameFilePath);

  // resize image
  const frameFile = gcsBucket.file(targetStorageFrameFilePath);
  await generateThumbnails(frameFile);

  // Once the thumbnails have been uploaded delete the temp files to free up disk space.
  fs.unlinkSync(targetTempFrameFilePath);
  frameFile.delete();
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
  // Define output folder
  const tempOutputFolder = path.dirname(downloadedTempMP4FilePath);

  // Define output file paths
  const dashDir = path.join(tempOutputFolder, "dash");
  fs.mkdirSync(dashDir);

  const hlsDir = path.join(tempOutputFolder, "hls");
  fs.mkdirSync(hlsDir);

  // Define output file paths
  const targetTempDashFilePath = path.join(dashDir, "optimized.mpd");
  const targetTempHLSFilePath = path.join(hlsDir, "optimized.m3u8");

  const dashCommand = ffmpeg(downloadedTempMP4FilePath)
    .videoCodec("libx264")
    .audioCodec("aac")
    .audioBitrate("64k")
    .videoBitrate("550k")
    // .addOption("-max_muxing_queue_size", "1024")
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
    // .addOption("-max_muxing_queue_size", "1024")
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

  const files = getAllFiles(tempOutputFolder);

  // Loop through each file and upload it to the bucket
  for (const file of files) {
    const targetStorageFilePath = path.join(
      targetDirectory,
      file.replace(`${tempOutputFolder}/`, "")
    );

    await gcsBucket.upload(file, {
      destination: targetStorageFilePath,
      resumable: false,
    });
  }
}

export default async function downloadAndProcessMP4(mp4) {
  const uniqueId = String(Date.now());

  // Create a temp directory where the storage file will be downloaded.
  const dir = path.join(os.tmpdir(), uniqueId);

  fs.mkdirSync(dir);

  const downloadedTempMP4FilePath = path.join(dir, "optimized.mp4");

  await mp4.download({ destination: downloadedTempMP4FilePath });
  console.log("video downloaded locally to", downloadedTempMP4FilePath);

  await generateThumbs(downloadedTempMP4FilePath, path.dirname(mp4.name));
  console.log("mp4 thumbnail generated");

  const duration = await getDuration(downloadedTempMP4FilePath);
  console.log("mp4 duration", duration);

  await generateStreamingFormats(
    downloadedTempMP4FilePath,
    path.dirname(mp4.name)
  );
  console.log("mp4 streaming formats generated");

  // Once the video has been processed, delete the temp directory to free up disk space.
  fs.rmSync(path.dirname(downloadedTempMP4FilePath), { recursive: true });

  return { duration };
}
