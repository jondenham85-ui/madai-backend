const authService = require("../services/authService");

async function signup(req, res, next) {
  try {
    const result = await authService.signup(req.body);
    res.cookie("madsi_session", result.token, result.cookieOptions);

    return res.status(201).json({
      success: true,
      user: result.user,
    });
  } catch (error) {
    return next(error);
  }
}

async function login(req, res, next) {
  try {
    const result = await authService.login(req.body);
    res.cookie("madsi_session", result.token, result.cookieOptions);

    return res.status(200).json({
      success: true,
      user: result.user,
    });
  } catch (error) {
    return next(error);
  }
}

async function logout(req, res) {
  res.clearCookie("madsi_session", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
  });

  return res.status(200).json({
    success: true,
    message: "Logged out",
  });
}

async function me(req, res, next) {
  try {
    const profile = await authService.me(req.user.id);

    return res.status(200).json({
      success: true,
      user: profile,
    });
  } catch (error) {
    return next(error);
  }
}

module.exports = {
  signup,
  login,
  logout,
  me,
};
