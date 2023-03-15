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
import { gcsBucket } from "./gcs.js";
import puppeteer from "puppeteer";
import generateThumbnails from "./thumbnails.js";
import { REGULAR_WIDTH } from "./constants.js";
import { createGLBIIIFDerivatives } from "./iiif.js";
import { createTempDir } from "./fs.js";

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
  const { optimizedGLBFilePath, optimizedGLB } = await optimizeGLB(glbFilePath);

  // upload the optimized file to GCS so that it can be screenshotted
  const optimizedFile = gcsBucket.file(optimizedGLBFilePath);

  await optimizedFile.save(optimizedGLB, {
    metadata: {
      contentType: "model/gltf-binary",
    },
  });

  await screenshotGLB(optimizedFile);

  // todo: save the screenshot to the temp dir here, then call createThumbnails

  // generate IIIF manifest
  await createGLBIIIFDerivatives(glbFilePath, metadata);

  console.log(`--- finished processing glb ${glb.name} ---`);

  return {};
}

async function optimizeGLB(glbFilePath) {
  console.log("optimizing glb", glbFilePath);

  const io = new NodeIO()
    .registerExtensions(KHRONOS_EXTENSIONS)
    .registerDependencies({
      "draco3d.decoder": await draco3d.createDecoderModule(), // Optional.
      "draco3d.encoder": await draco3d.createEncoderModule(), // Optional.
    })
    .setAllowHTTP(true);

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

  // const optimizedGLB = await io.writeBinary(document);

  const optimizedGLBFilePath = path.join(
    path.dirname(glbFilePath),
    "optimized.glb"
  );

  await io.writeBinary(optimizedGLBFilePath, document);

  return { optimizedGLBFilePath, document };
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

async function screenshotGLB(file) {
  // take screenshot for thumbnail
  const url = file.metadata.mediaLink;

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
    path.dirname(file.name),
    "screenshot.jpg"
  );
  const screenshotFile = gcsBucket.file(screenshotFilePath);

  await screenshotFile.save(screenshot, {
    metadata: {
      contentType: "image/jpeg",
    },
  });

  await generateThumbnails(screenshotFile);

  // delete screenshotFile
  await screenshotFile.delete();

  await browser.close();
}
