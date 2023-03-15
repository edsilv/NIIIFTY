import http from "http";
import fs from "fs";
import { NodeIO } from "@gltf-transform/core";
import { KHRONOS_EXTENSIONS } from "@gltf-transform/extensions";
import {
  dedup,
  flatten,
  join,
  weld,
  resample,
  prune,
  sparse,
  // textureCompress,
  draco,
} from "@gltf-transform/functions";
import draco3d from "draco3dgltf";
import path from "path";
import puppeteer from "puppeteer";
import createThumbnails from "./thumbnails.js";
import { REGULAR_WIDTH } from "./constants.js";
import { createGLBIIIFDerivatives } from "./iiif.js";
import { createTempDir, deleteFile, deleteDir } from "./fs.js";
import { uploadTempFilesToWeb3Storage } from "./web3Storage.js";
import { uploadFilesToGCS } from "./gcs.js";

export default async function processGLB(glb, metadata) {
  console.log(`--- started processing glb ${glb.name} ---`);

  // set the correct mime type on the original file as this is not passed on upload
  await glb.setMetadata({
    contentType: "model/gltf-binary",
  });

  const tempDir = createTempDir();

  const glbFilePath = path.join(tempDir, path.basename(glb.name));

  await glb.download({ destination: glbFilePath });
  console.log("glb downloaded to", glbFilePath);

  // optimise glb using gltf-transform
  await optimizeGLB(glbFilePath);

  // delete the original glb as it's already on GCS and will otherwise be uploaded again
  deleteFile(glbFilePath);

  await screenshotGLB(glb.metadata.mediaLink, tempDir);

  // generate IIIF manifest
  await createGLBIIIFDerivatives(glbFilePath, metadata);

  // upload the generated files to GCS
  await uploadFilesToGCS(tempDir, metadata.fileId);

  // upload the generated files to web3.storage
  const cid = await uploadTempFilesToWeb3Storage(tempDir);

  // Once the video has been processed, delete the temp directory.
  deleteDir(tempDir);

  console.log(`--- finished processing glb ${glb.name} ---`);

  return { cid };
}

async function optimizeGLB(glbFilePath) {
  console.log("optimizing glb", glbFilePath);

  const io = new NodeIO()
    .registerExtensions(KHRONOS_EXTENSIONS)
    .registerDependencies({
      "draco3d.decoder": await draco3d.createDecoderModule(), // Optional.
      "draco3d.encoder": await draco3d.createEncoderModule(), // Optional.
    });
  // .setAllowHTTP(true);

  const document = await io.read(glbFilePath);

  await document.transform(
    dedup(),
    // instance({ min: 5 }),
    flatten(),
    join(),
    weld({ tolerance: 0.0001 }),
    // simplify({ simplifier: MeshoptSimplifier, ratio: 0.001, error: 0.0001 }),
    resample(),
    prune({ keepAttributes: false, keepLeaves: false }),
    sparse(),
    // this errors if the model doesn't have any textures
    // textureCompress({
    //   encoder: sharp,
    //   targetFormat: "auto",
    //   resize: [2048, 2048],
    // }),
    draco()
  );

  const optimizedGLB = await io.writeBinary(document);

  const optimizedGLBFilePath = path.join(
    path.dirname(glbFilePath),
    "optimized.glb"
  );

  // write the optimized glb to the temp dir
  fs.writeFileSync(optimizedGLBFilePath, optimizedGLB);

  return optimizedGLBFilePath;
}

function toHTMLAttributeString(args) {
  if (!args) return "";

  return Object.entries(args)
    .map(([key, value]) => {
      return `${key}="${value}"`;
    })
    .join("\n");
}

function modelViewerHTMLTemplate(
  modelViewerUrl,
  width,
  height,
  src,
  backgroundColor,
  devicePixelRatio
) {
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
}

// async function serveGLB(glbFilePath) {
//   return new Promise((resolve, reject) => {
//     const server = http.createServer((req, res) => {
//       res.setHeader("Content-Type", "model/gltf-binary");
//       fs.createReadStream(glbFilePath).pipe(res);
//     });

//     const connections = new Set();

//     server.on("connection", (connection) => {
//       connections.add(connection);
//       connection.on("close", () => {
//         connections.delete(connection);
//       });
//     });

//     server.on("error", (error) => {
//       console.log("Server error:", error);
//     });

//     server.listen(() => {
//       const port = server.address().port;
//       console.log(`Server is running on port ${port}`);

//       // use the randomly assigned port in the src URL
//       const src = `http://localhost:${port}`;

//       console.log(`src is ${src}`);

//       resolve({ src, server });
//     });

//     server.closeConnections = () => {
//       for (const connection of connections) {
//         connection.destroy();
//       }
//       connections.clear();
//     };

//     server.on("close", () => {
//       console.log(`closing ${connections.size} connections`);
//       server.closeConnections();
//     });
//   });
// }

async function screenshotGLB(src, dir) {
  // const { src, server } = await serveGLB(glbFilePath);

  const args = [
    "--no-sandbox",
    "--disable-gpu",
    "--disable-dev-shm-usage",
    "--disable-setuid-sandbox",
    "--no-zygote",
    "--single-process",
  ];

  const headless = true;
  const width = REGULAR_WIDTH;
  const height = REGULAR_WIDTH;
  const devicePixelRatio = 1;
  const modelViewerUrl =
    "https://unpkg.com/@google/model-viewer/dist/model-viewer.min.js";
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

  // unlimited timeout
  await page.setDefaultNavigationTimeout(0);

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

  // save the screenshot to the temp dir, then call createThumbnails
  const screenshotPath = path.join(dir, "screenshot.png");
  fs.writeFileSync(screenshotPath, screenshot);

  await createThumbnails(screenshotPath);

  // delete screenshot
  deleteFile(screenshotPath);

  await browser.close();
}
