import axios from "axios";

const HF_INFERENCE = "https://api-inference.huggingface.co/models";

const ENGLISH_MODEL = "unitary/toxic-bert";
const HINDI_HINGLISH_MODEL = "l3cube-pune/hindi-abusive-bert";
const LOCAL_TOXICITY_URL = process.env.TOXICITY_URL;
const BENIGN_SHORT_MESSAGE_RE = /^[\p{L}\p{N}\s.,!?'"-]{1,40}$/u;
const TOXIC_HINT_RE =
  /kill|die|stupid|idiot|abuse|hate|harass|slur|bastard|shit|fuck|gali|gaand|madarchod|bhenchod|chutiya|randi|kutta|kamina|harami|suar|murder|rape|terror|attack/i;

/**
 * Single-sequence classification row: [{ label, score }, ...]
 * - Multi-label English toxicity (toxic-bert): many labels — use max score.
 * - Binary abusive / hate: take score for abusive/offensive class, not benign max.
 */
function scoreFromClassificationRow(row, modelPath = "") {
  if (!Array.isArray(row) || row.length === 0) return 0;

  const labStr = (item) => String(item?.label ?? "").toLowerCase();

  // Prefer explicit abusive / toxic / hate dimensions
  const riskLabel = /abusive|hate|toxic|offensive|insult|obscene|profan|slur|aggressive|attack|hateful|unsafe|not_safe|dirty|गाली|अपमान/i;
  const benignLabel = /non.?abusive|not.?abusive|not_abusive|non_abusive|clean|safe|neutral|not_hate|no_hate|negative_class|^0$|label_0|^neg$/i;

  let risk = 0;
  for (const item of row) {
    if (!item || typeof item.score !== "number") continue;
    const l = labStr(item);
    if (benignLabel.test(l)) continue;
    if (riskLabel.test(l)) {
      risk = Math.max(risk, item.score);
    }
  }
  if (risk > 0) return risk;

  // English toxic-bert: 6+ toxicity subtypes, all "risk" — max is standard
  if (row.length >= 4) {
    return Math.max(0, ...row.map((i) => (typeof i.score === "number" ? i.score : 0)));
  }

  // Generic binary labels (LABEL_0/LABEL_1) are model-dependent and can map
  // to "non-toxic" as the high score. Fail open here to avoid false positives
  // like warning on simple messages (e.g., "hello").
  if (row.length <= 3) {
    const labels = row.map((item) => String(item?.label ?? "").toLowerCase());
    const hasOnlyGenericBinaryLabels = labels.every((l) =>
      /^label_[01]$|^[01]$|^class_[01]$/.test(l)
    );
    if (hasOnlyGenericBinaryLabels) {
      console.warn(
        `Skipping ambiguous toxicity labels from ${modelPath || "unknown model"}: ${labels.join(", ")}`
      );
      return 0;
    }
  }

  // For rich multi-class outputs where no benign label exists, max score is reasonable.
  return Math.max(0, ...row.map((i) => (typeof i.score === "number" ? i.score : 0)));
}

/**
 * Parses HF text-classification responses.
 */
function maxScoreFromHFResponse(data, modelPath = "") {
  if (!data || typeof data === "string") {
    return 0;
  }

  const rows = Array.isArray(data[0]) ? data : [data];
  let max = 0;
  for (const row of rows) {
    if (!Array.isArray(row)) continue;
    max = Math.max(max, scoreFromClassificationRow(row, modelPath));
  }
  return max;
}

async function hfModelMaxScore(modelPath, text, token) {
  const { data, status } = await axios.post(
    `${HF_INFERENCE}/${modelPath}`,
    { inputs: text },
    {
      headers: { Authorization: `Bearer ${token}` },
      timeout: 25000,
      validateStatus: () => true,
    }
  );

  if (status >= 400) {
    console.warn(`HF ${modelPath}: HTTP ${status}`, data?.error || "");
    return 0;
  }

  if (data && typeof data === "object" && !Array.isArray(data) && data.error) {
    console.warn(`HF ${modelPath}:`, data.error);
    return 0;
  }

  return maxScoreFromHFResponse(data, modelPath);
}

export function isToxicityConfigured() {
  return Boolean(LOCAL_TOXICITY_URL || process.env.HF_TOKEN);
}

async function localServiceScore(text) {
  if (!LOCAL_TOXICITY_URL) return null;

  const { data, status } = await axios.post(
    LOCAL_TOXICITY_URL,
    { text },
    {
      timeout: 10000,
      validateStatus: () => true,
    }
  );

  if (status >= 400 || !data) {
    console.warn(`Local toxicity service HTTP ${status}`);
    return null;
  }

  const score = Number(data?.score);
  if (!Number.isFinite(score)) return null;
  return Math.max(0, Math.min(1, score));
}

/**
 * English (toxic-bert) + Hindi/Hinglish (hindi-abusive-bert) in parallel via Hugging Face Inference API.
 * Returns max(englishScore, hindiScore) in [0, 1]. Per-model failures contribute 0 (fail-open).
 */
export async function getToxicityMaxScore(text) {
  const token = process.env.HF_TOKEN;
  if (!text?.trim()) return 0;

  const input = text.trim().slice(0, 512);

  // Guardrail against noisy model/service outputs:
  // if text is short and has no obvious toxic cues, skip moderation scoring.
  if (input.length <= 40 && BENIGN_SHORT_MESSAGE_RE.test(input) && !TOXIC_HINT_RE.test(input)) {
    return 0;
  }

  // Prefer local self-hosted service if configured
  if (LOCAL_TOXICITY_URL) {
    try {
      const localScore = await localServiceScore(input);
      if (typeof localScore === "number") return localScore;
    } catch (err) {
      console.error("Local toxicity service error:", err.message);
    }
  }

  // Fallback to HF provider
  if (!token) return 0;

  try {
    const [englishScore, hindiScore] = await Promise.all([
      hfModelMaxScore(ENGLISH_MODEL, input, token).catch((err) => {
        console.error("HF English toxicity:", err.message);
        return 0;
      }),
      hfModelMaxScore(HINDI_HINGLISH_MODEL, input, token).catch((err) => {
        console.error("HF Hindi/Hinglish toxicity:", err.message);
        return 0;
      }),
    ]);

    return Math.max(englishScore, hindiScore);
  } catch (err) {
    console.error("HF toxicity parallel error:", err.message);
    return 0;
  }
}
