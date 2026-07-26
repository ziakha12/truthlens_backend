const jwt = require("jsonwebtoken");
const asyncHandler = require("../utils/asyncHandler");
const ApiError = require("../utils/ApiError");
const ApiResponse = require("../utils/ApiResponse");
const User = require("../models/user.model");

// Generates both tokens, saves refreshToken on the user document
const generateAccessAndRefreshTokens = async (userId) => {
  const user = await User.findById(userId);
  const accessToken = user.generateAccessToken();
  const refreshToken = user.generateRefreshToken();

  user.refreshToken = refreshToken;
  await user.save({ validateBeforeSave: false });

  return { accessToken, refreshToken };
};

// POST /api/v1/auth/signup
const signup = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    throw new ApiError(400, "Name, email and password are all required.");
  }

  const existingUser = await User.findOne({ email: email.toLowerCase() });
  if (existingUser) {
    throw new ApiError(409, "A user with this email already exists.");
  }

  const user = await User.create({ name, email, password });

  const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(user._id);

  const createdUser = await User.findById(user._id).select("-password -refreshToken");

  return res.status(201).json(
    new ApiResponse(
      201,
      { user: createdUser, accessToken, refreshToken },
      "Account created successfully."
    )
  );
});

// POST /api/v1/auth/login
const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    throw new ApiError(400, "Email and password are required.");
  }

  const user = await User.findOne({ email: email.toLowerCase() });
  if (!user) {
    throw new ApiError(404, "No account found with this email.");
  }

  const isPasswordValid = await user.isPasswordCorrect(password);
  if (!isPasswordValid) {
    throw new ApiError(401, "Incorrect password.");
  }

  const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(user._id);

  const loggedInUser = await User.findById(user._id).select("-password -refreshToken");

  return res.status(200).json(
    new ApiResponse(
      200,
      { user: loggedInUser, accessToken, refreshToken },
      "Logged in successfully."
    )
  );
});

// POST /api/v1/auth/refresh-token
// Mobile app calls this when accessToken expires, using the stored refreshToken
const refreshAccessToken = asyncHandler(async (req, res) => {
  const incomingRefreshToken = req.body?.refreshToken;

  if (!incomingRefreshToken) {
    throw new ApiError(401, "Refresh token is required.");
  }

  let decoded;
  try {
    decoded = jwt.verify(incomingRefreshToken, process.env.REFRESH_TOKEN_SECRET);
  } catch (error) {
    throw new ApiError(401, "Refresh token is invalid or expired.");
  }

  const user = await User.findById(decoded._id);
  if (!user || incomingRefreshToken !== user.refreshToken) {
    throw new ApiError(401, "Refresh token is invalid or has been used already.");
  }

  const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(user._id);

  return res.status(200).json(
    new ApiResponse(200, { accessToken, refreshToken }, "Access token refreshed.")
  );
});

// POST /api/v1/auth/logout (protected route)
const logout = asyncHandler(async (req, res) => {
  await User.findByIdAndUpdate(req.user._id, { $unset: { refreshToken: 1 } });

  return res.status(200).json(new ApiResponse(200, {}, "Logged out successfully."));
});

// GET /api/v1/auth/me (protected route) - mobile app can call this to check who's logged in
const getCurrentUser = asyncHandler(async (req, res) => {
  return res.status(200).json(new ApiResponse(200, req.user, "Current user fetched."));
});

module.exports = {
  signup,
  login,
  refreshAccessToken,
  logout,
  getCurrentUser,
};
