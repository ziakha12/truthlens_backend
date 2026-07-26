# Fake News Detector — Backend

Node.js + Express + MongoDB backend for the Fake News Detector mobile app.
Uses Gemini API (Google AI Studio) to analyze text / audio / video and return a
credibility score, false flags, and a brief explanation. All analysis routes
are protected — a user must sign up / log in first. Every analysis is saved as
a "chat" so the mobile app can show history, like ChatGPT.

## Folder Structure

```
fake-news-backend/
├── src/
│   ├── app.js                  # express app, middlewares, route mounting
│   ├── index.js                # entry point - loads env, connects db, starts server
│   ├── db/
│   │   └── connectDB.js
│   ├── models/
│   │   ├── user.model.js
│   │   └── chat.model.js
│   ├── controllers/
│   │   ├── auth.controller.js
│   │   └── chat.controller.js
│   ├── routes/
│   │   ├── auth.routes.js
│   │   └── chat.routes.js
│   ├── middlewares/
│   │   ├── auth.middleware.js   # verifies accessToken (JWT)
│   │   ├── multer.middleware.js # handles audio/video upload
│   │   └── error.middleware.js  # global error handler
│   └── utils/
│       ├── ApiError.js
│       ├── ApiResponse.js
│       ├── asyncHandler.js
│       └── geminiService.js     # calls Gemini API (put your AI Studio prompt here)
├── temp/                        # temporary storage for uploaded media (auto-cleaned)
├── .env.example
├── .gitignore
└── package.json
```

## Setup

1. Install dependencies:
   ```
   npm install
   ```

2. Copy `.env.example` to `.env` and fill in real values:
   ```
   cp .env.example .env
   ```
   - `MONGODB_URI` → your local Mongo or MongoDB Atlas connection string (without db name)
   - `ACCESS_TOKEN_SECRET` / `REFRESH_TOKEN_SECRET` → any long random strings
   - `GEMINI_API_KEY` → from Google AI Studio

3. Put your exact tested prompt from AI Studio inside
   `src/utils/geminiService.js` → `ANALYSIS_PROMPT` constant. Keep the
   "respond ONLY with valid JSON" instruction so parsing keeps working.

4. Run in dev mode (auto-restarts on file changes):
   ```
   npm run dev
   ```

5. Run in production:
   ```
   npm start
   ```

## API Endpoints

### Auth (public unless noted)
| Method | Endpoint                     | Body                                | Notes |
|--------|------------------------------|--------------------------------------|-------|
| POST   | /api/v1/auth/signup          | `{ name, email, password }`          | returns `accessToken` + `refreshToken` |
| POST   | /api/v1/auth/login           | `{ email, password }`                | returns `accessToken` + `refreshToken` |
| POST   | /api/v1/auth/refresh-token   | `{ refreshToken }`                   | returns new tokens |
| POST   | /api/v1/auth/logout          | —  (protected)                       | requires `Authorization: Bearer <accessToken>` |
| GET    | /api/v1/auth/me              | —  (protected)                       | returns logged-in user info |

### Chats (all protected — require `Authorization: Bearer <accessToken>`)
| Method | Endpoint                | Body / Form-data                                   | Notes |
|--------|--------------------------|-----------------------------------------------------|-------|
| POST   | /api/v1/chats/analyze     | `{ text }` (JSON) OR form-data file field `media`    | text → JSON body; audio/video → multipart form-data |
| GET    | /api/v1/chats             | query: `?page=1&limit=20`                            | list history (newest first) |
| GET    | /api/v1/chats/:chatId     | —                                                     | single chat detail |
| DELETE | /api/v1/chats/:chatId     | —                                                     | delete a chat |

## Mobile App Integration Notes

- Mobile app should store `accessToken` (short-lived) and `refreshToken`
  (long-lived) securely (e.g. Keychain / EncryptedSharedPreferences), NOT in
  plain storage.
- Send `accessToken` on every protected request:
  `Authorization: Bearer <accessToken>`
- When a request fails with 401 (expired token), call
  `/api/v1/auth/refresh-token` with the stored `refreshToken` to get a new pair,
  then retry the original request.
- For video/audio analysis, send as `multipart/form-data` with the file under
  field name `media`. For text analysis, send normal JSON: `{ "text": "..." }`.
