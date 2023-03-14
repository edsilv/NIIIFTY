import { Web3Storage } from "web3.storage";
import { WEB3_STORAGE_API_KEY } from "./constants.js";
import { getAllFiles } from "./fs.js";
import fs from "fs";

const web3Storage = new Web3Storage({ token: WEB3_STORAGE_API_KEY });

export async function uploadTempFilesToWeb3Storage(tempDirPath) {
  let files = getAllFiles(tempDirPath);

  files = files.map((file) => {
    return {
      name: file.replace(/^\/tmp\/\d+\//, "/"),
      stream: () => fs.createReadStream(file),
    };
  });

  // console.log("adding files to web3.storage", files);

  const cid = await web3Storage.put(files);

  return cid;
}

// add a google cloud storage file to web3.storage
// export async function addFileToWeb3Storage(file) {
//   const cid = await web3Storage.put([
//     {
//       name: file.name.split("/").pop(),
//       stream: () => gcsBucket.file(file.name).createReadStream(),
//     },
//   ]);

//   return cid;
// }
