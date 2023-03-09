import puppeteer from "puppeteer";
import gcsBucket from "./gcsBucket.js";
import path from "path";
import generateThumbnails from "./generateThumbnails.js";
import { REGULAR_WIDTH } from "./constants.js";

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

export default async function screenshotGLB(file) {
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
