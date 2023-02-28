import sharp from "sharp";
import unzip from "unzip-stream";
import path from "path";
import gcsBucket from "./gcsBucket.js";
import { GCS_URL } from "./constants.js";

// returns iiif manifest json for a given file
export function getIIIFManifestJson(path, metadata) {
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
        id: `${path}/optimized.glb`,
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

export async function createIIIFManifest(file, metadata) {
  console.log(`creating IIIF manifest for ${file.name}`);

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
export async function createImageIIIFDerivatives(image, metadata) {
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
export async function createGLBIIIFDerivatives(glb, metadata) {
  await createIIIFManifest(glb, metadata);
}