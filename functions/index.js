'use strict';

const functions = require('firebase-functions');
const { Storage } = require('@google-cloud/storage');
const { Web3Storage } = require('web3.storage');
const path = require('path');
const sharp = require('sharp');

const WEB3_STORAGE_API_KEY = process.env.WEB3_STORAGE_API_KEY;
const PROJECT_ID = process.env.GCP_PROJECT || process.env.GCLOUD_PROJECT;
const THUMB_MAX_WIDTH = 200;
const THUMB_MAX_HEIGHT = 200;

const gcs = new Storage();
const gcsBucket = gcs.bucket(`${PROJECT_ID}.appspot.com`);
const web3Storage = new Web3Storage({ token: WEB3_STORAGE_API_KEY })

/**
 * When a file is uploaded in the Storage bucket we generate a thumbnail automatically using
 * Sharp.
 */
// exports.generateThumbnail = functions.region('europe-west3')
// 	.storage.object().onFinalize((object) => {
// 		const fileBucket = object.bucket; // The Storage bucket that contains the file.
// 		const filePath = object.name; // File path in the bucket.
// 		const contentType = object.contentType; // File content type.
// 		const downloadtoken = object.metadata ? object.metadata.firebaseStorageDownloadTokens : undefined; // Access token

// 		// todo: handle mp4, glb

// 		// Exit if this is triggered on a file that is not an image.
// 		if (!contentType.startsWith('image/')) {
// 			functions.logger.log('rejecting: this is not an image.');
// 			return null;
// 		}

// 		// Get the file name.
// 		const fileName = path.basename(filePath);
// 		// Exit if the image is already a thumbnail.
// 		if (fileName.startsWith('thumb')) {
// 			functions.logger.log('rejecting: already a thumbnail.');
// 			return null;
// 		}

// 		// Download file from bucket.
// 		const bucket = gcs.bucket(fileBucket);

// 		const metadata = {
// 			contentType: contentType,
// 			metadata: {
// 				firebaseStorageDownloadTokens: downloadtoken
// 			}
// 		};

// 		// console.log("downloadToken", downloadtoken);
// 		// console.log("metadata", JSON.stringify(metadata, null, 2));

// 		const thumbFileName = "thumb.png";
// 		const thumbFilePath = path.join(path.dirname(filePath), thumbFileName);
// 		// Create write stream for uploading thumbnail
// 		const thumbnailUploadStream = bucket.file(thumbFilePath).createWriteStream({ metadata });

// 		// Create Sharp pipeline for resizing the image and use pipe to read from bucket read stream
// 		const pipeline = sharp();
// 		pipeline.resize({
// 			width: THUMB_MAX_WIDTH,
// 			height: THUMB_MAX_HEIGHT,
// 			fit: sharp.fit.cover,
// 			format: 'png',
// 		}).pipe(thumbnailUploadStream);

// 		bucket.file(filePath).createReadStream().pipe(pipeline);

// 		return new Promise((resolve, reject) =>
// 			thumbnailUploadStream.on('finish', resolve).on('error', reject));
// 	});

async function createThumbnail(file) {

	// console.log("file metadata", file.metadata);

	// const downloadToken = file.metadata.firebaseStorageDownloadTokens;

	// const metadata = {
	// 	contentType: "image/png",
	// 	metadata: {
	// 		firebaseStorageDownloadTokens: downloadToken
	// 	}
	// };

	const thumbFilePath = path.join(path.dirname(file.name), "thumb.png");
	// Create write stream for uploading thumbnail
	// const thumbnailUploadStream = gcsBucket.file(thumbFilePath).createWriteStream({ metadata });
	const thumbnailUploadStream = gcsBucket.file(thumbFilePath).createWriteStream();

	// Create Sharp pipeline for resizing the image and use pipe to read from bucket read stream
	const pipeline = sharp();
	pipeline.resize({
		width: THUMB_MAX_WIDTH,
		height: THUMB_MAX_HEIGHT,
		fit: sharp.fit.cover,
		format: 'png',
	}).pipe(thumbnailUploadStream);

	gcsBucket.file(file.name).createReadStream().pipe(pipeline);

	return new Promise((resolve, reject) =>
		thumbnailUploadStream.on('finish', resolve).on('error', reject));
}

async function addToWeb3Storage(file) {
	const cid = await web3Storage.put([
		{
			name: file.name.split('/').pop(),
			stream: () => gcsBucket.file(file.name).createReadStream()
		}
	]);

	return cid;
}

// when a file is created in firestore, 
// generate a thumbnail, and replicate the file to web3.storage
exports.fileCreated = functions.region('europe-west3')
	.firestore
	.document('files/{fileId}')
	.onCreate(async (snap, context) => {
		// Get an object representing the document
		// e.g. {'name': 'Marie', 'age': 66}
		// const newValue = snap.data();
		// access a particular field as you would any JS property
		// const name = newValue.name;

		const fileId = context.params.fileId;
		const [files] = await gcsBucket.getFiles();
		// get a reference to the uploaded default.[png, jpg, mp4, glb] file
		const defaultFile = files.find(file => file.name.startsWith(`${fileId}/default`));

		if (defaultFile) {
			await createThumbnail(defaultFile);
			const cid = await addToWeb3Storage(defaultFile);

			return snap.ref.set({
				cid,
			}, { merge: true });
		}
	});

// exports.addImageToIPFS = functions.region('europe-west3').storage.object().onFinalize(async (object) => {
// 	const fileBucket = object.bucket; // The Storage bucket that contains the file.
// 	const filePath = object.name; // File path in the bucket.
// 	const contentType = object.contentType; // File content type.

// 	console.log(fileBucket, filePath, contentType);

// 	// Exit if this is triggered on a file that is not an image.
// 	if (!contentType.startsWith('image/')) {
// 		functions.logger.log('rejecting: this is not an image.');
// 		return null;
// 	}

// 	// Get the file name.
// 	const fileName = path.basename(filePath);
// 	// Exit if the image is already a thumbnail.
// 	if (fileName.startsWith('thumb_')) {
// 		functions.logger.log('rejecting: image is a thumbnail.');
// 		return null;
// 	}

// 	// download file from bucket.
// 	// const fileContents = Buffer.from(await gcs.bucket(fileBucket).file(filePath).download());
// 	// const cid = await web3Storage.put([new File([fileContents], fileName)]);

// 	// stream file from bucket
// 	const file = {
// 		name: filePath.split('/').pop(),
// 		stream: () => gcs.bucket(fileBucket).file(filePath).createReadStream()
// 	};
// 	const cid = await web3Storage.put([file]);

// 	console.log(`IPFS CID: ${cid}`);
// 	console.log(`Gateway URL: https://${cid}.ipfs.w3s.link`);
// });