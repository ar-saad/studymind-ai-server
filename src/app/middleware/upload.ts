import multer from "multer";
import { AppError } from "../utils/AppError";

// Store file in memory as a buffer rather than writing to disk
const storage = multer.memoryStorage();

export const upload = multer({
  storage,
  limits: {
    fileSize: 2 * 1024 * 1024, // 2MB file size limit enforced on server
  },
  fileFilter: (_req, file, cb) => {
    // Only allow image files
    if (!file.mimetype.startsWith("image/")) {
      return cb(new AppError("Only image files are allowed!", 400));
    }
    cb(null, true);
  },
});
