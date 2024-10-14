import React, { useEffect } from 'react'
import api from '../utils/Api';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTimes, faArrowRight } from '@fortawesome/free-solid-svg-icons';

function profileCard({ profileCardToggle, profileData: initialProfileData }) {
    const [profileData, setProfileData] = useState(initialProfileData);
    const [initialProfilePic, setInitialProfilepic] = useState('');
    const [loading,setLoading] = useState(false);

    useEffect(() => {
        try {
            setInitialProfilepic(initialProfileData?.profile?.profilePic);
        } catch (err) { 
            console.log(err);
        }

    })

    let profilePicVar;

    if (profileData?.profile?.profilePic) {
        profilePicVar = profileData.profile.profilePic;
    }

    const handleChange = (e) => {
        const { name, value } = e.target;
        setProfileData(prevData => ({
            ...prevData,
            [name]: value,
            profile: {
                ...prevData.profile,
                [name]: value
            }
        })
        )
    }



    const handleFileChange = (e) => {
        const file = e.target.files[0];
        setProfileData(prevData => ({
            ...prevData,
            profile: {
                ...prevData.profile,
                profilePic: file
            }
        }))

    }

    const handleSubmit = async (e) => {
        setLoading(true);
        e.preventDefault();

        const profileDataObj = new FormData();

        profileDataObj.append('userName', profileData.userName);
        profileDataObj.append('email', profileData.email);
        profileDataObj.append('bio', profileData.profile.bio);

        if (profileData.profile.profilePic) {
            profileDataObj.append('profilePic', profileData.profile.profilePic);
        }

        try {
            console.log(profileData);
            const response = await api.post('/api/user/updateProfile', profileDataObj, {
                headers: { "content-type": "multipart/form-data" },
                withCredentials: true
            })
            if (response.data.success) {
                console.log(response.data.message);
                window.location.reload();
            }
        } catch (err) {
            console.log(err);
        }finally{
            setLoading(false);
        }
    }

    return (
        <div className='absolute flex justify-center items-center w-full bg-gray backdrop-blur-md h-full z-20'>
            <div className=' w-1/3 p-5 bg-white rounded-2xl shadow-2xl  border-gray-200'>
                <div className='flex justify-between ' onClick={profileCardToggle}>
                    <div className='flex gap-1 items-center'>
                        <p className='text-xl font-bold'>Profile</p>
                        <FontAwesomeIcon icon={faArrowRight} className=" hover:text-blue-700" size="lg" />
                    </div>
                    <FontAwesomeIcon icon={faTimes} className=" hover:text-blue-900  " size='lg' />
                </div>
                <div className='flex flex-col gap-4'>
                    <div className='overflow-hidden w-1/3 rounded-full mx-auto p-1 bg-anotherPrimary'>
                        <img className='rounded-full' src={initialProfilePic} alt="error" />

                    </div>

                    <form className='flex flex-col gap-4 justify-center items-center' onSubmit={handleSubmit}>

                        <div className='w-5/6 flex flex-col gap-1'>
                            <label htmlFor="userName" className='text-sm font-semibold text-font'>Username :</label>
                            <input className='focus:outline-none p-2 text-sm text-gray-500 font-semibold bg-gray-100 rounded-lg' value={profileData.userName} onChange={handleChange} id='userName' name='userName' type="text" />
                        </div>

                        <div className='w-5/6 flex flex-col gap-1 '>
                            <label htmlFor="email" className='text-sm font-semibold text-font'>Email :</label>
                            <input className='focus:outline-none p-2 text-sm text-gray-500 font-semibold bg-gray-100 rounded-lg' value={profileData.email} onChange={handleChange} id='email' name='email' type="email" />
                        </div>

                        <div className='w-5/6 flex flex-col gap-1'>
                            <label htmlFor="bio" className='text-sm font-semibold text-font'>About :</label>
                            <textarea className='focus:outline-none p-2 text-sm text-gray-500 font-semibold bg-gray-100 rounded-lg' value={profileData.profile.bio} onChange={handleChange} id='bio' name='bio'></textarea>
                        </div>


                        <div className='w-5/6 flex flex-col  gap-1'>
                            <label htmlFor="profilePic" className='text-sm font-semibold text-font'>Upload Image :</label>
                            <input className='focus:outline-none p-2 text-xs text-font font-semibold bg-gray-100 rounded-lg' id='profilePic' name='profilePic' onChange={handleFileChange} type="file" />
                        </div>


                        {loading ? (
                            <div className='m-4 py-1 text-base w-1/4 font-semibold bg-anotherPrimary rounded-md text-white'>
                                <div className="loader w-full text-center">Loading...</div>
                            </div>
                        ) : (
                            <button type='submit' className=' m-4 py-1  text-base w-1/4 font-semibold bg-anotherPrimary rounded-md text-white'>Update</button>
                        )}
                    </form>
                </div>

            </div>
        </div>
    )
}

export default profileCard