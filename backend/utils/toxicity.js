import axios from "axios";

const HF_INFERENCE = "https://api-inference.huggingface.co/models";

const ENGLISH_MODEL = "unitary/toxic-bert";
const HINDI_HINGLISH_MODEL = "l3cube-pune/hindi-abusive-bert";

/**
 * Single-sequence classification row: [{ label, score }, ...]
 * - Multi-label English toxicity (toxic-bert): many labels — use max score.
 * - Binary abusive / hate: take score for abusive/offensive class, not benign max.
 */
function scoreFromClassificationRow(row) {
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

  // Binary with generic LABEL_0 / LABEL_1 — often 1 = positive (abusive) class
  if (row.length === 2) {
    const pos = row.find((item) =>
      /^label_1$|^1$|positive|pos|abusive|hate|class_1/i.test(String(item?.label ?? ""))
    );
    if (pos && typeof pos.score === "number") return pos.score;
  }

  return Math.max(0, ...row.map((i) => (typeof i.score === "number" ? i.score : 0)));
}

/**
 * Parses HF text-classification responses.
 */
function maxScoreFromHFResponse(data) {
  if (!data || typeof data === "string") {
    return 0;
  }

  const rows = Array.isArray(data[0]) ? data : [data];
  let max = 0;
  for (const row of rows) {
    if (!Array.isArray(row)) continue;
    max = Math.max(max, scoreFromClassificationRow(row));
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

  return maxScoreFromHFResponse(data);
}

/**
 * English (toxic-bert) + Hindi/Hinglish (hindi-abusive-bert) in parallel via Hugging Face Inference API.
 * Returns max(englishScore, hindiScore) in [0, 1]. Per-model failures contribute 0 (fail-open).
 */
export async function getToxicityMaxScore(text) {
  const token = process.env.HF_TOKEN;
  if (!token || !text?.trim()) return 0;

  const input = text.trim().slice(0, 512);

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
