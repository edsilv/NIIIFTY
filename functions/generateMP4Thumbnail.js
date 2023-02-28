import ffmpeg from "fluent-ffmpeg";
import sharp from "sharp";
import { THUMB_WIDTH } from "./constants.js";
import gcsBucket from "./gcsBucket.js";

export default async function generateMP4Thumbnail(mp4) {
  const fileName = mp4.name;
  const mp4File = gcsBucket.file(fileName);

  // const outputFileName = path.join(path.dirname(fileName), `${name}.jpg`);
  const outputFileName = `${fileName.split(".mp4")[0]}-thumbnail.jpg`;
  const outputFile = gcsBucket.file(outputFileName);

  const inputOptions = { seek: "00:00:01" };
  const outputOptions = { endOffset: 1, format: "jpeg" };

  const ffmpegCommand = ffmpeg(mp4File.createReadStream())
    .inputOptions(inputOptions)
    .outputOptions(outputOptions)
    .output(
      outputFile.createWriteStream({ resumable: false, validation: false })
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
