'use strict';

const functions = require('firebase-functions');
const { Storage } = require('@google-cloud/storage');
const path = require('path');
const sharp = require('sharp');
// const { NFTStorage, File } = require('nft.storage');
// const { v4: uuid } = require('uuid');

const THUMB_MAX_WIDTH = 200;
const THUMB_MAX_HEIGHT = 200;

const gcs = new Storage();

/**
 * When an image is uploaded in the Storage bucket we generate a thumbnail automatically using
 * Sharp.
 */
exports.generateThumbnail = functions.storage.object().onFinalize((object) => {
    const fileBucket = object.bucket; // The Storage bucket that contains the file.
    const filePath = object.name; // File path in the bucket.
    const contentType = object.contentType; // File content type.
    const downloadtoken = object.metadata ? object.metadata.firebaseStorageDownloadTokens : undefined; // Access token

    // Exit if this is triggered on a file that is not an image.
    if (!contentType.startsWith('image/')) {
        functions.logger.log('This is not an image.');
        return null;
    }

    // Get the file name.
    const fileName = path.basename(filePath);
    // Exit if the image is already a thumbnail.
    if (fileName.startsWith('thumb_')) {
        functions.logger.log('Already a Thumbnail.');
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

    // We add a 'thumb_' prefix to thumbnails file name. That's where we'll upload the thumbnail.
    const thumbFileName = `thumb_${fileName}`;
    const thumbFilePath = path.join(path.dirname(filePath), thumbFileName);
    // Create write stream for uploading thumbnail
    const thumbnailUploadStream = bucket.file(thumbFilePath).createWriteStream({ metadata });

    // Create Sharp pipeline for resizing the image and use pipe to read from bucket read stream
    const pipeline = sharp();
    pipeline.resize({
        width: THUMB_MAX_WIDTH,
        height: THUMB_MAX_HEIGHT,
        fit: sharp.fit.cover
    }).pipe(thumbnailUploadStream);

    bucket.file(filePath).createReadStream().pipe(pipeline);

    return new Promise((resolve, reject) =>
        thumbnailUploadStream.on('finish', resolve).on('error', reject));
});

exports.addImageToIPFS = functions.storage.object().onFinalize(async (object) => {
    const fileBucket = object.bucket; // The Storage bucket that contains the file.
    const filePath = object.name; // File path in the bucket.
    const contentType = object.contentType; // File content type.
    const downloadtoken = object.metadata ? object.metadata.firebaseStorageDownloadTokens : undefined; // Access token

    // Exit if this is triggered on a file that is not an image.
    if (!contentType.startsWith('image/')) {
        functions.logger.log('This is not an image.');
        return null;
    }

    // Get the file name.
    const fileName = path.basename(filePath);
    // Exit if the image is already a thumbnail.
    if (fileName.startsWith('thumb_')) {
        functions.logger.log('Image is a thumbnail.');
        return null;
    }

    // Download file from bucket.
    const bucket = gcs.bucket(fileBucket);

    const apiKey = process.env.WEB3_STORAGE_API_KEY;

    console.log("apikey", apiKey);

    // const client = new NFTStorage({ token: apiKey });

    // const metadata = await client.store({
    //     name: 'Pinpie',
    //     description: 'Pin is not delicious beef!',
    //     image: new File([bucket.file(filePath)], 'pinpie.jpg', { type: 'image/jpg' })
    // });

    // console.log(metadata.url);
});