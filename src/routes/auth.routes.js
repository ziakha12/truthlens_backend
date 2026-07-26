const { Router } = require("express");
const {
  signup,
  login,
  refreshAccessToken,
  logout,
  getCurrentUser,
} = require("../controllers/auth.controller");
const verifyJWT = require("../middlewares/auth.middleware");

const router = Router();

// Public routes
router.post("/signup", signup);
router.post("/login", login);
router.post("/refresh-token", refreshAccessToken);

// Protected routes
router.post("/logout", verifyJWT, logout);
router.get("/me", verifyJWT, getCurrentUser);

module.exports = router;
