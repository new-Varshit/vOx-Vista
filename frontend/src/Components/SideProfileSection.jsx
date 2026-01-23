import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faPhone,
  faVideo,
  faUserPlus,
  faUserMinus,
  faPen,
  faRightFromBracket,
  faTrash,
  faBell,
  faBan,
  faArrowLeft
} from '@fortawesome/free-solid-svg-icons';
import { useSelector } from 'react-redux';
import { jwtDecode } from 'jwt-decode';
import api from '../utils/Api';
import  { getUserId } from '../utils/UserId';


function SideProfileSection({setIsSearchNewMember,setIsGroupInfoCardVisible,setIsConfirmMemRemoval ,setSelectedMember , setIsConfirmExitGrp , setIsConfirmDltGrp , setIsSideProfileCard}) {
  const currentChat = useSelector((state) => state.chat.currentChat);
  const currentChatRoom = useSelector((state) => state.chatRoom.currentChatRoom);

  // const token = localStorage.getItem('token');
  // const decodedToken = jwtDecode(token);
  // const userId = decodedToken.userId;

  const userId = getUserId();

  const isAdmin = String(currentChatRoom?.admin) === String(userId);

 
  

  return (
  <div className="w-full h-full bg-gradient-to-b from-gray-50 to-gray-100 border-l border-gray-200 rounded-r-xl md:my-2 md:mr-2 flex flex-col shadow-sm">
    
    {/* MOBILE HEADER WITH BACK BUTTON */}
    <div className="lg:hidden flex items-center gap-3 px-4 py-3 border-b border-gray-300 bg-white sticky top-0 z-10">
      <button onClick={() => setIsSideProfileCard(false)} className="flex-shrink-0">
        <FontAwesomeIcon icon={faArrowLeft} className="text-anotherPrimary text-xl" />
      </button>
      <h2 className="text-lg font-semibold text-gray-800">Profile</h2>
    </div>

    {/* SCROLLABLE CONTENT */}
    <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4 md:space-y-6">
      
      {/* HEADER */}
      <div className="flex flex-col items-center gap-3 md:gap-4 pb-4 md:pb-6 border-b border-gray-300">
        <div className="relative">
          <div className="w-20 h-20 md:w-28 md:h-28 rounded-full overflow-hidden border-2 md:border-4 border-anotherPrimary shadow-md">
            <img
              src={
                currentChatRoom?.isGroupChat
                  ? currentChatRoom.groupIcon
                  : currentChat?.profile?.profilePic
              }
              alt="profile"
              className="w-full h-full object-cover"
            />
          </div>

          {!currentChatRoom?.isGroupChat && (
            <div className="absolute bottom-0 right-0 w-3 h-3 md:w-4 md:h-4 bg-green-500 rounded-full border-2 border-white"></div>
          )}
        </div>

        <div className="text-center">
          <h2 className="text-base md:text-lg font-semibold text-gray-800">
            {currentChatRoom?.isGroupChat
              ? currentChatRoom.name
              : currentChat?.userName}
          </h2>

          {!currentChatRoom?.isGroupChat && (
            <p className="text-xs md:text-sm text-gray-500">{currentChat?.email}</p>
          )}
        </div>

        {!currentChatRoom?.isGroupChat && (
          <div className="flex gap-2 mt-1 md:mt-2">
            <button className="w-8 h-8 md:w-9 md:h-9 rounded-full bg-white border border-gray-300 hover:bg-gray-100 transition flex items-center justify-center">
              <FontAwesomeIcon icon={faPhone} className="text-xs md:text-sm" />
            </button>
            <button className="w-8 h-8 md:w-9 md:h-9 rounded-full bg-white border border-gray-300 hover:bg-gray-100 transition flex items-center justify-center">
              <FontAwesomeIcon icon={faVideo} className="text-xs md:text-sm" />
            </button>
          </div>
        )}
      </div>

      {/* BIO / ABOUT */}
      {currentChatRoom?.isGroupChat ? (
        <div className="bg-white rounded-lg p-3 md:p-4 shadow-sm border border-gray-200">
          <p className="text-xs md:text-sm font-semibold text-gray-800 mb-2">About Group</p>
          <p className="text-xs md:text-sm text-gray-600 leading-relaxed mb-2 md:mb-3">
            {currentChatRoom?.description || 'No description added'}
          </p>
          <p className="text-[10px] md:text-xs text-gray-400">
            Created on{' '}
            {new Date(currentChatRoom?.createdAt).toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
              year: 'numeric'
            })}
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-lg p-3 md:p-4 shadow-sm border border-gray-200">
          <p className="text-xs md:text-sm font-semibold text-gray-800 mb-2">Bio</p>
          <p className="text-xs md:text-sm text-gray-600 leading-relaxed">
            {currentChat?.profile?.bio || 'No bio available'}
          </p>
        </div>
      )}

      {/* ADMIN ACTIONS */}
      {currentChatRoom?.isGroupChat && isAdmin && (
        <div className="space-y-2">
          <button
            onClick={() => setIsSearchNewMember(true)}
            className="w-full flex items-center justify-center gap-2 bg-anotherPrimary text-white py-2 md:py-2.5 rounded-md text-xs md:text-sm hover:opacity-90 transition font-medium"
          >
            <FontAwesomeIcon icon={faUserPlus} className="text-xs md:text-sm" />
            Add Member
          </button>

          <button
            onClick={() => setIsGroupInfoCardVisible(true)}
            className="w-full flex items-center justify-center gap-2 bg-white border border-anotherPrimary text-anotherPrimary py-2 md:py-2.5 rounded-md text-xs md:text-sm hover:bg-anotherPrimary hover:text-white transition font-medium"
          >
            <FontAwesomeIcon icon={faPen} className="text-xs md:text-sm" />
            Edit Group Info
          </button>
        </div>
      )}

      {/* MEMBERS - ADD SCROLL */}
      {currentChatRoom?.isGroupChat && (
        <div>
          <div className="flex items-center justify-between mb-2 md:mb-3">
            <p className="text-sm md:text-base font-semibold text-gray-800">Members</p>
            <span className="text-[10px] md:text-xs bg-gray-200 px-2 py-0.5 rounded-full text-gray-600">
              {currentChatRoom.members?.length || 0}
            </span>
          </div>

          {/* SCROLLABLE MEMBERS LIST */}
          <div className="max-h-60 md:max-h-80 overflow-y-auto space-y-1.5 scrollbar-thin scrollbar-thumb-gray-400 scrollbar-track-gray-100">
            {currentChatRoom.members?.map(member => {
              const isGroupAdmin = member._id === currentChatRoom.admin;
              const canRemove = isAdmin && !isGroupAdmin && member._id !== userId;

              return (
                <div
                  key={member._id}
                  className="group flex items-center justify-between p-2 rounded-md hover:bg-white transition"
                >
                  <div className="flex items-center gap-2 md:gap-2.5 flex-1 min-w-0">
                    <img
                      src={member.profile?.profilePic}
                      alt={member.userName}
                      className="w-7 h-7 md:w-8 md:h-8 rounded-full object-cover border border-gray-200 flex-shrink-0"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="text-xs md:text-sm font-medium text-gray-800 truncate">
                        {member.userName}
                      </p>
                      {isGroupAdmin && (
                        <p className="text-[10px] md:text-xs text-gray-500">Group Admin</p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-1 md:gap-2 flex-shrink-0">
                    {isGroupAdmin && (
                      <span className="text-[10px] md:text-xs px-1.5 md:px-2 py-0.5 rounded-full bg-anotherPrimary text-white">
                        Admin
                      </span>
                    )}

                    {canRemove && (
                      <button
                        onClick={() => {
                          setIsConfirmMemRemoval(true);
                          setSelectedMember(member);
                        }}
                        className="opacity-0 group-hover:opacity-100 transition text-red-500 hover:text-red-700 p-1"
                        title="Remove member"
                      >
                        <FontAwesomeIcon icon={faUserMinus} className="text-xs md:text-sm" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>

    {/* FIXED BOTTOM ACTIONS */}
    <div className="border-t border-gray-300 bg-gray-50 p-3 space-y-2 sticky bottom-0">
      {currentChatRoom?.isGroupChat ? (
        <>
          <button
            onClick={() => setIsConfirmExitGrp(true)}
            className="w-full flex items-center justify-center gap-2 border border-orange-400 text-orange-600 py-2 rounded-md text-xs md:text-sm hover:bg-orange-50 transition font-medium"
          >
            <FontAwesomeIcon icon={faRightFromBracket} className="text-xs md:text-sm" />
            Exit Group
          </button>

          {isAdmin && (
            <button
              onClick={() => setIsConfirmDltGrp(true)}
              className="w-full flex items-center justify-center gap-2 bg-red-600 text-white py-2 rounded-md text-xs md:text-sm hover:bg-red-700 transition font-medium"
            >
              <FontAwesomeIcon icon={faTrash} className="text-xs md:text-sm" />
              Delete Group
            </button>
          )}
        </>
      ) : (
        <>
          <button className="w-full flex items-center justify-center gap-2 bg-white border border-gray-300 text-gray-700 py-2 rounded-md text-xs md:text-sm hover:bg-gray-50 transition font-medium">
            <FontAwesomeIcon icon={faBell} className="text-xs md:text-sm" />
            Mute Notifications
          </button>

          <button className="w-full flex items-center justify-center gap-2 border border-red-400 text-red-600 py-2 rounded-md text-xs md:text-sm hover:bg-red-50 transition font-medium">
            <FontAwesomeIcon icon={faBan} className="text-xs md:text-sm" />
            Block User
          </button>
        </>
      )}
    </div>
  </div>
);
}

export default SideProfileSection;
