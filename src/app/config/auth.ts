import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import prisma from "./prisma";

export const auth = betterAuth({
  database: prismaAdapter(prisma, {
    provider: "postgresql",
  }),
  user: {
    additionalFields: {
      role: {
        type: "string",
        required: false,
        defaultValue: "USER",
      },
      plan: {
        type: "string",
        required: false,
        defaultValue: "FREE",
      },
      dailyGenerations: {
        type: "number",
        required: false,
        defaultValue: 0,
      },
      lastGenerationDate: {
        type: "date",
        required: false,
      },
    },
  },
  emailAndPassword: {
    enabled: true,
  },
  trustedOrigins: [
    process.env.CLIENT_URL || "http://localhost:3000",
    // Allow server-side / curl testing in development
    ...(process.env.NODE_ENV !== "production" ? ["http://localhost:5000"] : []),
  ],
  advanced: {
    crossSubDomainCookies: {
      enabled: true,
    },
    defaultCookieAttributes: {
      sameSite: "none",
      secure: true,
    },
  },
});
