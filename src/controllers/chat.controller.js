const asyncHandler = require("../utils/asyncHandler");
const ApiError = require("../utils/ApiError");
const ApiResponse = require("../utils/ApiResponse");
const Chat = require("../models/chat.model");
const { analyzeText, analyzeMedia } = require("../utils/geminiService");

// POST /api/v1/chats/analyze
// Body for text:  { "mode": "text", "text": "..." }
// Body for image/voice: { "mode": "image" | "voice", "base64": "...", "mimeType": "image/jpeg" }
const analyzeContent = asyncHandler(async (req, res) => {
  const { mode, text, base64, mimeType } = req.body;

  if (!["text", "image", "voice"].includes(mode)) {
    throw new ApiError(400, "mode must be one of: text, image, voice.");
  }

  let analysisResult;
  let inputContent;

  if (mode === "text") {
    if (!text || !text.trim()) {
      throw new ApiError(400, "text is required when mode is 'text'.");
    }
    inputContent = text;
    analysisResult = await analyzeText(text);
  } else {
    if (!base64 || !mimeType) {
      throw new ApiError(400, "base64 and mimeType are required when mode is 'image' or 'voice'.");
    }
    inputContent = mode === "image" ? "Image submitted for verification" : "Voice clip submitted for verification";
    analysisResult = await analyzeMedia(base64, mimeType);
  }

  const chat = await Chat.create({
    user: req.user._id,
    inputType: mode,
    inputContent,
    credibilityScore: analysisResult.credibilityScore,
    status: analysisResult.status,
    summary: analysisResult.summary,
    analysis: analysisResult.analysis,
    redFlags: analysisResult.redFlags,
    sourcesFound: analysisResult.sourcesFound,
  });

  return res.status(201).json(
    new ApiResponse(201, chat, "Content analyzed successfully.")
  );
});

// GET /api/v1/chats -> list all past chats of logged-in user (newest first)
const getMyChats = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 20;

  const chats = await Chat.find({ user: req.user._id })
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(limit);

  const totalChats = await Chat.countDocuments({ user: req.user._id });

  return res.status(200).json(
    new ApiResponse(
      200,
      { chats, totalChats, page, totalPages: Math.ceil(totalChats / limit) },
      "Chat history fetched."
    )
  );
});

// GET /api/v1/chats/:chatId -> get single chat detail
const getChatById = asyncHandler(async (req, res) => {
  const { chatId } = req.params;

  const chat = await Chat.findOne({ _id: chatId, user: req.user._id });

  if (!chat) {
    throw new ApiError(404, "Chat not found.");
  }

  return res.status(200).json(new ApiResponse(200, chat, "Chat fetched."));
});

// DELETE /api/v1/chats/:chatId
const deleteChat = asyncHandler(async (req, res) => {
  const { chatId } = req.params;

  const chat = await Chat.findOneAndDelete({ _id: chatId, user: req.user._id });

  if (!chat) {
    throw new ApiError(404, "Chat not found.");
  }

  return res.status(200).json(new ApiResponse(200, {}, "Chat deleted."));
});

module.exports = {
  analyzeContent,
  getMyChats,
  getChatById,
  deleteChat,
};
