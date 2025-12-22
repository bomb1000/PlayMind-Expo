const { Storage } = require('@google-cloud/storage');
const path = require('path');

// Replace with your bucket name from .env
const BUCKET_NAME = 'playmind-ai-reader.firebasestorage.app';

// This script uses your local gcloud/firebase credentials
const storage = new Storage();

const corsConfiguration = [
    {
        origin: ['*'],
        method: ['GET', 'PUT', 'POST', 'DELETE', 'HEAD'],
        responseHeader: ['Content-Type'],
        maxAgeSeconds: 3600,
    },
];

async function setStorageCors() {
    try {
        console.log(`Setting CORS for bucket: ${BUCKET_NAME}...`);
        await storage.bucket(BUCKET_NAME).setCorsConfiguration(corsConfiguration);
        console.log('✅ Success! CORS configuration updated.');
    } catch (err) {
        console.error('❌ Error setting CORS:', err.message);
        console.log('\nPossible fixes:');
        console.log('1. Make sure you are logged in: firebase login');
        console.log('2. Ensure you have the right permissions for this project.');
    }
}

setStorageCors();
