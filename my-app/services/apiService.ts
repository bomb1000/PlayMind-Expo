import { initializeApp, getApp, getApps } from 'firebase/app';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { getStorage, ref, getDownloadURL } from 'firebase/storage';
import * as FileSystem from 'expo-file-system';
import { Book } from '../models/types';

// TODO: Replace with your actual Firebase config from your Firebase project settings
const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_AUTH_DOMAIN,
  projectId: process.env.EXPO_PUBLIC_PROJECT_ID,
  storageBucket: process.env.EXPO_PUBLIC_STORAGE_BUCKET,
  messagingSenderId: process.env.EXPO_PUBLIC_MESSAGING_SENDER_ID,
  appId: process.env.EXPO_PUBLIC_APP_ID
};

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
   */
  getUploadUrl: async (fileName: string, contentType: string): Promise<string> => {
    try {
      // Auth is required by the backend function, but for this MVP prototype,
      // we assume the user is implicitly authenticated or rules are open.
      // In a real app, you would handle user login with Firebase Auth.
      const result = await generateUploadUrl({ fileName, contentType });
      return (result.data as { url: string }).url;
    } catch (error) {
      console.error('Error getting upload URL:', error);
      throw new Error('Could not get upload URL.');
    }
  },

  /**
   * Uploads a file to GCS using the signed URL.
   */
  uploadFile: async (uploadUrl: string, fileUri: string, contentType: string) => {
    const uploadResponse = await FileSystem.uploadAsync(uploadUrl, fileUri, {
      httpMethod: 'PUT',
      headers: {
        'Content-Type': contentType,
      },
      uploadType: FileSystem.FileSystemUploadType.BINARY_CONTENT,
    });

    // Check for non-successful status codes (GCS signed URL uploads return 200 on success)
    if (uploadResponse.status < 200 || uploadResponse.status >= 300) {
      console.error('Upload failed with status:', uploadResponse.status, 'and message:', uploadResponse.body);
      throw new Error(`File upload failed. Server responded with status ${uploadResponse.status}`);
    }
  },

  /**
   * Tells the backend to start processing a newly uploaded PDF.
   */
  startPdfProcessing: async (gcsPath: string): Promise<void> => {
    try {
      await processPdf({ gcsPath });
      console.log('Successfully triggered PDF processing for:', gcsPath);
    } catch (error) {
      console.error('Error triggering PDF processing:', error);
      throw new Error('Could not start PDF processing.');
    }
  },

  /**
   * Downloads and returns the processed OCR text for a book.
   */
  getProcessedText: async (book: Book): Promise<string | null> => {
    if (!book.gcsUploadPath) return null;

    // This path is based on the backend logic in `processPdf`. It might need adjustment.
    const outputPrefix = book.gcsUploadPath.replace('uploads/', 'processed/').replace('.pdf', '');
    const processedPath = `${outputPrefix}_ocr_output/output-1-to-100.json`;

    try {
      const url = await getDownloadURL(ref(storage, processedPath));
      const response = await fetch(url);
      if (!response.ok) return null; // Not ready yet

      const data = await response.json();
      // The Vision AI JSON output is complex. We parse it to get the full text.
      return data.responses.map((res: any) => res.fullTextAnnotation?.text || '').join('\\n\\n');
    } catch (error: any) {
      // It's common for this to fail if the file isn't ready (e.g., 404 Not Found).
      if (error.code !== 'storage/object-not-found') {
          console.error("Error fetching processed text:", error);
      }
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