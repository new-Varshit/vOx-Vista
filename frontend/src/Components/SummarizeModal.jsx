import React, { useState, useEffect, useCallback } from "react";
import api from "../utils/Api";
import { useSelector } from "react-redux";

export default function SummarizeModal({ chatRoomId, onClose }) {
  const targetLanguage = useSelector((s) => s.lng.targetLanguage);
  const [summary, setSummary] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const run = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await api.post(
        "/api/ai/summarize",
        { chatRoomId },
        { withCredentials: true }
      );
      if (!res.data.success) {
        throw new Error(res.data.message || "Could not summarize");
      }
      let text = res.data.summary;
      if (targetLanguage) {
        const tr = await api.post(
          "/api/translate/translateMsg",
          {
            targetLanguage,
            message: {
              content: text,
              _id: "summary",
              sender: {},
              chatRoom: { _id: chatRoomId },
            },
          },
          { withCredentials: true }
        );
        if (tr.data.success) {
          text = tr.data.translatedMessage.content;
        }
      }
      setSummary(text);
    } catch (e) {
      setError(e.response?.data?.message || e.message || "Summary failed");
      setSummary("");
    } finally {
      setLoading(false);
    }
  }, [chatRoomId, targetLanguage]);

  useEffect(() => {
    run();
  }, [run]);

  return (
    <div
      className="fixed inset-0 z-[110] flex items-center justify-center bg-black/50 p-4"
      role="dialog"
      aria-modal="true"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg max-h-[min(80vh,28rem)] flex flex-col rounded-xl border-2 border-gray-300 bg-white shadow-xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="border-b-2 border-gray-300 bg-gray-100 px-4 py-3 flex items-center justify-between">
          <h2 className="text-sm font-bold text-gray-800">Conversation summary</h2>
          <button
            type="button"
            className="text-gray-600 hover:text-gray-900 text-lg leading-none px-2"
            onClick={onClose}
            aria-label="Close"
          >
            ×
          </button>
        </div>
        <p className="px-4 py-2 text-xs text-gray-600 border-b border-gray-200">
          Based on the last 50 messages in this chat
          {targetLanguage ? ` · Shown in your selected language` : ""}.
        </p>
        <div className="flex-1 overflow-y-auto px-4 py-3 text-sm text-gray-800 whitespace-pre-wrap">
          {loading && <p className="text-gray-500">Generating summary…</p>}
          {!loading && error && <p className="text-red-600">{error}</p>}
          {!loading && !error && summary}
        </div>
        <div className="border-t border-gray-200 px-4 py-3 flex gap-2 justify-end flex-wrap">
          <button
            type="button"
            className="px-3 py-2 text-sm rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50"
            onClick={onClose}
          >
            Close
          </button>
          <button
            type="button"
            disabled={loading}
            className="px-3 py-2 text-sm rounded-lg bg-anotherPrimary text-white hover:opacity-90 disabled:opacity-50"
            onClick={() => run()}
          >
            Regenerate
          </button>
        </div>
      </div>
    </div>
  );
}
