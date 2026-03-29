# VoltSense AI - EEE Smart Meter Analytics

VoltSense AI is a hybrid AI platform (CNN + SVM) for digital meter reading extraction and power consumption analytics, localized for TANGEDCO (Tamil Nadu) standards.

## 🚀 Local Setup (VS Code)

To run this project locally, follow these steps:

### 1. Prerequisites
- **Node.js** (v18 or higher)
- **Gemini API Key**: Get one for free at [Google AI Studio](https://aistudio.google.com/app/apikey).

### 2. Environment Configuration
1. Create a `.env` file in the root directory.
2. Copy the contents of `.env.example` into `.env`.
3. Replace `your_gemini_api_key_here` with your actual API key.

```env
GEMINI_API_KEY=your_actual_key_here
```

### 3. Installation & Development
Open your terminal in VS Code and run:

```bash
# Install dependencies
npm install

# Start the full-stack development server
npm run dev
```

The app will be available at `http://localhost:3000`.

## 🛠️ Project Structure
- `src/App.tsx`: Main React application (Frontend).
- `server.ts`: Express server (Backend) with Vite middleware.
- `src/lib/utils.ts`: Localization, Billing Logic, and AI Interpretations.
- `history.json`: Local database for meter readings (auto-generated).

## 📊 Features
- **AI Meter Scanning**: Dual-model (CNN+SVM) verification.
- **TANGEDCO Billing**: Accurate slab-based cost estimation.
- **Bilingual Support**: English & Tamil.
- **EEE Analytics**: Power system load profile interpretations.

## ⚠️ Troubleshooting
If the meter analysis shows "Analysis failed":
1. Ensure your `.env` file is named correctly (not `.env.txt`).
2. Verify your API key is valid in [Google AI Studio](https://aistudio.google.com/app/apikey).
3. Check the VS Code terminal for any server-side errors.
