import React, { useEffect, useRef } from 'react';
import { useState } from 'react';
import api from '../utils/Api';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowRight, faArrowLeft, faSearch, faUserFriends, faCamera } from '@fortawesome/free-solid-svg-icons';
import { useDispatch } from 'react-redux';
import { setCurrentChat } from '../store/chatSlice';
import { setCurrentChatRoom } from '../store/chatRoomSlice';
import profilePic from '../assets/profilePic.jpg';

function NewChatSearch({ newChatCard }) {

    const dispatch = useDispatch();

    const [newChats, setNewChats] = useState([]);
    const [searchInput, setSearchInput] = useState('');
    const [message, setMessage] = useState('');
    const [newGrpMode, setNewGrpMode] = useState(false);
    const [members, setMembers] = useState([]);
    const [isGrpDetailForm, setIsGrpDetailForm] = useState(false);
    const [grpDetail, setGrpDetail] = useState({
        groupIcon: null,
        name: '',
    });

    const iconInputRef = useRef(null);
    const btnRef = useRef(null);

    const handleInputGrpNameChange = (e) => {
        setGrpDetail(prevMsgs => ({
            ...prevMsgs,
            [e.target.name]: e.target.value
        }))
    }

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

    const handleSelMemClick = (newChat) => {
        setMembers(prevMembers => {
            const newSet = new Set(prevMembers);
            if (newSet.has(newChat._id)) {
                newSet.delete(newChat._id);
            } else {
                newSet.add(newChat._id);
            }
            return Array.from(newSet);
        });
    };

    const handleGrpMode = () => {
        setNewGrpMode(false)
        setMembers([]);
        setIsGrpDetailForm(false);
    }

    const handleCameraClick = () => {
        iconInputRef.current.click();
    }

    const handleSubmitBtnClick = () => {
        btnRef.current.click();
    }

    const handleSubmitGrpDetail = async (e) => {
        e.preventDefault();
        console.log(' Icon :  ',grpDetail.groupIcon);

        const formObj = new FormData();
        formObj.append('name', grpDetail.name); // Append group name
        formObj.append('groupIcon', grpDetail.groupIcon.inputIcon); // Append group icon
        formObj.append('members', JSON.stringify(members)); // Append members array as JSON string
    
        console.log('Form Data:', [...formObj]);
        try {
            const response = await api.post('/api/chatRoom/groupChat', formObj, {
                headers: { "content-type": "multipart/form-data" },
                withCredentials: true
            })
            if (response.data.success) {
                dispatch(setCurrentChatRoom(response.data.groupChat));
                handleGrpMode();
                newChatCard();
            }
        } catch (err) {
            console.log(err);
        }
        console.log('submitted...')
    }


    const handleIconInputChange = (event) => {

        const inputIcon = event.target.files[0];
        console.log('input icon before :',inputIcon);


        if (inputIcon && inputIcon.type.startsWith('image/')) {
            const iconWithPreview = {
                inputIcon,
                preview: URL.createObjectURL(inputIcon) // Added correct property name "preview"
            };
            console.log('input icon after :',iconWithPreview)
            setGrpDetail(prevData => ({
                ...prevData,
                [event.target.name]: iconWithPreview
            }));
        } else {
            console.warn("Please upload a valid image file.");
            setGrpDetail(m => ({
                ...m
            })); // Clear the selection if the file is invalid
        }
    };


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
                <div className='flex justify-between items-center'>

                    <div className='flex  gap-2 items-center'>
                        {newGrpMode && <FontAwesomeIcon icon={faArrowLeft} className='text-base' onClick={handleGrpMode} />
                        }
                        <p className='font-semibold text-lg'>{newGrpMode ? 'New Group' : 'New Chat'}</p>
                        {!newGrpMode && <FontAwesomeIcon icon={faArrowRight} className='text-base' />
                        }
                    </div>
                    {newGrpMode &&
                        <div>
                            <p className='font-semibold'>{`selected(${members?.length})`}</p>
                        </div>}
                </div>

                <div className='flex flex-col gap-3'>

                    {!isGrpDetailForm &&
                        <input className='rounded-full py-2 px-4 text-sm w-full focus:outline-none text-gray-600' type="text" placeholder='Search email or username' onChange={(e) => setSearchInput(e.target.value)} />
                    }
                    {!newGrpMode && !isGrpDetailForm &&
                        <div className='flex gap-3 items-center px-3 hover:bg-blue-300 py-1 rounded-md cursor-pointer' onClick={() => setNewGrpMode(!newGrpMode)}>
                            <FontAwesomeIcon icon={faUserFriends} className='text-xl text-anotherPrimary  border-anotherPrimary rounded-full
                        p-1' />
                            <p className='text-sm font-medium text-anotherPrimary'>New group </p>
                        </div>
                    }


                    {isGrpDetailForm &&
<<<<<<< HEAD
                        <form className='flex flex-col gap-2 mt-[5%]' onSubmit={(e) =>handleSubmitGrpDetail(e)}>
=======
                        <form className='flex flex-col gap-2 mt-[5%]' onSubmit={(e) => handleSubmitGrpDetail(e)}>
>>>>>>> 1231b23454122c208aeaebd61de14996fa854556
                            <div>
                                <div onClick={handleCameraClick} className='flex justify-center items-center gap-5'>
                                    <div className='border-[1px] border-anotherPrimary  flex justify-center items-center  rounded-full w-[15%] aspect-square overflow-hidden'>
                                        {grpDetail?.groupIcon ? (
                                            <img
                                                src={grpDetail?.groupIcon?.preview}
                                                alt="Group Icon"
                                                className="w-full h-full  object-cover rounded-full"
                                            />
                                        ) : (
                                            <FontAwesomeIcon
                                                icon={faCamera}
                                                className='text-4xl text-anotherPrimary '
                                            />
                                        )}
                                    </div>

                                    <label htmlFor="groupIcon" className='text-base font-medium  text-gray-600' >Add a group icon</label>
                                </div>
                                <input type="file" className='hidden' accept="image/*" ref={iconInputRef} name='groupIcon' required onChange={(e) => handleIconInputChange(e)} />
                            </div>
                            <div className='flex flex-col gap-1'>
                                <label htmlFor="name" className='text-sm font-medium text-gray-600'>Provide a  group name :</label>
                                <input type="text" placeholder='Group name...' name='name' className='text-xs p-2  focus:outline-none text-gray-600 rounded-lg' value={grpDetail?.name} onChange={handleInputGrpNameChange} />
                            </div>
                            <button ref={btnRef} type='submit'></button>
                        </form>
                    }



                    {
                        members.length > 0 &&
                        (
                            <div className='flex justify-evenly items-center '>
                                <button className='px-2 text-sm font-medium text-center py-1 w-[47%] rounded-md hover:bg-blue-500  bg-anotherPrimary text-white' onClick={isGrpDetailForm ? handleSubmitBtnClick : () => setIsGrpDetailForm(true)}>
                                    {isGrpDetailForm ? 'Create' : 'Next'}
                                </button>
                                <button onClick={handleGrpMode} className='px-2 text-sm font-medium text-center rounded-md py-1 w-[47%] hover:bg-b-100 bg-white text-anotherPrimary'>
                                    Cancel
                                </button >
                            </div>
                        )
                    }


                </div>
                <div>


                    {!isGrpDetailForm && (
                        newChats.length === 0
                            ?
                            <div className='w-5/6 mx-auto mt-[30%] flex flex-col gap-2 justify-center items-center'>
                                <div>
                                    <FontAwesomeIcon icon={newGrpMode ? faUserFriends : faSearch} className='text-7xl text-font' />
                                </div>
                                <p className='text-gray-600 font-semibold text-sm text-center'>

                                    {message || (newGrpMode ? 'Search for group members using Email or Username...' : 'Search for new chats using Email or Username...')}

                                </p>
                            </div>
                            :
                            <div className=' scroll-smooth flex-1 flex flex-col gap-2 overflow-y-scroll scrollbar-thin scrollbar-thumb-gray-200 scrollbar-track-gray-200 cursor-pointer'>
                                {
                                    newChats.map((newChat) => (
                                        <div className={`flex justify-start gap-3 ${!members.includes(newChat._id) && ' hover:bg-gray-300'} p-2 py-1 ${members.includes(newChat._id) && 'bg-blue-300'} rounded-md`} key={newChat._id} onClick={newGrpMode ? () => handleSelMemClick(newChat) : () => handleChatClick(newChat)}>
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
                    )
                    }

                </div>
            </div>
        </div>
    )
}

export default NewChatSearch 