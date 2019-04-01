/**
 * Copyright 2017 Google Inc. All Rights Reserved.
 * ...
 */

// Import the Firebase SDK for Google Cloud Functions.
const functions = require('firebase-functions');
// Import and initialize the Firebase Admin SDK.
const admin = require('firebase-admin');
admin.initializeApp();

const Vision = require('@google-cloud/vision');
const vision = new Vision();
const spawn = require('child-process-promise').spawn;

const path = require('path');
const os = require('os');
const fs = require('fs');

// Checks if uploaded images are flagged as Adult or Violence and if so blurs them.
exports.blurOffensiveImages = functions.storage.object().onFinalize((object) => {
  const file = gcs.bucket(object.bucket).file(object.name);

  // Check the image content using the Cloud Vision API.
  return vision.detectSafeSearch(file).then((data) => {
    const safeSearch = data[0];
    console.log('SafeSearch results on image', safeSearch);

    if (safeSearch.adult || safeSearch.violence) {
      return blurImage(object.name, object.bucket, object.metadata);
    }
    return null;
  });
});

/**
 * Blurs the given image located in the given bucket using ImageMagick.
 */
function blurImage(filePath, bucketName, metadata) {
  const tempLocalFile = path.join(os.tmpdir(), filePath);
  const tempLocalDir = path.dirname(tempLocalFile);
  const bucket = gcs.bucket(bucketName);

  // Create the temp directory where the storage file will be downloaded.
  return mkdirp(tempLocalDir).then(() => {
    console.log('Temporary directory has been created', tempLocalDir);
    // Download file from bucket.
    return bucket.file(filePath).download({destination: tempLocalFile});
  }).then(() => {
    console.log('The file has been downloaded to', tempLocalFile);
    // Blur the image using ImageMagick.
    return spawn('convert', [tempLocalFile, '-channel', 'RGBA', '-blur', '0x8', tempLocalFile]);
  }).then(() => {
    console.log('Blurred image created at', tempLocalFile);
    // Uploading the Blurred image.
    return bucket.upload(tempLocalFile, {
      destination: filePath,
      metadata: {metadata: metadata}, // Keeping custom metadata.
    });
  }).then(() => {
    console.log('Blurred image uploaded to Storage at', filePath);
    fs.unlinkSync(tempLocalFile);
    return console.log('Deleted local file', filePath);
  });
}