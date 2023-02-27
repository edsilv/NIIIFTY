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
import fetch from "node-fetch";
import path from "path";
import gcsBucket from "./gcsBucket.js";

export default async function optimizeGLB(originalFile) {
  console.log("optimizing glb", originalFile.name);

  const io = new NodeIO(fetch)
    .registerExtensions(KHRONOS_EXTENSIONS)
    .registerDependencies({
      "draco3d.decoder": await draco3d.createDecoderModule(), // Optional.
      "draco3d.encoder": await draco3d.createEncoderModule(), // Optional.
    })
    .setAllowHTTP(true);

  // this works, although streaming would be more efficient?
  const document = await io.read(originalFile.metadata.mediaLink);

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

  const glb = await io.writeBinary(document);

  const optimizedModelFilePath = path.join(
    path.dirname(originalFile.name),
    "optimized.glb"
  );
  const optimizedFile = gcsBucket.file(optimizedModelFilePath);

  await optimizedFile.save(glb, {
    metadata: {
      contentType: "model/gltf-binary",
    },
  });

  return optimizedFile;
}
