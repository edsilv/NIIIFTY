import { Storage } from "@google-cloud/storage";

const gcs = new Storage();
const PROJECT_ID = process.env.GCP_PROJECT || process.env.GCLOUD_PROJECT;
const gcsBucket = gcs.bucket(`${PROJECT_ID}.appspot.com`);

export default gcsBucket;
