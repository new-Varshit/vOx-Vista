import React from 'react';
import api from '../utils/Api';
import { io } from 'socket.io-client';
import { useState, useEffect, useRef, useCallback } from 'react';
import { useSelector } from 'react-redux';
// import userId from '../utils/UserId';
import MessageSecCS from './MessageSecCS';
import InputAreaCS from './InputAreaCS';
import HeaderSecCS from './HeaderSecCS';
import { jwtDecode } from 'jwt-decode';


function ChatSection({ sideProfileCard, isSideProfileCard, delOptCardToggle }) {

  //getting the recipient id and chatroom from redux store
  const currentChat = useSelector((state) => state.chat.currentChat);
  const currentChatRoom = useSelector((state) => state.chatRoom.currentChatRoom);
  const targetLanguage = useSelector((state) => state.lng.targetLanguage);
        
  const token = localStorage.getItem('token');
  const decodedToken = jwtDecode(token);
  const userId = decodedToken.userId;
  //all the states using
  const [isTyping, setIsTyping] = useState(false);
  const [typingUsers, setTypingUsers] = useState([]);
  const [messages, setMessages] = useState([]);
  const [sendMessage, setSendMessage] = useState('');
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [isDelSelCardVisible, setIsDelSelCardVisible] = useState(false);
  const [inSelectMode, setSelectMode] = useState(false);
  const [selectedMsgs, setSelectedMsgs] = useState([]);
  const [selectedFiles, setSelectedFiles] = useState([]);

  //references we are using 
  const typingTimeoutRef = useRef(null);
  const lastMessageRef = useRef(null);
  const socket = useRef(null);


  const typingObj = {
    userId: currentChat?._id,
    chatRoomId: currentChatRoom?._id
  }

  // to dynamically showing if recipient is typing using socket.io
  const handleTyping = () => {
    if (!isTyping) {
      socket.current.emit('typing', typingObj);
      setIsTyping(true);
    }

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    typingTimeoutRef.current = setTimeout(() => {
      socket.current.emit('stopTyping', typingObj);
      setIsTyping(false);
    }, 2000);
  };




  //updating all the messages of a chat to delivered in the database
  const updateMessagesDelivered = useCallback(async () => {
    try {
      await api.post(`/api/message/updateAllMsgsToDelivered`, null, {
        withCredentials: true,
      });
    } catch (err) {
      console.error('Error updating message delivery status:', err);
    }
  }, []);


  const targetLanguageRef = useRef(targetLanguage);
  useEffect(() => {
    targetLanguageRef.current = targetLanguage;
  }, [targetLanguage]);

  // console.log("yo bro",targetLanguageRef.current);

  //handling receiving messages ,  callback function for 'receiveMessage' socket.io event listener
  const handleReceiveMessage = useCallback(async (message) => {
    console.log('message: ', message);
    //updating the receved message in real time
    if (targetLanguageRef.current && message.sender._id !== userId) {
      console.log("Translating message to target language:", targetLanguageRef.current);
      try {
        const response = await api.post('/api/translate/translateMsg', {
          targetLanguage: targetLanguageRef.current,
          message
        }, { withCredentials: true });
               
        console.log(response.data);

        if (response.data.success) {
          message = response.data.translatedMessage;
        }
      } catch (error) {
        console.error("Translation error:", error);
      }
    }

    setMessages((prevMessages) => [...prevMessages, message]);


    if (message.sender._id !== userId) {
      //updating receiving to delivered 
      updateMessagesDelivered();

      if (socket.current) {
        const currentRoom = currentChat;
        const updatedMessage = {
          ...message,
          inChatRoom: !!currentRoom
        };
        //emitting the event 'delivered' to notify the user that message has been delivered
        socket.current.emit('delivered', updatedMessage);
      }
    }
  }, [updateMessagesDelivered, currentChat]);






  //setting up connection and other socket.io events
  useEffect(() => {

    //updating  messages  to delivered whenver user open chatapp
    updateMessagesDelivered();


    if (userId) {

      //connecting to the socket.io server and will also join the personal room...
      socket.current = io('http://localhost:3000', {
        query: { userId }
      });

      //getting the list of online users from the socket.io server....
      socket.current.on('update-online-status', (onlineUsersArray) => {
        //storing the online user array in the state 
        setOnlineUsers(onlineUsersArray);
      })
      console.log('socket connected')
      //if user open a chat , then emitting events to join that chatroom , leave the personal room and listening for 
      if (currentChatRoom) {

        //joining room ,when click on a chat or user...
        socket.current.emit('joinRoom', currentChatRoom?._id);

        //leaving personal room when a chatroom is joined...
        socket.current.emit('leavePersonalRoom', userId);

        //listening to the event 'msgsRead' and changing the messages to read in realtime...
        socket.current.on('msgsRead', () => {
          setMessages((prevMessages) =>
            prevMessages.map((msg) =>
              msg = { ...msg, status: 'read' }
            )
          );
        })
      }
      //dynamically displaying  user is typing and put the user into the typing user array state...
      socket.current.on('displayTyping', (userId) => {
        setTypingUsers((prev) => [...prev, userId]);
      });

      //dynamically removing the use from the typing user array state ....
      socket.current.on('removeTyping', (userId) => {
        setTypingUsers((prev) => prev.filter((id) => id !== userId));
      });

      //message delivered socket.io event listener which is updating the message status to delivered in the database
      socket.current.on('msgDelivered', async (message) => {
        try {
          let response = await api.post(`/api/message/updateMsgToDelivered/${message._id}`, null, {
            withCredentials: true
          });

          //updating to delivered in real time 
          if (response?.data?.success) {
            setMessages((prevMessages) =>
              prevMessages.map((msg) => {
                if (msg.status === 'sent') {

                  return msg = {
                    ...msg, status: 'delivered'
                  }
                } else {
                  return msg
                }
              }
              )
            );
          }
          //updating to read in real time 
          if (currentChatRoom && message.inChatRoom && response?.data?.success) {
            response = await api.post(`/api/message/updateMsgToRead/${message._id}`, null, {
              withCredentials: true
            });
            if (response?.data?.success) {
              //updating messages to  read in realtime
              setMessages((prevMessages) =>
                prevMessages.map((msg) =>
                  msg._id === message._id ? { ...msg, status: 'read' } : msg
                )
              );
            }
          }
        } catch (error) {
          console.error('Error updating message status:', error);
        }
      });



      //receiver message socket.io event listener which is calling the catllback function
      socket.current.on('receiveMessage', handleReceiveMessage);
      return () => {
        if (socket.current) {
          socket.current.disconnect();
          console.log("Socket disconnected");
        }
      };
    }
  }, [currentChatRoom]);



  //This useEffect hook manages the socket's 'msgDelivered' event listener....
  useEffect(() => {
    if (!socket.current) return;

    return () => {
      socket.current.off('msgDelivered');
    };
  }, [currentChat]);




  //updating the status of all the  messages of a chat to read in the database...
  useEffect(() => {
    if (currentChat) {
      const updateMessagesRead = async () => {
        try {
          const userId = currentChat?._id;
          if (userId) {
            await api.post(`/api/message/updateMsgsToRead/${currentChat._id}`, null, {
              withCredentials: true,
            });
          }
        } catch (err) {
          console.log(err);
        }
      };

      updateMessagesRead();
    }
  }, [messages]);


  //fetching all the messages of a chatRoom  from the database.....
  useEffect(() => {
    const fetchChatRoomMessages = async () => {
      if (!currentChatRoom?._id) {
        return;
      }
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
        }
      } catch (err) {
        console.log(err);
      }
    }
    fetchChatRoomMessages();
  }, [currentChatRoom]);


  //storing the last message reference , so with that when you open a chat you will see the latest message ....
  useEffect(() => {
    if (lastMessageRef.current) {
      lastMessageRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);


  //seding the message to the database  to store as well as to the socket.io server for dynamically sending...
  const sendInputMessage = async (e) => {
    if (sendMessage || selectedFiles.length > 0) {
      e.preventDefault();

      let message = new FormData();
      message.append('chatRoomId', currentChatRoom._id),
        message.append('content', sendMessage)

      if (selectedFiles.length > 0) {
        selectedFiles.forEach((fileObj, index) => {
          message.append('attachments', fileObj.file); // Append each file with key 'attachments'
        });
      }
      try {
        const response = await api.post('/api/message/sendMessage', message, {
          headers: {
            'Content-Type': 'multipart/form-data' // Ensure multipart/form-data is used for file uploads
          },
          withCredentials: true
        });
        if (response.data.success) {
          console.log(response.data.message);
          let messageData;
          if (response.data?.message?.chatRoom?.isGroupChat) {
               console.log('in group');
            messageData = {
              message: response.data.message
            }
          } else {
            console.log('in a private chat');
            messageData = {

              message: response.data.message,
              recipientId: currentChat._id
            }
          }
          socket.current.emit('sendMessage', messageData);
          setSendMessage('');
          setSelectedFiles([]);
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
    console.log(selectedMsgs)
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

      console.log('selected msgs: ', selectedMsgs);

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
        console.log('done bhai ');
        if (typeof msgId === 'string') {
          console.log(msgId)
          setMessages(prevMsgs => prevMsgs.filter(mssg => mssg._id !== msgId));
        } else {
          console.log('yo you selected msgs to delete')
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
    console.log(msg.sender);
    console.log(userId);
    if (msg.sender._id === userId) {
      console.log('yo');
      delOptCardToggle(msg._id);
      setMessages(prevMsgs => prevMsgs.filter(mssg => mssg._id !== msg._id));
    } else {
      console.log('hey');
      deleteSelectedMsgs(msg._id);
    }
  }


  return (
    <>
      {currentChat ?
        (<div className='h-full relative'>

          <HeaderSecCS
            inSelectMode={inSelectMode}
            selectedMsgs={selectedMsgs}
            deleteSelectedMsgs={deleteSelectedMsgs}
            handleCancelSelection={handleCancelSelection}
            typingUsers={typingUsers}
            onlineUsers={onlineUsers}
            isSideProfileCard={isSideProfileCard}
            sideProfileCard={sideProfileCard}
          />


          {/* message section -->  */}

          <MessageSecCS
            messages={messages}
            selectedMsgs={selectedMsgs}
            inSelectMode={inSelectMode}
            toggleSelectMessage={toggleSelectMessage}
            lastMessageRef={lastMessageRef}
            isDelSelCardVisible={isDelSelCardVisible}
            handleDelSelCard={handleDelSelCard}
            handleSingleMsgDeletion={handleSingleMsgDeletion}
            handleMessageSelect={handleMessageSelect}
          />



          {/* input area  */}

          <InputAreaCS
            setSelectedFiles={setSelectedFiles}
            sendInputMessage={sendInputMessage}
            selectedFiles={selectedFiles}
            sendMessage={sendMessage}
            setSendMessage={setSendMessage}
            handleTyping={handleTyping}
          />



        </div>)
        : (
          <div className='w-full h-full  flex justify-center items-center bg-white '>
            <div className='flex flex-col justify-center items-center gap-2'>
              <p className='font-bold text-5xl text-anotherPrimary'>vOx-Vista</p>
              <p className='font-medium text-xl '>Your chat will appear here....</p>
            </div>
          </div>
        )


      }

    </>
  )
}

export default ChatSection 