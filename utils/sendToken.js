export const sendToken = (user, statusCode, message, res) => {
  const token = user.generateToken();
  res
    .status(statusCode)
    .cookie("token", token, {
      expires: new Date(
        Date.now() + process.env.COOKIE_EXPIRE * 24 * 60 * 60 * 1000
      ),
      httpOnly: true,
      secure: true, // ✅ Required for HTTPS
      sameSite: "none", // ✅ Required for cross-site cookie sharing
    })
    .json({
      success: true,
      user,
      message,
      token,
    });
};
