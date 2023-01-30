"use strict";

// todo: upgrade to functions v2 when out of beta
// https://firebase.google.com/docs/functions/beta/get-started
const functions = require("firebase-functions");
const { Storage } = require("@google-cloud/storage");
const { Web3Storage } = require("web3.storage");
const path = require("path");
const sharp = require("sharp");
// const unzipper = require("unzipper");
const unzip = require("unzip-stream");

const WEB3_STORAGE_API_KEY = process.env.WEB3_STORAGE_API_KEY;
const PROJECT_ID = process.env.GCP_PROJECT || process.env.GCLOUD_PROJECT;
const REGULAR_WIDTH = 1080;
const SMALL_WIDTH = 400;
const THUMB_WIDTH = 200;

const gcs = new Storage();
const gcsBucket = gcs.bucket(`${PROJECT_ID}.appspot.com`);
const web3Storage = new Web3Storage({ token: WEB3_STORAGE_API_KEY });

async function resizeImage(image, name, width, height) {
  const imageFilePath = path.join(path.dirname(image.name), `${name}.jpg`);
  const imageUploadStream = gcsBucket.file(imageFilePath).createWriteStream();

  // Create Sharp pipeline for resizing the image and use pipe to read from bucket read stream
  const pipeline = sharp();

  pipeline
    .resize({
      width,
      height,
      fit: sharp.fit.cover,
      format: "jpeg",
      quality: 80,
    })
    .pipe(imageUploadStream);

  gcsBucket.file(image.name).createReadStream().pipe(pipeline);

  return new Promise((resolve, reject) =>
    imageUploadStream.on("finish", resolve).on("error", reject)
  );
}

async function generateIIIFImageTiles(image) {
  const zipPath = path.join(path.dirname(image.name), "iiif.zip");
  const imageTilesWriteStream = gcsBucket.file(zipPath).createWriteStream();

  // Create Sharp pipeline for resizing the image and use pipe to read from bucket read stream

  // await sharp(image, {
  //   limitInputPixels: true,
  // })
  //   .tile({
  //     layout: "iiif",
  //     id: "someid", // urljoin(url, directoryName),
  //   })
  //   .toFile(imageUploadStream);

  const pipeline = sharp();

  pipeline
    .tile({
      layout: "iiif3",
      id: "someid", //urljoin(url, directoryName),
    })
    .pipe(imageTilesWriteStream);

  return new Promise((resolve, reject) =>
    // pipe image to sharp pipeline
    gcsBucket
      .file(image.name)
      .createReadStream()
      .pipe(pipeline)
      .pipe(unzip.Parse())
      .on("entry", (entry) => {
        console.log("entry", entry.path);

        const entryDestPath = path.join(path.dirname(image.name), entry.path);
        const entryDestFile = gcsBucket.file(entryDestPath);

        entry
          .pipe(entryDestFile.createWriteStream())
          .on("error", (err) => {
            console.log("Error", err);
            reject();
          })
          .on("finish", () => {
            console.log(`Finished extracting entry to ${entryDestPath}`);
            // todo, delete zip file
            resolve();
          });
      })
  );

  // pipeline
  //   .tile({
  //     layout: "iiif3",
  //     id: "someid", //urljoin(url, directoryName),
  //   })
  //   .pipe(imageTilesWriteStream)
  //   .pipe(unzip.Parse())
  //   .on("entry", (entry) => {
  //     console.log("entry", entry.path);

  //     const entryDestPath = path.join(path.dirname(image.name), entry.path);
  //     const entryDestFile = gcsBucket.file(entryDestPath);

  //     entry
  //       .pipe(entryDestFile.createWriteStream())
  //       .on("error", (err) => {
  //         console.log("Error", err);
  //       })
  //       .on("finish", () => {
  //         console.log(`Finished extracting entry to ${destination}`);
  //       });
  //   });

  // // send original image to pipeline
  // const file = gcsBucket.file(image.name);
  // file.createReadStream().pipe(pipeline);

  // return new Promise((resolve, reject) => {
  //   imageTilesWriteStream
  //     .on("finish", async () => {
  //       // await file.delete();
  //       resolve();
  //     })
  //     .on("error", reject);
  // });
}

// this works, but is triggered for every tile that's added
// exports.unzip = functions
//   .runWith({
//     timeoutSeconds: 540,
//     memory: "2GB",
//   })
//   .storage.object()
//   .onFinalize(async (object) => {
//     console.log("----------------------- unzip -----------------------");

//     if (
//       object.contentType !== "application/zip" &&
//       object.contentType !== "application/x-zip-compressed"
//     ) {
//       console.log("Not a zip file.", object.contentType);
//       return;
//     }

//     const file = gcsBucket.file(object.name);
//     //const remoteDir = object.name.replace(".zip", "");

//     console.log(`Downloading ${file.path}`);

//     await file
//       .createReadStream()
//       .on("error", (err) => {
//         console.error("createReadStream Error", err);
//         return;
//       })
//       .on("end", () => {
//         // The file is fully downloaded.
//         console.log("Finished downloading.");
//       })
//       .pipe(unzip.Parse())
//       .on("entry", (entry) => {
//         const destination = gcsBucket.file(
//           `${file.name.replace(".", "_")}/${entry.path}`
//         );

//         entry
//           .pipe(destination.createWriteStream())
//           .on("error", (err) => {
//             console.log("Error", err);
//           })
//           .on("finish", () => {
//             console.log(`Finished extracting ${destination.path}`);
//           });
//       });

//     await file.delete();
//   });

// https://stackoverflow.com/a/59454505
// https://leolabs.org/blog/firebase-cloud-functions-unzip-files
// exports.unzip = functions
//   .runWith({
//     timeoutSeconds: 540,
//     memory: "2GB",
//   })
//   .storage.object()
//   .onFinalize(async (object) => {
//     //console.log(object)
//     if (
//       object.contentType !== "application/zip" &&
//       object.contentType !== "application/x-zip-compressed"
//     ) {
//       console.log("Not a zip file.", object.contentType);
//       return;
//     }

//     const file = gcsBucket.file(object.name);
//     //const remoteDir = object.name.replace(".zip", "");

//     console.log(`Downloading ${file}`);

//     await file
//       .createReadStream()
//       .on("error", (err) => {
//         console.error("Error", err);
//         return;
//       })
//       .on("end", () => {
//         // The file is fully downloaded.
//         console.log("Finished downloading.");
//       })
//       .pipe(unzipper.Parse())
//       .on("entry", (entry) => {
//         const destination = gcsBucket.file(
//           `${file.name.replace(".", "_")}/${entry.path}`
//         );

//         entry
//           .pipe(destination.createWriteStream())
//           .on("error", (err) => {
//             console.log("Error", err);
//           })
//           .on("finish", () => {
//             console.log(`Finsihed extracting ${destination.path}`);
//           });
//       })
//       .promise();

//     await file.delete();
//   });

async function addToWeb3Storage(file) {
  const cid = await web3Storage.put([
    {
      name: file.name.split("/").pop(),
      stream: () => gcsBucket.file(file.name).createReadStream(),
    },
  ]);

  return cid;
}

async function processImage(originalFile) {
  // for image derivatives, use the same image set as unsplash, which makes the following available via their api:

  // raw (the original image)
  // "https://images.unsplash.com/photo-1565651454302-e263192bad3a?ixid=MnwzODk0NTh8MHwxfHNlYXJjaHwxMHx8b3V0ZG9vcnN8ZW58MHwyfHx8MTY3MTAzMTAzNg&ixlib=rb-4.0.3"

  // full (the raw image but optimised at 80% compression)
  // "https://images.unsplash.com/photo-1565651454302-e263192bad3a?crop=entropy&cs=tinysrgb&fm=jpg&ixid=MnwzODk0NTh8MHwxfHNlYXJjaHwxMHx8b3V0ZG9vcnN8ZW58MHwyfHx8MTY3MTAzMTAzNg&ixlib=rb-4.0.3&q=80"
  await resizeImage(originalFile, "full", null, null);

  // regular (width 1080px, 80% compression)
  // "https://images.unsplash.com/photo-1565651454302-e263192bad3a?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=MnwzODk0NTh8MHwxfHNlYXJjaHwxMHx8b3V0ZG9vcnN8ZW58MHwyfHx8MTY3MTAzMTAzNg&ixlib=rb-4.0.3&q=80&w=1080"
  await resizeImage(originalFile, "regular", REGULAR_WIDTH, null);

  // small (width 400px, 80% compression)
  // "https://images.unsplash.com/photo-1565651454302-e263192bad3a?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=MnwzODk0NTh8MHwxfHNlYXJjaHwxMHx8b3V0ZG9vcnN8ZW58MHwyfHx8MTY3MTAzMTAzNg&ixlib=rb-4.0.3&q=80&w=400"
  await resizeImage(originalFile, "small", SMALL_WIDTH, null);

  // thumb (width 200px, 80% compression)
  // "https://images.unsplash.com/photo-1565651454302-e263192bad3a?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=MnwzODk0NTh8MHwxfHNlYXJjaHwxMHx8b3V0ZG9vcnN8ZW58MHwyfHx8MTY3MTAzMTAzNg&ixlib=rb-4.0.3&q=80&w=200"
  await resizeImage(originalFile, "thumb", THUMB_WIDTH, THUMB_WIDTH);

  // generate IIIF image tiles
  await generateIIIFImageTiles(originalFile);

  // add the original file to web3.storage
  const cid = await addToWeb3Storage(originalFile);

  return { cid };
}

// when a file is created in firestore,
// generate derivatives, and replicate to web3.storage
exports.fileCreated = functions
  .region("europe-west3")
  .runWith({
    timeoutSeconds: 300,
    memory: "1GB",
  })
  .firestore.document("files/{fileId}")
  .onCreate(async (snap, context) => {
    const fileId = context.params.fileId;
    // get a reference to the uploaded original.[png, jpg, tif, tiff, mp3, mp4, glb] file
    const [files] = await gcsBucket.getFiles({ prefix: `${fileId}/original` });

    let processedProps;

    if (files.length) {
      const originalFile = files[0];

      const file = snap.data();

      switch (file.type) {
        case "image/png":
        case "image/jpeg":
        case "image/tif":
        case "image/tiff":
          // process image
          processedProps = await processImage(originalFile);
          break;
        case "audio/mpeg":
          // process audio
          break;
        case "video/mp4":
          // process video
          break;
        case "model/gltf-binary":
          // process gltf
          break;
        default:
          // reject
          throw new Error("Unsupported file type", mimeType);
      }

      // update firestore record
      return snap.ref.set(
        {
          ...processedProps,
          processed: true,
        },
        { merge: true }
      );
    }
  });

exports.fileDeleted = functions
  .region("europe-west3")
  .runWith({
    timeoutSeconds: 300,
    memory: "1GB",
  })
  .firestore.document("files/{fileId}")
  .onDelete(async (_snap, context) => {
    const fileId = context.params.fileId;

    // https://googleapis.dev/nodejs/storage/latest/Bucket.html#deleteFiles
    gcsBucket.deleteFiles({
      prefix: `${fileId}`,
    });
  });

/**
 * When a file is uploaded in the Storage bucket we generate a thumbnail automatically using
 * Sharp.
 */
// exports.generateThumbnail = functions.region('europe-west3')
// 	.storage.object().onFinalize((object) => {
// 		const fileBucket = object.bucket; // The Storage bucket that contains the file.
// 		const filePath = object.name; // File path in the bucket.
// 		const contentType = object.contentType; // File content type.
// 		const downloadtoken = object.metadata ? object.metadata.firebaseStorageDownloadTokens : undefined; // Access token

// 		// todo: handle mp4, glb

// 		// Exit if this is triggered on a file that is not an image.
// 		if (!contentType.startsWith('image/')) {
// 			functions.logger.log('rejecting: this is not an image.');
// 			return null;
// 		}

// 		// Get the file name.
// 		const fileName = path.basename(filePath);
// 		// Exit if the image is already a thumbnail.
// 		if (fileName.startsWith('thumb')) {
// 			functions.logger.log('rejecting: already a thumbnail.');
// 			return null;
// 		}

// 		// Download file from bucket.
// 		const bucket = gcs.bucket(fileBucket);

// 		const metadata = {
// 			contentType: contentType,
// 			metadata: {
// 				firebaseStorageDownloadTokens: downloadtoken
// 			}
// 		};

// 		// console.log("downloadToken", downloadtoken);
// 		// console.log("metadata", JSON.stringify(metadata, null, 2));

// 		const thumbFileName = "thumb.png";
// 		const thumbFilePath = path.join(path.dirname(filePath), thumbFileName);
// 		// Create write stream for uploading thumbnail
// 		const thumbnailUploadStream = bucket.file(thumbFilePath).createWriteStream({ metadata });

// 		// Create Sharp pipeline for resizing the image and use pipe to read from bucket read stream
// 		const pipeline = sharp();
// 		pipeline.resize({
// 			width: THUMB_MAX_WIDTH,
// 			height: THUMB_MAX_HEIGHT,
// 			fit: sharp.fit.cover,
// 			format: 'png',
// 		}).pipe(thumbnailUploadStream);

// 		bucket.file(filePath).createReadStream().pipe(pipeline);

// 		return new Promise((resolve, reject) =>
// 			thumbnailUploadStream.on('finish', resolve).on('error', reject));
// 	});

// exports.addImageToIPFS = functions.region('europe-west3').storage.object().onFinalize(async (object) => {
// 	const fileBucket = object.bucket; // The Storage bucket that contains the file.
// 	const filePath = object.name; // File path in the bucket.
// 	const contentType = object.contentType; // File content type.

// 	console.log(fileBucket, filePath, contentType);

// 	// Exit if this is triggered on a file that is not an image.
// 	if (!contentType.startsWith('image/')) {
// 		functions.logger.log('rejecting: this is not an image.');
// 		return null;
// 	}

// 	// Get the file name.
// 	const fileName = path.basename(filePath);
// 	// Exit if the image is already a thumbnail.
// 	if (fileName.startsWith('thumb_')) {
// 		functions.logger.log('rejecting: image is a thumbnail.');
// 		return null;
// 	}

// 	// download file from bucket.
// 	// const fileContents = Buffer.from(await gcs.bucket(fileBucket).file(filePath).download());
// 	// const cid = await web3Storage.put([new File([fileContents], fileName)]);

// 	// stream file from bucket
// 	const file = {
// 		name: filePath.split('/').pop(),
// 		stream: () => gcs.bucket(fileBucket).file(filePath).createReadStream()
// 	};
// 	const cid = await web3Storage.put([file]);

// 	console.log(`IPFS CID: ${cid}`);
// 	console.log(`Gateway URL: https://${cid}.ipfs.w3s.link`);
// });
