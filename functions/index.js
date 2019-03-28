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
exports.blurOffensiveImages = functions.runWith({memory: '2GB'}).storage.object().onFinalize(
  async (object) => {
    const image = {
      source: {imageUri: `gs://${object.bucket}/${object.name}`},
    };

    // Check the image content using the Cloud Vision API.
    const batchAnnotateImagesResponse = await vision.safeSearchDetection(image);
    const safeSearchResult = batchAnnotateImagesResponse[0].safeSearchAnnotation;
    const Likelihood = Vision.types.Likelihood;
    if (Likelihood[safeSearchResult.adult] >= Likelihood.LIKELY ||
        Likelihood[safeSearchResult.violence] >= Likelihood.LIKELY) {
      console.log('The image', object.name, 'has been detected as inappropriate.');
      return blurImage(object.name);
    }
    console.log('The image', object.name, 'has been detected as OK.');
    return null;
  });

// Blurs the given image located in the given bucket using ImageMagick.
async function blurImage(filePath) {
  const tempLocalFile = path.join(os.tmpdir(), path.basename(filePath));
  const messageId = filePath.split(path.sep)[1];
  const bucket = admin.storage().bucket();

  // Download file from bucket.
  await bucket.file(filePath).download({destination: tempLocalFile});
  console.log('Image has been downloaded to', tempLocalFile);
  // Blur the image using ImageMagick.
  await spawn('convert', [tempLocalFile, '-channel', 'RGBA', '-blur', '0x24', tempLocalFile]);
  console.log('Image has been blurred');
  // Uploading the Blurred image back into the bucket.
  await bucket.upload(tempLocalFile, {destination: filePath});
  console.log('Blurred image has been uploaded to', filePath);
  // Deleting the local file to free up disk space.
  fs.unlinkSync(tempLocalFile);
  console.log('Deleted local file.');
  // Indicate that the message has been moderated.
  await admin.firestore().collection('messages').doc(messageId).update({moderated: true});
  console.log('Marked the image as moderated in the database.');
}