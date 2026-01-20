import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEllipsisV, faTrash, faCopy, faCheckSquare } from '@fortawesome/free-solid-svg-icons';
import FilesInChat from './FilesInChat';
import { useSelector } from 'react-redux';
import { useRef } from 'react';
import StatusCheck from '../utils/StatusCheck';
import { isToday, isYesterday, format } from "date-fns";
import  { getUserId } from '../utils/UserId';
import MessageSkeleton from './MessageSkeleton';


function MessageSecCS({
    messages,
    selectedMsgs,
    inSelectMode,
    toggleSelectMessage,
    lastMessageRef,
    setIsAtBottom,
    isDelSelCardVisible,
    handleDelSelCard,
    handleSingleMsgDeletion,
    handleMessageSelect,
    accessMessage,
    isMessagesLoading,
    unreadCount,
    firstUnreadId,
    firstUnreadRef
}) {

    const chatContainerRef = useRef(null);

    const userId = getUserId();

    const currentChatRoom = useSelector((state) => state.chatRoom.currentChatRoom);


    const getDateLabel = (date) => {
        if (isToday(date)) return 'Today';
        else if (isYesterday(date)) return 'Yesterday';
        else return format(date, "dd MMM yyyy");
    }

    const handleScroll = () => {
        const el = chatContainerRef.current;
        if (!el) return;

        const threshold = 50;
        const atBottom =
            el.scrollHeight - el.scrollTop - el.clientHeight < threshold;

        setIsAtBottom(prev => {
            if (prev === atBottom) return prev;
            return atBottom;
        });
    }

       console.log('userId',userId);
    

    return (
        <>
            {currentChatRoom?.isAllowed === false && (
                <div className="bg-red-100 text-red-700 text-sm p-2 text-center">
                    {accessMessage}
                </div>
            )}
            <div
                ref={chatContainerRef}
                onScroll={handleScroll}
                className=' h-[83%] bg-white overflow-y-scroll  scrollbar-thin scrollbar-thumb-white scrollbar-track-white rounded-r-xl p-4  flex flex-col gap-0.5'
            >

                {isMessagesLoading ?

                    (<MessageSkeleton count={9} />)

                    :

                    (messages.map((message, index) => {

                        const isFirstUnread = message._id === firstUnreadId;
                        const currentDate = new Date(message.createdAt);
                        const prevMsg = messages[index - 1];
                        const prevDate = prevMsg ? new Date(prevMsg.createdAt) : null;

                        const showDateSeparator = !prevDate || currentDate.toDateString() !== prevDate.toDateString();

                        return (
                            <React.Fragment key={message._id}>
                                {showDateSeparator && (
                                    <div className="sticky top-2 z-10 flex justify-center my-3">
                                        <span className="bg-gray-200 text-gray-600 text-xs px-3 py-1 rounded-full shadow">
                                            {getDateLabel(currentDate)}
                                        </span>
                                    </div>
                                )}



                                {isFirstUnread && unreadCount > 0 && (
                                    <div className="sticky top-2 z-10 my-3">
                                        <div className="w-full px-4 py-2 
                    bg-gray-100/70 
                    backdrop-blur-sm 
                    border-y border-gray-300 
                    flex justify-center">
                                            <span className="bg-blue-500 text-white text-xs px-4 py-1.5 rounded-full shadow-sm">
                                                {unreadCount} unread messages
                                            </span>
                                        </div>
                                    </div>
                                )}







                                {/* 🔹 SYSTEM MESSAGE */}
                                {message?.isSystem && (
                                    <div
                                        ref={
                                            isFirstUnread
                                                ? firstUnreadRef
                                                : index === messages.length - 1
                                                    ? lastMessageRef
                                                    : null
                                        }
                                        className="flex justify-center my-2"
                                    >
                                        <span className="bg-gray-100 text-gray-600 text-xs px-3 py-1 rounded-full shadow-sm">
                                            {message.content}
                                        </span>
                                    </div>
                                )}

                                {/* 🔹 NORMAL MESSAGE */}
                                {!message?.isSystem && (message?.content || message?.attachments?.length > 0) ? (
                                    <div
                                        ref={
                                            isFirstUnread
                                                ? firstUnreadRef
                                                : index === messages.length - 1
                                                    ? lastMessageRef
                                                    : null
                                        }

                                        className={`${selectedMsgs.includes(message._id) ? 'bg-blue-300  bg-opacity-50' : ''}`}
                                        onClick={() => inSelectMode && toggleSelectMessage(message._id)}
                                    >
                                        { String(message?.sender?._id) !== String(userId)
                                            ? (
                                                <div className='flex gap-1 group mt-1'>
                                                    <img className='rounded-full w-7 h-7 flex' src={message?.sender?.profile?.profilePic} alt="error" />
                                                    <div className='bg-gray-200 text-gray-800 max-w-[70%] pt-2 pb-1 px-2 flex flex-col  justify-center rounded-md'>
                                                        {message?.attachments?.length > 0 && <FilesInChat attachments={message?.attachments} />}
                                                        <p className=' text-gray-800 text-sm   font-medium -mb-2 mr-12'>{message.content}</p>
                                                        <div className={`flex  w-full justify-end ${message?.attachments?.length > 0 && 'mt-2'}`}>
                                                            <p className='text-[10px] '>{format(new Date(message?.createdAt), 'HH:mm')}</p>
                                                        </div>
                                                    </div>

                                                    {!inSelectMode && (
                                                        <div className={`bg-gray-200 w-[2%]  ${isDelSelCardVisible === message._id ? 'flex' : 'hidden group-hover:flex'}  justify-center items-center rounded-r-xl relative curson-pointer`} onClick={(e) => handleDelSelCard(message._id, e)}>
                                                            {isDelSelCardVisible === message._id && (
                                                                <div className={` bg-gray-200 absolute left-[120%] ${index === messages.length - 1 ? 'bottom-1/3' : 'top-1/3'} rounded-lg p-3  flex flex-col gap-2 `}>
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
                                                            )}
                                                            <FontAwesomeIcon icon={faEllipsisV} className='text-gray-700 text-xl cursor-pointer' />
                                                        </div>
                                                    )}
                                                </div>
                                            )
                                            : (
                                                <div className=' flex gap-1 justify-end group  mt-1 ' >
                                                    {!inSelectMode && (
                                                        <div className={`bg-gray-200 w-[2%] ${isDelSelCardVisible === message._id ? 'flex' : 'hidden group-hover:flex'} justify-center items-center rounded-l-xl relative cursor-pointer`} onClick={(e) => handleDelSelCard(message._id, e)}>
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
                                                            )}
                                                            <FontAwesomeIcon icon={faEllipsisV} className='text-gray-700 text-xl cursor-pointer' />
                                                        </div>
                                                    )}
                                                    <div className='bg-anotherPrimary text-sm max-w-[70%] text-white pt-2 pb-1 px-2 flex flex-col  justify-center rounded-md'>
                                                        {message?.attachments?.length > 0 && <FilesInChat attachments={message?.attachments} />}
                                                        <p className='text-sm text-white font-medium -mb-2 mr-16'>{message.content}</p>
                                                        <div className={`flex gap-2 w-full justify-end ${message?.attachments?.length > 0 && 'mt-2'}`}>
                                                            <p className='text-[10px] text-gray-300'>{format(new Date(message?.createdAt), 'HH:mm')}</p>
                                                            <p>
                                                                <StatusCheck
                                                                    userId={userId}
                                                                    currentChatRoom={currentChatRoom}
                                                                    readBy={message.readBy}
                                                                    deliveredTo={message.deliveredTo}
                                                                />
                                                            </p>
                                                        </div>
                                                    </div>
                                                    {/* <img className='rounded-full w-7 h-7 flex' src={message?.sender?.profile?.profilePic} alt="error" loading="lazy" /> */}
                                                </div>
                                            )
                                        }
                                    </div>
                                ) : null}
                            </React.Fragment>
                        );
                    })
                    )

                }
            </div>

        </>
    )
}

export default MessageSecCS;
