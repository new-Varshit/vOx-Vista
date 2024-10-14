import React from 'react';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/Api';
import { useDispatch, useSelector } from 'react-redux';
import ChatListing from '../Components/ChatListing';
import ChatSection from '../Components/ChatSection';
import SideProfileSection from '../Components/SideProfileSection';
import ProfileCard from '../Components/profileCard';
import NewChatSearch from '../Components/NewChatSearch';
import { logIn, logOut } from '../store/authSlice';

function MainPage() {

    const navigate = useNavigate();
    const dispatch = useDispatch();
   console.log('mainpage');

    const [isSideProfileCard, setIsSideProfileCard] = useState(false);
    const [isProfileCardVisible, setisProfileCardVisible] = useState(false);
    const [isNewChatCardVisible, setIsNewChatCardVisible] = useState(false);
    const [profileData, setProfileData] = useState('');


    const profileCardToggle = () => {
        setisProfileCardVisible(!isProfileCardVisible);
    }

    const sideProfileCard = () => {
        setIsSideProfileCard(!isSideProfileCard);
    }
    
    const newChatCard = () =>{
        setIsNewChatCardVisible(!isNewChatCardVisible);
    }

    const userLoggedOut = async () => {
        try {
            const response = await api.post('/api/auth/logout', null, {
                withCredentials: true
            })
            if (response.data.success) {
                dispatch(logOut());
                navigate('/login');
            }
        } catch (err) {
            console.log(err)
        }
    }

    useEffect(() => {
        const checkSession = async () => {
            try {
                const response = await api.get('/api/auth/check-session', {
                    withCredentials: true
                })
                if (response.data.success) {
                    dispatch(logIn(response.data.userId));
                    setProfileData(response.data.profileData);

                } else {
                    dispatch(logOut());
                    navigate('/login');
                }
            } catch (err) {
                console.log(err);
                dispatch(logOut());
                navigate('/login');
            }
        }
        checkSession();
    }, [])

    return (
        <>
            <div className='h-screen flex'>
                <div className='flex flex-col w-1/4 '>

                    <div className='p-5 bg-gray-200 flex flex-col gap-5 m-2 rounded-tl-2xl '>

                        <p className='font-bold text-blue-800 text-2xl text-center font-serif'>vox-Vista</p>



                        <div className='flex justify-between'>
                            <div className='flex gap-4 justify-start items-center'>
                                <div className='w-1/5 rounded-xl overflow-hidden'>
                                    {profileData?.profile?.profilePic && (
                                        <img className='' src={profileData.profile.profilePic} alt="profile Pic" />
                                    )}
                                </div>
                                <div>
                                    <p className=' text-anotherPrimary  font-bold'>{profileData.userName}</p>
                                    <p className='text-font text-sm'>{profileData.email}</p>
                                </div>
                            </div>
                            <div onClick={profileCardToggle} >
                                <svg className='w-5 mt-2' xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><path d="M441 58.9L453.1 71c9.4 9.4 9.4 24.6 0 33.9L424 134.1 377.9 88 407 58.9c9.4-9.4 24.6-9.4 33.9 0zM209.8 256.2L344 121.9 390.1 168 255.8 302.2c-2.9 2.9-6.5 5-10.4 6.1l-58.5 16.7 16.7-58.5c1.1-3.9 3.2-7.5 6.1-10.4zM373.1 25L175.8 222.2c-8.7 8.7-15 19.4-18.3 31.1l-28.6 100c-2.4 8.4-.1 17.4 6.1 23.6s15.2 8.5 23.6 6.1l100-28.6c11.8-3.4 22.5-9.7 31.1-18.3L487 138.9c28.1-28.1 28.1-73.7 0-101.8L474.9 25C446.8-3.1 401.2-3.1 373.1 25zM88 64C39.4 64 0 103.4 0 152L0 424c0 48.6 39.4 88 88 88l272 0c48.6 0 88-39.4 88-88l0-112c0-13.3-10.7-24-24-24s-24 10.7-24 24l0 112c0 22.1-17.9 40-40 40L88 464c-22.1 0-40-17.9-40-40l0-272c0-22.1 17.9-40 40-40l112 0c13.3 0 24-10.7 24-24s-10.7-24-24-24L88 64z" /></svg>
                            </div>
                        </div>


                        <div className='flex justify-evenly'>
                            <button className='bg-anotherPrimary rounded-md text-sm font-semibold py-1 text-white w-2/5'>Delete</button>
                            <button className='bg-anotherPrimary rounded-md text-sm  font-semibold py-1 text-white w-2/5' onClick={userLoggedOut}>logout</button>
                        </div>

                    </div>

                    <div className='flex-1 overflow-auto bg-gray-200 m-2 rounded-bl-2xl mt-0'>
                        <ChatListing newChatCard={newChatCard}/>
                    </div>
                </div>


                <div className={`${isSideProfileCard ? 'w-1/2' : 'w-3/4'}   h-full py-2`}>
                    <ChatSection sideProfileCard={sideProfileCard} isSideProfileCard={isSideProfileCard} />
                </div>



                {isSideProfileCard &&
                    <SideProfileSection />
                }

                {isProfileCardVisible &&
                    <ProfileCard profileCardToggle={profileCardToggle} profileData={profileData} />
                }


                {isNewChatCardVisible &&
                    <NewChatSearch newChatCard={newChatCard}/>
                }

            </div>




        </>
    )
}

export default MainPage