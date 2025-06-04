import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import cookieParser from "cookie-parser";
import { connectDB } from "./database/db.js";
import { errorMiddleware } from "./middlewares/errorMiddlewares.js";
import {v2 as cloudinary} from "cloudinary"
import authRouter from "./routes/authRouter.js"
import bookRouter from "./routes/bookRouter.js"
import borrowRouter from "./routes/borrowRouter.js"
import userRouter from "./routes/userRouter.js"
import expressFileupload from "express-fileupload"
import { notifyUsers } from "./services/notifyUsers.js";
import { removeUnverifiedAccounts } from "./services/removeUnverifiedAccounts.js";



export const app = express();
dotenv.config({path:"./.env"})


cloudinary.config({
   cloud_name: process.env.CLOUDINARY_CLIENT_NAME,
   api_key: process.env.CLOUDINARY_CLIENT_API,
   api_secret: process.env.CLOUDINARY_CLIENT_SECRET
})

app.listen(process.env.PORT,()=>{
    console.log(`Server is running on port ${process.env.PORT}`)
})

app.use(cors({
    origin: [process.env.FRONTEND_URL],
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE"],
}));
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({extended:true}));
app.use(expressFileupload({
    useTempFiles:true,
    tempFileDir:"/tmp/"
}))

app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    message: 'Library Management System backend is healthy',
    timestamp: new Date().toISOString(),
  });
});

app.get('/', (req, res) => {
  res.send('📚 Library Management System API is running!');
});

app.use("/api/v1/auth", authRouter);
app.use("/api/v1/book", bookRouter);
app.use("/api/v1/borrow", borrowRouter);
app.use("/api/v1/user", userRouter);

notifyUsers()
removeUnverifiedAccounts()


connectDB();

app.use(errorMiddleware)