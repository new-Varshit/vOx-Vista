import React, { useEffect } from 'react';
import { useState } from 'react';
import api from '../utils/Api';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowRight, faSearch } from '@fortawesome/free-solid-svg-icons';
import { useDispatch } from 'react-redux';
import { setCurrentChat } from '../store/chatSlice';
import { setCurrentChatRoom } from '../store/chatRoomSlice';
import profilePic from '../assets/profilePic.jpg';

function NewChatSearch({ newChatCard }) {

    const dispatch = useDispatch();
    const [newChats, setNewChats] = useState([]);
    const [searchInput, setSearchInput] = useState('');
    const [message, setMessage] = useState('');

    const handleClick = (e) => {
        if (e.target === e.currentTarget) {
            newChatCard();
        }
    }

    const handleChatClick = async (newChat) => {
        newChatCard();
        dispatch(setCurrentChat(newChat));
        let recipientID = newChat._id;
        try {
            const response = await api.post('/api/chatRoom', { recipientID }, {
                withCredentials: true
            })
            if (response.data.success) {
                dispatch(setCurrentChatRoom(response.data.chatRoom));
            }
            console.log(response.data.chatRoom);
        } catch (err) {
            console.log(err)
        }
    }


    useEffect(() => {

        if (!searchInput.trim()) {
            setNewChats([]);
            setMessage('');
            return;
        } 
        const timeoutId = setTimeout(async () => {

            const searchQuery = async () => {
                try {
                    const response = await api.get('/api/user/searchUser', {
                        params: { searchInput },
                        withCredentials: true
                    })
                    if (response.data.success) {
                        if (response.data.searchResult.length === 0) {
                            setMessage('User not found');
                        }
                        setNewChats(response.data.searchResult);
                    }
                } catch (err) {
                    console.log(err);
                }
            }
            searchQuery();
        }, 1000);
        return () => clearTimeout(timeoutId);
    }, [searchInput]);




    return (
        <div className='absolute w-full h-full bg-transparent z-30 flex ' onClick={handleClick}>
            <div className='w-1/5 top-[28%] left-1/4 h-[60%] relative bg-gray-200 p-4 flex flex-col gap-3 rounded-lg'>
                <div className='flex  gap-2 items-center'>
                    <p className='font-semibold text-lg'>New Chat</p>
                    <FontAwesomeIcon icon={faArrowRight} className='text-base' />
                </div>
                <div className=''>
                    <input className='rounded-full py-2 px-4 text-sm w-full focus:outline-none text-gray-600' type="text" placeholder='Search email or username' onChange={(e) => setSearchInput(e.target.value)} />
                </div>
                <div>

                    {
                        newChats.length === 0
                            ?
                            <div className='w-5/6 mx-auto mt-[30%] flex flex-col gap-2 justify-center items-center'>
                                <div>
                                    <FontAwesomeIcon icon={faSearch} className='text-7xl text-font' />
                                </div>
                                <p className='text-gray-600 font-semibold text-sm text-center'>
                                    {message || 'Search for New Chats , Using Email or Username...'}
                                </p>
                            </div>
                            :
                            <div className=' scroll-smooth flex-1 flex flex-col gap-2 overflow-y-scroll scrollbar-thin scrollbar-thumb-gray-200 scrollbar-track-gray-200 '>
                                {
                                    newChats.map((newChat) => (
                                        <div className='flex justify-start gap-3 hover:bg-gray-300 p-2 py-1 rounded-md' key={newChat._id} onClick={() => handleChatClick(newChat)}>
                                            <img className='rounded-full w-[15%]' src={newChat?.profile?.profilePic || profilePic} alt="profile picture" />
                                            <div className='flex flex-col w-5/6 justify-center'>
                                                <div className='flex justify-between w-full mb-0'>
                                                    <p className='text-anotherPrimary font-semibold text-sm'>{newChat.userName}</p>
                                                </div>
                                                <div className='flex justify-between w-full mt-0'>
                                                    <p className='text-xs text-font truncate'>{newChat.profile.bio}</p>
                                                </div>
                                            </div>
                                        </div>
                                    ))
                                }
                            </div>

                    }

                </div>
            </div>
        </div>
    )
}

export default NewChatSearch 