import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEllipsisV, faTrash, faCopy, faCheckSquare, } from '@fortawesome/free-solid-svg-icons';
import { format } from 'date-fns';
import FilesInChat from './FilesInChat';
import StatusCheck from '../utils/StatusCheck';
import userId from '../utils/UserId';



function MessageSecCS({
    messages,
    selectedMsgs,
    inSelectMode,
    toggleSelectMessage,
    lastMessageRef,
    isDelSelCardVisible,
    handleDelSelCard,
    handleSingleMsgDeletion,
    handleMessageSelect,
}) {
    return (
        <>
            
            <div className=' h-[83%] bg-white overflow-y-scroll scroll-smooth scrollbar-thin scrollbar-thumb-white scrollbar-track-white rounded-r-xl p-4  flex flex-col gap-0.5' >

               { messages.map((message, index) => (
                    message?.content || message.attachments.length > 0 ? (
                    <div key={message._id} ref={index === messages.length - 1 ? lastMessageRef : null} className={`${selectedMsgs.includes(message._id) ? 'bg-blue-300  bg-opacity-50' : ''}`} onClick={() => inSelectMode && toggleSelectMessage(message._id)}>
                        {message?.sender?._id !== userId
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
                                        </div>)
                                    }
                                </div>
                            )
                            :
                            (
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
                                        </div>)
                                    }
                                    <div className='bg-anotherPrimary text-sm max-w-[70%] text-white pt-2 pb-1 px-2 flex flex-col  justify-center rounded-md'>
                                        {message?.attachments?.length > 0 && <FilesInChat attachments={message?.attachments}/>}

                                        <p className='text-sm text-white font-medium -mb-2 mr-16'>{message.content}</p>
                                        <div className={`flex gap-2 w-full justify-end ${message?.attachments?.length > 0 && 'mt-2'}`}>
                                            <p className='text-[10px] text-gray-300'>{format(new Date(message?.createdAt), 'HH:mm')}</p>
                                            <p><StatusCheck msgStatus={message?.status} /></p>
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
        </>
    )
}

export default MessageSecCS