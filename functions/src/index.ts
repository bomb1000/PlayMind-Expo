import * as admin from "firebase-admin";
import * as functions from "firebase-functions";
import vision from "@google-cloud/vision";
import { GoogleGenerativeAI } from "@google/generative-ai";

admin.initializeApp();
const visionClient = new vision.ImageAnnotatorClient();

const BUCKET_NAME = "playmind-ai-reader.firebasestorage.app";

// Helper to get GenAI model dynamically
function getGeminiModel() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("GEMINI_API_KEY not set");
  const genAI = new GoogleGenerativeAI(apiKey);
  // Using gemini-1.5-flash-latest as a more stable alias
  return genAI.getGenerativeModel({ model: "gemini-1.5-flash-latest" });
}

export const generateUploadUrl = functions.https.onCall(async (data, context) => {
  // AUTH CHECK REMOVED FOR MVP
  const { fileName, contentType } = data;
  if (!fileName || !contentType) {
    throw new functions.https.HttpsError("invalid-argument", "The function must be called with a 'fileName' and 'contentType' argument.");
  }
  // Use a placeholder user ID if not authenticated
  const userId = context.auth?.uid || "guest-user";
  const filePath = `uploads/${userId}/${fileName}`;
  const options = {
    version: "v4" as const,
    action: "write" as const,
    expires: Date.now() + 15 * 60 * 1000,
    contentType: contentType,
  };
  try {
    console.log(`Generating signed URL for bucket: ${BUCKET_NAME}, path: ${filePath}`);
    const [url] = await admin.storage().bucket(BUCKET_NAME).file(filePath).getSignedUrl(options);
    console.log("Signed URL generated successfully.");
    return { url };
  } catch (error) {
    console.error("Error creating signed URL:", error);
    throw new functions.https.HttpsError("internal", "Unable to create signed URL.");
  }
});

export const processPdf = functions
  .runWith({ secrets: ["GEMINI_API_KEY"], timeoutSeconds: 300 })
  .https.onCall(async (data, context) => {
    // AUTH CHECK REMOVED FOR MVP
    const { gcsPath } = data;
    if (!gcsPath) {
      throw new functions.https.HttpsError("invalid-argument", "The function must be called with a 'gcsPath' argument.");
    }
    const bucket = BUCKET_NAME;
    const name = gcsPath;
    console.log(`Processing file: ${name} in bucket ${bucket}`);
    const gcsSourceUri = `gs://${bucket}/${name}`;

    // Logic must match Front-end expectation
    // Input: uploads/userId/_External___Request_for_401k_pension_distribution.pdf
    // Output Dir: processed/userId/_External___Request_for_401k_pension_distribution_ocr_output/

    // We expect "uploads/" to be replaced by "processed/" and the extension removed.
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
      const [result] = await operation.promise();
      console.log(`OCR operation completed for ${name}`);

      // Inspect the result for inner errors
      if (result.responses) {
        (result.responses as any).forEach((res: any, idx: number) => {
          if (res.error) {
            console.error(`Page/File ${idx} Error: ${res.error.message}, Code: ${res.error.code}`);
          } else {
            console.log(`Page/File ${idx} status: Success?`);
          }
        });
      }

      console.log(`Verifying Output at URI: ${gcsDestinationUri}`);

      // Verify if files exist immediately
      const prefix = outputPrefix + "_ocr_output/";
      const [files] = await admin.storage().bucket(bucket).getFiles({ prefix });
      console.log(`Backend found ${files.length} files in prefix ${prefix}`);
      files.forEach(f => console.log(`Backend File: ${f.name}`));

      if (files.length === 0) {
        console.error("CRITICAL: OCR finished but no files found! Listing 'processed/' root to debug...");
        const [allFiles] = await admin.storage().bucket(bucket).getFiles({ prefix: 'processed/', maxResults: 20 });
        allFiles.forEach(f => console.log(`[DEBUG_DUMP] Found file: ${f.name}`));
        throw new functions.https.HttpsError("internal", "OCR finished but no output generated. Check logs for DEBUG_DUMP.");
      }

      return null;
    } catch (error) {
      console.error(`Error starting OCR for ${name}:`, error);
      throw new functions.https.HttpsError("internal", `OCR failed: ${error}`);
    }
  });

export const getAiSummary = functions
  .runWith({ secrets: ["GEMINI_API_KEY"] })
  .https.onCall(async (data, context) => {
    // AUTH CHECK REMOVED FOR MVP
    const { text } = data;
    if (!text) {
      throw new functions.https.HttpsError("invalid-argument", "The function must be called with a 'text' argument.");
    }
    try {
      const prompt = `Summarize the following text in a few concise paragraphs:\n\n${text}`;
      const geminiModel = getGeminiModel();
      const result = await geminiModel.generateContent(prompt);
      const response = result.response;
      const summary = response.text();
      return { summary };
    } catch (error) {
      console.error("Error generating summary with Gemini:", error);
      throw new functions.https.HttpsError("internal", "Unable to generate summary.");
    }
  });

export const getAiConcepts = functions
  .runWith({ secrets: ["GEMINI_API_KEY"] })
  .https.onCall(async (data, context) => {
    // AUTH CHECK REMOVED FOR MVP
    const { text } = data;
    if (!text) {
      throw new functions.https.HttpsError("invalid-argument", "The function must be called with a 'text' argument.");
    }
    try {
      const prompt = `Extract the key concepts from the following text. For each concept, provide a title and a brief explanation. Return the result as a JSON array where each object has \"concept\" and \"explanation\" fields. Text:\n\n${text}`;
      const geminiModel = getGeminiModel();
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
