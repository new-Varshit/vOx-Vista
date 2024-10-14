import React, { useState, useEffect } from 'react';
import profilePic from '../assets/profilePic.jpg';
import { useDispatch,useSelector } from 'react-redux';
import { setCurrentChat } from '../store/chatSlice';
import { setCurrentChatRoom } from '../store/chatRoomSlice';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import api from '../utils/Api';
import { faSearch, faArrowRight, faPlus } from '@fortawesome/free-solid-svg-icons';

function ChatListing({ newChatCard }) {

    const [activeChatRooms, setActiveChatRooms] = useState([]);
      const currentChat = useSelector((state) => state.chat.currentChat);
      const currentChatRoom = useSelector((state) => state.chatRoom.currentChatRoom);


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



    useEffect(() => {

        const fetchActiveChatRooms = async () => {
            try {
                const response = await api.get('/api/chatRoom/getAllChatRooms', {
                    withCredentials: true
                });
                if (response.data.success) {
                    console.log(response.data.chatRooms);
                    setActiveChatRooms(response.data.chatRooms);
                }
            } catch (err) {
                console.log(err);
            }
        }
        fetchActiveChatRooms();
    }, [currentChat]);

    return (

        <div className='flex flex-col gap-2 h-full py-4'>

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
            <div className='flex flex-col gap-5 h-full scroll-smooth overflow-y-scroll scrollbar-thin scrollbar-thumb-gray-200 scrollbar-track-gray-200 px-4 '>

                {
                    activeChatRooms.length === 0
                        ?
                        <div className='w-5/6 mx-auto flex flex-col justify-center items-center p-2 mt-[30%]'>
                            <p className='text-anotherPrimary font-bold text-2xl'>
                                Nothing Here
                            </p>
                            <p className='text-gray-600 font-semibold text-base'>There is no chat in your feed. </p>
                            <p className='text-gray-600 font-semibold text-base'>Try to add some</p>
                        </div>
                        :
                        activeChatRooms.map((chatRoom) => (
                            <div className='flex justify-start gap-3' key={chatRoom._id} onClick={() => handleChatClick(chatRoom.receiver)}>
                                <img className='rounded-full w-[15%]' src={chatRoom?.receiver?.profile?.profilePic} alt="profile picture" />
                                <div className='flex flex-col w-5/6 justify-center'>
                                    <div className='flex justify-between w-full mb-0'>
                                        <p className='text-anotherPrimary font-semibold text-sm'>{chatRoom?.receiver?.userName}</p>
                                        <p className='text-xs text-font'>6:23 pm</p>
                                    </div>
                                    <div className='flex justify-between w-full mt-0'>
                                        <p className='text-xs text-font truncate'>{chatRoom?.receiver?.profile?.bio}</p>

                                        <p className={`${chatRoom?.unreadMsgs === 0 || currentChatRoom?._id === chatRoom._id ? 'bg-gray-200 text-gray-200' : 'bg-anotherPrimary text-white'} rounded-full text-xs font-semibold px-1 text-center flex items-center`}>{chatRoom?.unreadMsgs}</p>
                                    </div>
                                </div>
                            </div>
                        ))

                }


            </div>
        </div>

    );
}

export default ChatListing;
