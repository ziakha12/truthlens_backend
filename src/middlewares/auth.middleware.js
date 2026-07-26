const jwt = require("jsonwebtoken");
const asyncHandler = require("../utils/asyncHandler");
const ApiError = require("../utils/ApiError");
const User = require("../models/user.model");

// Mobile app must send: Authorization: Bearer <accessToken>
const verifyJWT = asyncHandler(async (req, _res, next) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.startsWith("Bearer ")
    ? authHeader.split(" ")[1]
    : null;

  if (!token) {
    throw new ApiError(401, "Unauthorized request. Please login first.");
  }

  try {
    const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);

    const user = await User.findById(decodedToken._id).select(
      "-password -refreshToken"
    );

    if (!user) {
      throw new ApiError(401, "Invalid access token.");
    }

    req.user = user;
    next();
  } catch (error) {
    throw new ApiError(401, error?.message || "Invalid or expired access token.");
  }
});

module.exports = verifyJWT;
