
const { GoogleGenAI } = require("@google/genai");
const ApiError = require("./ApiError");

const ai = new GoogleGenAI({ apiKey: "AQ.Ab8RN6Lgbu9tg81q0bfsBIg6hLPGZVFmaAVBGyhcFJzLj-H2Pg"});
const MODEL = "gemini-2.5-flash";

/**
 * IMPORTANT:
 * Replace ANALYSIS_PROMPT below with the exact prompt you already built &
 * tested in Google AI Studio. Keep the "respond ONLY in valid JSON" instruction
 * and the exact field names below, since the app's UI depends on this shape.
 */
const ANALYSIS_PROMPT = `
You are "truthLens AI", a fake news / misinformation detection assistant.
Analyze the given content (text claim, news image, or transcribed voice clip) and determine how credible it is.

Respond ONLY with a valid JSON object in exactly this shape, no markdown, no extra text, no backticks:
{
  "credibilityScore": <number from 0 to 100>,
  "status": "True" | "False" | "Misleading" | "Unverified",
  "summary": "one short punchy sentence summarizing the verdict",
  "analysis": "a detailed 3-6 sentence explanation of the reasoning behind the score and status",
  "redFlags": ["short red flag 1", "short red flag 2"],
  "sourcesFound": ["source or reference 1", "source or reference 2"]
}

Rules:
- "status" must be exactly one of: True, False, Misleading, Unverified.
- If no red flags are found, return an empty array for "redFlags".
- If no sources/references can be identified, return an empty array for "sourcesFound".
`;

// Converts the raw model text into a safe JS object (model sometimes wraps JSON in ```json fences)
const parseModelResponse = (rawText) => {
  const cleaned = (rawText || "").replace(/```json/gi, "").replace(/```/g, "").trim();
  let parsed;
  try {
    parsed = JSON.parse(cleaned);
  } catch (err) {
    throw new ApiError(502, "Failed to parse AI response. Please try again.");
  }

  // Basic shape safety-net so a malformed model response never crashes the app
  return {
    credibilityScore: Number.isFinite(parsed.credibilityScore) ? parsed.credibilityScore : 0,
    status: ["True", "False", "Misleading", "Unverified"].includes(parsed.status)
      ? parsed.status
      : "Unverified",
    summary: parsed.summary || "No summary available.",
    analysis: parsed.analysis || "No detailed analysis available.",
    redFlags: Array.isArray(parsed.redFlags) ? parsed.redFlags : [],
    sourcesFound: Array.isArray(parsed.sourcesFound) ? parsed.sourcesFound : [],
  };
};

/**
 * Analyze plain text content
 */
const analyzeText = async (textContent) => {
  const response = await ai.models.generateContent({
    model: MODEL,
    contents: [
      { text: ANALYSIS_PROMPT },
      { text: `Content to analyze:\n"""\n${textContent}\n"""` },
    ],
  });

  return parseModelResponse(response.text);
};

/**
 * Analyze an image or voice clip.
 * base64Data: raw base64 string (no "data:...;base64," prefix)
 * mimeType examples: "image/jpeg", "image/png", "audio/m4a", "audio/mpeg"
 */
const analyzeMedia = async (base64Data, mimeType) => {
  const response = await ai.models.generateContent({
    model: MODEL,
    contents: [
      { text: ANALYSIS_PROMPT },
      { inlineData: { mimeType, data: base64Data } },
    ],
  });

  return parseModelResponse(response.text);
};

module.exports = {
  analyzeText,
  analyzeMedia,
};
