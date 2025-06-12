export const sendToken = (user, statusCode, message, res) => {
  const token = user.generateToken();

  
  const isProduction = process.env.NODE_ENV === "production";
  res
    .status(statusCode)
    .cookie("token", token, {
      expires: new Date(
        Date.now() + process.env.COOKIE_EXPIRE * 24 * 60 * 60 * 1000
      ),
      httpOnly: true,
       secure: isProduction, // Only use secure cookies in production (HTTPS)
      sameSite: isProduction ? "none" : "lax", // lax for dev, none for cross-origin prod
    })
    .json({
      success: true,
      user,
      message,
      token,
    });
};
