import { User } from "../models/userModels.js";
import { catchAsyncErrors } from "./catchAsyncErrors.js";
import ErrorHandler from "./errorMiddlewares.js";
import jwt from "jsonwebtoken";

export const isAuthenticated = catchAsyncErrors(async (req, res, next) => {
  const { token } = req.cookies;
  // console.log("Token from cookies:", req.cookies.token);
  if (!token) {
    return next(new ErrorHandler(401, "User is not authenticated."));
  }

  let decoded;
  try {
    decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);
  } catch (err) {
    return next(new ErrorHandler(400, "Json Web Token is Invalid"));
  }
  // console.log(decoded)
  req.user = await User.findById(decoded.id);

  if (!req.user) {
    return next(new ErrorHandler(404, "User not found"));
  }

  next();
});

export const isAuthorized = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return next(
        new ErrorHandler(
          403,
          `User with this role (${req.user.role}) not allowed to access this resource`
        )
      );
    }
    next();
  };
};
