import React from 'react';
import { jwtDecode } from 'jwt-decode';
import { format } from 'date-fns';
import profilePic from '../assets/profilePic.jpg';
import api from '../utils/Api';
import { io } from 'socket.io-client';
import { useState, useEffect, useRef, useCallback } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faFaceSmile, faPaperPlane, } from '@fortawesome/free-regular-svg-icons';
import { faPaperclip, faPhone, faVideo, faCheck, faCheckDouble } from '@fortawesome/free-solid-svg-icons';

function ChatSection({ sideProfileCard, isSideProfileCard }) {


  const token = localStorage.getItem('token');
  const decodedToken = jwtDecode(token);
  const userId = decodedToken.userId;
  const currentChat = useSelector((state) => state.chat.currentChat);
  const currentChatRoom = useSelector((state) => state.chatRoom.currentChatRoom);

  const [isTyping, setIsTyping] = useState(false);
  const [typingUsers, setTypingUsers] = useState([]);
  const [messages, setMessages] = useState([]);
  const [sendMessage, setSendMessage] = useState('');
  const [onlineUsers,setOnlineUsers] = useState([]);

  const typingTimeoutRef = useRef(null);
  const lastMessageRef = useRef(null);
  const socket = useRef(null);

  const typingObj = {
    userId: currentChat?._id,
    chatRoomId: currentChatRoom?._id
  }

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

  const updateMessagesDelivered = useCallback(async () => {
    try {
      await api.post(`/api/message/updateAllMsgsToDelivered`, null, {
        withCredentials: true,
      });
    } catch (err) {
      console.error('Error updating message delivery status:', err);
    }
  }, []);


  const handleReceiveMessage = useCallback((message) => {
    setMessages((prevMessages) => [...prevMessages, message]);
    if (message.sender._id !== userId) {
      console.log('receiver here...')
      updateMessagesDelivered();
      if (socket.current) {
        const currentRoom = currentChat;
        console.log('you are here', currentRoom);
        console.log('Current chat room:', currentRoom);
        const updatedMessage = {
          ...message,
          inChatRoom: !!currentRoom
        };
        socket.current.emit('delivered', updatedMessage);
      }
    }
  }, [updateMessagesDelivered, currentChat]);

  useEffect(() => {

    updateMessagesDelivered();


    if (token) {


      socket.current = io('http://localhost:3000', {
        query: { userId }
      });

      socket.current.on('update-online-status',(onlineUsersArray)=>{
        setOnlineUsers(onlineUsersArray);
      })
      console.log('socket connected')

      

      if (currentChatRoom) {
        socket.current.emit('joinRoom', currentChatRoom?._id);
        socket.current.emit('leavePersonalRoom', userId);
        socket.current.on('msgsRead', () => {
          setMessages((prevMessages) =>
            prevMessages.map((msg) =>
              msg = { ...msg, status: 'read' }
            )
          );
        })
      }
 

      socket.current.on('displayTyping', (userId) => {
        setTypingUsers((prev) => [...prev, userId]);
      });

      socket.current.on('removeTyping', (userId) => {
        setTypingUsers((prev) => prev.filter((id) => id !== userId));
      });


      socket.current.on('msgDelivered', async (message) => {
        try {
          let response = await api.post(`/api/message/updateMsgToDelivered/${message._id}`, null, {
            withCredentials: true
          });

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
          if (currentChat && message.inChatRoom && response?.data?.success) {
            response = await api.post(`/api/message/updateMsgToRead/${message._id}`, null, {
              withCredentials: true
            });
            if (response?.data?.success) {
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

      socket.current.on('receiveMessage', handleReceiveMessage);

      return () => {
        if (socket.current) {
          socket.current.disconnect();
          console.log("Socket disconnected");
        }
      };
    }
  }, [currentChatRoom]);


  useEffect(() => {
    if (!socket.current) return;

    return () => {
      socket.current.off('msgDelivered');
    };
  }, [currentChat]);


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


  useEffect(() => {
    const fetchChatRoomMessages = async () => {
      if (!currentChatRoom?._id) {
        return;
      }
      try {
        const response = await api.get(`/api/message/${currentChatRoom._id}`, {
          withCredentials: true
        })
        if (response.data.success) {
          setMessages(response.data.messages);
        }
      } catch (err) {
        console.log(err);
      }
    }
    fetchChatRoomMessages();
  }, [currentChatRoom]);



  useEffect(() => {
    if (lastMessageRef.current) {
      lastMessageRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);



  const sendInputMessage = async (e) => {
    e.preventDefault();

    let message = {
      chatRoomId: currentChatRoom._id,
      content: sendMessage
    }
    try {
      const response = await api.post('/api/message/sendMessage', message, {
        withCredentials: true
      });
      if (response.data.success) {
        let messageData = {
          message: response.data.message,
          recipientId: currentChat._id
        }
        socket.current.emit('sendMessage', messageData);
        setSendMessage('');
      }
    } catch (err) {
      console.log(err);
    }
  }

  const statusCheck = (msgStatus) => {

    if (msgStatus === 'read') {
      return (<FontAwesomeIcon icon={faCheckDouble} className='text-cyan-400 text-xs' />)

    } else if (msgStatus === 'delivered') {
      return (<FontAwesomeIcon icon={faCheckDouble} className='text-gray-300 text-xs' />)

    } else {
      return (<FontAwesomeIcon icon={faCheck} className='text-gray-300 text-xs' />)
    }

  }

  // const checkForUserStatus = (receiverId) =>{
  //   console.log(onlineUsers);
  //       const isUserOnline = onlineUsers.find(id => id === receiverId);
  //       console.log(isUserOnline);
  //            if(isUserOnline){
  //             return 'Online'
  //            }else{
  //             return 'Offline'
  //            }
  // }
  console.log(onlineUsers)

  return (
    <>
      {currentChat ?
        (<div className='h-full'>
          <div className='w-full bg-white border-b-2 border-gray-200 h-[10%] '>
            <div className='flex justify-between items-center gap-2 py-4 ml-7 w-11/12'>
              <div className='flex items-center  gap-4'>
                <div className='overflow-hidden rounded-full'>
                  <img className='w-12' src={currentChat?.profile?.profilePic} alt="" onClick={sideProfileCard} />
                </div>
                <div className='flex flex-col '>
                  <p className='font-semibold  text-sm'>{currentChat.userName}</p>
                  {typingUsers.find(id => id !== currentChat._id)
                    ?
                    <p className='text-xs font-semibold text-green-500'>Typing...</p>
                    :
                    <p className='text-xs font-medium text-font'>{onlineUsers.find(id => id === currentChat._id) ? 'Online' : 'Offline'}</p>
                  }
                </div>
              </div>

              {!isSideProfileCard && (
                <div className='flex gap-4'>
                  <div>
                    <FontAwesomeIcon icon={faPhone} className='  text-gray-400 text-xl' />
                  </div>
                  <div>
                    <FontAwesomeIcon icon={faVideo} className='  text-gray-400 text-xl' />
                  </div>
                </div>
              )
              }
            </div>
          </div>
          <div className=' h-[83%] bg-white overflow-y-scroll scroll-smooth scrollbar-thin scrollbar-thumb-white scrollbar-track-white rounded-r-xl p-4  flex flex-col gap-3' >



            {
              messages.map((message, index) => (
                message?.content ? (
                  <div key={message._id} ref={index === messages.length - 1 ? lastMessageRef : null}>
                    {message?.sender?._id === currentChat._id
                      ? (
                        <div className='flex gap-1'>
                          <img className='rounded-full w-7 h-7 flex' src={message?.sender?.profile?.profilePic} alt="error" />
                          <div className='bg-gray-200 text-gray-800 max-w-[70%] pt-2 pb-1 px-2 flex flex-col items-center justify-center rounded-md'>
                            <p className=' text-gray-800 text-sm  font-medium -mb-2 mr-12'>{message.content}</p>
                            <div className='flex  w-full justify-end'>
                              <p className='text-[10px] '>{format(new Date(message?.createdAt), 'HH:mm')}</p>
                            </div>
                          </div>
                        </div>

                      )
                      : (
                        <div className='flex gap-1 justify-end'>
                          <div className='bg-anotherPrimary text-sm  max-w-[70%] text-white pt-2 pb-1 px-2 flex flex-col items-center justify-center rounded-md'>
                            <p className='text-sm text-white font-medium -mb-2 mr-16'>{message.content}</p>
                            <div className='flex gap-2 w-full justify-end'>
                              <p className='text-[10px] text-gray-300'>{format(new Date(message?.createdAt), 'HH:mm')}</p>
                              <p>{statusCheck(message?.status)}</p>
                            </div>
                          </div>
                          <img className='rounded-full w-7 h-7 flex' src={message?.sender?.profile?.profilePic} alt="error" loading="lazy" />
                        </div>
                      )
                    }
                  </div>
                ) : null
              ))
            }
          </div>
          

          <div className='w-[97%] ml-3 bottom-2 flex rounded-lg overflow-hidden'>
            <form className='flex w-full' onSubmit={sendInputMessage}>
              <div className='flex bg-gray-300 gap-4 justify-center items-center px-5'>
                <FontAwesomeIcon icon={faFaceSmile} className='text-white text-2xl' />
                <FontAwesomeIcon icon={faPaperclip} className='text-white text-2xl' />
              </div>

              <input
                className='w-full py-4 px-2 focus:outline-none bg-gray-300'
                type='text'
                placeholder='Type a message...'
                value={sendMessage}
                onChange={(e) => setSendMessage(e.target.value)}
                onInput={handleTyping}
              />

              <button type='submit' className='px-5 bg-gray-300 flex justify-center items-center'>
                <FontAwesomeIcon icon={faPaperPlane} className='text-anotherPrimary text-3xl' />
              </button>
            </form>
          </div>

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