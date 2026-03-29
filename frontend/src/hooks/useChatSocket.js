import { useEffect, useRef, useState } from "react";
import { io } from "socket.io-client";

export default function useChatSocket({
    userId
}) {
    const socketRef = useRef(null);
    const [socket, setSocket] = useState(null);

    useEffect(() => {
        if (!userId) return;

        if (!socketRef.current) {
            const token = localStorage.getItem("token");
            socketRef.current = io(import.meta.env.VITE_API_URL, {
                auth: { token },
                withCredentials: true
            });
            setSocket(socketRef.current);
        }


        return () => {
            if (socketRef.current) {
                socketRef.current.disconnect();
                socketRef.current = null;
                setSocket(null);
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
        socket,
        emitTyping,
        emitStopTyping,
        emitDelivered,
        joinChatRoom,
        leavePersonalRoom
    };
}