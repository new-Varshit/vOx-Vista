import { useEffect, useRef } from "react";
import { io } from "socket.io-client";

export default function useChatSocket({
    userId
}) {
    const socketRef = useRef(null);

    useEffect(() => {
        if (!userId) return;

        if (!socketRef.current) {
            socketRef.current = io(import.meta.env.VITE_API_URL, {
                query: { userId }
            });
        }


        return () => {
            if (socketRef.current) {
                socketRef.current.disconnect();
                socketRef.current = null;
            }
        };
    }, [userId]);

    const emitDelivered = (message) => {
        socketRef.current?.emit("delivered", message);
    };

    const emitTyping = (typingObj) => {
        socketRef.current?.emit("typing", typingObj);
    };

    const emitStopTyping = (typingObj) => {
        socketRef.current?.emit("stopTyping", typingObj);
    }

    const joinChatRoom = (chatRoomId) => {
        socketRef.current?.emit("joinRoom", chatRoomId);
    }

    const leavePersonalRoom = (userId) => {
        socketRef.current?.emit("leavePersonalRoom", userId);
    };

    return {
        socketRef,
        emitTyping,
        emitStopTyping,
        emitDelivered,
        joinChatRoom,
        leavePersonalRoom
    };
}