import React from 'react';
import api from '../utils/Api';
import { useState, useEffect, useRef, useCallback } from 'react';
import { useSelector } from 'react-redux';
// import userId from '../utils/UserId';
import MessageSecCS from './MessageSecCS';
import InputAreaCS from './InputAreaCS';
import HeaderSecCS from './HeaderSecCS';
import { jwtDecode } from 'jwt-decode';
// import userId from '../utils/UserId';
import { getUserId } from '../utils/UserId';
// import useChatSocket from '../hooks/useChatSocket';


function ChatSection({

  isMobileChatOpen,
  setIsMobileChatOpen,
  setActiveChatRooms,
  socketRef,
  emitTyping,
  emitStopTyping,
  joinChatRoom,
  sideProfileCard,
  isSideProfileCard,
  delOptCardToggle,
  messages,
  setMessages,
  accessMessage

}) {

  //getting the recipient id and chatroom from redux store
  const currentChat = useSelector((state) => state.chat.currentChat);
  const currentChatRoom = useSelector((state) => state.chatRoom.currentChatRoom);
  const targetLanguage = useSelector((state) => state.lng.targetLanguage);
  const currentChatRoomRef = useRef(null);
  const [isMessagesLoading, setIsMessagesLoading] = useState(false);
  const [unreadCount, setUnreadCount] = useState(null);
  const [firstUnreadId, setFirstUnreadId] = useState(null);

  const userId = getUserId();


  useEffect(() => {
    currentChatRoomRef.current = currentChatRoom;
  }, [currentChatRoom]);



  const messagesRef = useRef([]);
  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);


  //handling receiving messages ,  callback function for 'receiveMessage' socket.io event listener
  const handleReceiveMessage = useCallback(

    async (incomingMessage) => {
      const activeRoomId = currentChatRoomRef.current?._id;
      if (!activeRoomId) return;
      if (incomingMessage.chatRoom._id !== activeRoomId) return;

      // Reliable duplicate check
      if (messagesRef.current.some(m => m._id === incomingMessage._id)) {
        return;
      }

      // Append once
      setMessages(prev => [...prev, incomingMessage]);

      // Translate if needed
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
                    // Preserve any real-time updates that happened during translation
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



  // const token = localStorage.getItem('token');
  // const decodedToken = jwtDecode(token);
  // const userId = decodedToken.userId;
  //all the states using
  const [isTyping, setIsTyping] = useState(false);
  const [typingUsers, setTypingUsers] = useState([]);
  // const [messages, setMessages] = useState([]);
  const [sendMessage, setSendMessage] = useState('');
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [isDelSelCardVisible, setIsDelSelCardVisible] = useState(false);
  const [inSelectMode, setSelectMode] = useState(false);
  const [selectedMsgs, setSelectedMsgs] = useState([]);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [isAtBottom, setIsAtBottom] = useState(true);

  //references we are using 
  const typingTimeoutRef = useRef(null);
  const lastMessageRef = useRef(null);
  const firstUnreadRef = useRef(null);
  // const socket = useRef(null);



  const typingObj = {
    userId: currentChat?._id,
    chatRoomId: currentChatRoom?._id
  }



  // Mark messages as read when chat is active and user is viewing
  useEffect(() => {
    if (!currentChatRoom || messages.length === 0) return;
    if (!socketRef.current) return;

    // Only mark as read if user is actually viewing (window is focused)
    if (!document.hasFocus()) return;

    const unreadMessages = messages.filter(
      msg =>
        msg?.sender?._id !== userId &&
        !msg?.readBy?.includes(userId)
    );

    if (unreadMessages.length === 0) return;

    // Small delay to ensure user actually sees the messages
    const timeoutId = setTimeout(() => {
      socketRef.current.emit("readMessages", {
        chatRoomId: currentChatRoom._id,
        userId
      });
    }, 500); // Half second delay

    return () => clearTimeout(timeoutId);
  }, [currentChatRoom, messages, userId]);

  // Optional: Also mark as read when window gains focus
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


  useEffect(() => {
    const socket = socketRef.current;
    if (!socket) return;

    // Keep a stable reference to your receive handler (already defined via useCallback)
    const onReceiveMessage = handleReceiveMessage;

    const onDisplayTyping = (uid) => {
      setTypingUsers(prev => (prev.includes(String(uid)) ? prev : [...prev, String(uid)]));
    };

    const onRemoveTyping = (uid) => {
      setTypingUsers(prev => prev.filter(id => id !== String(uid)));
    };

    const onMsgsRead = ({ chatRoomId, readerId }) => {
      if (String(chatRoomId) !== String(currentChatRoom?._id)) return; // scope to active room
      setMessages(prev => prev.map(msg => {
        if (String(msg?.sender?._id) === String(readerId)) return msg;
        if ((msg.readBy || []).map(String).includes(String(readerId))) return msg;
        return { ...msg, readBy: [...(msg.readBy || []), String(readerId)] };
      }));
    };

    const onMessageDeleted = ({ messageId, chatRoomId }) => {
      if (chatRoomId && String(chatRoomId) !== String(currentChatRoom?._id)) return;
      // Some server sends just messageId — handle both shapes
      const id = messageId || (typeof messageId === 'string' ? messageId : null);
      if (!id) return;
      setMessages(prev => prev.filter(msg => String(msg._id) !== String(id)));
    };

    const onUpdateOnlineStatus = (users) => {
      setOnlineUsers(users || []);
    };

    // Register handlers
    socket.on("receiveMessage", onReceiveMessage);
    socket.on("displayTyping", onDisplayTyping);
    socket.on("removeTyping", onRemoveTyping);
    socket.on("msgsRead", onMsgsRead);
    socket.on("messageDeleted", onMessageDeleted);
    socket.on("update-online-status", onUpdateOnlineStatus);

    // Cleanup using the same function references
    return () => {
      socket.off("receiveMessage", onReceiveMessage);
      socket.off("displayTyping", onDisplayTyping);
      socket.off("removeTyping", onRemoveTyping);
      socket.off("msgsRead", onMsgsRead);
      socket.off("messageDeleted", onMessageDeleted);
      socket.off("update-online-status", onUpdateOnlineStatus);
    };
  }, [handleReceiveMessage, currentChatRoom?._id]);





  // to dynamically showing if recipient is typing using socket.io



  const targetLanguageRef = useRef(targetLanguage);
  useEffect(() => {
    targetLanguageRef.current = targetLanguage;
  }, [targetLanguage]);


  useEffect(() => {
    if (!currentChatRoom) return;

    joinChatRoom(currentChatRoom._id);

    return () => {
      socketRef.current?.emit("leaveRoom", currentChatRoom._id);
    };
  }, [currentChatRoom]);



  const handleTyping = () => {
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






  //fetching all the messages of a chatRoom  from the database.....
  useEffect(() => {
    const fetchChatRoomMessages = async () => {
      if (!currentChatRoom?._id) {
        return;
      }
      setIsMessagesLoading(true);
      if (selectedMsgs) {
        handleCancelSelection();
      }
      try {
        const response = await api.get(`/api/message/${currentChatRoom._id}`, {
          withCredentials: true
        })
        if (response.data.success) {
          const visibleMessages = response?.data?.messages.filter(msg => !msg.deletedFor.includes(userId))
          setMessages(visibleMessages);

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
    }
    fetchChatRoomMessages();
  }, [currentChatRoom]);


  //storing the last message reference , so with that when you open a chat you will see the latest message ....
  useEffect(() => {
    if (lastMessageRef.current) {
      if (isAtBottom) {
        lastMessageRef.current.scrollIntoView({ behavior: 'auto' });
      }
    }
  }, [messages.length]);

  useEffect(() => {
    if (firstUnreadRef.current) {
      firstUnreadRef.current.scrollIntoView({ block: "center" });
    }
  }, [firstUnreadId]);

  //seding the message to the database  to store as well as to the socket.io server for dynamically sending...
  const sendInputMessage = async (e) => {

    e.preventDefault();
    if (sendMessage || selectedFiles.length > 0) {

      let message = new FormData();
      message.append('chatRoomId', currentChatRoom._id),
        message.append('content', sendMessage)

      if (selectedFiles.length > 0) {
        selectedFiles.forEach((fileObj, index) => {
          message.append('attachments', fileObj.file); // Append each file with key 'attachments'
        });
      }

      const tempId = "temp-" + Date.now();

      const tempMessage = {
        _id: tempId,
        content: sendMessage,
        createdAt: new Date().toISOString(),
        isSystem: false,
        attachments: selectedFiles.map(f => ({
          url: URL.createObjectURL(f.file),
          mimeType: f.file.type,
          temp: true
        })),
        sender: {
          _id: userId,
        },
        readBy: [],
        deliveredTo: [],
        status: "sending",
        chatRoom: { _id: currentChatRoom._id }
      };

      setMessages(prev => [...prev, tempMessage]);

      setSendMessage('');
      setSelectedFiles([]);

      try {
        const response = await api.post('/api/message/sendMessage', message, {
          headers: {
            'Content-Type': 'multipart/form-data' // Ensure multipart/form-data is used for file uploads
          },
          withCredentials: true
        });
        if (response.data.success) {


          setMessages(prev =>
            prev.map(m => {
              if (m._id !== tempId) return m;

              return {
                ...response.data.message,
                deliveredTo: m.deliveredTo?.length
                  ? m.deliveredTo
                  : response.data.message.deliveredTo,
                readBy: m.readBy?.length
                  ? m.readBy
                  : response.data.message.readBy,
              };
            })
          );



          setActiveChatRooms(prev => {
            const index = prev.findIndex(
              room => room._id === response.data.message.chatRoom._id
            );

            if (index === -1) return prev;

            const updatedRoom = {
              ...prev[index],
              lastMessage: response.data.message
            };

            const newList = [...prev];
            newList.splice(index, 1);
            newList.unshift(updatedRoom);

            return newList;

          });

          const messageData = {
            message: response.data.message
          }

          socketRef.current.emit('sendMessage', messageData);

        }
      } catch (err) {
        console.log(err);
      }
    } else {
      return;
    }
  }

  //handling if message menu card i.e delsel card is visible or not
  const handleDelSelCard = async (id) => {
    setIsDelSelCardVisible(prev => prev === id ? '' : id);
  }


  //selecting and deselecting a message 
  const toggleSelectMessage = async (id, event) => {
    if (event) {
      event.stopPropagation();
    }
    if (!inSelectMode) {
      return
    }
    if (selectedMsgs.includes(id)) {
      setSelectedMsgs(prev => prev.filter(MsgId => MsgId !== id))
    } else {
      setSelectedMsgs([...selectedMsgs, id]);
    }
  };


  //selecting the first message when click on select
  const handleMessageSelect = (id) => {
    if (!inSelectMode) {
      setSelectMode(true);
    }
    setSelectedMsgs([id]);
  };



  //cancelling the selection process of messages
  const handleCancelSelection = () => {
    setSelectMode(false);
    setSelectedMsgs([]);
  }


  //deleting selected messages
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
  }


  //deleting single message 
  const handleSingleMsgDeletion = (msg) => {
   
    if (msg.sender._id === userId) {
      delOptCardToggle(msg._id);
      setMessages(prevMsgs => prevMsgs.filter(mssg => mssg._id !== msg._id));
    } else {
      deleteSelectedMsgs(msg._id);
    }
  }


  return (
    <>
      {currentChatRoom ? (
        <div className="flex flex-col h-full">
          {/* Header - Fixed height */}
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
            />
          </div>

          {/* Message section - Takes remaining space with scroll */}
          <div className="flex-1 overflow-y-auto bg-white scrollbar-thin scrollbar-thumb-gray-400 scrollbar-track-gray-100">
            <MessageSecCS
              isMessagesLoading={isMessagesLoading}
              accessMessage={accessMessage}
              messages={messages}
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
            />
          </div>

          {/* Input area - Fixed at bottom with white background behind */}
          <div className="flex-shrink-0 bg-white border-t border-gray-200 p-3">
            <InputAreaCS
              setSelectedFiles={setSelectedFiles}
              sendInputMessage={sendInputMessage}
              selectedFiles={selectedFiles}
              sendMessage={sendMessage}
              setSendMessage={setSendMessage}
              handleTyping={handleTyping}
            />
          </div>
        </div>
      ) : (
        <div className="w-full h-full flex justify-center items-center bg-white">
          <div className="flex flex-col justify-center items-center gap-2">
            <p className="font-bold text-5xl text-anotherPrimary">vOx-Vista</p>
            <p className="font-medium text-xl">Your chat will appear here....</p>
          </div>
        </div>
      )}
    </>
  )
}

export default ChatSection 