# PlayMind-Expo 🧠✨

PlayMind-Expo 是一款基於 AI 的智慧 PDF 閱讀助手，旨在為使用者提供最頂級、最流暢的數位閱讀與學習體驗。透過 Google Gemini AI 的強大功能，我們將枯燥的文檔轉化為易於吸收的知識精華。

## ✨ 核心亮點

### 🎨 頂級 UI/UX 設計
*   **Glassmorphism (玻璃擬態)**：全 App 採用現代化的毛玻璃視覺風格，營造深邃且具科技感的氛圍。
*   **Indigo & Purple 科技色調**：精心調配的深色與淺色模式，保護視力的同時兼具極致美感。
*   **沉浸式閱讀體驗**：零遮擋的閱讀介面，AI 功能巧妙整合於標題欄，讓您專注於內容本身。
*   **動態佈局優化**：智慧偵測系統環境，自動避開導航欄遮擋，確保操作順手。

### 🤖 AI 智慧功能
*   **一鍵智慧總結 (AI Summary)**：利用 Google Gemini AI 快速提取文檔核心摘要。
*   **關鍵概念提取 (Key Concepts)**：自動識別文檔中的重要概念並提供詳細解釋。
*   **OCR 文字辨識**：整合 Google Cloud Vision API，精準將 PDF 轉化為可互動的文字。

### 📱 現代化技術棧
*   **前端**：Expo (React Native) + TypeScript + Expo Router
*   **後端**：Firebase Functions (Node.js)
*   **AI 引擎**：Google Generative AI (Gemini Pro) & Google Cloud Vision

## 📈 專案現況與進展
*   ✅ **PDF 處理自動化**：已成功實作 PDF 上傳後自動觸發 Google Cloud Vision API 進行 OCR 辨識。
*   ✅ **儲存架構優化**：採用 Firebase Client SDK 直傳模式，解決了原本後端簽署 URL 的權限與計費障礙。
*   ✅ **檔名處理**：內建檔名過濾機制，自動處理特殊字元以確保雲端存儲路徑穩定。
*   🔄 **AI 功能調整中**：目前正在優化 Gemini 1.5 Flash 的整合，以提供更高品質的摘要與概念分析。

## 📱 啟動說明

### 前端應用 (my-app)
1. 安裝依賴：`npm install`
2. 啟動：`npx expo start`

### 後端函數 (functions)
1. 安裝依賴：`cd functions && npm install`
2. 編譯：`npm run build`
3. 部署：`firebase deploy --only functions`

---
由 **PlayMind Team** 傾力打造，致力於重新定義 AI 時代的閱讀方式。
