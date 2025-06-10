import express from "express";
import dotenv from "dotenv";
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
import { createServer as createVercelHandler } from "@vercel/node"; // not real, see below

// Load environment variables
dotenv.config({ path: "./.env" });

// Initialize app
const app = express();

// Cloudinary config
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLIENT_NAME,
  api_key: process.env.CLOUDINARY_CLIENT_API,
  api_secret: process.env.CLOUDINARY_CLIENT_SECRET
});

// Middleware
app.use(cors({
  origin: '*',
  methods: ["GET", "POST", "PUT", "DELETE"],
  credentials: false
}));
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(expressFileupload({
  useTempFiles: true,
  tempFileDir: "/tmp/"
}));

// Routes
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

// Initialize DB and background services
connectDB();
notifyUsers();
removeUnverifiedAccounts();

app.use(errorMiddleware);

// ✅ Export as Vercel handler
import { createServer } from "http";
import { parse } from "url";

const server = createServer((req, res) => {
  const parsedUrl = parse(req.url, true);
  app(req, res); // Forward to Express
});

export default server;
