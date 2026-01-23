import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowLeft, faPen } from '@fortawesome/free-solid-svg-icons';

const ProfileDetailsSection = ({ 
    profileData, 
    userLoggedOut, 
    setMobileActiveTab,
    profileCardToggle
}) => {

    return (
        <div className='flex flex-col h-full bg-gray-200 rounded-2xl overflow-hidden'>
            
            {/* Header */}
            <div className='flex items-center gap-4 p-4 bg-gradient-to-r from-anotherPrimary to-blue-600'>
                <button onClick={() => setMobileActiveTab('chats')}>
                    <FontAwesomeIcon icon={faArrowLeft} className='text-white text-xl' />
                </button>
                <h2 className='text-white font-bold text-lg'>Profile</h2>
            </div>

            {/* Scrollable Content */}
            <div className='flex-1 overflow-y-auto p-4 space-y-4'>
                
                {/* Profile Picture & Info */}
                <div className='flex flex-col items-center gap-3 bg-white rounded-2xl p-6 shadow-sm'>
                    <div className='w-28 h-28 rounded-full overflow-hidden border-4 border-anotherPrimary shadow-lg'>
                        {profileData?.profile?.profilePic ? (
                            <img
                                src={profileData.profile.profilePic}
                                alt="Profile"
                                className="w-full h-full object-cover"
                            />
                        ) : (
                            <div className='w-full h-full bg-gray-300 flex items-center justify-center'>
                                <span className='text-4xl text-gray-500'>👤</span>
                            </div>
                        )}
                    </div>
                    
                    <div className='text-center'>
                        <p className='text-anotherPrimary font-bold text-xl'>
                            {profileData?.userName || "Username"}
                        </p>
                        <p className='text-gray-600 text-sm mt-1'>
                            {profileData?.email || "email@example.com"}
                        </p>
                    </div>
                </div>

                {/* Bio Section */}
                {profileData?.profile?.bio && (
                    <div className='bg-white rounded-xl p-4 shadow-sm'>
                        <p className='text-xs font-semibold text-gray-700 mb-2'>Bio</p>
                        <p className='text-sm text-gray-600 leading-relaxed'>{profileData.profile.bio}</p>
                    </div>
                )}

                {/* Edit Profile Button */}
                <button 
                    onClick={profileCardToggle}
                    className='w-full bg-white border-2 border-anotherPrimary text-anotherPrimary rounded-xl py-3 font-semibold text-sm hover:bg-anotherPrimary hover:text-white transition flex items-center justify-center gap-2 shadow-sm'
                >
                    <FontAwesomeIcon icon={faPen} />
                    Edit Profile
                </button>

                {/* Account Actions */}
                <div className='flex flex-col gap-3 mt-4'>
                    <button 
                        onClick={userLoggedOut}
                        className='w-full bg-anotherPrimary text-white rounded-xl py-3 font-semibold text-sm hover:bg-blue-700 transition shadow-sm'
                    >
                        Logout
                    </button>
                    
                    <button 
                        className='w-full bg-red-500 text-white rounded-xl py-3 font-semibold text-sm hover:bg-red-600 transition shadow-sm'
                    >
                        Delete Account
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ProfileDetailsSection;