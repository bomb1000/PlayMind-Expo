import * as admin from "firebase-admin";
import * as functions from "firebase-functions";
import { Storage } from "@google-cloud/storage";
// 修正後的版本
import vision from "@google-cloud/vision";
import { GoogleGenerativeAI } from "@google/generative-ai";

// Initialize Firebase Admin SDK
admin.initializeApp();
const storage = new Storage();
// 修正後的版本
const visionClient = new vision.ImageAnnotatorClient();

// (以下內容保持不變，但請確保您的檔案和這裡完全一致)
const geminiApiKey = process.env.GEMINI_API_KEY;
if (!geminiApiKey) {
  console.error("GEMINI_API_KEY environment variable not set.");
}
const genAI = new GoogleGenerativeAI(geminiApiKey!);
const geminiModel = genAI.getGenerativeModel({ model: "gemini-pro" });

const BUCKET_NAME = process.env.GCS_BUCKET || "your-default-bucket-name";

export const generateUploadUrl = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError("unauthenticated", "The function must be called while authenticated.");
  }
  const { fileName, contentType } = data;
  if (!fileName || !contentType) {
    throw new functions.https.HttpsError("invalid-argument", "The function must be called with a 'fileName' and 'contentType' argument.");
  }
  const userId = context.auth.uid;
  const filePath = `uploads/${userId}/${fileName}`;
  const options = {
    version: "v4" as const,
    action: "write" as const,
    expires: Date.now() + 15 * 60 * 1000,
    contentType: contentType,
  };
  try {
    const [url] = await storage.bucket(BUCKET_NAME).file(filePath).getSignedUrl(options);
    return { url };
  } catch (error) {
    console.error("Error creating signed URL:", error);
    throw new functions.https.HttpsError("internal", "Unable to create signed URL.");
  }
});

export const processPdf = functions.storage.object().onFinalize(async (object) => {
  const { bucket, name, contentType } = object;
  if (!contentType || !contentType.startsWith("application/pdf") || !name || !name.startsWith("uploads/")) {
    console.log(`File ${name} is not a PDF or not in the uploads folder. Skipping.`);
    return null;
  }
  if (bucket !== BUCKET_NAME) {
    console.log(`File is in bucket ${bucket}, but expected ${BUCKET_NAME}. Skipping.`);
    return null;
  }
  console.log(`Processing file: ${name}`);
  const gcsSourceUri = `gs://${bucket}/${name}`;
  const outputPrefix = name.replace("uploads/", "processed/").replace(".pdf", "");
  const gcsDestinationUri = `gs://${bucket}/${outputPrefix}_ocr_output/`;
  const request = {
    requests: [
      {
        inputConfig: { gcsSource: { uri: gcsSourceUri }, mimeType: "application/pdf" },
        features: [{ type: "DOCUMENT_TEXT_DETECTION" as const }],
        outputConfig: { gcsDestination: { uri: gcsDestinationUri }, batchSize: 100 },
      },
    ],
  };
  try {
    const [operation] = await visionClient.asyncBatchAnnotateFiles(request);
    console.log(`Started OCR operation for ${name}:`, operation.name);
    return null;
  } catch (error) {
    console.error(`Error starting OCR for ${name}:`, error);
    return null;
  }
});

export const getAiSummary = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError("unauthenticated", "The function must be called while authenticated.");
  }
  const { text } = data;
  if (!text) {
    throw new functions.https.HttpsError("invalid-argument", "The function must be called with a 'text' argument.");
  }
  try {
    const prompt = `Summarize the following text in a few concise paragraphs:\n\n${text}`;
    const result = await geminiModel.generateContent(prompt);
    const response = result.response;
    const summary = response.text();
    return { summary };
  } catch (error) {
    console.error("Error generating summary with Gemini:", error);
    throw new functions.https.HttpsError("internal", "Unable to generate summary.");
  }
});

export const getAiConcepts = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError("unauthenticated", "The function must be called while authenticated.");
  }
  const { text } = data;
  if (!text) {
    throw new functions.https.HttpsError("invalid-argument", "The function must be called with a 'text' argument.");
  }
  try {
    const prompt = `Extract the key concepts from the following text. For each concept, provide a title and a brief explanation. Return the result as a JSON array where each object has \"concept\" and \"explanation\" fields. Text:\n\n${text}`;
    const result = await geminiModel.generateContent(prompt);
    const response = result.response;
    const conceptsText = response.text().replace(/^```json\n/, '').replace(/\n```$/, '');
    const concepts = JSON.parse(conceptsText);
    return { concepts };
  } catch (error) {
    console.error("Error extracting concepts with Gemini:", error);
    throw new functions.https.HttpsError("internal", "Unable to extract concepts.");
  }
});