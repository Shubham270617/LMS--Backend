import { catchAsyncErrors } from "../middlewares/catchAsyncErrors.js";
import ErrorHandler from "../middlewares/errorMiddlewares.js";
import { User } from "../models/userModels.js";
import bcrypt from "bcrypt"
import {v2 as cloudinary} from "cloudinary"


export const getAllUSers = catchAsyncErrors(async(req, res, next)=>{
    const users = await User.find({accountVerified: true});
    res.status(200).json({
       success: true,
       users, 
    })
});


export const registerNewAdmin = catchAsyncErrors(async(req, res, next)=>{
    if(!req.files || Object.keys(req.files).length === 0){
        return next(new ErrorHandler(400, "Admin avatar is required."))
    }

    const {name, email, password} = req.body;
    if(!name || !email ||!password){
        return next(new ErrorHandler(400, "All fields are required."))
    }
    const isRegistered = await User.findOne({email, accountVerified: true});
    if(isRegistered){
        return next(new ErrorHandler(400, "User already registered"))
    }
    if(password.length < 8 || password.length > 16){
        return next(new ErrorHandler(400, "Password must be between 8 to 16 character long."))
    }

    const {avatar} = req.files;
    const allowedFormats = ["image/png", "image/jpeg", "image/webp"];
    if(!allowedFormats.includes(avatar.mimetype)){
        return next(new ErrorHandler(400, "File formate not supported"))
    }
    const hashedPassword = await bcrypt.hash(password, 10)
    const cloudinaryResponse = await cloudinary.uploader.upload(
        avatar.tempFilePath, {
            folder: "LIBRARY_MANAGEMENT_SYSTEM_ADMIN_AVATARS"
        }
    )
    if(!cloudinaryResponse || cloudinaryResponse.error){
    console.error("Cloudinary Error:", cloudinaryResponse.error || "Unknown cloudinary error. ")
    return next(new ErrorHandler(500, "Failed to upload avatar image to cloudinary"))
    }
    const admin = await User.create({
        name,
        email,
        password: hashedPassword,
        role: "Admin",
        accountVerified: true,
        avatar:{
            public_id: cloudinaryResponse.public_id,
            url: cloudinaryResponse.secure_url
        },
    })
    res.status(201).json({
        success: true,
        message: "Admin register successfully",
        admin,
    })
})
