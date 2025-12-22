import { initializeApp, getApp, getApps } from 'firebase/app';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { getStorage, ref, getDownloadURL, uploadBytes, listAll } from 'firebase/storage';
import { Book } from '../models/types';

const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_AUTH_DOMAIN,
  projectId: process.env.EXPO_PUBLIC_PROJECT_ID,
  storageBucket: 'playmind-ai-reader.firebasestorage.app',
  messagingSenderId: process.env.EXPO_PUBLIC_MESSAGING_SENDER_ID,
  appId: process.env.EXPO_PUBLIC_APP_ID
};

// Ensure critical configuration is present
if (!firebaseConfig.apiKey || !firebaseConfig.projectId) {
  console.warn(
    'Firebase configuration is missing or incomplete. Please check your .env file. See .env.example for details.'
  );
}

// Initialize Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const functions = getFunctions(app);
const storage = getStorage(app);

// --- Callable Functions ---

// Note: In a real app, you'd want to specify the region if your functions are not in us-central1
const generateUploadUrl = httpsCallable(functions, 'generateUploadUrl');
const getAiSummary = httpsCallable(functions, 'getAiSummary');
const getAiConcepts = httpsCallable(functions, 'getAiConcepts');
const processPdf = httpsCallable(functions, 'processPdf');

export const apiService = {
  /**
   * Gets a signed URL for uploading a file.
   * @deprecated logic moved to client-side upload
   */
  getUploadUrl: async (fileName: string, contentType: string): Promise<string> => {
    try {
      const result = await generateUploadUrl({ fileName, contentType });
      return (result.data as { url: string }).url;
    } catch (error) {
      console.error('Error getting upload URL:', error);
      throw new Error('Could not get upload URL.');
    }
  },

  /**
   * Uploads a file directly to Firebase Storage using the Client SDK.
   * This bypasses the need for Signed URLs and backend service account permissions.
   */
  uploadFile: async (fileName: string, fileUri: string, contentType: string, userId: string = 'user-id-placeholder') => {
    try {
      console.log('Starting direct upload for:', fileName);

      // Step 1: Convert file URI to Blob
      const fileResponse = await fetch(fileUri);
      const blob = await fileResponse.blob();

      // Sanitize filename to avoid path issues with special characters (e.g. spaces, colons)
      const sanitizedFileName = fileName.replace(/[^a-zA-Z0-9.-]/g, '_');
      console.log('Sanitized filename:', sanitizedFileName);

      // Step 2: Create Storage Reference
      const filePath = `uploads/${userId}/${sanitizedFileName}`;
      // uploadBytes imported at top level
      const storageRef = ref(storage, filePath);

      // Step 3: Upload via Client SDK
      await uploadBytes(storageRef, blob, { contentType });

      console.log('Direct upload successful!');
      return filePath;
    } catch (error) {
      console.error('Error during direct file upload:', error);
      throw error;
    }
  },

  /**
   * Tells the backend to start processing a newly uploaded PDF.
   */
  startPdfProcessing: async (gcsPath: string): Promise<void> => {
    try {
      await processPdf({ gcsPath });
      console.log('Successfully triggered PDF processing for:', gcsPath);
    } catch (error: any) {
      console.error('Error triggering PDF processing:', error);
      throw new Error(`Could not start PDF processing: ${error.message}`);
    }
  },

  /**
   * Downloads and returns the processed OCR text for a book.
   */
  getProcessedText: async (book: Book): Promise<string | null> => {
    if (!book.gcsUploadPath) return null;

    // This path is based on the backend logic in `processPdf`.
    const outputPrefix = book.gcsUploadPath.replace('uploads/', 'processed/').replace('.pdf', '');
    const outputDir = `${outputPrefix}_ocr_output/`;

    try {
      // List files in the output directory
      console.log(`[DEBUG] Checking for files in: ${outputDir}`);
      const folderRef = ref(storage, outputDir);
      const listResult = await listAll(folderRef);
      console.log(`[DEBUG] Found ${listResult.items.length} files.`);
      listResult.items.forEach(i => console.log(`[DEBUG] File: ${i.name}`));

      if (listResult.items.length === 0) {
        return null; // No files yet, processing likely still in progress
      }

      // Find the first JSON output file
      const jsonFile = listResult.items.find(item => item.name.endsWith('.json'));

      if (!jsonFile) {
        return null; // Folder exists but no JSON file yet?
      }

      const url = await getDownloadURL(jsonFile);
      const response = await fetch(url);
      if (!response.ok) return null; // Not ready yet

      const data = await response.json();
      // The Vision AI JSON output is complex. We parse it to get the full text.
      return data.responses.map((res: any) => res.fullTextAnnotation?.text || '').join('\n\n');
    } catch (error: any) {
      // If the folder doesn't exist yet, listAll might throw or return empty.
      // storage/object-not-found is common for getDownloadURL, strictly speaking listAll throws 'storage/object-not-found' if the *parent* bucket is missing, but here the path is virtual so it usually just returns empty.
      console.warn("Checking processed text status...", error.code || error.message);
      return null;
    }
  },

  /**
   * Calls the backend to get an AI summary.
   */
  getSummary: async (text: string): Promise<string> => {
    try {
      const result = await getAiSummary({ text });
      return (result.data as { summary: string }).summary;
    } catch (error) {
      console.error('Error getting AI summary:', error);
      throw new Error('Could not get AI summary.');
    }
  },

  /**
   * Calls the backend to get AI-extracted concepts.
   */
  getConcepts: async (text: string): Promise<any[]> => {
    try {
      const result = await getAiConcepts({ text });
      return (result.data as { concepts: any[] }).concepts;
    } catch (error) {
      console.error('Error getting AI concepts:', error);
      throw new Error('Could not get AI concepts.');
    }
  }
};