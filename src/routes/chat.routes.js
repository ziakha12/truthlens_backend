const { Router } = require("express");
const {
  analyzeContent,
  getMyChats,
  getChatById,
  deleteChat,
} = require("../controllers/chat.controller");
const verifyJWT = require("../middlewares/auth.middleware");

const router = Router();

// Every route below requires login (accessToken)
router.use(verifyJWT);

// body: { mode: "text", text } OR { mode: "image" | "voice", base64, mimeType }
router.post("/analyze", analyzeContent);

router.get("/", getMyChats);
router.get("/:chatId", getChatById);
router.delete("/:chatId", deleteChat);

module.exports = router;
