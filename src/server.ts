import "dotenv/config";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import { toNodeHandler } from "better-auth/node";
import { auth } from "./app/config/auth";
import { globalErrorHandler } from "./app/middleware/globalErrorHandler";
import { AppError } from "./app/utils/AppError";

// Module routers
import topicRouter from "./app/modules/topics/topic.router";
import userRouter from "./app/modules/user/user.router";
import adminRouter from "./app/modules/admin/admin.router";

const app = express();
const PORT = process.env.PORT || 5000;

const allowedOrigins = [
  process.env.CLIENT_URL || "http://localhost:3000",
];

// CORS must be registered BEFORE the auth handler so that
// preflight (OPTIONS) requests receive proper CORS headers.
app.use(
  cors({
    origin: allowedOrigins,
    credentials: true, // required for Better Auth session cookies
  })
);

// Mount Better Auth handler BEFORE express.json()
// This is critical — Better Auth needs to parse the raw body itself
app.all("/api/auth/{*splat}", toNodeHandler(auth));

// Standard middleware (after auth handler)
app.use(helmet());
app.use(morgan("dev"));
app.use(express.json());

// Health check
app.get("/", (_req, res) => {
  res.json({ message: "StudyMind AI API is running", status: "ok" });
});

// API Routes
app.use("/api/topics", topicRouter);
app.use("/api/user", userRouter);
app.use("/api/admin", adminRouter);

// 404 handler for unknown routes
app.use((req, _res, next) => {
  next(new AppError(`Route ${req.originalUrl} not found`, 404));
});

// Global error handler (must be last)
app.use(globalErrorHandler);

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
