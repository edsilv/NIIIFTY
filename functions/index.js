"use strict";

// todo: upgrade to functions v2 when out of beta
// https://firebase.google.com/docs/functions/beta/get-started
import functions from "firebase-functions";
import path from "path";
// import addFilesToWeb3Storage from "./web3Storage.js";
import { getIIIFManifestJson } from "./iiif.js";
import { gcsBucket } from "./gcs.js";
import processImage from "./image.js";
import processGLB from "./glb.js";
import processMP4 from "./mp4.js";
import { GCS_URL } from "./constants.js";

async function updateMetadataDerivatives(fileId, metadata) {
  console.log(`updating derivatives for ${fileId}`);

  // e.g. https://niiifty-bd2e2.appspot.com.storage.googleapis.com/EoLsdWm2MHekqS5eANuJ
  const id = `${GCS_URL}/${fileId}`;

  const iiifManifestJSON = getIIIFManifestJson(`${id}`, metadata);
  const iiifManifestFile = gcsBucket.file(path.join(fileId, "iiif/index.json"));

  // todo: will randomising this cause the cache to reset and serve the new file immediately after being changed?
  // const cacheControlSeconds =
  //   Math.floor(Math.random() * (7200 - 3600 + 1)) + 3600;

  // cache for 1 minute
  const cacheControlSeconds = 60;

  // write updated iiif manifest to bucket
  await iiifManifestFile.save(JSON.stringify(iiifManifestJSON, null, 2), {
    metadata: {
      contentType: "application/json",
      cacheControl: `public, max-age=${cacheControlSeconds}`,
    },
  });

  console.log(`finished updating derivatives for ${fileId}`);
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

      const metadata = {
        fileId,
        ...snap.data(),
      };

      switch (metadata.type) {
        case "image/png":
        case "image/jpeg":
        case "image/tif":
        case "image/tiff": {
          // process image
          processedProps = await processImage(originalFile, metadata);
          break;
        }
        // case "audio/mpeg": {
        //   // process audio
        //   break;
        // }
        case "video/mp4": {
          // process video
          processedProps = await processMP4(originalFile, metadata);
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

    // console.log("previous value", previousValue);
    // console.log("new value", metadata);

    // if the file has not been processed, ignore
    if (!metadata.processed) {
      console.log("file has not been processed, skipping");
      return;
    }

    // if the processed flag has changed, ignore
    if (previousValue.processed !== metadata.processed) {
      console.log("processed flag has changed, skipping");
      return;
    }

    // the original uploaded file cannot be changed, only the metadata associated with it.
    // update any derivatives (like iiif manifests) that include the metadata
    await updateMetadataDerivatives(fileId, metadata);
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
