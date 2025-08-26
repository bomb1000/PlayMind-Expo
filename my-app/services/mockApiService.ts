import { Book } from '../models/types';

// This file simulates the behavior of the real apiService.ts for frontend development
// when the backend is unavailable.

// --- Mock Data ---

const MOCK_OCR_TEXT = `
This is the simulated text content of a processed PDF document. It is quite long to mimic a real book chapter.

Chapter 1: The Basics of Mocking

Mocking is a fundamental technique in modern software development. It involves creating objects that simulate the behavior of real objects. This is particularly useful when the real objects are impractical to use for testing purposes. For example, a real object might depend on external systems, have unpredictable behavior, or be slow.

By using a mock object, a test can be made more predictable and faster. The mock object can be configured to return specific values, throw exceptions, or verify that certain methods are called. This allows the test to focus on the behavior of the system under test, without being affected by the behavior of its dependencies.

There are many different mocking frameworks available for different programming languages. Some of the most popular ones include Mockito for Java, Moq for .NET, and Jest for JavaScript. These frameworks provide a rich set of features for creating and configuring mock objects.

In the context of this application, we are mocking the entire API service layer. This allows us to develop and test the frontend UI without needing a live connection to the Firebase backend and Google Cloud services. We can simulate file uploads, OCR processing, and AI-powered analysis, providing a complete and interactive development experience.

End of simulated chapter.
`;

const MOCK_SUMMARY = "This is a mock summary of the document. It highlights the key points about mocking, its benefits for testing by creating predictable and fast tests, and mentions popular frameworks like Jest. It also explains that the current implementation uses a mocked API service to enable frontend development without a live backend.";

const MOCK_CONCEPTS = [
  { concept: "Mocking", explanation: "A technique in software development where an object mimics the behavior of a real object, used primarily for testing." },
  { concept: "Predictable Tests", explanation: "Mocking helps in making tests more predictable by removing dependencies on external systems or unpredictable behavior." },
  { concept: "Mocking Frameworks", explanation: "Tools like Mockito, Moq, and Jest that provide features to create and configure mock objects easily." },
  { concept: "API Service Mocking", explanation: "The specific approach used in this app, where the entire API layer is simulated to allow for independent frontend development." }
];


// --- Mock API Implementation ---

// Helper function to simulate network delay
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const mockApiService = {
  getUploadUrl: async (fileName: string, contentType: string): Promise<string> => {
    console.log(`[MOCK] Getting upload URL for ${fileName}`);
    await sleep(300);
    return `https://mock-storage.com/upload-url-for/${fileName}`;
  },

  uploadFile: async (uploadUrl: string, fileUri: string, contentType: string) => {
    console.log(`[MOCK] "Uploading" file from ${fileUri} to ${uploadUrl}`);
    await sleep(1500); // Simulate upload time
    console.log('[MOCK] Upload complete.');
  },

  startPdfProcessing: async (gcsPath: string): Promise<void> => {
    console.log(`[MOCK] Triggering PDF processing for ${gcsPath}`);
    await sleep(200);
  },

  getProcessedText: async (book: Book): Promise<string | null> => {
    console.log(`[MOCK] Checking for processed text for book: ${book.title}`);
    // Simulate a "not ready yet" state for the first couple of tries
    const isReady = Math.random() > 0.3; // 70% chance of being ready
    if (!isReady) {
        console.log('[MOCK] OCR text not ready yet.');
        await sleep(1000);
        return null;
    }

    console.log('[MOCK] OCR text is ready. Returning mock content.');
    await sleep(800);
    return MOCK_OCR_TEXT;
  },

  getSummary: async (text: string): Promise<string> => {
    console.log('[MOCK] Generating AI summary...');
    await sleep(2000); // Simulate AI thinking time
    return MOCK_SUMMARY;
  },

  getConcepts: async (text: string): Promise<any[]> => {
    console.log('[MOCK] Extracting AI concepts...');
    await sleep(1500); // Simulate AI thinking time
    return MOCK_CONCEPTS;
  }
};
