import React, { useState } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPhone, faVideo, faArrowLeft, faEllipsisV } from '@fortawesome/free-solid-svg-icons';
import Translation from './Translation';
import { useDispatch, useSelector } from 'react-redux';
import { setCurrentChat } from '../store/chatSlice';
import { setCurrentChatRoom } from '../store/chatRoomSlice';



function HeaderSecCS({
    inSelectMode,
    selectedMsgs,
    deleteSelectedMsgs,
    handleCancelSelection,
    typingUsers,
    onlineUsers,
    isSideProfileCard,
    sideProfileCard,
    setIsMobileChatOpen, // NEW PROP for mobile navigation
}) {

    

    const currentChat = useSelector((state) => state.chat.currentChat);
    const currentChatRoom = useSelector((state) => state.chatRoom.currentChatRoom);
    const [showMobileMenu, setShowMobileMenu] = useState(false);
    const dispatch = useDispatch();
    


    const handleBackFromChat = () => {                 // socket leaves the room
        dispatch(setCurrentChat(null));
        dispatch(setCurrentChatRoom(null));
        setIsMobileChatOpen(false);          // UI back to chat list
    };


    return (
        <div className='w-full bg-white border-b-2 border-gray-200 relative'>
            {inSelectMode ?
                (<div className='flex justify-between items-center gap-2 py-3 px-3 md:px-6 md:ml-7 md:w-11/12'>

                    <div className='flex gap-1 text-base md:text-lg font-semibold'>
                        {selectedMsgs.length}
                        <p>Selected</p>
                    </div>


                    <div className='flex gap-2 font-medium text-xs md:text-sm'>
                        <button className='py-1 px-2 rounded-md border-anotherPrimary border-2' onClick={deleteSelectedMsgs}>Delete</button>
                        <button className='py-1 px-2 rounded-md bg-anotherPrimary text-white' onClick={() => handleCancelSelection()}>Cancel</button>
                    </div>

                </div>)
                :
                (<div className='flex justify-between items-center gap-2 py-3 px-3 md:px-6 md:ml-7 md:w-11/12'>

                    {/* LEFT SIDE - Back button + Profile */}
                    <div className='flex items-center gap-2 md:gap-4 flex-1 min-w-0'>

                        {/* BACK BUTTON - Only on mobile */}
                        <button
                            onClick={handleBackFromChat}
                            className='md:hidden flex-shrink-0 w-8 h-8 flex items-center justify-center'
                        >
                            <FontAwesomeIcon icon={faArrowLeft} className='text-anotherPrimary text-lg' />
                        </button>

                        {/* Profile Section */}
                        {currentChatRoom?.isGroupChat ?

                            <div className='flex items-center gap-2 md:gap-4 flex-1 min-w-0'>
                                <div
                                    className={`
                                        w-10 h-10 md:w-12 md:h-12 rounded-full overflow-hidden flex items-center justify-center
                                        border border-gray-300 transition flex-shrink-0
                                        ${currentChatRoom?.isAllowed === false
                                            ? "pointer-events-none opacity-50 select-none cursor-not-allowed"
                                            : "cursor-pointer hover:opacity-90"}
                                    `}
                                    onClick={sideProfileCard}
                                >
                                    <img
                                        src={currentChatRoom?.groupIcon}
                                        alt="Group profile"
                                        className="w-full h-full object-cover"
                                    />
                                </div>

                                <div className='flex flex-col min-w-0 flex-1'>
                                    <p className='font-semibold text-sm truncate'>{currentChatRoom.name}</p>
                                    <div className='flex flex-row flex-wrap'>
                                        {currentChatRoom?.members.slice(0, 3).map((member, idx) => (
                                            <p key={member._id} className='text-xs text-gray-600'>
                                                {member.userName}{idx < 2 && idx < currentChatRoom.members.length - 1 ? ', ' : ''}
                                            </p>
                                        ))}
                                        {currentChatRoom?.members.length > 3 && (
                                            <p className='text-xs text-gray-600'> +{currentChatRoom.members.length - 3}</p>
                                        )}
                                    </div>
                                    {currentChatRoom.members.some(member => typingUsers.includes(member._id))
                                        &&
                                        <p className='text-xs font-semibold text-green-500'>Typing...</p>
                                    }
                                </div>
                            </div>

                            :

                            <div className='flex items-center gap-2 md:gap-4 flex-1 min-w-0'>
                                <div className="w-10 h-10 md:w-12 md:h-12 rounded-full overflow-hidden flex items-center justify-center cursor-pointer border border-gray-300 hover:opacity-90 transition flex-shrink-0">
                                    <img className="w-full h-full object-cover" src={currentChat?.profile?.profilePic} alt="" onClick={sideProfileCard} />
                                </div>
                                <div className='flex flex-col min-w-0 flex-1'>
                                    <p className='font-semibold text-sm truncate'>{currentChat?.userName}</p>
                                    {typingUsers.find(id => id !== currentChat?._id)
                                        ?
                                        <p className='text-xs font-semibold text-green-500'>Typing...</p>
                                        :
                                        <p className='text-xs font-medium text-font'>{onlineUsers.find(id => id === currentChat?._id) ? 'Online' : 'Offline'}</p>
                                    }
                                </div>
                            </div>
                        }
                    </div>

                    {/* RIGHT SIDE - Actions */}
                    {!isSideProfileCard && (
                        <>
                            {/* DESKTOP VIEW - All icons visible */}
                            <div className='hidden md:flex gap-4 flex-shrink-0'>
                                <Translation />
                                <div>
                                    <FontAwesomeIcon icon={faPhone} className='text-gray-400 text-xl hover:text-anotherPrimary transition cursor-pointer' />
                                </div>
                                <div>
                                    <FontAwesomeIcon icon={faVideo} className='text-gray-400 text-xl hover:text-anotherPrimary transition cursor-pointer' />
                                </div>
                            </div>

                            {/* MOBILE VIEW - Translation + Three dots menu */}
                            <div className='md:hidden flex items-center gap-3 flex-shrink-0'>
                                {/* Translation Button - Always visible on mobile */}
                                <Translation />

                                {/* Three dots menu for other actions */}
                                <button
                                    onClick={() => setShowMobileMenu(!showMobileMenu)}
                                    className='w-8 h-8 flex items-center justify-center'
                                >
                                    <FontAwesomeIcon icon={faEllipsisV} className='text-gray-600 text-lg' />
                                </button>

                                {/* Mobile Dropdown Menu - Only call options now */}
                                {showMobileMenu && (
                                    <>
                                        <div className='absolute right-3 top-full mt-1 bg-white rounded-lg shadow-lg border border-gray-200 z-50 py-2 min-w-[180px]'>

                                            <button
                                                className='w-full flex items-center gap-3 px-4 py-2 hover:bg-gray-100 text-left text-sm'
                                                onClick={() => {
                                                    setShowMobileMenu(false);
                                                    // Handle audio call
                                                }}
                                            >
                                                <FontAwesomeIcon icon={faPhone} className='text-anotherPrimary' />
                                                <span className='text-gray-700'>Audio Call</span>
                                            </button>

                                            <button
                                                className='w-full flex items-center gap-3 px-4 py-2 hover:bg-gray-100 text-left text-sm'
                                                onClick={() => {
                                                    setShowMobileMenu(false);
                                                    // Handle video call
                                                }}
                                            >
                                                <FontAwesomeIcon icon={faVideo} className='text-anotherPrimary' />
                                                <span className='text-gray-700'>Video Call</span>
                                            </button>
                                        </div>

                                        {/* Backdrop to close menu */}
                                        <div
                                            className='fixed inset-0 z-40'
                                            onClick={() => setShowMobileMenu(false)}
                                        />
                                    </>
                                )}
                            </div>
                        </>
                    )}
                </div>
                )}
        </div>
    )
}

export default HeaderSecCS