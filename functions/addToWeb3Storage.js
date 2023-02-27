import { Web3Storage } from "web3.storage";
import gcsBucket from "./gcsBucket.js";

const WEB3_STORAGE_API_KEY = process.env.WEB3_STORAGE_API_KEY;
const web3Storage = new Web3Storage({ token: WEB3_STORAGE_API_KEY });

export default async function addToWeb3Storage(file) {
  const cid = await web3Storage.put([
    {
      name: file.name.split("/").pop(),
      stream: () => gcsBucket.file(file.name).createReadStream(),
    },
  ]);

  return cid;
}
