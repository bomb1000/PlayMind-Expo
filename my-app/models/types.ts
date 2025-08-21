export type BookStatus = 'new' | 'uploading' | 'processing' | 'ready' | 'failed';

export interface Book {
  id: string; // A unique identifier, e.g., timestamp + filename
  fileName: string;
  sourceUri: string; // The original URI from the document picker
  gcsUploadPath?: string; // The path in GCS where the PDF is uploaded
  status: BookStatus;
  processedText?: string; // The OCR'd text
  error?: string; // To store any error messages
}
