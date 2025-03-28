# Form Saathi - Project Overview

## 📄 Introduction
Form Saathi is a mobile-first, voice-based web assistant designed to help low-literacy, non-English-speaking users across India understand and fill out forms. It is built for users like gig workers, delivery agents, helpers, and citizens accessing government benefits who often struggle with English forms or digital interfaces.

Form Saathi transforms form-filling into a **voice-first, language-inclusive, and accessible** experience using APIs provided by **Sarvam AI**.

---

## 🔧 Core Functionality

### User Goals:
- Upload a screenshot or PDF of a form.
- Select or speak their preferred language.
- Ask questions about the form using voice.
- Receive easy-to-understand explanations for each field in text and audio, in their own language.

---

## 🎓 User Flow Summary

1. **File Upload**
   - User uploads a `.jpg`, `.png`, or `.pdf` file.
   - The file is sent to Sarvam AI's `POST /sarvam-parse` endpoint.
   - Extracted text is parsed and scanned for potential form fields.

2. **Language Selection**
   - User is asked to select from a list of languages or speak their language.
   - If spoken, the audio is passed to `POST /language-identification` to auto-detect the language.

3. **Voice Query**
   - User speaks into the mic, asking for help (e.g., "Yeh form mein kya hai?").
   - Audio is sent to `POST /speech-to-text-translate`, returning English text.
   - System uses this to determine the user's intent (asking about the form).

4. **Explanation Generation**
   - System generates simple English explanations for each parsed form field.
   - Example: "Full Name" -> "This is your full name, as shown on your Aadhaar card."

5. **Translation**
   - Each explanation is translated to the user's selected language using `POST /translate-text`.

6. **Text-to-Speech**
   - Translated text is converted to speech using `POST /text-to-speech`.
   - The audio file is played back to the user alongside the translated text.

7. **Restart Option**
   - A restart button allows users to reset the flow (file upload + language + voice interaction).

---

## 🔄 Sarvam AI APIs Used

| Flow Step             | API Endpoint                    | Purpose                                             |
|----------------------|----------------------------------|-----------------------------------------------------|
| Parse Form Content   | `POST /sarvam-parse`            | Extracts text from uploaded images or PDFs          |
| Detect Language      | `POST /language-identification` | Identifies spoken language                         |
| Voice Input + Translate | `POST /speech-to-text-translate` | Converts voice to text, detects and translates     |
| Translate Explanation| `POST /translate-text`          | Translates explanations to selected language        |
| Speak Response       | `POST /text-to-speech`          | Converts translated text to audio speech            |

---

## 📊 Tech Stack

### Frontend:
- **React** (mobile-first layout)
- **Tailwind CSS** for styling
- **React Mic** for audio recording
- **Audio playback controls** for TTS responses

### Backend:
- **Node.js or Python (Flask)** (optional for orchestration)
- **API integration** with Sarvam endpoints

### Hosting:
- **Vercel** (frontend-only MVP)

---

## 🚀 Development Notes for Devs

### File Upload:
- Accept PDF or image files.
- Send as multipart/form-data to `/sarvam-parse`.
- Parse response to isolate relevant field labels (look for patterns like labels ending with ":", etc.)

### Voice Input:
- Use MediaRecorder API or `react-mic` to record user voice.
- Convert audio blob to base64 or file stream and send to `/speech-to-text-translate`.
- Parse returned text for intent (e.g., does it include "kya hai", "form", etc.).

### Translation:
- Create a mapping of field labels to short English explanations.
- Send each to `/translate-text` using selected or detected language.

### TTS:
- For each translated field, use `/text-to-speech` to get audio response.
- Autoplay or use tap-to-play for accessibility.

### UI Notes:
- High contrast colors, large touch targets
- Use Sarvam-inspired theme: light peach BG, orange highlights (`#FF6A1A`), gray-black text (`#2F2F2F`)

---

## 🎯 Upcoming Features
- Field-specific interaction: user taps a field and says "ye kya hai?"
- Voice form filling (Phase 2)
- Multi-page form parsing
- Support for saving or exporting filled values (PDF + JSON)
- Offline mode for low-connectivity areas

---

## ✨ Credits
Made by Sneha using Sarvam AI
Tool: **Form Saathi** — your voice guide for any form.

