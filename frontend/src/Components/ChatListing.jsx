import React, { useState, useRef, useEffect } from 'react';
import { format } from 'date-fns';
import { useDispatch, useSelector } from 'react-redux';
import { setCurrentChat } from '../store/chatSlice';
import { setCurrentChatRoom } from '../store/chatRoomSlice';
// import userId from '../utils/UserId';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import api from '../utils/Api';
import { faSearch, faArrowRight, faPlus } from '@fortawesome/free-solid-svg-icons';
import { jwtDecode } from 'jwt-decode';


function ChatListing({ newChatCard , setActiveChatRooms ,fetchActiveChatRooms ,activeChatRooms }) {

    const token = localStorage.getItem('token');
    const decodedToken = jwtDecode(token);
    const userId = decodedToken.userId;

    // const [activeChatRooms, setActiveChatRooms] = useState([]);
    const [isChatMenuVisible, setIsChatMenuVisible] = useState(null);
    const [searchChatRoom, setSearchChatRoom] = useState('');

    // const currentChat = useSelector((state) => state.chat.currentChat);
    const currentChatRoom = useSelector((state) => state.chatRoom.currentChatRoom);

    const menuRef = useRef(null);

    const dispatch = useDispatch();

    useEffect(() => {
        // if (!searchChatRoom.trim()) {
        //     return;
        // }
        const searchActiveUser = async () => {
            try {
                const response = await api.get('/api/chatRoom/searchActiveChatRoom', {
                    params: { searchChatRoom },
                    withCredentials: true
                })
                if (response.data.success) {
                    setActiveChatRooms(response.data.chatRooms);
                }
            } catch (err) {
                console.log(err);
            }
        }
        searchActiveUser();
    }, [searchChatRoom])


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

    const handleGroupChatClick = async (groupChat) => {
        dispatch(setCurrentChat(null));
        dispatch(setCurrentChatRoom(groupChat));
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
        // const fetchActiveChatRooms = async () => {
        //     try {
        //         const response = await api.get('/api/chatRoom/getAllChatRooms', {
        //             withCredentials: true
        //         });
        //         if (response.data.success) {
        //             console.log(response.data.chatRooms);
        //             setActiveChatRooms(response.data.chatRooms.filter(chatRoom => !chatRoom.deletedFor.includes(userId)));
        //         }
        //     } catch (err) {
        //         console.log(err);
        //     }
        // }
        fetchActiveChatRooms();
    }, [currentChatRoom]);



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
                <input type="text" className='text-sm bg-white focus:outline-none py-3 w-full text-gray-600' onChange={(e) => setSearchChatRoom(e.target.value)} placeholder='Search...' />
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

                            <div className='flex items-center gap-4 p-2 cursor-pointer hover:bg-gray-100 rounded-xl relative' key={chatRoom._id} ref={menuRef} onContextMenu={(e) => handleChatMenuToggle(chatRoom._id, e)} onClick={chatRoom?.isGroupChat ? () => handleGroupChatClick(chatRoom) : () => handleChatClick(chatRoom.receiver)}>

                                {chatRoom?.isGroupChat
                                    ?
                                    <img className='w-12 h-12 object-cover rounded-full border border-gray-300' src={chatRoom?.groupIcon} alt="profile picture" />
                                    :
                                    <img className='w-12 h-12 object-cover rounded-full border border-gray-300' src={chatRoom?.receiver?.profile?.profilePic} alt="profile picture" />
                                }

                                <div className='flex flex-col w-5/6 justify-center'>
                                    <div className='flex justify-between w-full mb-0'>
                                        {chatRoom?.isGroupChat
                                            ?
                                            <p className='text-anotherPrimary text-base font-medium truncate'>{chatRoom?.name}</p>
                                            :
                                            <p className='text-anotherPrimary text-base font-medium truncate'>{chatRoom?.receiver?.userName}</p>
                                        }
                                        <p className='text-xs text-font'>{chatRoom?.lastMessage?.createdAt
                                            ? format(new Date(chatRoom.lastMessage.createdAt), 'HH:mm')
                                            : 'N/A'}</p>
                                    </div>
                                    <div className='flex justify-between w-full mt-0'>
                                        <p className='text-sm text-gray-600 truncate max-w-[70%]'>{chatRoom?.lastMessage?.sender === userId ? 'You: ' + chatRoom?.lastMessage?.content : chatRoom?.lastMessage?.content}</p>

                                        {!chatRoom?.isGroupChat && chatRoom?.unreadMsgs > 0 && (
                                            <p className='min-w-[20px] h-[20px] px-2 rounded-full text-xs font-semibold text-white bg-anotherPrimary text-center flex items-center justify-center'>
                                                {chatRoom.unreadMsgs}
                                            </p>
                                        )}

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
