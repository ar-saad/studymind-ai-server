# 🧠 StudyMind AI — Server-Side API (Node.js & Express)

🌐 **[Live Demo Website](https://studymind-ai-client.vercel.app/)** | 🖥️ **[Client Repository](https://github.com/ar-saad/studymind-ai-client)** | ⚙️ **[Server Repository](https://github.com/ar-saad/studymind-ai-server)** | ☁️ **[Live Server API](https://studymind-ai-server.vercel.app/)**

[![Express](https://img.shields.io/badge/Express-5.2-blue?style=flat-square&logo=express)](https://expressjs.com/)
[![Prisma](https://img.shields.io/badge/Prisma-7.8.0-indigo?style=flat-square&logo=prisma)](https://prisma.io/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Neon_Cloud-blue?style=flat-square&logo=postgresql)](https://neon.tech/)
[![Google Gemini](https://img.shields.io/badge/Gemini_AI-2.5_Flash-orange?style=flat-square&logo=google-gemini)](https://deepmind.google/technologies/gemini/)
[![Winston Logger](https://img.shields.io/badge/Logger-Winston-brightgreen?style=flat-square)](https://github.com/winstonjs/winston)

Welcome to the server-side API repository of **StudyMind AI**. This service is built using **Node.js**, **Express.js**, and **TypeScript**, powered by **Prisma ORM** over **PostgreSQL** (Neon Cloud), and integrated with **Google Gemini AI** for content generation, **Better Auth** for secure sessions, and **Sentry** with **Winston** for production-grade logging and monitoring.

---

## ⚡ Core Tech Stack & Dependencies

- **Runtime & Server Framework**: Node.js & Express.js (v5.2.1)
- **Database & ORM**: PostgreSQL via [Neon](https://neon.tech/) & [Prisma Client v7.8.0](https://prisma.io/)
- **Authentication**: [Better Auth v1.6.9](https://better-auth.com/) (session management, user roles, database integrations)
- **Artificial Intelligence**: [@google/generative-ai v0.24.1](https://deepmind.google/technologies/gemini/) (`gemini-2.5-flash`)
- **Media Hosting**: [Cloudinary v2.10.0](https://cloudinary.com/) (avatar image uploads and processing)
- **Security & Logs**: [Helmet](https://helmetjs.github.io/), [Cors](https://github.com/expressjs/cors), [Morgan](https://github.com/expressjs/morgan), and [Winston v3.19.0](https://github.com/winstonjs/winston)
- **Monitoring**: [Sentry Node SDK v10.52.0](https://sentry.io/) (for live error and exception capturing)

---

## 📡 API Routing Catalog

### 1. Authentication Routes (`/api/auth`)

_The auth endpoints are handled and managed through Better Auth integration._

| Method   | Route                | Description                             | Auth Required |
| :------- | :------------------- | :-------------------------------------- | :------------ |
| **POST** | `/api/auth/register` | Register a new user                     | Public        |
| **POST** | `/api/auth/login`    | Login user, issues session cookie / JWT | Public        |
| **POST** | `/api/auth/google`   | Google OAuth token exchange             | Public        |
| **GET**  | `/api/auth/me`       | Fetch active logged-in user profile     | **Required**  |
| **POST** | `/api/auth/logout`   | Invalidate current user session         | **Required**  |

### 2. Topic Discovery Routes (`/api/topics`)

| Method   | Route                    | Description                                      | Auth Required |
| :------- | :----------------------- | :----------------------------------------------- | :------------ |
| **GET**  | `/api/topics`            | Query topics with pagination, filters, and sorts | Public        |
| **GET**  | `/api/topics/popular`    | Fetch the top 10 studied topics                  | Public        |
| **GET**  | `/api/topics/categories` | Retrieve list of all topic categories            | Public        |
| **GET**  | `/api/topics/:slug`      | Retrieve single topic metadata and ratings       | Public        |
| **POST** | `/api/topics/create`     | Trigger AI generation of a new topic             | **Required**  |
| **POST** | `/api/topics/:id/review` | Submit a star review and comment (limit 1)       | **Required**  |

### 3. AI Generation Endpoints (`/api/ai`)

| Method   | Route                 | Description                                              | Auth Required |
| :------- | :-------------------- | :------------------------------------------------------- | :------------ |
| **POST** | `/api/ai/study-guide` | Request Gemini-compiled structured study guide           | **Required**  |
| **POST** | `/api/ai/quiz`        | Generate an interactive 10-question multiple-choice quiz | **Required**  |
| **POST** | `/api/ai/chat`        | Send topic-scoped chat query to Gemini doubt solver      | **Required**  |

### 4. User Workspace Routes (`/api/user`)

| Method     | Route                     | Description                                                       | Auth Required |
| :--------- | :------------------------ | :---------------------------------------------------------------- | :------------ |
| **GET**    | `/api/user/study-history` | Fetch paginated list of past study sessions (max 5 for Free)      | **Required**  |
| **GET**    | `/api/user/quiz-results`  | Fetch paginated historical quiz scores & answers (max 5 for Free) | **Required**  |
| **GET**    | `/api/user/progress`      | Generate chart datasets: scores over time, study volumes          | **Required**  |
| **PUT**    | `/api/user/profile`       | Update profile information and Cloudinary avatarUrl               | **Required**  |
| **PUT**    | `/api/user/password`      | Change user password (requires verification)                      | **Required**  |
| **DELETE** | `/api/user/account`       | Permanently purge account and all associated user history         | **Required**  |

### 5. Admin Control Endpoints (`/api/admin`)

| Method     | Route                         | Description                                            | Auth Required |
| :--------- | :---------------------------- | :----------------------------------------------------- | :------------ |
| **GET**    | `/api/admin/stats`            | Platform-wide KPIs: User counts, conversion rates      | **Admin**     |
| **GET**    | `/api/admin/users`            | Query platform users list with search & ban toggles    | **Admin**     |
| **PUT**    | `/api/admin/users/:id/plan`   | Force change a user plan (`FREE` / `PRO`)              | **Admin**     |
| **PUT**    | `/api/admin/users/:id/status` | Set status to `ACTIVE` or `BANNED`                     | **Admin**     |
| **DELETE** | `/api/admin/users/:id`        | Purge any user profile                                 | **Admin**     |
| **GET**    | `/api/admin/topics`           | Query all topics including user-created ones           | **Admin**     |
| **PUT**    | `/api/admin/topics/:id`       | Update topic title, description, or difficulty         | **Admin**     |
| **DELETE** | `/api/admin/topics/:id`       | Purge any topic from database and study records        | **Admin**     |
| **GET**    | `/api/admin/generation-logs`  | Monitor all AI tokens, generation success and failures | **Admin**     |
| **GET**    | `/api/admin/topic-analytics`  | Aggregated analytics: popular topics, category shares  | **Admin**     |

---

## 🗄️ Database Schema & Architecture

The database schema is defined in [schema.prisma](file:///w:/personal-projects/studymind-ai/studymind-ai-server/prisma/schema.prisma) and operates over PostgreSQL. Key models include:

- **[User](file:///w:/personal-projects/studymind-ai/studymind-ai-server/prisma/schema.prisma#L32-L55)**: Manages authentication, user role (`USER` / `ADMIN`), billing tier (`FREE` / `PRO`), and daily rate limit counters (`dailyGenerations`, `topicsCreatedToday`, and `lastGenerationDate`).
- **[Category](file:///w:/personal-projects/studymind-ai/studymind-ai-server/prisma/schema.prisma#L57-L74)**: Pre-packaged list of academic fields (Science, History, Technology, etc.) which groups topics together.
- **[Topic](file:///w:/personal-projects/studymind-ai/studymind-ai-server/prisma/schema.prisma#L76-L86)**: Holds learning subjects. Nullable `createdByUserId` separates user-created topics from seeded ones.
- **[StudySession](file:///w:/personal-projects/studymind-ai/studymind-ai-server/prisma/schema.prisma#L88-L101)**: Created whenever a user opens a topic. Increments the `studyCount` of the topic.
- **[QuizResult](file:///w:/personal-projects/studymind-ai/studymind-ai-server/prisma/schema.prisma#L103-L112) & [QuizAnswer](file:///w:/personal-projects/studymind-ai/studymind-ai-server/prisma/schema.prisma#L114-L126)**: Saves multiple-choice outputs, score percentages, completion times, and answers to allow historical reviews.
- **[GenerationLog](file:///w:/personal-projects/studymind-ai/studymind-ai-server/prisma/schema.prisma#L128-L140)**: Audit trail logging AI call types (`GUIDE`, `QUIZ`, `CHAT`, `TOPIC_CREATE`), token consumptions, and exception tracking.
- **[Review](file:///w:/personal-projects/studymind-ai/studymind-ai-server/prisma/schema.prisma#L142-L154)**: Saves stars (1-5) and text commentaries. Constrained with a unique index on `(userId, topicId)` to allow only one review per user per topic.

---

## 🦾 Robust AI Integration Engineering

The server implements highly defensive software practices inside [ai.service.ts](file:///w:/personal-projects/studymind-ai/studymind-ai-server/src/app/modules/ai/ai.service.ts) to guarantee platform resilience:

### A. Automatic Reset of Daily Token Allowances

Before every generative call, the server compares `lastGenerationDate` with today's date. If it is a new day, the daily counter variables (`dailyGenerations`, `topicsCreatedToday`) are instantly reset to zero before validating limits:

```typescript
const today = new Date().toISOString().split("T")[0];
if (user.lastGenerationDate !== today) {
  await prisma.user.update({
    where: { id: userId },
    data: {
      dailyGenerations: 0,
      topicsCreatedToday: 0,
      lastGenerationDate: new Date(),
    },
  });
}
```

### B. Defensive JSON Stripping

LLM outputs can sometimes come packaged inside markdown block fences (` ```json ... ``` `). The server implements an active strip method to parse text outputs cleanly prior to converting them into structural objects:

````typescript
function parseAIResponse<T>(text: string): T {
  let cleaned = text.trim();
  if (cleaned.startsWith("```json")) cleaned = cleaned.slice(7);
  else if (cleaned.startsWith("```")) cleaned = cleaned.slice(3);
  if (cleaned.endsWith("```")) cleaned = cleaned.slice(0, -3);
  return JSON.parse(cleaned.trim()) as T;
}
````

### C. Automatic Generation Retries

If the Gemini API returns a deformed response or if JSON parsing fails, the system automatically loops and retries up to **2 times** before rejecting the call with a 500 error, reducing the error rate in production to near zero.

---

## 📁 Repository Directory Map

```
📁 src/
├── 📄 server.ts                      # App entrypoint, configures Sentry, Express, and Winston
└── 📁 app/                           # Core application directory
    ├── 📁 config/                    # Global configurations (Gemini client, database poolers)
    ├── 📁 middleware/                # Shared express handlers (Auth guard, global error interceptor)
    ├── 📁 utils/                     # Generic utility functions (Custom AppError, logger instances)
    └── 📁 modules/                   # Module-driven architecture domains
        ├── 📁 auth/                  # Authentication controllers and cookies
        ├── 📁 ai/                    # AI generative services, prompts, and rate limiters
        ├── 📁 topics/                # Topic routing, filtering logic, and star rating submissions
        ├── 📁 user/                  # Study history tracking, settings updates, and chart analytics
        └── 📁 admin/                 # KPI calculations, logs audits, user ban, and topic deletions
```

---

## 🛠️ Local Installation & Development

Ensure a PostgreSQL instance is available prior to launching the server.

1.  **Install dependencies**:
    ```bash
    npm install
    ```
2.  **Configure environment files**: Create a `.env` file in the root of `/studymind-ai-server`:
    ```env
    DATABASE_URL="postgresql://neondb_owner:password@ep-holy-forest-pooler.us-east-1.aws.neon.tech/neondb?sslmode=require"
    BETTER_AUTH_SECRET="your-better-auth-secret"
    BETTER_AUTH_URL="http://localhost:5000"
    CLIENT_URL="http://localhost:3000"
    GEMINI_API_KEY="your-google-gemini-api-key"
    SENTRY_DSN="" # Optional for dev
    CLOUDINARY_CLOUD_NAME="your-cloudinary-name"
    CLOUDINARY_API_KEY="your-cloudinary-key"
    CLOUDINARY_API_SECRET="your-cloudinary-secret"
    ```
3.  **Run migrations & seed**:
    ```bash
    npx prisma migrate dev
    npx prisma db seed # If seed is configured
    ```
4.  **Execute scripts**:
    - `npm run dev`: Runs the development server inside [tsx](https://github.com/privatezk/tsx) watcher at `http://localhost:5000`.
    - `npm run build`: Generates Prisma clients and compiles TypeScript to JavaScript in `/dist`.
    - `npm run start`: Runs the production-ready compiled JavaScript from `/dist`.
    - `npm run lint`: Checks files for syntax or stylistic errors using ESLint.
    - `npm run studio`: Launches the visual **Prisma Studio** database explorer on `http://localhost:5555`.

---

## 📄 License

This backend application is licensed under the ISC License.
