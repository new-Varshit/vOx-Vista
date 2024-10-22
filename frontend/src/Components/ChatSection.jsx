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
import { faPaperclip, faPhone, faVideo, faCheck, faCheckDouble, faEllipsisV, faTrash, faCopy, faCheckSquare } from '@fortawesome/free-solid-svg-icons';

function ChatSection({ sideProfileCard, isSideProfileCard, delOptCardToggle }) {

  //getting userId from token stored in localStorage
  const token = localStorage.getItem('token');
  const decodedToken = jwtDecode(token);
  const userId = decodedToken.userId;

  //getting the recipient id and chatroom from redux store
  const currentChat = useSelector((state) => state.chat.currentChat);
  const currentChatRoom = useSelector((state) => state.chatRoom.currentChatRoom);

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
  const fileInputRef = useRef(null);


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






  //handling receiving messages ,  callback function for 'receiveMessage' socket.io event listener
  const handleReceiveMessage = useCallback((message) => {

    //updating the receved message in real time
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


    if (token) {

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
          if (currentChat && message.inChatRoom && response?.data?.success) {
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


  // returning the appropriate icon  as per the message status
  const statusCheck = (msgStatus) => {

    if (msgStatus === 'read') {
      return (<FontAwesomeIcon icon={faCheckDouble} className='text-cyan-400 text-xs' />)

    } else if (msgStatus === 'delivered') {
      return (<FontAwesomeIcon icon={faCheckDouble} className='text-gray-300 text-xs' />)

    } else {
      return (<FontAwesomeIcon icon={faCheck} className='text-gray-300 text-xs' />)
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
        if (msgId) {
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

  const handleFileChange = (event) => {
    const files = Array.from(event.target.files);

    const filePreviews = files.map((file) => {
      console.log(file);
      if (file.type.startsWith('image/') || file.type.startsWith('video/')) {
        return { file, preview: URL.createObjectURL(file) }
      } else {
        return { file, preview: null }
      }
    })
    setSelectedFiles(filePreviews);
    console.log(filePreviews);
  };


  const handleClipClick = () => {
    fileInputRef.current.click();  // Click the hidden file input
  };



  return (
    <>
      {currentChat ?
        (<div className='h-full relative'>
          <div className='w-full bg-white border-b-2 border-gray-200 h-[10%] '>

            {inSelectMode ?
              (<div className='flex justify-between items-center gap-2 py-4 ml-7 w-11/12'>

                <div className='flex gap-1 text-lg font-semibold'>
                  {selectedMsgs.length}
                  <p>Selected</p>
                </div>


                <div className='flex gap-2   font-medium text-sm'>
                  <button className='py-1 px-2 rounded-md border-anotherPrimary border-2' onClick={deleteSelectedMsgs} >Delete</button>
                  <button className='py-1 px-2 rounded-md bg-anotherPrimary text-white' onClick={() => handleCancelSelection()}>Cancel</button>
                </div>

              </div>)
              :
              (<div className='flex justify-between items-center gap-2 py-4 ml-7 w-11/12'>
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
              )}
          </div>
          <div className=' h-[83%] bg-white overflow-y-scroll scroll-smooth scrollbar-thin scrollbar-thumb-white scrollbar-track-white rounded-r-xl p-4  flex flex-col gap-0.5' >



            {
              messages.map((message, index) => (
                message?.content ? (
                  <div key={message._id} ref={index === messages.length - 1 ? lastMessageRef : null} className={`${selectedMsgs.includes(message._id) ? 'bg-blue-300  bg-opacity-50' : ''}`} onClick={() => inSelectMode && toggleSelectMessage(message._id)}>
                    {message?.sender?._id === currentChat._id
                      ? (
                        <div className='flex gap-1 group mt-1'>
                          <img className='rounded-full w-7 h-7 flex' src={message?.sender?.profile?.profilePic} alt="error" />
                          <div className='bg-gray-200 text-gray-800 max-w-[70%] pt-2 pb-1 px-2 flex flex-col items-center justify-center rounded-md'>
                            <p className=' text-gray-800 text-sm  font-medium -mb-2 mr-12'>{message.content}</p>
                            <div className='flex  w-full justify-end'>
                              <p className='text-[10px] '>{format(new Date(message?.createdAt), 'HH:mm')}</p>
                            </div>
                          </div>
                          {!inSelectMode &&
                            (<div className={`bg-gray-200 w-[2%]  ${isDelSelCardVisible === message._id ? 'flex' : 'hidden group-hover:flex'}  justify-center items-center rounded-r-xl relative curson-pointer`} onClick={(e) => handleDelSelCard(message._id, e)}>
                              {isDelSelCardVisible === message._id && (
                                <div className={` bg-gray-200 absolute left-[120%] ${index === messages.length - 1 ? 'bottom-1/3' : 'top-1/3'}          rounded-lg p-3  flex flex-col gap-2 `}>
                                  <div className='flex gap-2' onClick={() => handleSingleMsgDeletion(message)}>
                                    <FontAwesomeIcon icon={faTrash} className='text-lg text-anotherPrimary' />
                                    <button className='text-sm font-medium'>Delete</button>
                                  </div>
                                  <div className='flex gap-2' onClick={() => handleMessageSelect(message._id)}>
                                    <FontAwesomeIcon icon={faCheckSquare} className='text-lg text-anotherPrimary' />
                                    <button className='text-sm font-medium'>Select</button>
                                  </div>
                                  <div className='flex gap-2'>
                                    <FontAwesomeIcon icon={faCopy} className='text-lg text-anotherPrimary' />
                                    <button className='text-sm font-medium'>Copy</button>
                                  </div>
                                </div>

                              )};
                              <FontAwesomeIcon icon={faEllipsisV} className='text-gray-700 text-xl cursor-pointer' />
                            </div>)}
                        </div>

                      )
                      : (
                        <div className=' flex gap-1 justify-end group  mt-1 ' >
                          {!inSelectMode &&

                            (<div className={`bg-gray-200 w-[2%] ${isDelSelCardVisible === message._id ? 'flex' : 'hidden group-hover:flex'} justify-center items-center rounded-l-xl relative curson-pointer`} onClick={(e) => handleDelSelCard(message._id, e)}>
                              {isDelSelCardVisible === message._id && (
                                <div className={` bg-gray-200 absolute right-[120%] ${index === messages.length - 1 ? 'bottom-1/3' : 'top-1/3'} rounded-lg p-3  flex flex-col gap-2 `}>
                                  <div className='flex gap-2' onClick={() => handleSingleMsgDeletion(message)}>
                                    <FontAwesomeIcon icon={faTrash} className='text-lg text-anotherPrimary' />
                                    <button className='text-sm font-medium'>Delete</button>
                                  </div>
                                  <div className='flex gap-2' onClick={() => handleMessageSelect(message._id)}>
                                    <FontAwesomeIcon icon={faCheckSquare} className='text-lg text-anotherPrimary' />
                                    <button className='text-sm font-medium'>Select</button>
                                  </div>
                                  <div className='flex gap-2'>
                                    <FontAwesomeIcon icon={faCopy} className='text-lg text-anotherPrimary' />
                                    <button className='text-sm font-medium'>Copy</button>
                                  </div>
                                </div>

                              )};
                              <FontAwesomeIcon icon={faEllipsisV} className='text-gray-700 text-xl cursor-pointer' />
                            </div>)}
                          <div className='bg-anotherPrimary text-sm max-w-[70%] text-white pt-2 pb-1 px-2 flex flex-col items-center justify-center rounded-md'>
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

          {/* input area  */}

          <div className='w-[97%] ml-3 bottom-2 flex rounded-lg overflow-hidden '>
            <form className='flex w-full' onSubmit={sendInputMessage}>
              <div className='flex bg-gray-300 gap-4 justify-center items-center px-5'>
                <FontAwesomeIcon icon={faFaceSmile} className='text-white text-2xl' />

                <FontAwesomeIcon icon={faPaperclip} className='text-white text-2xl' onClick={handleClipClick} />
                <input type="file" className='hidden' multiple accept='*' ref={fileInputRef} onChange={handleFileChange}
                />
                {selectedFiles.length > 0 &&
                  (<div className='absolute flex flex-col p-4  bg-gray-200 border-black border-2 left-[2%] bottom-[8%] max-h-96'>
                    <p className='font-medium text-sm'>{selectedFiles.length === 1 ? `Selected item...` : `Selected items(${selectedFiles.length})`}</p>
                    <div className={`grid grid-cols-${selectedFiles.length >= 5 ? '5' : selectedFiles.length} gap-4 mt-4`}>
                    {selectedFiles.map((fileObj, index) => (
                        <div key={index} className="w-24 h-24 flex flex-col items-center flex-wrap ">

                          {/* Show preview for images and videos */}
                          {fileObj.preview && fileObj.file.type.startsWith("image/") && (
                            <img
                              src={fileObj.preview}
                              alt={`Preview ${index}`}
                              className="w-24 h-24 object-cover rounded-md"
                            />
                          )}
                          {fileObj.preview && fileObj.file.type.startsWith("video/") && (
                            <video
                              src={fileObj.preview}
                              controls
                              className="w-24 h-24 object-cover rounded-md"
                            />
                          )}


                          {/* Show file name for non-previewable files */}
                          {!fileObj.preview && (
                            <div className="w-24 text-center text-sm">
                              <p>{fileObj.file.name}</p>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>)}
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