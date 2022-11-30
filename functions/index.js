'use strict';

const functions = require('firebase-functions');
const { Storage } = require('@google-cloud/storage');
const { Web3Storage } = require('web3.storage');
const path = require('path');
const sharp = require('sharp');

const THUMB_MAX_WIDTH = 200;
const THUMB_MAX_HEIGHT = 200;

const gcs = new Storage();

const web3StorageAPIKey = process.env.WEB3_STORAGE_API_KEY;
const web3Storage = new Web3Storage({ token: web3StorageAPIKey });

/**
 * When a file is uploaded in the Storage bucket we generate a thumbnail automatically using
 * Sharp.
 */
exports.generateThumbnail = functions.region('europe-west3')
	.storage.object().onFinalize((object) => {
		const fileBucket = object.bucket; // The Storage bucket that contains the file.
		const filePath = object.name; // File path in the bucket.
		const contentType = object.contentType; // File content type.
		const downloadtoken = object.metadata ? object.metadata.firebaseStorageDownloadTokens : undefined; // Access token

		// todo: handle mp4, glb

		// Exit if this is triggered on a file that is not an image.
		if (!contentType.startsWith('image/')) {
			functions.logger.log('rejecting: this is not an image.');
			return null;
		}

		// Get the file name.
		const fileName = path.basename(filePath);
		// Exit if the image is already a thumbnail.
		if (fileName.startsWith('thumb')) {
			functions.logger.log('rejecting: already a thumbnail.');
			return null;
		}

		// Download file from bucket.
		const bucket = gcs.bucket(fileBucket);

		const metadata = {
			contentType: contentType,
			metadata: {
				firebaseStorageDownloadTokens: downloadtoken
			}
		};

		// console.log("downloadToken", downloadtoken);
		// console.log("metadata", JSON.stringify(metadata, null, 2));

		const thumbFileName = "thumb.png";
		const thumbFilePath = path.join(path.dirname(filePath), thumbFileName);
		// Create write stream for uploading thumbnail
		const thumbnailUploadStream = bucket.file(thumbFilePath).createWriteStream({ metadata });

		// Create Sharp pipeline for resizing the image and use pipe to read from bucket read stream
		const pipeline = sharp();
		pipeline.resize({
			width: THUMB_MAX_WIDTH,
			height: THUMB_MAX_HEIGHT,
			fit: sharp.fit.cover,
			format: 'png',
		}).pipe(thumbnailUploadStream);

		bucket.file(filePath).createReadStream().pipe(pipeline);

		return new Promise((resolve, reject) =>
			thumbnailUploadStream.on('finish', resolve).on('error', reject));
	});

// when a file is created, generate a thumbnail, and replicate the file to web3.storage
exports.addToWeb3Storage = functions.region('europe-west3')
	.firestore
	.document('files/{fileId}')
	.onCreate(async (snap, context) => {
		// Get an object representing the document
		// e.g. {'name': 'Marie', 'age': 66}
		// const newValue = snap.data();
		// access a particular field as you would any JS property
		// const name = newValue.name;

		const fileId = context.params.fileId;
		const projectId = process.env.GCP_PROJECT || process.env.GCLOUD_PROJECT;

		// niiifty-bd2e2.appspot.com
		const fileBucket = `${projectId}.appspot.com`;

		// todo: find a file starting with "default" in the bucket
		// hard coding default.png for now
		// oMTICD9Q6QPmwTTzXKHi/default.png
		const filePath = `${fileId}/default.png`;

		// stream file from bucket
		const file = {
			name: filePath.split('/').pop(),
			stream: () => gcs.bucket(fileBucket).file(filePath).createReadStream()
		};

		const cid = await web3Storage.put([file]);

		return snap.ref.set({
			cid,
		}, { merge: true });
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