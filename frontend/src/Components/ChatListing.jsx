import React, { useState, useRef, useEffect } from 'react';
import { format } from 'date-fns';
import { useDispatch, useSelector } from 'react-redux';
import { setCurrentChat } from '../store/chatSlice';
import { setCurrentChatRoom } from '../store/chatRoomSlice';
// import userId from '../utils/UserId';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import api from '../utils/Api';
import { faSearch, faArrowRight, faPlus } from '@fortawesome/free-solid-svg-icons';

// import userId from '../utils/UserId';
import ChatListSkeleton from './ChatListSkeleton';
import { getUserId } from '../utils/UserId';


function ChatListing({ setIsMobileChatOpen, registerFetch, isProChatListLoading, setIsProChatListLoading, newChatCard, setActiveChatRooms, activeChatRooms }) {



    // const [activeChatRooms, setActiveChatRooms] = useState([]);
    const [isChatMenuVisible, setIsChatMenuVisible] = useState(null);
    const [searchChatRoom, setSearchChatRoom] = useState('');
    const [loading, setLoading] = useState(false);

    // const currentChat = useSelector((state) => state.chat.currentChat);
    const currentChatRoom = useSelector((state) => state.chatRoom.currentChatRoom);
    // const { socketRef }  = 

    const menuRef = useRef(null);

    const dispatch = useDispatch();

   const userId = getUserId();

    const handleChatClick = async (newChat) => {
        setActiveChatRooms(prev =>
            prev.map(r =>
                r._id === newChat._id ? { ...r, unreadMsgs: 0 } : r
            )
        );

        dispatch(setCurrentChat(newChat));
        let recipientID = newChat._id;
        try {
            const response = await api.post('/api/chatRoom', { recipientID }, {
                withCredentials: true
            })
            if (response.data.success) {
                dispatch(setCurrentChatRoom(response.data.chatRoom));
                        setIsMobileChatOpen(true);

            }
        } catch (err) {
            console.log(err)
        }
    }

    const handleGroupChatClick = async (groupChat) => {
        setActiveChatRooms(prev =>
            prev.map(r =>
                r._id === groupChat._id ? { ...r, unreadMsgs: 0 } : r
            )
        );
        dispatch(setCurrentChat(null));
        dispatch(setCurrentChatRoom(groupChat));
        setIsMobileChatOpen(true);
    }


    const handleChatMenuToggle = (chatRoomId, e) => {
        e.preventDefault();
        setIsChatMenuVisible(prevId => prevId === null ? chatRoomId : null)
    }

    const deleteActiveChat = async (chatId) => {
        console.log(chatId);
        try {
            const response = await api.post(`/api/chatroom/dltChatRoom/${chatId}`, null, {
                withCredentials: true
            })
            if (response.data.success) {
                console.log(response.data.message);
                setActiveChatRooms(prevChat => prevChat.filter(chatRoom => chatRoom._id != chatId));
                setIsChatMenuVisible(null);

                if (chatId === currentChatRoom._id) {
                    dispatch(setCurrentChatRoom(null));
                    dispatch(setCurrentChat(null));
                }
            }
        } catch (err) {
            console.log(err);
        }
    }

    const clearAllMsgsForUser = async (chatId) => {
        try {
            const response = await api.post(`/api/message/clrChatRoomMsgs/${chatId}`, null, {
                withCredentials: true
            })
            if (response.data.success) {
                console.log(response.data.message);
                setIsChatMenuVisible(null);
            }
        } catch (err) {
            console.log(err);
        }
    }

    const handleClickOutside = (event) => {
        if (menuRef.current && !menuRef.current.contains(event.target)) {
            setIsChatMenuVisible(null);
        }
    };


    const fetchChatRooms = async () => {
        try {
            console.log('hello');
            if (searchChatRoom.trim()) {
                console.log();
                const response = await api.get('/api/chatRoom/searchActiveChatRoom', {
                    params: { searchChatRoom },
                    withCredentials: true
                })
                if (response.data.success) {
                    setActiveChatRooms(response.data.chatRooms);
                }
            } else {
                const response = await api.get('/api/chatRoom/getAllChatRooms', {
                    withCredentials: true
                });
                if (response.data.success) {
                    setActiveChatRooms(response.data.chatRooms);
                }
            }
        } catch (err) {
            console.log(err);
        }
    }

    useEffect(()=>{
        if(searchChatRoom.trim()){
            fetchChatRooms();
        }
    },[searchChatRoom]);


    useEffect(() => {
        registerFetch.current = fetchChatRooms;
    }, []);


    useEffect(() => {
        document.addEventListener('click', handleClickOutside);

        return () => {
            document.removeEventListener('click', handleClickOutside);
        };
    }, []);




return (
    <div className='flex flex-col h-full'>

        {/* Header Section */}
        <div className='flex-shrink-0 px-3 md:px-4 py-3 md:py-4'>
            <div className='flex justify-between items-center'>
                <h1 className='text-anotherPrimary font-bold text-xl md:text-2xl'>Chats</h1>
                <button 
                    onClick={newChatCard}
                    className='w-9 h-9 md:w-10 md:h-10 flex items-center justify-center rounded-full hover:bg-gray-200 transition-colors'
                    aria-label="New chat"
                >
                    <FontAwesomeIcon icon={faPlus} className='text-anotherPrimary text-lg md:text-xl' />
                </button>
            </div>
        </div>

        {/* Search Bar */}
        <div className='flex-shrink-0 px-3 md:px-4 pb-3 md:pb-4'>
            <div className='relative'>
                <FontAwesomeIcon 
                    icon={faSearch} 
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm"
                />
                <input 
                    type="text" 
                    className='w-full pl-10 pr-4 py-2.5 md:py-3 text-sm bg-white rounded-full focus:outline-none focus:ring-2 focus:ring-anotherPrimary/20 text-gray-700 placeholder:text-gray-400 shadow-sm border border-gray-200' 
                    onChange={(e) => setSearchChatRoom(e.target.value)} 
                    placeholder='Search chats...' 
                />
            </div>
        </div>

        {/* Chat List - Scrollable */}
        <div className='flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent px-2 md:px-3'>
            {isProChatListLoading ? (
                <div className="py-2">
                    <ChatListSkeleton />
                </div>
            ) : activeChatRooms.length === 0 ? (
                <div className='flex flex-col justify-center items-center text-center px-4 py-20'>
                    <div className='w-20 h-20 md:w-24 md:h-24 rounded-full bg-gray-200 flex items-center justify-center mb-4'>
                        <FontAwesomeIcon icon={faCommentDots} className='text-gray-400 text-3xl md:text-4xl' />
                    </div>
                    <p className='text-gray-800 font-bold text-lg md:text-xl mb-2'>
                        No Chats Yet
                    </p>
                    <p className='text-gray-500 text-sm md:text-base'>
                        Start a new conversation
                    </p>
                </div>
            ) : (
                <div className='space-y-0.5'>
                    {activeChatRooms.map((chatRoom) => (
                        <div
                            key={chatRoom._id}
                            className='group relative flex items-center gap-3 p-2.5 md:p-3 cursor-pointer hover:bg-gray-100 rounded-lg transition-colors'
                            ref={menuRef}
                            onContextMenu={(e) => handleChatMenuToggle(chatRoom._id, e)}
                            onClick={
                                chatRoom?.isGroupChat
                                    ? () => handleGroupChatClick(chatRoom)
                                    : () => handleChatClick(chatRoom.receiver)
                            }
                        >
                            {/* Profile Picture */}
                            <div className='relative flex-shrink-0'>
                                <img
                                    className='w-11 h-11 md:w-12 md:h-12 object-cover rounded-full border-2 border-gray-200'
                                    src={
                                        chatRoom?.isGroupChat 
                                            ? chatRoom?.groupIcon 
                                            : chatRoom?.receiver?.profile?.profilePic
                                    }
                                    alt="profile"
                                />
                                {/* Online indicator for non-group chats */}
                                {!chatRoom?.isGroupChat && (
                                    <div className='absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white hidden'></div>
                                )}
                            </div>

                            {/* Chat Info */}
                            <div className='flex-1 min-w-0 flex flex-col gap-0.5'>
                                {/* Top Row: Name and Time */}
                                <div className='flex items-baseline justify-between gap-2'>
                                    <h3 className='font-semibold text-sm md:text-base text-gray-900 truncate'>
                                        {chatRoom?.isGroupChat 
                                            ? chatRoom?.name 
                                            : chatRoom?.receiver?.userName
                                        }
                                    </h3>
                                    <span className='text-[10px] md:text-xs text-gray-500 flex-shrink-0'>
                                        {chatRoom?.lastMessage?.createdAt
                                            ? format(new Date(chatRoom.lastMessage.createdAt), 'HH:mm')
                                            : ''}
                                    </span>
                                </div>

                                {/* Bottom Row: Last Message and Badge */}
                                <div className='flex items-center justify-between gap-2'>
                                    <p className='text-xs md:text-sm text-gray-600 truncate flex-1'>
                                        {chatRoom?.lastMessage
                                            ? chatRoom.lastMessage.sender === userId
                                                ? `You: ${chatRoom.lastMessage.content}`
                                                : chatRoom.lastMessage.content
                                            : 'No messages yet'}
                                    </p>

                                    {/* Unread Badge */}
                                    {chatRoom?.unreadMsgs > 0 && (
                                        <div className='flex-shrink-0 min-w-[18px] h-[18px] md:min-w-[20px] md:h-[20px] px-1.5 rounded-full bg-anotherPrimary flex items-center justify-center'>
                                            <span className='text-[10px] md:text-xs font-bold text-white'>
                                                {chatRoom.unreadMsgs > 99 ? '99+' : chatRoom.unreadMsgs}
                                            </span>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Context Menu */}
                            {isChatMenuVisible === chatRoom?._id && (
                                <div 
                                    className='absolute right-2 top-1/2 -translate-y-1/2 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-20 min-w-[140px]'
                                    onClick={(e) => e.stopPropagation()}
                                >
                                    {!chatRoom?.isGroupChat && (
                                        <button
                                            className='w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 transition-colors flex items-center gap-2'
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                deleteActiveChat(chatRoom._id);
                                            }}
                                        >
                                            <FontAwesomeIcon icon={faTrash} className='text-red-500 text-xs' />
                                            Delete
                                        </button>
                                    )}
                                    <button className='w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 transition-colors flex items-center gap-2'>
                                        <FontAwesomeIcon icon={faThumbtack} className='text-anotherPrimary text-xs' />
                                        Pin to top
                                    </button>
                                    <button
                                        className='w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 transition-colors flex items-center gap-2'
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            clearAllMsgsForUser(chatRoom._id);
                                        }}
                                    >
                                        <FontAwesomeIcon icon={faBroom} className='text-anotherPrimary text-xs' />
                                        Clear messages
                                    </button>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    </div>
);
}

export default ChatListing;
