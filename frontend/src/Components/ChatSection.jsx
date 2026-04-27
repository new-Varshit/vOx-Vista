import React from 'react';
import api from '../utils/Api';
import { useState, useEffect, useRef, useCallback } from 'react';
import { useSelector } from 'react-redux';
import MessageSecCS from './MessageSecCS';
import InputAreaCS from './InputAreaCS';
import HeaderSecCS from './HeaderSecCS';
import SummarizeModal from './SummarizeModal';
import { getUserId } from '../utils/UserId';


function ChatSection({
  isMobileChatOpen,
  setIsMobileChatOpen,
  setActiveChatRooms,
  socketRef,
  socket,
  emitTyping,
  emitStopTyping,
  joinChatRoom,
  sideProfileCard,
  isSideProfileCard,
  delOptCardToggle,
  messages,
  setMessages,
  accessMessage,
  registerCallHandlers
}) {

  const currentChat = useSelector((state) => state.chat.currentChat);
  const currentChatRoom = useSelector((state) => state.chatRoom.currentChatRoom);
  const isBotChat = Boolean(currentChat?.isBot);
  const targetLanguage = useSelector((state) => state.lng.targetLanguage);
  const currentChatRoomRef = useRef(null);
  const [isMessagesLoading, setIsMessagesLoading] = useState(false);
  const [unreadCount, setUnreadCount] = useState(null);
  const [firstUnreadId, setFirstUnreadId] = useState(null);

  const userId = getUserId();

  // FIX #4: Moved targetLanguageRef above handleReceiveMessage so it's
  // declared before it's referenced inside the callback.
  const targetLanguageRef = useRef(targetLanguage);
  useEffect(() => {
    targetLanguageRef.current = targetLanguage;
  }, [targetLanguage]);

  const currentChatRef = useRef(currentChat);
  useEffect(() => {
    currentChatRoomRef.current = currentChatRoom;
  }, [currentChatRoom]);
  useEffect(() => {
    currentChatRef.current = currentChat;
  }, [currentChat]);

  const messagesRef = useRef([]);
  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  // Callback for 'receiveMessage' socket.io event listener
  const handleReceiveMessage = useCallback(
    async (incomingMessage) => {
      const activeRoomId = currentChatRoomRef.current?._id;
      if (!activeRoomId) return;
      if (incomingMessage.chatRoom._id !== activeRoomId) return;
      if (currentChatRef.current?.isBot) return;

      if (messagesRef.current.some(m => m._id === incomingMessage._id)) {
        return;
      }

      setMessages(prev => [...prev, incomingMessage]);

      if (
        incomingMessage?.sender?._id !== userId &&
        targetLanguageRef.current
      ) {
        try {
          const response = await api.post(
            "/api/translate/translateMsg",
            {
              targetLanguage: targetLanguageRef.current,
              message: incomingMessage,
            },
            { withCredentials: true }
          );

          if (response.data.success) {
            setMessages(prev =>
              prev.map(m =>
                m._id === incomingMessage._id
                  ? {
                    ...response.data.translatedMessage,
                    deliveredTo: m.deliveredTo?.length > 0
                      ? m.deliveredTo
                      : response.data.translatedMessage.deliveredTo,
                    readBy: m.readBy?.length > 0
                      ? m.readBy
                      : response.data.translatedMessage.readBy
                  }
                  : m
              )
            );
          }
        } catch (err) {
          console.error("Translation error:", err);
        }
      }
    },
    [userId]
  );

  const [isTyping, setIsTyping] = useState(false);
  const [typingUsers, setTypingUsers] = useState([]);
  const [sendMessage, setSendMessage] = useState('');
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [isDelSelCardVisible, setIsDelSelCardVisible] = useState(false);
  const [inSelectMode, setSelectMode] = useState(false);
  const [selectedMsgs, setSelectedMsgs] = useState([]);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [isAtBottom, setIsAtBottom] = useState(true);
  const [callState, setCallState] = useState({
    phase: "idle",
    callType: null,
    peerUserId: null,
    chatRoomId: null
  });
  const [captionPrefs, setCaptionPrefs] = useState({
    enabled: true,
    showOriginal: true,
    translateTo: targetLanguage || "en",
    speechLang: "en-US",
  });
  const [showCaptionSettings, setShowCaptionSettings] = useState(false);
  const [callCaptions, setCallCaptions] = useState([]);
  const [captionStatus, setCaptionStatus] = useState("");
  const [translationCache, setTranslationCache] = useState(new Map());
  const [translatingCaptions, setTranslatingCaptions] = useState(new Set());
  const [localStream, setLocalStream] = useState(null);
  const [remoteStream, setRemoteStream] = useState(null);
  const [aiChatMessages, setAiChatMessages] = useState([]);
  const [hasMoreOlder, setHasMoreOlder] = useState(false);
  const [nextOlderCursor, setNextOlderCursor] = useState(null);
  const [loadingOlder, setLoadingOlder] = useState(false);
  const [modBlockOpen, setModBlockOpen] = useState(false);
  const [modWarnOpen, setModWarnOpen] = useState(false);
  const [summarizeOpen, setSummarizeOpen] = useState(false);
  const loadOlderLockRef = useRef(false);
  const moderationForceRef = useRef(false);
  const moderationRetryRef = useRef(null);

  const typingTimeoutRef = useRef(null);
  const lastMessageRef = useRef(null);
  const firstUnreadRef = useRef(null);
  const peerConnectionRef = useRef(null);
  const pendingCandidatesRef = useRef([]);
  const incomingCallRef = useRef(null);
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const localAudioRef = useRef(null);
  const remoteAudioRef = useRef(null);
  const localStreamRef = useRef(null);
  const speechRecognitionRef = useRef(null);
  const shouldRunRecognitionRef = useRef(false);
  const recognitionRestartTimerRef = useRef(null);
  const captionDebounceRef = useRef(null);
  const lastCaptionRef = useRef("");

  const typingObj = {
    userId: currentChat?._id,
    chatRoomId: currentChatRoom?._id
  };

  const stopStreamTracks = (stream) => {
    if (!stream) return;
    stream.getTracks().forEach((track) => track.stop());
  };

  const cleanupCallState = () => {
    if (peerConnectionRef.current) {
      peerConnectionRef.current.onicecandidate = null;
      peerConnectionRef.current.ontrack = null;
      peerConnectionRef.current.close();
      peerConnectionRef.current = null;
    }
    pendingCandidatesRef.current = [];
    incomingCallRef.current = null;
    stopStreamTracks(localStreamRef.current);
    if (speechRecognitionRef.current) {
      speechRecognitionRef.current.onresult = null;
      speechRecognitionRef.current.onerror = null;
      speechRecognitionRef.current.onend = null;
      speechRecognitionRef.current.stop();
      speechRecognitionRef.current = null;
    }
    setLocalStream(null);
    localStreamRef.current = null;
    setRemoteStream(null);
    setCallCaptions([]);
    setCaptionStatus("");
    setShowCaptionSettings(false);
    setCallState({ phase: "idle", callType: null, peerUserId: null, chatRoomId: null });
  };

  // FIX #2: Removed the orphaned `pc.addTrack` block that existed outside
  // this function. All track-adding logic is now correctly inside here.
  const createPeerConnection = (peerUserId, callType, chatRoomId) => {
    if (peerConnectionRef.current) return peerConnectionRef.current;

    const pc = new RTCPeerConnection({
      iceServers: [{ urls: "stun:stun.l.google.com:19302" }]
    });

    pc.ontrack = (event) => {
      const [stream] = event.streams || [];
      if (stream) setRemoteStream(stream);
    };

    pc.onicecandidate = (event) => {
      if (!event.candidate || !socketRef.current || !chatRoomId) return;
      socketRef.current.emit("call:ice-candidate", {
        chatRoomId,
        toUserId: peerUserId,
        candidate: event.candidate
      });
    };

    const currentLocalStream = localStreamRef.current;
    if (currentLocalStream) {
      currentLocalStream.getTracks().forEach((track) => {
        pc.addTrack(track, currentLocalStream);
      });
    }

    peerConnectionRef.current = pc;
    setCallState((prev) => ({
      ...prev,
      phase: prev.phase === "incoming" ? "active" : prev.phase,
      callType: callType || prev.callType,
      peerUserId,
      chatRoomId: chatRoomId || prev.chatRoomId
    }));
    return pc;
  };

  const requestMedia = async (callType) => {
    const constraints = {
      audio: true,
      video: callType === "video"
    };
    return navigator.mediaDevices.getUserMedia(constraints);
  };

  const startCall = async (callType) => {
    if (!socketRef.current || !currentChatRoom?._id) return;
    if (currentChatRoom?.isGroupChat) {
      alert("Voice/video calling is currently available for one-to-one chats only.");
      return;
    }
    if (!currentChat?._id) return;
    try {
      const stream = await requestMedia(callType);
      setLocalStream(stream);
      localStreamRef.current = stream;
      setCallState({ phase: "outgoing", callType, peerUserId: currentChat._id, chatRoomId: currentChatRoom._id });
      socketRef.current.emit("call:initiate", {
        chatRoomId: currentChatRoom._id,
        callType,
        toUserId: currentChat._id
      });
    } catch (err) {
      console.log("media permission error", err);
      alert("Could not access microphone/camera. Please allow permissions.");
    }
  };

  const acceptIncomingCall = async () => {
    const incoming = incomingCallRef.current;
    if (!incoming || !socketRef.current) return;
    try {
      const stream = await requestMedia(incoming.callType);
      setLocalStream(stream);
      localStreamRef.current = stream;
      setCallState({
        phase: "active",
        callType: incoming.callType,
        peerUserId: incoming.fromUserId,
        chatRoomId: incoming.chatRoomId
      });
      socketRef.current.emit("call:accept", {
        chatRoomId: incoming.chatRoomId,
        toUserId: incoming.fromUserId,
        callType: incoming.callType
      });
    } catch (err) {
      console.log("accept call media error", err);
      alert("Could not access required media devices.");
    }
  };

  const declineIncomingCall = () => {
    const incoming = incomingCallRef.current;
    if (incoming && socketRef.current) {
      socketRef.current.emit("call:decline", {
        chatRoomId: incoming.chatRoomId,
        toUserId: incoming.fromUserId
      });
    }
    cleanupCallState();
  };

  const endCall = () => {
    if (socketRef.current && callState.chatRoomId && callState.peerUserId) {
      socketRef.current.emit("call:end", {
        chatRoomId: callState.chatRoomId,
        toUserId: callState.peerUserId
      });
    }
    cleanupCallState();
  };

  useEffect(() => {
    if (!registerCallHandlers) return;
    registerCallHandlers({ startCall, endCall });
  }, [registerCallHandlers]);

  const upsertCaption = useCallback((captionEntry) => {
    setCallCaptions((prev) => {
      const updated = [...prev, captionEntry].slice(-6);
      return updated;
    });
  }, []);

  // FIX #1 & #3: All duplicate function definitions that had leaked outside
  // the component have been removed. Only the single set above is kept.

  const maybeTranslateCaption = useCallback(
    async (text, captionId) => {
      if (!captionPrefs.enabled || !captionPrefs.translateTo || !text?.trim()) {
        return text;
      }

      const cacheKey = `${text}-${captionPrefs.translateTo}`;
      const cached = translationCache.get(cacheKey);
      if (cached) {
        return cached;
      }

      if (translatingCaptions.has(cacheKey)) {
        return text;
      }

      setTranslatingCaptions(prev => new Set(prev).add(cacheKey));

      try {
        const response = await api.post(
          "/api/translate/translateMsg",
          {
            targetLanguage: captionPrefs.translateTo,
            message: { content: text },
          },
          { withCredentials: true }
        );

        let translatedText = text;
        if (response.data.success) {
          translatedText = response.data.translatedMessage.content;

          setTranslationCache(prev => {
            const newCache = new Map(prev);
            if (newCache.size > 100) {
              const firstKey = newCache.keys().next().value;
              newCache.delete(firstKey);
            }
            newCache.set(cacheKey, translatedText);
            return newCache;
          });
        }

        return translatedText;
      } catch (err) {
        console.error("Caption translation error:", err);
        setCaptionStatus("Translation unavailable - showing original");
        return text;
      } finally {
        setTranslatingCaptions(prev => {
          const newSet = new Set(prev);
          newSet.delete(cacheKey);
          return newSet;
        });
      }
    },
    [captionPrefs.enabled, captionPrefs.translateTo, translationCache, translatingCaptions]
  );

  // FIX #5: Removed the duplicate readMessages useEffect. Only one instance
  // is kept here.
  useEffect(() => {
    if (!currentChatRoom || messages.length === 0) return;
    if (!socketRef.current) return;
    if (!document.hasFocus()) return;

    const unreadMessages = messages.filter(
      msg =>
        msg?.sender?._id !== userId &&
        !msg?.readBy?.includes(userId)
    );

    if (unreadMessages.length === 0) return;

    const timeoutId = setTimeout(() => {
      socketRef.current.emit("readMessages", {
        chatRoomId: currentChatRoom._id,
        userId
      });
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [currentChatRoom, messages, userId]);

  // Also mark as read when the window regains focus
  useEffect(() => {
    const handleFocus = () => {
      if (!currentChatRoom || !socketRef.current) return;

      const hasUnread = messages.some(
        msg =>
          msg?.sender?._id !== userId &&
          !msg?.readBy?.includes(userId)
      );

      if (hasUnread) {
        socketRef.current.emit("readMessages", {
          chatRoomId: currentChatRoom._id,
          userId
        });
      }
    };

    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [currentChatRoom, messages, userId]);

  // FIX #6: Unified socket reference — always resolve once at the top of
  // each effect rather than mixing socket / socketRef.current inline.
  useEffect(() => {
    const socketInstance = socket || socketRef.current;
    if (!socketInstance) return;

    const onReceiveMessage = handleReceiveMessage;

    const onDisplayTyping = (uid) => {
      setTypingUsers(prev => (prev.includes(String(uid)) ? prev : [...prev, String(uid)]));
    };

    const onRemoveTyping = (uid) => {
      setTypingUsers(prev => prev.filter(id => id !== String(uid)));
    };

    const onMsgsRead = ({ chatRoomId, readerId }) => {
      if (String(chatRoomId) !== String(currentChatRoom?._id)) return;
      setMessages(prev => prev.map(msg => {
        if (String(msg?.sender?._id) === String(readerId)) return msg;
        if ((msg.readBy || []).map(String).includes(String(readerId))) return msg;
        return { ...msg, readBy: [...(msg.readBy || []), String(readerId)] };
      }));
    };

    const onMessageDeleted = ({ messageId, chatRoomId }) => {
      if (chatRoomId && String(chatRoomId) !== String(currentChatRoom?._id)) return;
      const id = messageId || (typeof messageId === 'string' ? messageId : null);
      if (!id) return;
      setMessages(prev => prev.filter(msg => String(msg._id) !== String(id)));
    };

    const onUpdateOnlineStatus = (users) => {
      setOnlineUsers(users || []);
    };

    socketInstance.on("receiveMessage", onReceiveMessage);
    socketInstance.on("displayTyping", onDisplayTyping);
    socketInstance.on("removeTyping", onRemoveTyping);
    socketInstance.on("msgsRead", onMsgsRead);
    socketInstance.on("messageDeleted", onMessageDeleted);
    socketInstance.on("update-online-status", onUpdateOnlineStatus);

    return () => {
      socketInstance.off("receiveMessage", onReceiveMessage);
      socketInstance.off("displayTyping", onDisplayTyping);
      socketInstance.off("removeTyping", onRemoveTyping);
      socketInstance.off("msgsRead", onMsgsRead);
      socketInstance.off("messageDeleted", onMessageDeleted);
      socketInstance.off("update-online-status", onUpdateOnlineStatus);
    };
  }, [handleReceiveMessage, currentChatRoom?._id, socket]);

  useEffect(() => {
    if (localVideoRef.current) {
      localVideoRef.current.srcObject = localStream || null;
    }
  }, [localStream]);

  useEffect(() => {
    if (remoteVideoRef.current) {
      remoteVideoRef.current.srcObject = remoteStream || null;
    }
  }, [remoteStream]);

  useEffect(() => {
    if (localAudioRef.current) {
      localAudioRef.current.srcObject = localStream || null;
    }
  }, [localStream]);

  useEffect(() => {
    if (remoteAudioRef.current) {
      remoteAudioRef.current.srcObject = remoteStream || null;
      if (remoteStream) {
        remoteAudioRef.current.play().catch(() => {});
      }
    }
  }, [remoteStream]);

  useEffect(() => {
    const socketInstance = socket || socketRef.current;
    if (!socketInstance) return;

    const onIncomingCall = ({ chatRoomId, callType, fromUserId }) => {
      incomingCallRef.current = { chatRoomId, callType, fromUserId };
      setCallState({ phase: "incoming", callType, peerUserId: fromUserId, chatRoomId });
    };

    const onCallAccepted = async ({ chatRoomId, callType, fromUserId }) => {
      if (!chatRoomId) return;
      if (!localStreamRef.current) return;
      try {
        const pc = createPeerConnection(fromUserId, callType, chatRoomId);
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        socketInstance.emit("call:offer", {
          chatRoomId,
          toUserId: fromUserId,
          callType,
          sdp: offer
        });
        setCallState({ phase: "active", callType, peerUserId: fromUserId, chatRoomId });
      } catch (err) {
        console.log("create offer error", err);
        cleanupCallState();
      }
    };

    const onCallDeclined = () => {
      alert("Call was declined.");
      cleanupCallState();
    };

    const onCallOffer = async ({ chatRoomId, callType, fromUserId, sdp }) => {
      if (!chatRoomId || !sdp) return;
      try {
        if (!localStreamRef.current) {
          const stream = await requestMedia(callType);
          setLocalStream(stream);
          localStreamRef.current = stream;
        }
        const pc = createPeerConnection(fromUserId, callType, chatRoomId);
        await pc.setRemoteDescription(new RTCSessionDescription(sdp));
        for (const cand of pendingCandidatesRef.current) {
          await pc.addIceCandidate(new RTCIceCandidate(cand));
        }
        pendingCandidatesRef.current = [];
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        socketInstance.emit("call:answer", {
          chatRoomId,
          toUserId: fromUserId,
          sdp: answer
        });
      } catch (err) {
        console.log("handle offer error", err);
        cleanupCallState();
      }
    };

    const onCallAnswer = async ({ chatRoomId, sdp }) => {
      if (!chatRoomId) return;
      try {
        const pc = peerConnectionRef.current;
        if (!pc) return;
        await pc.setRemoteDescription(new RTCSessionDescription(sdp));
        for (const cand of pendingCandidatesRef.current) {
          await pc.addIceCandidate(new RTCIceCandidate(cand));
        }
        pendingCandidatesRef.current = [];
      } catch (err) {
        console.log("handle answer error", err);
      }
    };

    const onCallIce = async ({ candidate }) => {
      const pc = peerConnectionRef.current;
      if (!candidate) return;
      if (!pc || !pc.remoteDescription) {
        pendingCandidatesRef.current.push(candidate);
        return;
      }
      try {
        await pc.addIceCandidate(new RTCIceCandidate(candidate));
      } catch (err) {
        console.log("ice candidate error", err);
      }
    };

    const onCallEnded = () => {
      cleanupCallState();
    };

    const onCallCaption = async ({ chatRoomId, fromUserId, caption }) => {
      if (!captionPrefs.enabled) return;
      if (!caption?.text?.trim()) return;
      if (String(chatRoomId) !== String(callState.chatRoomId)) return;

      const captionText = caption.text.trim();
      if (captionText === lastCaptionRef.current) return;
      lastCaptionRef.current = captionText;

      if (captionDebounceRef.current) {
        clearTimeout(captionDebounceRef.current);
      }

      captionDebounceRef.current = setTimeout(async () => {
        const captionId = `${fromUserId}-${Date.now()}`;
        const translated = await maybeTranslateCaption(captionText, captionId);

        upsertCaption({
          id: captionId,
          fromUserId,
          original: captionText,
          translated,
          isTranslating: translatingCaptions.has(`${captionText}-${captionPrefs.translateTo}`),
          at: caption.at || Date.now(),
        });
      }, 300);
    };

    socketInstance.on("call:incoming", onIncomingCall);
    socketInstance.on("call:accepted", onCallAccepted);
    socketInstance.on("call:declined", onCallDeclined);
    socketInstance.on("call:offer", onCallOffer);
    socketInstance.on("call:answer", onCallAnswer);
    socketInstance.on("call:ice-candidate", onCallIce);
    socketInstance.on("call:ended", onCallEnded);
    socketInstance.on("call:caption", onCallCaption);

    return () => {
      socketInstance.off("call:incoming", onIncomingCall);
      socketInstance.off("call:accepted", onCallAccepted);
      socketInstance.off("call:declined", onCallDeclined);
      socketInstance.off("call:offer", onCallOffer);
      socketInstance.off("call:answer", onCallAnswer);
      socketInstance.off("call:ice-candidate", onCallIce);
      socketInstance.off("call:ended", onCallEnded);
      socketInstance.off("call:caption", onCallCaption);
    };
  }, [socket, callState.chatRoomId, captionPrefs.enabled, maybeTranslateCaption, upsertCaption]);

  useEffect(() => {
    if (!targetLanguage) return;
    setCaptionPrefs((prev) => ({ ...prev, translateTo: targetLanguage }));
  }, [targetLanguage]);

  useEffect(() => {
    if (!currentChatRoom) return;

    joinChatRoom(currentChatRoom._id);

    return () => {
      socketRef.current?.emit("leaveRoom", currentChatRoom._id);
    };
  }, [currentChatRoom]);

  useEffect(() => {
    const socketInstance = socket || socketRef.current;
    const Recognition =
      window.SpeechRecognition || window.webkitSpeechRecognition || null;

    if (
      !Recognition ||
      !socketInstance ||
      callState.phase !== "active" ||
      !captionPrefs.enabled ||
      !callState.chatRoomId ||
      !callState.peerUserId
    ) {
      shouldRunRecognitionRef.current = false;
      if (recognitionRestartTimerRef.current) {
        clearTimeout(recognitionRestartTimerRef.current);
        recognitionRestartTimerRef.current = null;
      }
      if (speechRecognitionRef.current) {
        speechRecognitionRef.current.stop();
        speechRecognitionRef.current = null;
      }
      if (!Recognition && captionPrefs.enabled && callState.phase === "active") {
        setCaptionStatus("Captions unavailable: this browser does not support SpeechRecognition.");
      }
      return;
    }

    const recognition = new Recognition();
    shouldRunRecognitionRef.current = true;
    recognition.continuous = true;
    recognition.interimResults = false;
    recognition.lang = captionPrefs.speechLang || "en-US";

    recognition.onresult = (event) => {
      const result = event.results[event.results.length - 1];
      const text = result?.[0]?.transcript?.trim();
      if (!text) return;
      setCaptionStatus("Captions active");
      socketInstance.emit("call:caption", {
        chatRoomId: callState.chatRoomId,
        toUserId: callState.peerUserId,
        caption: {
          text,
          isFinal: true,
          at: Date.now(),
        },
      });
    };

    recognition.onerror = (event) => {
      const code = event?.error || "unknown";
      if (code === "aborted") return;
      console.error("SpeechRecognition error:", code, event);
      if (code === "not-allowed" || code === "service-not-allowed") {
        setCaptionStatus("Captions blocked: microphone/speech permission denied.");
        return;
      }
      if (code === "audio-capture") {
        setCaptionStatus("Captions unavailable: microphone input could not be captured.");
        return;
      }
      setCaptionStatus(`Captions error: ${code}`);
    };

    recognition.onend = () => {
      if (
        shouldRunRecognitionRef.current &&
        speechRecognitionRef.current &&
        callState.phase === "active" &&
        captionPrefs.enabled
      ) {
        recognitionRestartTimerRef.current = setTimeout(() => {
          try {
            speechRecognitionRef.current?.start();
          } catch {
            /* no-op */
          }
        }, 300);
      }
    };

    speechRecognitionRef.current = recognition;
    try {
      recognition.start();
      setCaptionStatus("Starting captions...");
    } catch {
      setCaptionStatus("Could not start captions.");
      speechRecognitionRef.current = null;
    }

    return () => {
      shouldRunRecognitionRef.current = false;
      if (recognitionRestartTimerRef.current) {
        clearTimeout(recognitionRestartTimerRef.current);
        recognitionRestartTimerRef.current = null;
      }
      recognition.onresult = null;
      recognition.onerror = null;
      recognition.onend = null;
      recognition.stop();
      if (speechRecognitionRef.current === recognition) {
        speechRecognitionRef.current = null;
      }
    };
  }, [
    socket,
    callState.phase,
    callState.chatRoomId,
    callState.peerUserId,
    captionPrefs.enabled,
    captionPrefs.speechLang,
    upsertCaption,
    userId,
  ]);

  useEffect(() => {
    return () => {
      cleanupCallState();
    };
  }, []);

  const handleTyping = () => {
    if (isBotChat) return;
    if (!isTyping) {
      emitTyping(typingObj);
      setIsTyping(true);
    }

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    typingTimeoutRef.current = setTimeout(() => {
      emitStopTyping(typingObj);
      setIsTyping(false);
    }, 2000);
  };

  const loadOlderMessages = useCallback(async () => {
    if (
      !currentChatRoom?._id ||
      isBotChat ||
      loadingOlder ||
      !hasMoreOlder ||
      !nextOlderCursor ||
      loadOlderLockRef.current
    ) {
      return;
    }
    loadOlderLockRef.current = true;
    setLoadingOlder(true);
    try {
      const { beforeId, beforeAt } = nextOlderCursor;
      const qs = new URLSearchParams({
        limit: "30",
        beforeId: String(beforeId),
        beforeAt: new Date(beforeAt).toISOString(),
      });
      const response = await api.get(`/api/message/${currentChatRoom._id}?${qs.toString()}`, {
        withCredentials: true,
      });
      if (!response.data.success) return;
      const older = response.data.messages.filter((msg) => !msg.deletedFor?.includes(userId));
      setMessages((prev) => {
        const ids = new Set(prev.map((m) => String(m._id)));
        const merged = older.filter((m) => !ids.has(String(m._id)));
        return [...merged, ...prev];
      });
      setHasMoreOlder(Boolean(response.data.hasMoreOlder));
      setNextOlderCursor(response.data.nextOlderCursor || null);
    } catch (err) {
      console.log(err);
    } finally {
      setLoadingOlder(false);
      loadOlderLockRef.current = false;
    }
  }, [currentChatRoom?._id, isBotChat, loadingOlder, hasMoreOlder, nextOlderCursor, userId]);

  const displayMessages = isBotChat ? aiChatMessages : messages;

  const sendAiChat = async (e) => {
    e.preventDefault();
    const text = sendMessage.trim();
    if (!text || !currentChatRoom?._id) return;

    const userLocalId = `local-u-${Date.now()}`;
    const asstLocalId = `local-a-${Date.now()}`;
    const userEntry = {
      _id: userLocalId,
      content: text,
      createdAt: new Date().toISOString(),
      isSystem: false,
      sender: { _id: userId, userName: "You", profile: {} },
      readBy: [],
      deliveredTo: [],
      chatRoom: { _id: currentChatRoom._id },
    };
    const botSender = {
      _id: currentChat?._id || "ai-bot",
      userName: currentChat?.userName || "AI Assistant",
      profile: currentChat?.profile || {},
    };
    const asstEntry = {
      _id: asstLocalId,
      content: "",
      createdAt: new Date().toISOString(),
      isSystem: false,
      sender: botSender,
      readBy: [],
      deliveredTo: [],
      chatRoom: { _id: currentChatRoom._id },
      streaming: true,
    };

    setSendMessage("");
    setAiChatMessages((prev) => [...prev, userEntry, asstEntry]);

    const historyPayload = [...aiChatMessages, userEntry]
      .filter((m) => !m.streaming && (m.content || "").trim())
      .map((m) => ({
        role: String(m.sender?._id) === String(userId) ? "user" : "assistant",
        content: (m.content || "").trim(),
      }));

    const baseUrl = import.meta.env.VITE_API_URL || "";
    try {
      const res = await fetch(`${baseUrl}/api/ai/assistant/stream`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: historyPayload }),
      });
      if (!res.ok || !res.body) {
        throw new Error("Assistant request failed");
      }
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let doneStream = false;
      while (!doneStream) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const parts = buffer.split("\n\n");
        buffer = parts.pop() || "";
        for (const part of parts) {
          const line = part.trim();
          if (!line.startsWith("data:")) continue;
          const jsonStr = line.replace(/^data:\s*/, "");
          try {
            const payload = JSON.parse(jsonStr);
            if (payload.type === "token" && payload.text) {
              setAiChatMessages((prev) =>
                prev.map((m) =>
                  m._id === asstLocalId ? { ...m, content: (m.content || "") + payload.text } : m
                )
              );
            } else if (payload.type === "error") {
              setAiChatMessages((prev) =>
                prev.map((m) =>
                  m._id === asstLocalId
                    ? { ...m, content: payload.message || "Something went wrong.", streaming: false }
                    : m
                )
              );
              doneStream = true;
            } else if (payload.type === "done") {
              doneStream = true;
            }
          } catch {
            /* ignore parse */
          }
        }
      }
      setAiChatMessages((prev) =>
        prev.map((m) => (m._id === asstLocalId ? { ...m, streaming: false } : m))
      );
    } catch (err) {
      console.error(err);
      setAiChatMessages((prev) =>
        prev.map((m) =>
          m._id === asstLocalId
            ? { ...m, content: "Could not reach the assistant. Try again later.", streaming: false }
            : m
        )
      );
    }
  };

  const confirmModerationWarnSend = async () => {
    const retry = moderationRetryRef.current;
    setModWarnOpen(false);
    if (!retry || !currentChatRoom?._id) return;
    moderationRetryRef.current = null;

    const message = new FormData();
    message.append("chatRoomId", currentChatRoom._id);
    message.append("content", retry.text || "");
    message.append("force", "true");
    (retry.files || []).forEach((fileObj) => message.append("attachments", fileObj.file));

    const tempId = "temp-" + Date.now();
    const tempMessage = {
      _id: tempId,
      content: retry.text || "",
      createdAt: new Date().toISOString(),
      isSystem: false,
      attachments: (retry.files || []).map((f) => ({
        url: URL.createObjectURL(f.file),
        mimeType: f.file.type,
        temp: true,
      })),
      sender: { _id: userId },
      readBy: [],
      deliveredTo: [],
      status: "sending",
      chatRoom: { _id: currentChatRoom._id },
    };

    setMessages((prev) => [...prev, tempMessage]);

    try {
      const response = await api.post("/api/message/sendMessage", message, {
        headers: { "Content-Type": "multipart/form-data" },
        withCredentials: true,
        validateStatus: () => true,
      });

      if (response.status === 400 && response.data?.blocked) {
        setMessages((prev) => prev.filter((m) => m._id !== tempId));
        setModBlockOpen(true);
        return;
      }

      if (!response.data?.success) {
        setMessages((prev) => prev.filter((m) => m._id !== tempId));
        return;
      }

      setMessages((prev) =>
        prev.map((m) => {
          if (m._id !== tempId) return m;
          return {
            ...response.data.message,
            deliveredTo: m.deliveredTo?.length ? m.deliveredTo : response.data.message.deliveredTo,
            readBy: m.readBy?.length ? m.readBy : response.data.message.readBy,
          };
        })
      );

      setActiveChatRooms((prev) => {
        const index = prev.findIndex((room) => room._id === response.data.message.chatRoom._id);
        if (index === -1) return prev;
        const updatedRoom = { ...prev[index], lastMessage: response.data.message };
        const newList = [...prev];
        newList.splice(index, 1);
        newList.unshift(updatedRoom);
        return newList;
      });

      socketRef.current?.emit("sendMessage", { message: response.data.message });
    } catch (err) {
      console.log(err);
      setMessages((prev) => prev.filter((m) => m._id !== tempId));
    }
  };

  useEffect(() => {
    const fetchChatRoomMessages = async () => {
      if (!currentChatRoom?._id) {
        return;
      }
      if (currentChat?.isBot) {
        setIsMessagesLoading(false);
        setHasMoreOlder(false);
        setNextOlderCursor(null);
        return;
      }
      setIsMessagesLoading(true);
      setHasMoreOlder(false);
      setNextOlderCursor(null);
      if (selectedMsgs) {
        handleCancelSelection();
      }
      try {
        const response = await api.get(`/api/message/${currentChatRoom._id}?limit=30`, {
          withCredentials: true
        });
        if (response.data.success) {
          const visibleMessages = response?.data?.messages.filter(msg => !msg.deletedFor.includes(userId));
          setMessages(visibleMessages);
          setHasMoreOlder(Boolean(response.data.hasMoreOlder));
          setNextOlderCursor(response.data.nextOlderCursor || null);

          const unread = visibleMessages.filter(m => m?.sender?._id !== userId && !m.readBy.includes(userId));
          setUnreadCount(unread.length);
          const firstUnread = unread[0];
          setFirstUnreadId(firstUnread?._id || null);
        }
      } catch (err) {
        console.log(err);
      } finally {
        setIsMessagesLoading(false);
      }
    };
    fetchChatRoomMessages();
  }, [currentChatRoom, currentChat?.isBot]);

  useEffect(() => {
    if (lastMessageRef.current) {
      if (isAtBottom) {
        lastMessageRef.current.scrollIntoView({ behavior: 'auto' });
      }
    }
  }, [displayMessages.length, isAtBottom]);

  useEffect(() => {
    if (firstUnreadRef.current) {
      firstUnreadRef.current.scrollIntoView({ block: "center" });
    }
  }, [firstUnreadId]);

  const sendInputMessage = async (e) => {
    e.preventDefault();
    if (isBotChat) {
      return sendAiChat(e);
    }
    if (!(sendMessage || selectedFiles.length > 0)) {
      return;
    }

    const pendingText = sendMessage;
    const pendingFiles = [...selectedFiles];

    let message = new FormData();
    message.append("chatRoomId", currentChatRoom._id);
    message.append("content", pendingText);
    message.append("force", moderationForceRef.current ? "true" : "false");
    moderationForceRef.current = false;

    if (pendingFiles.length > 0) {
      pendingFiles.forEach((fileObj) => {
        message.append("attachments", fileObj.file);
      });
    }

    const tempId = "temp-" + Date.now();

    const tempMessage = {
      _id: tempId,
      content: pendingText,
      createdAt: new Date().toISOString(),
      isSystem: false,
      attachments: pendingFiles.map((f) => ({
        url: URL.createObjectURL(f.file),
        mimeType: f.file.type,
        temp: true,
      })),
      sender: {
        _id: userId,
      },
      readBy: [],
      deliveredTo: [],
      status: "sending",
      chatRoom: { _id: currentChatRoom._id },
    };

    setMessages((prev) => [...prev, tempMessage]);
    setSendMessage("");
    setSelectedFiles([]);

    try {
      const response = await api.post("/api/message/sendMessage", message, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
        withCredentials: true,
        validateStatus: () => true,
      });

      if (response.data?.warn) {
        setMessages((prev) => prev.filter((m) => m._id !== tempId));
        setSendMessage(pendingText);
        setSelectedFiles(pendingFiles);
        moderationRetryRef.current = { text: pendingText, files: pendingFiles };
        setModWarnOpen(true);
        return;
      }

      if (response.status === 400 && response.data?.blocked) {
        setMessages((prev) => prev.filter((m) => m._id !== tempId));
        setSendMessage(pendingText);
        setSelectedFiles(pendingFiles);
        setModBlockOpen(true);
        return;
      }

      if (!response.data?.success) {
        setMessages((prev) => prev.filter((m) => m._id !== tempId));
        setSendMessage(pendingText);
        setSelectedFiles(pendingFiles);
        return;
      }

      setMessages((prev) =>
        prev.map((m) => {
          if (m._id !== tempId) return m;
          return {
            ...response.data.message,
            deliveredTo: m.deliveredTo?.length ? m.deliveredTo : response.data.message.deliveredTo,
            readBy: m.readBy?.length ? m.readBy : response.data.message.readBy,
          };
        })
      );

      setActiveChatRooms((prev) => {
        const index = prev.findIndex((room) => room._id === response.data.message.chatRoom._id);
        if (index === -1) return prev;
        const updatedRoom = {
          ...prev[index],
          lastMessage: response.data.message,
        };
        const newList = [...prev];
        newList.splice(index, 1);
        newList.unshift(updatedRoom);
        return newList;
      });

      socketRef.current?.emit("sendMessage", { message: response.data.message });
    } catch (err) {
      console.log(err);
      setMessages((prev) => prev.filter((m) => m._id !== tempId));
      setSendMessage(pendingText);
      setSelectedFiles(pendingFiles);
    }
  };

  const handleDelSelCard = async (id) => {
    setIsDelSelCardVisible(prev => prev === id ? '' : id);
  };

  const toggleSelectMessage = async (id, event) => {
    if (event) {
      event.stopPropagation();
    }
    if (!inSelectMode) {
      return;
    }
    if (selectedMsgs.includes(id)) {
      setSelectedMsgs(prev => prev.filter(MsgId => MsgId !== id));
    } else {
      setSelectedMsgs([...selectedMsgs, id]);
    }
  };

  const handleMessageSelect = (id) => {
    if (!inSelectMode) {
      setSelectMode(true);
    }
    setSelectedMsgs([id]);
  };

  const handleCancelSelection = () => {
    setSelectMode(false);
    setSelectedMsgs([]);
  };

  const deleteSelectedMsgs = async (msgId) => {
    try {
      let response;

      if (msgId && selectedMsgs.length === 0) {
        response = await api.post('/api/message/deleteSelectedMsgs', { selectedMsgs: [msgId] }, {
          withCredentials: true
        });
      } else {
        response = await api.post('/api/message/deleteSelectedMsgs', { selectedMsgs }, {
          withCredentials: true
        });
      }

      if (response.data.success) {
        if (typeof msgId === 'string') {
          setMessages(prevMsgs => prevMsgs.filter(mssg => mssg._id !== msgId));
        } else {
          setMessages(prevMsgs => prevMsgs.filter(mssg => !selectedMsgs.includes(mssg._id)));
          handleCancelSelection();
        }
      }
    } catch (err) {
      console.log(err);
    }
  };

  const handleSingleMsgDeletion = (msg) => {
    if (isBotChat) {
      setAiChatMessages((prevMsgs) => prevMsgs.filter((mssg) => mssg._id !== msg._id));
      return;
    }
    if (msg.sender._id === userId) {
      delOptCardToggle(msg._id);
      setMessages(prevMsgs => prevMsgs.filter(mssg => mssg._id !== msg._id));
    } else {
      deleteSelectedMsgs(msg._id);
    }
  };

  // FIX #3: Component now has a proper return and closing brace before export.
  return (
    <>
      {currentChatRoom ? (
        <div className="flex flex-col h-full">
          <div className="flex-shrink-0">
            <HeaderSecCS
              isMobileChatOpen={isMobileChatOpen}
              setIsMobileChatOpen={setIsMobileChatOpen}
              inSelectMode={inSelectMode}
              selectedMsgs={selectedMsgs}
              deleteSelectedMsgs={deleteSelectedMsgs}
              handleCancelSelection={handleCancelSelection}
              typingUsers={typingUsers}
              onlineUsers={onlineUsers}
              isSideProfileCard={isSideProfileCard}
              sideProfileCard={sideProfileCard}
              onStartAudioCall={() => startCall("audio")}
              onStartVideoCall={() => startCall("video")}
              onOpenSummarize={() => setSummarizeOpen(true)}
              showSummarize={!isBotChat && messages.length > 0}
            />
          </div>

          <div className="flex-1 min-h-0 flex flex-col bg-white">
            <MessageSecCS
              isMessagesLoading={isMessagesLoading}
              accessMessage={accessMessage}
              messages={displayMessages}
              selectedMsgs={selectedMsgs}
              inSelectMode={inSelectMode}
              toggleSelectMessage={toggleSelectMessage}
              lastMessageRef={lastMessageRef}
              setIsAtBottom={setIsAtBottom}
              isDelSelCardVisible={isDelSelCardVisible}
              handleDelSelCard={handleDelSelCard}
              handleSingleMsgDeletion={handleSingleMsgDeletion}
              handleMessageSelect={handleMessageSelect}
              unreadCount={unreadCount}
              firstUnreadId={firstUnreadId}
              firstUnreadRef={firstUnreadRef}
              hasMoreOlder={hasMoreOlder}
              loadingOlder={loadingOlder}
              onLoadOlder={loadOlderMessages}
            />
          </div>

          <div className="flex-shrink-0 bg-white border-t border-gray-200 p-3">
            <InputAreaCS
              setSelectedFiles={setSelectedFiles}
              sendInputMessage={sendInputMessage}
              selectedFiles={selectedFiles}
              sendMessage={sendMessage}
              setSendMessage={setSendMessage}
              handleTyping={handleTyping}
              disableAttachments={isBotChat}
            />
          </div>
        </div>
      ) : (
        <div className="w-full h-full flex justify-center items-center bg-white">
          <div className="flex flex-col justify-center items-center gap-2 opacity-80">
            <img
              src="/logo.png"
              alt="VoxVista"
              className="w-24 h-auto object-contain"
            />
            <p className="font-bold text-4xl text-anotherPrimary tracking-wide">
              VoxVista
            </p>
            <p className="font-medium text-lg text-gray-500">
              Your chat will appear here...
            </p>
          </div>
        </div>
      )}

      {summarizeOpen && currentChatRoom?._id && (
        <SummarizeModal
          chatRoomId={currentChatRoom._id}
          onClose={() => setSummarizeOpen(false)}
        />
      )}

      {modBlockOpen && (
        <div
          className="fixed inset-0 z-[110] flex items-center justify-center bg-black/50 p-4"
          onClick={() => setModBlockOpen(false)}
        >
          <div
            className="w-full max-w-sm rounded-xl border border-gray-200 bg-white p-6 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-semibold text-gray-900 text-center mb-2">
              Message not sent
            </h3>
            <p className="text-sm text-gray-600 text-center mb-4">
              Your message includes content that is not allowed in this group.
            </p>
            <button
              type="button"
              className="w-full py-2.5 rounded-lg bg-anotherPrimary text-white text-sm font-medium"
              onClick={() => setModBlockOpen(false)}
            >
              OK
            </button>
          </div>
        </div>
      )}

      {modWarnOpen && (
        <div
          className="fixed inset-0 z-[110] flex items-center justify-center bg-black/50 p-4"
          onClick={() => {
            setModWarnOpen(false);
            moderationRetryRef.current = null;
          }}
        >
          <div
            className="w-full max-w-sm rounded-xl border border-gray-200 bg-white p-6 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-semibold text-gray-900 text-center mb-2">
              Check your message
            </h3>
            <p className="text-sm text-gray-600 text-center mb-4">
              This message may be inappropriate for the group. You can edit it, cancel, or send it anyway.
            </p>
            <div className="flex flex-col gap-2">
              <button
                type="button"
                className="w-full py-2.5 rounded-lg bg-anotherPrimary text-white text-sm font-medium"
                onClick={confirmModerationWarnSend}
              >
                Send anyway
              </button>
              <button
                type="button"
                className="w-full py-2.5 rounded-lg border border-gray-300 text-gray-700 text-sm"
                onClick={() => {
                  setModWarnOpen(false);
                  moderationRetryRef.current = null;
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {callState.phase !== "idle" && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
          <div className="w-full max-w-3xl rounded-xl bg-gray-900 text-white p-4 md:p-6 flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <p className="font-semibold">
                {callState.phase === "incoming" && `Incoming ${callState.callType} call`}
                {callState.phase === "outgoing" && `Calling (${callState.callType})...`}
                {callState.phase === "active" && `${callState.callType === "video" ? "Video" : "Voice"} call in progress`}
              </p>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  className="px-3 py-1 rounded-md bg-gray-700 hover:bg-gray-600 text-sm"
                  onClick={() => setShowCaptionSettings((prev) => !prev)}
                >
                  Captions
                </button>
                <button
                  type="button"
                  className="px-3 py-1 rounded-md bg-red-600 hover:bg-red-700"
                  onClick={endCall}
                >
                  End
                </button>
              </div>
            </div>

            {showCaptionSettings && (
              <div className="rounded-lg border border-gray-700 bg-black/30 p-3 grid grid-cols-1 md:grid-cols-4 gap-3">
                <label className="text-sm flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={captionPrefs.enabled}
                    onChange={(e) =>
                      setCaptionPrefs((prev) => ({ ...prev, enabled: e.target.checked }))
                    }
                  />
                  Enable captions
                </label>
                <label className="text-sm flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={captionPrefs.showOriginal}
                    onChange={(e) =>
                      setCaptionPrefs((prev) => ({ ...prev, showOriginal: e.target.checked }))
                    }
                  />
                  Show original
                </label>
                <label className="text-sm flex flex-col gap-1">
                  Translate to
                  <select
                    value={captionPrefs.translateTo}
                    onChange={(e) =>
                      setCaptionPrefs((prev) => ({ ...prev, translateTo: e.target.value }))
                    }
                    className="bg-gray-800 rounded px-2 py-1"
                  >
                    <option value="en">English</option>
                    <option value="hi">Hindi</option>
                    <option value="es">Spanish</option>
                    <option value="fr">French</option>
                    <option value="de">German</option>
                  </select>
                </label>
                <label className="text-sm flex flex-col gap-1">
                  Speech input language
                  <select
                    value={captionPrefs.speechLang}
                    onChange={(e) =>
                      setCaptionPrefs((prev) => ({ ...prev, speechLang: e.target.value }))
                    }
                    className="bg-gray-800 rounded px-2 py-1"
                  >
                    <option value="en-US">English (US)</option>
                    <option value="hi-IN">Hindi (India)</option>
                  </select>
                </label>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="rounded-lg bg-black/40 min-h-[180px] overflow-hidden p-2">
                {callState.callType === "video" ? (
                  <video ref={localVideoRef} autoPlay muted playsInline className="w-full h-full object-cover" />
                ) : (
                  <>
                    <audio ref={localAudioRef} autoPlay muted playsInline />
                    <div className="h-full w-full flex items-center justify-center text-sm text-gray-300">
                      Microphone active
                    </div>
                  </>
                )}
              </div>
              <div className="rounded-lg bg-black/40 min-h-[180px] overflow-hidden p-2">
                {callState.callType === "video" ? (
                  <video ref={remoteVideoRef} autoPlay playsInline className="w-full h-full object-cover" />
                ) : (
                  <>
                    <audio ref={remoteAudioRef} autoPlay playsInline />
                    <div className="h-full w-full flex items-center justify-center text-sm text-gray-300">
                      {remoteStream ? "Connected" : "Waiting for remote audio..."}
                    </div>
                  </>
                )}
              </div>
            </div>

            {captionPrefs.enabled && (
              <div className="rounded-lg bg-black/50 border border-gray-700 p-3 min-h-[84px] max-h-40 overflow-y-auto">
                {captionStatus && (
                  <p className="text-[11px] text-yellow-300 mb-1">{captionStatus}</p>
                )}
                {callCaptions.length === 0 ? (
                  <p className="text-xs text-gray-300">Live captions will appear here during the call.</p>
                ) : (
                  <div className="flex flex-col gap-2">
                    {callCaptions.map((item) => (
                      <div key={item.id} className="text-sm">
                        <div className="flex items-start gap-2">
                          <p className="text-white flex-1">{item.translated}</p>
                          {item.isTranslating && (
                            <div className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse" title="Translating..."></div>
                          )}
                        </div>
                        {captionPrefs.showOriginal && item.original !== item.translated && (
                          <p className="text-gray-300 text-xs mt-1">{item.original}</p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {callState.phase === "incoming" && (
              <div className="flex gap-3 justify-end">
                <button
                  type="button"
                  className="px-4 py-2 rounded-md bg-gray-600 hover:bg-gray-500"
                  onClick={declineIncomingCall}
                >
                  Decline
                </button>
                <button
                  type="button"
                  className="px-4 py-2 rounded-md bg-green-600 hover:bg-green-500"
                  onClick={acceptIncomingCall}
                >
                  Accept
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
} // ← FIX #3: Correctly closes the ChatSection function

export default ChatSection;
