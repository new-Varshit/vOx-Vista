import React, { useState, useRef, useEffect } from 'react';
import profilePic from '../assets/profilePic.jpg';
import { jwtDecode } from 'jwt-decode';
import { format } from 'date-fns';
import { useDispatch, useSelector } from 'react-redux';
import { setCurrentChat } from '../store/chatSlice';
import { setCurrentChatRoom } from '../store/chatRoomSlice';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import api from '../utils/Api';
import { faSearch, faArrowRight, faPlus } from '@fortawesome/free-solid-svg-icons';

function ChatListing({ newChatCard }) {

    const token = localStorage.getItem('token');
    const decodedToken = jwtDecode(token);
    const userId = decodedToken.userId;

    const [activeChatRooms, setActiveChatRooms] = useState([]);
    const [isChatMenuVisible, setIsChatMenuVisible] = useState(null);

    const currentChat = useSelector((state) => state.chat.currentChat);
    const currentChatRoom = useSelector((state) => state.chatRoom.currentChatRoom);

    const menuRef = useRef(null);

    const dispatch = useDispatch();





    const handleChatClick = async (newChat) => {

        dispatch(setCurrentChat(newChat));
        let recipientID = newChat._id;
        try {
            const response = await api.post('/api/chatRoom', { recipientID }, {
                withCredentials: true
            })
            if (response.data.success) {
                dispatch(setCurrentChatRoom(response.data.chatRoom));
            }
        } catch (err) {
            console.log(err)
        }
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


    useEffect(() => {
        const fetchActiveChatRooms = async () => {
            try {
                const response = await api.get('/api/chatRoom/getAllChatRooms', {
                    withCredentials: true
                });
                if (response.data.success) {
                    console.log(response.data.chatRooms);
                    console.log(response.data.chatRooms);
                    setActiveChatRooms(response.data.chatRooms.filter(chatRoom => !chatRoom.deletedFor.includes(userId)));
                }
            } catch (err) {
                console.log(err);
            }
        }
        fetchActiveChatRooms();
    }, [currentChat]);

    

    useEffect(() => {
        document.addEventListener('click', handleClickOutside);

        return () => {
            document.removeEventListener('click', handleClickOutside);
        };
    }, []);




    return (

        <div className='flex flex-col gap-2 h-full py-4 '>

            <div className='w-11/12 mx-auto flex justify-between items-center mb-2'>
                <div className='flex gap-2 items-center'>
                    <p className='text-black font-bold text-xl'>Chats</p>
                    <FontAwesomeIcon icon={faArrowRight} className='text-black text-xl' />
                </div>
                <FontAwesomeIcon icon={faPlus} onClick={newChatCard} className='text-black text-xl hover:text-anotherPrimary' />
            </div>

            {/* Search bar section */}
            <div className='sticky  top-0 flex overflow-hidden rounded-full w-5/6 mx-auto bg-white z-10 mb-4'>
                <button className='bg-white p-1 px-3 border-l '>
                    <FontAwesomeIcon icon={faSearch} className="text-gray-300" />
                </button>
                <input type="text" className='text-sm bg-white focus:outline-none py-3 w-full text-gray-600' placeholder='Search...' />
            </div>

            {/* Scrollable chat listing */}
            <div className='flex flex-col gap-5 h-full scroll-smooth overflow-y-scroll scrollbar-thin scrollbar-thumb-gray-200 scrollbar-track-gray-200 px-4'>

                {
                    activeChatRooms.length === 0
                        ?
                        <div className='w-5/6 mx-auto flex flex-col justify-center items-center p-2 mt-[30%]'>
                            <p className='text-anotherPrimary font-bold text-2xl '>
                                Nothing Here
                            </p>
                            <p className='text-gray-600 font-semibold text-base'>There is no chat in your feed. </p>
                            <p className='text-gray-600 font-semibold text-base'>Try to add some</p>
                        </div>
                        :
                        activeChatRooms.map((chatRoom) => (
                        
                            <div className='flex justify-start gap-3 relative overflow-visible' key={chatRoom._id} ref={menuRef} onContextMenu={(e) => handleChatMenuToggle(chatRoom._id, e)} onClick={() => handleChatClick(chatRoom.receiver)}>
                                <img className='rounded-full w-[15%]' src={chatRoom?.receiver?.profile?.profilePic} alt="profile picture" />
                                <div className='flex flex-col w-5/6 justify-center'>
                                    <div className='flex justify-between w-full mb-0'>
                                        <p className='text-anotherPrimary font-semibold text-sm'>{chatRoom?.receiver?.userName}</p>
                                        <p className='text-xs text-font'>{format(new Date(chatRoom?.lastMessage?.createdAt), 'HH:mm')}</p>
                                    </div>
                                    <div className='flex justify-between w-full mt-0'>
                                        <p className='text-xs text-font truncate'>{chatRoom?.lastMessage?.sender === userId ? 'You: ' + chatRoom?.lastMessage?.content : chatRoom?.lastMessage?.content}</p>

                                        <p className={`${chatRoom?.unreadMsgs === 0 || currentChatRoom?._id === chatRoom._id ? 'bg-gray-200 text-gray-200' : 'bg-anotherPrimary text-white'} rounded-full text-xs font-semibold px-1 text-center flex items-center`}>{chatRoom?.unreadMsgs}</p>
                                    </div>
                                </div>
                                {
                                    isChatMenuVisible === chatRoom._id &&
                                    <div className='absolute p-2 bg-white rounded-lg right-0  top-1/2   flex flex-col z-10'>
                                        <p className='text-anotherPrimary font-medium text-xs cursor-pointer' onClick={() => deleteActiveChat(chatRoom._id)}>Delete</p>
                                        <p className='text-anotherPrimary font-medium text-xs cursor-pointer' >Pin to top</p>
                                        <p className='text-anotherPrimary font-medium text-xs cursor-pointer' onClick={() => clearAllMsgsForUser(chatRoom._id)}>Clear messages</p>
                                    </div>
                                }

                            </div>
                        ))

                }


            </div>
        </div>

    );
}

export default ChatListing;
