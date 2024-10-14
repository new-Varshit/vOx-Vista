import React from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPhone, faVideo } from '@fortawesome/free-solid-svg-icons';
import profilePic from '../assets/profilePic.jpg';
import { useSelector } from 'react-redux';


function SideProfileSection() {
    const currentChat = useSelector((state)=>state.chat.currentChat);
    return (

        <div className='w-1/4 bg-gray-200 rounded-r-lg my-2 mr-2 flex p-5 justify-center'>
            <div className='w-5/6  flex flex-col gap-8 mt-[25%] '>
                <div className='rounded-full overflow-hidden w-1/2 mx-auto bg-anotherPrimary p-1' >
                    <img className='rounded-full' src={currentChat?.profile?.profilePic} alt="error" />
                </div>
                <div className='flex flex-col justify-center items-center gap-2'>
                    <p className='font-bold  text-xl'>{currentChat.userName}</p>
                    <p className='text-gray-600 text-base font-semibold'>{currentChat.email}</p>
                    <p className='text-gray-500 text-center text-sm font-medium'>{currentChat?.profile?.bio}</p>
                </div>
                <div className='flex justify-evenly items-center '>
                    <div className='w-1/2 text-center border-r-2 border-white'>
                        <FontAwesomeIcon icon={faPhone} className='text-anotherPrimary text-4xl p-3 rounded-full  hover:text-blue-900 bg-white' />
                    </div>
                    <div className='w-1/2 text-center'>
                        <FontAwesomeIcon icon={faVideo} className='text-anotherPrimary text-4xl p-3 rounded-full hover:text-blue-900   bg-white' />
                    </div>
                </div>
            </div>

        </div>

    )
}

export default SideProfileSection