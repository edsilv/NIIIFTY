import { Storage } from "@google-cloud/storage";
import { PROJECT_ID } from "./constants.js";

const gcs = new Storage();
const gcsBucket = gcs.bucket(`${PROJECT_ID}.appspot.com`);

export default gcsBucket;
