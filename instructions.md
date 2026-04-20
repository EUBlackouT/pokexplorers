# Pokémon Explorers - Development & Migration Guide

This document provides a detailed overview of the project's architecture, tech stack, and setup instructions for moving the project from AI Studio to a standalone environment (like Cursor/VS Code).

## 1. Project Overview
**Pokémon Explorers** is a full-stack React application built with a unique architecture that combines a high-performance frontend for game mechanics with a Node.js backend for audio proxying and real-time multiplayer.

### Key Technologies:
- **Frontend**: React 18, Vite, TypeScript, Framer Motion (for animations).
- **Backend**: Node.js, Express (hosting the application and audio proxy).
- **Real-time Multiplayer**: Socket.io (Low-latency) & Firebase/Firestore (Persistent state).
- **Audio System**: Custom Web Audio API implementation with procedural fallbacks.
- **Styling**: Tailwind CSS.

## 2. Architecture & Services

### Audio System (`/services/soundService.ts` & `/server.ts`)
The audio system is highly resilient due to browser sandboxing constraints:
- **Server Proxy**: The backend `/api/audio-proxy` fetches audio files server-side to bypass CORS and Referer restrictions from sources like Smogon and PokeAPI.
- **Web Audio API**: Uses `AudioContext` and `bufferCache` instead of legacy `<audio>` tags for precision and reliability.
- **Procedural Fallbacks**: If an external sound fails to load, the system synthesizes a "thump" or "hit" sound directly in code so the user never experiences silence.
- **Mirrors**: A cascading mirror system checks multiple CDN sources (GitHub, JSDelivr, Showdown) in order.

### Multiplayer & Persistence (`/services/multiplayer.ts` & `/server.ts`)
- **Firestore**: Handles room management, persistent game state, and high-level sync.
- **Socket.io**: Initialized in `server.ts` to handle low-latency events (move animations, emotes) that don't need to be saved in the database forever.
- **Portability**: The system uses standard `socket.io-client` on the frontend and `socket.io` on the backend.

## 3. Standalone Setup (Cursor / Local)

### Prerequisites:
- **Node.js**: v18 or higher.
- **npm**: Standard installation.

### Local Installation:
1. **Clone the Repo**: After exporting to GitHub, clone it to your machine.
2. **Install Dependencies**:
   ```bash
   npm install
   ```
3. **Environment Variables**:
   Create a `.env` file in the root directory. You can find the values in `firebase-applet-config.json`.
   ```env
   VITE_FIREBASE_API_KEY=your_key
   VITE_FIREBASE_AUTH_DOMAIN=your_domain
   VITE_FIREBASE_PROJECT_ID=your_id
   VITE_FIREBASE_APP_ID=your_app_id
   VITE_GEMINI_API_KEY=your_google_ai_key (if using AI features)
   ```
4. **Run Development Mode**:
   This project uses `tsx server.ts` to run both the backend and frontend simultaneously via Vite middleware.
   ```bash
   npm run dev
   ```

## 4. Firebase Configuration
The project is already configured with Firebase. The following files are critical:
- `firebase-applet-config.json`: Contains your connection keys.
- `firestore.rules`: Contains the security rules that must be deployed to the Firebase Console.
- `firebase-blueprint.json`: The data schema for your Firestore collections.

To deploy rules locally, you can use the Firebase CLI:
```bash
firebase deploy --only firestore:rules
```

## 5. UI/UX Guidelines (Custom Rules)
- **Aesthetics**: Adhere strictly to the `AGENTS.md` rules regarding Pokémon anime-style backgrounds and specific Pokémon-themed typography.
- **Audio Rules**: No rock music; keep it 8-bit or orchestral.

## 6. Directory Structure
- `/src`: Main React source code.
- `/services`: Core logic (Audio, Multiplayer, Pokémon data).
- `/data`: Static game data (Moves, Abilities, Fusions).
- `server.ts`: The entry point for the full-stack application.
