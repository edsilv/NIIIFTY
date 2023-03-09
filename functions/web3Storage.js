import { Web3Storage } from "web3.storage";
import gcsBucket from "./gcsBucket.js";
import { WEB3_STORAGE_API_KEY } from "./constants.js";

const web3Storage = new Web3Storage({ token: WEB3_STORAGE_API_KEY });

export async function addFilesToWeb3Storage(files) {
  const cid = await web3Storage.put([
    {
      name: file.name.split("/").pop(),
      stream: () => gcsBucket.file(file.name).createReadStream(),
    },
  ]);

  return cid;
}

export async function addFileToWeb3Storage(file) {
  const cid = await web3Storage.put([
    {
      name: file.name.split("/").pop(),
      stream: () => gcsBucket.file(file.name).createReadStream(),
    },
  ]);

  return cid;
}
