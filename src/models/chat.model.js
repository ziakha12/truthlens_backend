const mongoose = require("mongoose");

const chatSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    inputType: {
      type: String,
      enum: ["text", "image", "voice"],
      required: true,
    },
    // For text: the actual text submitted.
    // For image/voice: a short label (we don't store the raw media itself, only the result).
    inputContent: {
      type: String,
      required: true,
    },
    credibilityScore: {
      type: Number,
      required: true,
      min: 0,
      max: 100,
    },
    status: {
      type: String,
      enum: ["True", "False", "Misleading", "Unverified"],
      required: true,
    },
    summary: {
      type: String,
      required: true,
    },
    analysis: {
      type: String,
      required: true,
    },
    redFlags: {
      type: [String],
      default: [],
    },
    sourcesFound: {
      type: [String],
      default: [],
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Chat", chatSchema);
