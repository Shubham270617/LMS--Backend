import express from "express";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import cors from "cors";
import cookieParser from "cookie-parser";
import { connectDB } from "../database/db.js";
import { errorMiddleware } from "../middlewares/errorMiddlewares.js";
import { v2 as cloudinary } from "cloudinary";
import authRouter from "../routes/authRouter.js";
import bookRouter from "../routes/bookRouter.js";
import borrowRouter from "../routes/borrowRouter.js";
import userRouter from "../routes/userRouter.js";
import expressFileupload from "express-fileupload";
import { notifyUsers } from "../services/notifyUsers.js";
import { removeUnverifiedAccounts } from "../services/removeUnverifiedAccounts.js";

// Get __dirname equivalent in ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ✅ Load .env from root directory
dotenv.config({ path: path.join(__dirname, "../.env") });

// Debug log to confirm env variables are loaded
console.log("🔍 MONGO_URI is:", process.env.MONGO_URI);

const app = express();

// ✅ Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLIENT_NAME,
  api_key: process.env.CLOUDINARY_CLIENT_API,
  api_secret: process.env.CLOUDINARY_CLIENT_SECRET,
});

// ✅ Middleware setup
app.use(cors({
  origin: [
    "https://lms-frontend-beta-nine.vercel.app",
    "http://localhost:5173"
  ],
  methods: ["GET", "POST", "PUT", "DELETE"],
  credentials: true,
}));

app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(expressFileupload({
  useTempFiles: true,
  tempFileDir: "/tmp/"
}));

// ✅ Routes
app.get('/', (req, res) => {
  res.send(`
    <h1>✅ Your Backend API is Live</h1>
    <p>Welcome to the Library Management System API</p>
  `);
});

app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    message: 'Library Management System backend is healthy',
    timestamp: new Date().toISOString(),
  });
});

app.use("/api/v1/auth", authRouter);
app.use("/api/v1/book", bookRouter);
app.use("/api/v1/borrow", borrowRouter);
app.use("/api/v1/user", userRouter);

// ✅ Connect to DB & schedule jobs
await connectDB();
notifyUsers();
removeUnverifiedAccounts();

// ✅ Global error handler
app.use(errorMiddleware);

// ✅ Start Server
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`🚀 Server is running on http://localhost:${PORT}`);
});

// ✅ Export app for Vercel serverless
export default app;
