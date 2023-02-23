"use strict";

// todo: upgrade to functions v2 when out of beta
// https://firebase.google.com/docs/functions/beta/get-started
const functions = require("firebase-functions");
const { Storage } = require("@google-cloud/storage");
const { Web3Storage } = require("web3.storage");
const path = require("path");
const sharp = require("sharp");
const unzip = require("unzip-stream");
const puppeteer = require("puppeteer");

const GCS_URL = process.env.GCS_URL;
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
  const imageUploadStream = gcsBucket.file(imageFilePath).createWriteStream({
    metadata: {
      contentType: "image/jpeg",
    },
  });
  const file = gcsBucket.file(image.name);

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

  file.createReadStream().pipe(pipeline);

  return new Promise((resolve, reject) =>
    imageUploadStream
      .on("finish", async () => {
        resolve();
      })
      .on("error", reject)
  );
}

// returns iiif manifest json for a given file
function getIIIFManifestJson(path, metadata) {
  const id = `${path}/iiif`;
  const manifestId = `${id}/index.json`;
  const canvasId = `${manifestId}/canvas/0`;
  const annotationPageId = `${manifestId}/canvas/0/annotationpage/0`;
  const annotationId = `${manifestId}/canvas/0/annotation/0`;
  const { type, title, license } = metadata;

  let body, thumbnail;

  switch (type) {
    case "image/png":
    case "image/jpeg":
    case "image/tif":
    case "image/tiff": {
      body = {
        id: `${path}/full.jpg`,
        type: "Image",
        format: "image/jpeg",
        label: {
          "@none": [title],
        },
        service: [
          {
            id,
            profile: "level0",
            type: "ImageService3",
          },
        ],
      };

      thumbnail = [
        {
          id: `${path}/thumb.jpg`,
          type: "Image",
        },
      ];

      break;
    }
    case "model/gltf-binary": {
      body = {
        id: `${path}/original.glb`,
        type: "Model",
        format: "model/gltf-binary",
        label: {
          "@none": [title],
        },
      };

      thumbnail = [
        {
          id: `${path}/thumb.jpg`,
          type: "Image",
        },
      ];

      break;
    }
    case "audio/mpeg": {
      break;
    }
    case "video/mp4": {
      break;
    }
  }

  const manifest = {
    "@context": [
      "http://www.w3.org/ns/anno.jsonld",
      "http://iiif.io/api/presentation/3/context.json",
    ],
    id: manifestId,
    type: "Manifest",
    items: [
      {
        id: canvasId,
        type: "Canvas",
        items: [
          {
            id: annotationPageId,
            type: "AnnotationPage",
            items: [
              {
                id: annotationId,
                type: "Annotation",
                motivation: "painting",
                body,
                target: canvasId,
              },
            ],
          },
        ],
        label: {
          "@none": [title],
        },
        thumbnail,
      },
    ],
    label: {
      "@none": [title],
    },
  };

  // metadata
  const kvp = [
    ...(metadata.title ? [["Title", title]] : []),
    ...(metadata.license ? [["License", license]] : []),
  ];

  manifest.metadata = kvp.map((x) => {
    return {
      label: {
        "@none": [x[0]],
      },
      value: {
        "@none": [x[1]],
      },
    };
  });

  // requiredStatement
  if (metadata.attribution) {
    manifest.requiredStatement = {
      label: { en: ["Attribution"] },
      value: { en: [metadata.attribution] },
    };
  }

  // rights
  manifest.rights = license;

  return manifest;
}

async function createIIIFManifest(file, metadata) {
  console.log(`------ creating IIIF manifest for ${file.name} ------`);

  const dirname = path.dirname(file.name);
  const id = `${GCS_URL}/${dirname}`;

  console.log(`creating iiif manifest with id "${id}"`);

  const iiifManifestJSON = getIIIFManifestJson(`${id}`, metadata);
  const iiifManifestFilePath = path.join(
    path.dirname(file.name),
    "iiif/index.json"
  );
  const iiifManifestFile = gcsBucket.file(iiifManifestFilePath);

  // write iiif manifest to bucket
  await iiifManifestFile.save(JSON.stringify(iiifManifestJSON, null, 2), {
    metadata: {
      contentType: "application/json",
      cacheControl: "public, max-age=60", // cache for 1 minute
    },
  });

  return id;
}

// creates iiif manifest, images tiles, and info.json for a given image
async function createImageIIIFDerivatives(image, metadata) {
  const id = await createIIIFManifest(image, metadata);

  // generate iiif image tiles
  console.log(`generating iiif image tiles`);

  const dirname = path.dirname(image.name);
  const zipPath = path.join(dirname, "iiif.zip");
  const zipFile = gcsBucket.file(zipPath);
  const imageTilesWriteStream = zipFile.createWriteStream();

  // Create Sharp pipeline for tiling the image
  const pipeline = sharp();

  pipeline
    .tile({
      layout: "iiif3",
      basename: "iiif",
      id,
    })
    .pipe(imageTilesWriteStream);

  return new Promise((resolve, _reject) => {
    const promises = [];

    const unzipParser = unzip.Parse();

    unzipParser.on("end", async () => {
      console.log(
        `waiting for ${promises.length} iiif.zip entries to finish streaming to ${dirname}/iiif`
      );

      await Promise.all(promises);

      console.log(`finished extracting iiif.zip, deleting ${zipPath}`);

      await zipFile.delete();

      resolve();
    });

    gcsBucket
      .file(image.name)
      .createReadStream()
      .pipe(pipeline)
      .pipe(unzipParser)
      .on("entry", (entry) => {
        const entryDestPath = path.join(dirname, entry.path);
        const entryDestFile = gcsBucket.file(entryDestPath);
        const p = new Promise((resolve, reject) => {
          // console.log(`write zip file entry ${entry.path} to ${entryDestPath}`);
          entry
            .pipe(entryDestFile.createWriteStream())
            .on("finish", () => {
              // console.log(
              //   `finished streaming ${entry.path} to ${entryDestPath}`
              // );
              resolve();
            })
            .on("error", (e) => {
              console.log(
                `error streaming ${entry.path} to ${entryDestPath}: ${e}`
              );
              reject();
            });
        });
        promises.push(p);
      });
  });
}

// creates iiif manifest for a given glb
async function createGLBIIIFDerivatives(glb, metadata) {
  await createIIIFManifest(glb, metadata);
}

async function updateDerivatives(fileId, metadata) {
  console.log(`------ updating image derivatives for ${fileId} ------`);

  // e.g. https://niiifty-bd2e2.appspot.com.storage.googleapis.com/EoLsdWm2MHekqS5eANuJ
  const id = `${GCS_URL}/${fileId}`;

  const iiifManifestJSON = getIIIFManifestJson(`${id}`, metadata);
  const iiifManifestFile = gcsBucket.file(path.join(fileId, "iiif/index.json"));

  // write updated iiif manifest to bucket
  await iiifManifestFile.save(JSON.stringify(iiifManifestJSON, null, 2), {
    metadata: {
      contentType: "application/json",
      cacheControl: "public, max-age=60", // cache for 1 minute
    },
  });

  console.log(`finished updating image derivatives for ${fileId}`);
}

async function addToWeb3Storage(file) {
  const cid = await web3Storage.put([
    {
      name: file.name.split("/").pop(),
      stream: () => gcsBucket.file(file.name).createReadStream(),
    },
  ]);

  return cid;
}

// when an image is uploaded, create derivatives and add to web3 storage
async function processImage(originalFile, metadata) {
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

  // generate IIIF manifest and image tiles
  await createImageIIIFDerivatives(originalFile, metadata);

  // add the original file to web3.storage
  // todo: add the derivatives to web3.storage
  console.log("add to web3.storage");
  const cid = await addToWeb3Storage(originalFile);

  return { cid };
}

function toHTMLAttributeString(args) {
  if (!args) return "";

  return Object.entries(args)
    .map(([key, value]) => {
      return `${key}="${value}"`;
    })
    .join("\n");
}

const modelViewerHTMLTemplate = (
  modelViewerUrl,
  width,
  height,
  src,
  backgroundColor,
  devicePixelRatio
) => {
  const defaultAttributes = {
    id: "snapshot-viewer",
    style: `background-color: ${backgroundColor};`,
    "interaction-prompt": "none",
    src: src,
  };

  const defaultAttributesString = toHTMLAttributeString(defaultAttributes);

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=${devicePixelRatio}">
        <script type="module"
          src="${modelViewerUrl}">
        </script>
        <style>
          body {
            margin: 0;
          }
          model-viewer {
            --progress-bar-color: transparent;
            width: ${width}px;
            height: ${height}px;
          }
        </style>
      </head>
      <body>
        <model-viewer
          ${defaultAttributesString}
        />
      </body>
    </html>
  `;
};

// when a glb is uploaded, create derivatives and add to web3 storage
async function processGLB(originalFile, metadata) {
  // todo: optimise glb using gltf-transform

  // take screenshot for thumbnail
  const url = originalFile.metadata.mediaLink; // todo: use optimised glb

  const args = [
    "--no-sandbox",
    "--disable-gpu",
    "--disable-dev-shm-usage",
    "--disable-setuid-sandbox",
    "--no-zygote",
    "--single-process",
  ];

  const headless = true;
  const width = 800;
  const height = 800;
  const devicePixelRatio = 1;
  const modelViewerUrl =
    "https://unpkg.com/@google/model-viewer/dist/model-viewer.min.js";
  const src = url;
  const backgroundColor = "#000000";

  const browser = await puppeteer.launch({
    args,
    defaultViewport: {
      width,
      height,
      deviceScaleFactor: devicePixelRatio,
    },
    headless,
  });

  const page = await browser.newPage();

  const data = modelViewerHTMLTemplate(
    modelViewerUrl,
    width,
    height,
    src,
    backgroundColor,
    devicePixelRatio
  );

  // console.log("modelviewer template", data);

  await page.setContent(data, {
    waitUntil: ["domcontentloaded", "networkidle0"],
  });

  const element = await page.$("model-viewer");
  const boundingBox = await element.boundingBox();

  await page.setViewport({
    width: Math.ceil(boundingBox.width),
    height: Math.ceil(boundingBox.height),
    deviceScaleFactor: devicePixelRatio,
  });

  const screenshot = await element.screenshot(); // returns a buffer

  const screenshotFilePath = path.join(
    path.dirname(originalFile.name),
    "thumb.jpg"
  );
  const screenshotFile = gcsBucket.file(screenshotFilePath);

  await screenshotFile.save(screenshot, {
    metadata: {
      contentType: "image/jpeg",
    },
  });

  await resizeImage(screenshotFile, "thumb", THUMB_WIDTH, THUMB_WIDTH);

  console.log(`Screenshot saved to ${screenshotFilePath}`);
  await browser.close();

  // generate IIIF manifest
  await createGLBIIIFDerivatives(originalFile, metadata);

  console.log("add to web3.storage");
  const cid = await addToWeb3Storage(originalFile);

  return { cid };
}

// when a file is created in firestore,
// generate derivatives, and replicate to web3.storage
exports.fileCreated = functions
  .region("europe-west3")
  .runWith({
    timeoutSeconds: 300,
    memory: "2GB",
  })
  .firestore.document("files/{fileId}")
  .onCreate(async (snap, context) => {
    const fileId = context.params.fileId;
    // get a reference to the uploaded original.[png, jpg, tif, tiff, mp3, mp4, glb] file
    const [files] = await gcsBucket.getFiles({ prefix: `${fileId}/original` });

    let processedProps;

    if (files.length) {
      const originalFile = files[0];

      const metadata = snap.data();

      switch (metadata.type) {
        case "image/png":
        case "image/jpeg":
        case "image/tif":
        case "image/tiff": {
          // process image
          processedProps = await processImage(originalFile, metadata);
          break;
        }
        case "audio/mpeg": {
          // process audio
          break;
        }
        case "video/mp4": {
          // process video
          break;
        }
        case "model/gltf-binary": {
          // process glb
          processedProps = await processGLB(originalFile, metadata);
          break;
        }
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

// when a file is updated in firestore
exports.fileUpdated = functions
  .region("europe-west3")
  .runWith({
    timeoutSeconds: 300,
    memory: "1GB",
  })
  .firestore.document("files/{fileId}")
  .onUpdate(async (change, context) => {
    const previousValue = change.before.data();
    const fileId = context.params.fileId;
    // Get an object representing the document
    const metadata = change.after.data();

    // only continue if something other that the processed flag has changed
    if (previousValue.processed !== metadata.processed) {
      console.log("only the processed flag has changed, skipping");
      return;
    }

    // the original uploaded file cannot be changed, only the metadata associated with it.
    // update any derivatives (like iiif manifests) that include the metadata

    // todo: is a switch needed? or can we just call updateDerivatives for all types?
    switch (metadata.type) {
      case "image/png":
      case "image/jpeg":
      case "image/tif":
      case "image/tiff": {
        // update image derivatives
        await updateDerivatives(fileId, metadata);
        break;
      }
      case "audio/mpeg": {
        // process audio
        break;
      }
      case "video/mp4": {
        // process video
        break;
      }
      case "model/gltf-binary": {
        // update glb derivatives
        await updateDerivatives(fileId, metadata);
        break;
      }
    }
  });

// when a file is deleted in firestore
exports.fileDeleted = functions
  .region("europe-west3")
  .runWith({
    timeoutSeconds: 300,
    memory: "1GB",
  })
  .firestore.document("files/{fileId}")
  .onDelete(async (_snap, context) => {
    const fileId = context.params.fileId;

    // Get a list of all the files in the folder
    const [files] = await gcsBucket.getFiles({
      prefix: `${fileId}/`,
    });

    console.log(`Found ${files.length} files in ${fileId}/`);

    // Delete all the files in the folder
    const deletions = files.map((file) => {
      console.log(`Deleting ${file.name}`);
      return file.delete();
    });

    // Wait for all deletions to complete
    await Promise.all(deletions);

    console.log(`Finished deleting ${files.length} files in ${fileId}/`);
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
