"use strict";

// todo: upgrade to functions v2 when out of beta
// https://firebase.google.com/docs/functions/beta/get-started
import functions from "firebase-functions";
import path from "path";
import addToWeb3Storage from "./addToWeb3Storage.js";
import resizeImage from "./resizeImage.js";
import {
  createImageIIIFDerivatives,
  getIIIFManifestJson,
  createGLBIIIFDerivatives,
} from "./iiif.js";
import optimizeGLB from "./optimizeGLB.js";
import gcsBucket from "./gcsBucket.js";
import screenshotGLB from "./screenshotGLB.js";
import {
  GCS_URL,
  REGULAR_WIDTH,
  SMALL_WIDTH,
  THUMB_WIDTH,
} from "./constants.js";

async function updateDerivatives(fileId, metadata) {
  console.log(`updating derivatives for ${fileId}`);

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

  console.log(`finished updating derivatives for ${fileId}`);
}

// when an image is uploaded, create derivatives and add to web3 storage
async function processImage(originalFile, metadata) {
  console.log(`--- started processing image ${originalFile.name} ---`);

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

  console.log(`--- finished processing image ${originalFile.name} ---`);

  return { cid };
}

// when a glb is uploaded, create derivatives and add to web3 storage
async function processGLB(originalFile, metadata) {
  console.log(`--- started processing glb ${originalFile.name} ---`);

  // set the correct mime type on the original file as this is not passed on upload
  await originalFile.setMetadata({
    contentType: "model/gltf-binary",
  });

  // optimise glb using gltf-transform
  const optimizedFile = await optimizeGLB(originalFile);

  await screenshotGLB(optimizedFile);

  // generate IIIF manifest
  await createGLBIIIFDerivatives(originalFile, metadata);

  console.log("add to web3.storage");
  const cid = await addToWeb3Storage(originalFile);

  console.log(`--- finished processing glb ${originalFile.name} ---`);

  return { cid };
}

// when a file is created in firestore,
// generate derivatives, and replicate to web3.storage
export const fileCreated = functions
  .region("europe-west3")
  .runWith({
    timeoutSeconds: 540, // max
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
          // todo: add try/catch so that if it fails it's marked in the db
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
          try {
            processedProps = await processGLB(originalFile, metadata);
          } catch (error) {
            console.log("error processing glb", error);
            // update firestore record
            return snap.ref.set(
              {
                processingError: true,
              },
              { merge: true }
            );
          }

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
export const fileUpdated = functions
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
export const fileDeleted = functions
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
