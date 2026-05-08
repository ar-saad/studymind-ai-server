import { GoogleGenerativeAI } from "@google/generative-ai";

const apiKey = process.env.GEMINI_API_KEY;

if (!apiKey) {
  console.warn("⚠️  GEMINI_API_KEY is not set. AI features will not work.");
}

const genAI = new GoogleGenerativeAI(apiKey || "");

/**
 * Get the Gemini generative model (gemini-2.5-flash — free tier).
 */
export const getGeminiModel = () => {
  return genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
};

export default genAI;
