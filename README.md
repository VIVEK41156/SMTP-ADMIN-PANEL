# Web Digital Mantra - SMTP Admin Panel 🚀

This is a full-stack application built for **Web Digital Mantra** to seamlessly manage and send branded HTML emails via any SMTP provider.

## 🛠️ Technology Stack

- **Frontend**: React.js (v19)
- **UI & Styling**: Vanilla CSS3 (Glassmorphism design system) & Lucide React Icons
- **Backend API**: Node.js & Express.js
- **Email Engine**: Nodemailer
- **Deployment Infrastructure**: Vercel (Static Frontend + Serverless Functions)

## 🏗️ Architecture Overview

The system operates on a modern Client-Server REST API architecture:

1. **The React Frontend** handles all user interactions, maintaining state dynamically without page reloads.
2. **The Express Backend** intercepts API requests (like `/api/send-email`).
3. **Dynamic Template Engine**: Before sending, the backend passes the user's raw text through a custom HTML builder (`buildHtmlEmail`). This wraps the text in a highly professional, mobile-responsive template styled with the brand's colors (`#c0392b` and `#1a3a6e`).
4. **CID Image Embedding**: To bypass aggressive email client image blockers (which usually block `base64` or external HTTP links), the backend natively embeds the actual company logo as a CID attachment directly inside the MIME email payload. This guarantees the logo renders instantly for the recipient.
5. **Vercel Serverless Optimization**: The backend utilizes an intelligent in-memory fallback cache to safely run on Vercel's strict Read-Only file system, ensuring total cloud compatibility without requiring an external database.

## 🚀 How to Run Locally

1. Clone the repository
2. Install dependencies for the frontend and backend:
   ```bash
   npm install
   cd server && npm install
   ```
3. Start the application:
   ```bash
   npm start          # Starts the React Frontend (Port 3000)
   cd server && node index.js  # Starts the Express Backend (Port 5000)
   ```
