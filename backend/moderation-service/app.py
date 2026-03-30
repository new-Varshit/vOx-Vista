from fastapi import FastAPI
from pydantic import BaseModel
from transformers import pipeline

app = FastAPI(title="VoxVista Local Toxicity Service")

english_classifier = pipeline(
    "text-classification",
    model="unitary/toxic-bert",
    top_k=None,
)

hinglish_classifier = pipeline(
    "text-classification",
    model="l3cube-pune/hindi-abusive-bert",
    top_k=None,
)


class ScoreRequest(BaseModel):
    text: str


def row_score(row):
    if not row:
        return 0.0

    labels = [(str(item.get("label", "")).lower(), float(item.get("score", 0.0))) for item in row]
    risk_words = [
        "toxic",
        "abusive",
        "hate",
        "offensive",
        "insult",
        "obscene",
        "profan",
        "slur",
        "hateful",
        "label_1",
        "class_1",
    ]
    benign_words = [
        "safe",
        "neutral",
        "clean",
        "non_abusive",
        "not_hate",
        "label_0",
        "class_0",
    ]

    risk = 0.0
    for label, score in labels:
        if any(word in label for word in benign_words):
            continue
        if any(word in label for word in risk_words):
            risk = max(risk, score)

    if risk > 0:
        return risk

    return max((score for _, score in labels), default=0.0)


@app.get("/health")
def health_check():
    return {"ok": True}


@app.post("/score")
def score(req: ScoreRequest):
    text = (req.text or "").strip()[:512]
    if not text:
        return {"score": 0.0, "english": 0.0, "hinglish": 0.0}

    english_raw = english_classifier(text)[0]
    hinglish_raw = hinglish_classifier(text)[0]

    english_score = row_score(english_raw if isinstance(english_raw, list) else [english_raw])
    hinglish_score = row_score(hinglish_raw if isinstance(hinglish_raw, list) else [hinglish_raw])
    final_score = max(english_score, hinglish_score)

    return {
        "score": round(final_score, 6),
        "english": round(english_score, 6),
        "hinglish": round(hinglish_score, 6),
    }
