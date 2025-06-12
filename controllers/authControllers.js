import { catchAsyncErrors } from "../middlewares/catchAsyncErrors.js";
import ErrorHandler from "../middlewares/errorMiddlewares.js";
import { User } from "../models/userModels.js";
import bcrypt from "bcrypt";
import crypto from "crypto";
import { sendVerificationCode } from "../utils/sendVerificationCode.js";
import { sendToken } from "../utils/sendToken.js";
import { sendEmail } from "../utils/sendEmail.js";
import { generateForgotPasswordEmailTemplate } from "../utils/emailTemplates.js";

export const register = catchAsyncErrors(async (req, res, next) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) {
      return next(new ErrorHandler(400, "Please enter all fields."));
    }

    const isRegistered = await User.findOne({ email, accountVerified: true });
    if (isRegistered) {
      return next(new ErrorHandler(400, "User already registered"));
    }
    const registerationAttemptsByUser = await User.find({
      email,
      accountVerified: false,
    });
    if (registerationAttemptsByUser.length >= 5) {
      return next(
        new ErrorHandler(
          400,
          "You have exceeded the number of registration attempted Please try after 30 minutes"
        )
      );
    }

    if (password.length < 8 || password.length > 20) {
      return next(
        new ErrorHandler(400, "Password must be between 8 and 20 characters")
      );
    }
    const hashPassword = await bcrypt.hash(password, 10);
    const user = await User.create({
      name,
      email,
      password: hashPassword,
    });
    const verificationCode = await user.generateVerificationCode();
    await user.save();
    sendVerificationCode(verificationCode, email, res);
  } catch (error) {
    next(error);
  }
});

export const verifyOTP = catchAsyncErrors(async (req, res, next) => {
  const { email, otp } = req.body;
  if (!email || !otp) {
    return next(new ErrorHandler(400, "Email or otp is missing"));
  }
  try {
    const userAllEntries = await User.find({
      email,
      accountVerified: false,
    }).sort({ createdAt: -1 }); //this is mongodb method where we will find the user when it was created and arranged in descending order.

    if (!userAllEntries) {
      return next(new ErrorHandler(404, "User not found."));
    }

    let user;

    if (userAllEntries.length > 1) {
      user = userAllEntries[0];
      await User.deleteMany({
        _id: { $ne: user._id }, //"Delete all user entries that have the same email, are not verified, and have an _id different from the most recent one."
        email,
        accountVerified: false,
      });
    } else {
      user = userAllEntries[0];
    }

    if (user.verificationCode !== Number(otp)) {
      return next(new ErrorHandler(400, "Invalid OTP."));
    }

    const currentTime = Date.now();

    const verificationCodeExpire = new Date(
      user.verificationCodeExpire
    ).getTime();
    if (currentTime > verificationCodeExpire) {
      return next(new ErrorHandler(400, "OTP Expired"));
    }

    user.accountVerified = true;
    user.verificationCode = null;
    user.verificationCodeExpire = null;

    await user.save({ validateModifiedOnly: true });

    sendToken(user, 200, "Account Verified.", res);
  } catch (error) {
    return next(new ErrorHandler(500, "Internal Server Error."));
  }
});

export const login = catchAsyncErrors(async (req, res, next) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return next(new ErrorHandler(400, "Please enter all field"));
  }

  const user = await User.findOne({ email, accountVerified: true }).select(
    "+password"
  );
  if (!user) {
    return next(new ErrorHandler(400, "Invalid Email"));
  }

  const isPasswordMatched = await bcrypt.compare(password, user.password);
  if (!isPasswordMatched) {
    return next(new ErrorHandler(400, "Invalid Password"));
  }

  sendToken(user, 200, "User login successfully.", res);
});

export const logout = catchAsyncErrors(async (req, res, next) => {
  res
    .status(200)
    .cookie("token", "", {
      expires: new Date(Date.now()),
      httpOnly: true,
      sameSite: "none",   // ✅ Required for Vercel / HTTPS frontend
      secure: true        // ✅ Must match the original set-cookie flags
    })
    .json({
      success: true,
      message: "Logged out successfully.",
    });
});

export const getUser = catchAsyncErrors(async (req, res, next) => {
  const user = req.user;
  res.status(200).json({
    success: true,
    user,
  });
});

export const forgotPassword = catchAsyncErrors(async (req, res, next) => {
  if (!req.body.email) {
    return next(new ErrorHandler(400, "Email is required"));
  }
  const user = await User.findOne({
    email: req.body.email,
    accountVerified: true,
  });
  if (!user) {
    return next(new ErrorHandler(400, "Invalid Email."));
  }
  const resetToken = user.getResetPasswordToken();

  await user.save({ validateBeforeSave: false });

  const resetPasswordUrl = `${process.env.FRONTEND_URL}/password/reset/${resetToken}`;

  const message = generateForgotPasswordEmailTemplate(resetPasswordUrl);

  try {
    await sendEmail({
      email: user.email,
      subject: "Library Management System Password Recovery",
      message,
    });
    res.status(200).json({
      success: true,
      message: `Email sent to ${user.email} successfully.`,
    });
  } catch (error) {
    user.resetPasswordToken = undefined;
    (user.resetPasswordExpires = undefined),
      await user.save({ validateBeforeSave: false });
    return next(new ErrorHandler(500, error.message));
  }
});

export const resetPassword = catchAsyncErrors(async (req, res, next) => {
  const { token } = req.params;
  const resetPasswordToken = crypto
    .createHash("sha256")
    .update(token)
    .digest("hex");

  const user = await User.findOne({
    resetPasswordToken,
    resetPasswordExpires: { $gt: Date.now() },
  });

  if (!user) {
    return next(
      new ErrorHandler(
        400,
        "Reset Paswword token is invalid or has been expired."
      )
    );
  }

  if (req.body.password !== req.body.confirmPassword) {
    return next(
      new ErrorHandler(400, "Password and confirm password do not match.")
    );
  }
  if (
    req.body.password.length < 8 ||
    req.body.password.length > 16 ||
    req.body.confirmPassword.length < 8 ||
    req.body.confirmPassword.length > 16
  ) {
    return next(
      new ErrorHandler(400, "Password must be between 8 and 16 characters.")
    );
  }
  const hashedPassword = await bcrypt.hash(req.body.password, 10);
  user.password = hashedPassword;
  user.resetPasswordToken = undefined;
  user.resetPasswordExpires = undefined;

  await user.save();

  sendToken(user, 200, "Password reset successfully.", res);
});

export const updatePassword = catchAsyncErrors(async (req, res, next) => {
  const user = await User.findById(req.user._id).select("+password");
  const { currentPassword, newPassword, confirmPassword } = req.body;
  if (!currentPassword || !newPassword || !confirmPassword) {
    return next(new ErrorHandler(400, "Please enter all field."));
  }

  const isPasswordMatched = await bcrypt.compare(
    currentPassword,
    user.password
  );
  if (!isPasswordMatched) {
    return next(new ErrorHandler(400, "Current Password is incorrect."));
  }
  if (
    newPassword.length < 8 ||
    newPassword.length > 16 ||
    confirmPassword.length < 8 ||
    confirmPassword.length > 16
  ) {
    return next(
      new ErrorHandler(400, "Password must be between 8 and 16 characters.")
    );
  }
  if (newPassword !== confirmPassword) {
    return next(
      new ErrorHandler(
        400,
        "New password and confirm new password do not match."
      )
    );
  }

  const hashedPassword = await bcrypt.hash(newPassword, 10);
  user.password = hashedPassword;
  await user.save();
  res.status(200).json({
    success: true,
    message: "Password updated successfully.",
  });
});
