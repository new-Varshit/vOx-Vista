import React from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPhone, faVideo, } from '@fortawesome/free-solid-svg-icons';
import Translation from './Translation';
import { useSelector } from 'react-redux';


function HeaderSecCS({
    inSelectMode,
    selectedMsgs,
    deleteSelectedMsgs,
    handleCancelSelection,
    typingUsers,
    onlineUsers,
    isSideProfileCard,
    sideProfileCard,
}) {

    const currentChat = useSelector((state) => state.chat.currentChat);
    const currentChatRoom = useSelector((state) => state.chatRoom.currentChatRoom);


    return (
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

                    {currentChatRoom?.isGroupChat  ?

                        <div className='flex items-center  gap-4'>
                            <div className='overflow-hidden rounded-full'>
                                <img className='w-12' src={currentChatRoom?.groupIcon} alt="" onClick={sideProfileCard} />
                            </div>
                            <div className='flex flex-col '>
                                <p className='font-semibold  text-sm'>{currentChatRoom.name}</p>
                                <div className='flex flex-row'>
                                        {currentChatRoom?.members.map((member)=>(
                                             <p className='text-xs'>{member.userName + ", "}</p>
                                        ))}
                                </div>
                                {currentChatRoom.members.some(member=>typingUsers.includes(member._id))
                                    &&
                                    <p className='text-xs font-semibold text-green-500'>Typing...</p>
                                }
                            </div>
                        </div>

                        :

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
                    }

                    {!isSideProfileCard && (
                        <div className='flex gap-4'>
                            <Translation />
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
    )
}

export default HeaderSecCS