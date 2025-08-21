# PlayMind-Expo: AI-Powered PDF Ebook Reader & Mind Model Refinement App

This an [Expo](https://expo.dev) project designed to be an intelligent ebook reader that helps users deeply understand PDF-based knowledge materials (especially tool-oriented books) and refine their mental models through AI-driven analysis and situational practice.

## Core Vision

The primary goal of this application is to leverage the power of Artificial Intelligence (AI), particularly Large Language Models (LLMs like Google Gemini) and Optical Character Recognition (OCR via services like Google Cloud Vision AI), to:

1.  **Unlock PDF Content**: Efficiently extract and structure text from PDF documents, including scanned images within PDFs (via OCR).
2.  **Facilitate "Close Reading"**: Provide AI tools to help users engage deeply with the content, such as:
    *   Automated summarization.
    *   Key concept extraction and explanation.
    *   Clarification of complex passages.
    *   AI-assisted Q&A about the content.
3.  **Distill Mental Models**: Assist users in identifying and articulating the core mental models, frameworks, or methodologies presented in the books.
4.  **Refine Mental Models through Practice**: Offer AI-generated situational simulation exercises where users can apply their distilled mental models to real-world scenarios, receive feedback, and thereby sharpen their understanding and application skills.

## Current Development Stage & Features (MVP - Simulated Backend)

The project is currently in **Phase 2 (Initial Implementation)** of its development, with a focus on building out the core user experience workflow with a **simulated backend**. This means that while the app's UI and frontend logic for AI interactions are being developed, the actual calls to cloud AI services (OCR, LLM) are currently mocked.

**Key Implemented/Prototyped Features (Frontend with Mocked Backend):**

*   **PDF Import & Library Management (`EbookLibraryScreen.tsx`)**:
    *   Users can select PDF files from their device using `expo-document-picker`.
    *   A (simulated) workflow for uploading the PDF to cloud storage (GCS) and triggering a (simulated) cloud OCR process (Google Cloud Vision AI) is in place.
    *   The app tracks and displays the status of each book (e.g., `uploading`, `ocr_processing`, `ocr_completed`, `ocr_failed`).
    *   Users can "refresh" the status of books undergoing OCR, which invokes a (simulated) API call to fetch processed content.
    *   Book metadata and (simulated) processed content are stored locally using `AsyncStorage`.
*   **Ebook Reader (`EbookReaderScreen.tsx`)**:
    *   Displays (simulated) text content extracted from PDFs.
    *   Text is selectable for future interaction.
    *   **AI-Assisted Reading Tools (prototyped with mocked Gemini calls)**:
        *   **Full-Text Summarization**: Button to get an AI-generated summary of the entire book content.
        *   **Key Concept Extraction (Per Chapter)**: Button on each chapter to extract key concepts. Results are shown in a modal.
        *   **Concept Explanation**: Within the key concepts modal, each concept has an "Explain" button to get a detailed AI-generated explanation.
*   **Backend Design (Conceptual with Mocked Frontend API Service)**:
    *   Detailed interface design for Firebase Functions that would serve as a backend proxy for:
        *   Generating secure GCS upload URLs.
        *   Triggering and managing Google Cloud Vision AI OCR tasks.
        *   Processing and structuring OCR results.
        *   Proxying requests to Google Gemini for various NLP tasks.
    *   An `apiService.ts` on the frontend simulates calls to these conceptual backend functions.

## Technology Stack (Planned & Prototyped)

*   **Frontend**: React Native with Expo
*   **Language**: TypeScript
*   **State Management**: React Context/Hooks (with `AsyncStorage` for persistence in MVP)
*   **Backend (Conceptual/Planned)**: Firebase Functions (Node.js/TypeScript)
*   **Cloud Services (Planned Integration)**:
    *   Google Cloud Storage (GCS): For PDF file storage.
    *   Google Cloud Vision AI: For PDF OCR (Document Text Detection).
    *   Google Gemini (via Vertex AI or Google AI Studio): For LLM-based text analysis, Q&A, and situational simulation generation.

## Getting Started (Current State - For Developers)

1.  **Clone the repository.**
2.  **Install dependencies**:
    ```bash
    cd my-app
    npm install
    # or
    yarn install
    ```
3.  **Run the app**:
    ```bash
    npx expo start
    ```
    This will open the Expo Dev Tools, allowing you to run the app on an emulator/simulator or on a physical device using the Expo Go app.

    _Note: As the backend is currently simulated in the frontend API service, no actual cloud service setup is required to run and test the current UI workflow._

## Next Steps (Roadmap)

*   **Phase 1 Completion (Backend Implementation)**:
    *   Implement the designed Firebase Functions.
    *   Integrate with actual Google Cloud Vision AI and Gemini APIs.
    *   Set up Google Cloud Storage and necessary IAM permissions.
*   **Phase 2 Continued (AI-Assisted Reading & Mind Model Distillation)**:
    *   Implement AI-assisted Q&A.
    *   Design and implement UI/UX for users to collaboratively (with AI) mark, define, and structure mental models from the text.
*   **Phase 3 (AI Situational Simulation Exercises)**:
    *   Develop AI logic (prompts and interaction flows with Gemini) to generate relevant situational simulations based on the distilled mental models.
    *   Implement UI for AI demonstration of model application in scenarios.
    *   Implement UI for user practice within these simulations, including AI feedback mechanisms.

## Contributions

(Details on how to contribute, if applicable, can be added here later.)
