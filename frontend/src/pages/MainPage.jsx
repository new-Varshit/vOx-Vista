import React from 'react';
import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/Api';
import { useDispatch } from 'react-redux';
import ChatListing from '../Components/ChatListing';
import ChatSection from '../Components/ChatSection';
import SideProfileSection from '../Components/SideProfileSection';
import ProfileCard from '../Components/ProfileCard';
import NewChatSearch from '../Components/NewChatSearch';
import { logIn, logOut } from '../store/authSlice';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTimes,faArrowLeft } from '@fortawesome/free-solid-svg-icons';
import { setCurrentChat } from '../store/chatSlice';
import { setCurrentChatRoom } from '../store/chatRoomSlice';
import useChatSocket from "../hooks/useChatSocket";
import { useSelector } from "react-redux";
import { getUserId } from '../utils/UserId';
import ProfileSkeleton from '../Components/ProfileSkeleton';
import MobileBottomNav from '../Components/MobileBottomNav';
import ProfileDetailsSection from '../Components/ProfileDetailsSection';





function MainPage() {

    const navigate = useNavigate();
    const dispatch = useDispatch();

    const [messages, setMessages] = useState([]);
    const [activeChatRooms, setActiveChatRooms] = useState([]);
    const [isSideProfileCard, setIsSideProfileCard] = useState(false);
    const [isProfileCardVisible, setisProfileCardVisible] = useState(false);
    const [isNewChatCardVisible, setIsNewChatCardVisible] = useState(false);
    const [isDelOptCardVisible, setIsDelOptCardVisible] = useState(false);
    const [profileData, setProfileData] = useState('');
    const [msgId, setMsgId] = useState(null);
    const [newMembers, setNewMembers] = useState([]);
    const [potentialMembers, setPotentialMembers] = useState([]);
    const [isSearchNewMember, setIsSearchNewMember] = useState(false);
    const [searchInput, setSearchInput] = useState('');
    const [isGroupInfoCardVisible, setIsGroupInfoCardVisible] = useState(false);
    const [groupPreviewIcon, setGroupPreviewIcon] = useState(null);
    const [groupName, setGroupName] = useState("");
    const [groupDescription, setGroupDescription] = useState("");
    const [groupPreviewIconFile, setGroupPreviewIconFile] = useState(null);
    const [isConfirmMemRemoval, setIsConfirmMemRemoval] = useState(false);
    const [selectedMember, setSelectedMember] = useState(null);
    const [isConfirmExitGrp, setIsConfirmExitGrp] = useState(false);
    const [accessMessage, setAccessMessage] = useState('');
    const [isConfirmDltGrp, setIsConfirmDltGrp] = useState(false);
    const [isProChatListLoading, setIsProChatListLoading] = useState(true);
    const [loadingAction, setLoadingAction] = useState(null);
    const [isMobileChatOpen, setIsMobileChatOpen] = useState(false);
    const [isProfileDetailsVisible, setIsProfileDetailsVisible] = useState(false);
    const [mobileActiveTab, setMobileActiveTab] = useState('chats');

    const fetchChatRoomsRef = useRef(null);

    const userId = getUserId();


    const currentChatRoom = useSelector(
        (state) => state.chatRoom.currentChatRoom
    );

    const currentChatRoomRef = useRef(currentChatRoom);

    useEffect(() => {
        currentChatRoomRef.current = currentChatRoom;
        setGroupName(currentChatRoom?.name || "");
        setGroupDescription(currentChatRoom?.description || "");
    }, [currentChatRoom]);

    const { socketRef, emitTyping, emitStopTyping, joinChatRoom,
        leavePersonalRoom } = useChatSocket({
            userId,
        });

    useEffect(() => {

        if (!socketRef.current) return;
        const socket = socketRef.current;

        const handleIncrementUnread = ({ chatRoomId, message }) => {
            setActiveChatRooms(prev =>
                prev.map(room => {
                    if (room._id !== chatRoomId) return room;

                    const isActive =
                        currentChatRoomRef.current?._id === chatRoomId;

                    return {
                        ...room,
                        lastMessage: message,
                        unreadMsgs: isActive
                            ? room?.unreadMsgs || 0   // no increment
                            : (room?.unreadMsgs || 0) + 1
                    };
                })
            );
        };
        socket.on("incrementUnread", handleIncrementUnread);
        return () => socket.off("incrementUnread", handleIncrementUnread);
    }, [socketRef.current]);


    useEffect(() => {

        if (!socketRef.current) return;
        const socket = socketRef.current;

        const handleGlobalDelivery = async (message) => {
            if (message?.sender?._id === userId) return;

            setActiveChatRooms(prev => {
                const index = prev.findIndex(
                    room => room._id === message.chatRoom._id
                );

                if (index === -1) return prev;

                const updatedRoom = prev[index];

                const newList = [...prev];
                newList.splice(index, 1);
                newList.unshift(updatedRoom);

                return newList;
            });


            socket.emit("ack-Delivered", {
                messageId: message?._id,
                senderId: message?.sender?._id,
                chatRoomId: message?.chatRoom?._id,
                isRead: currentChatRoomRef.current?._id === message?.chatRoom?._id
            });


        };


        const handleGlobalDeliveredUI = ({ messageId, senderId, deliveredtoId }) => {


            if (senderId !== userId) return;

            try {

                setMessages(prev =>
                    prev.map(msg => {
                        if (msg._id !== messageId) return msg;

                        if (msg.deliveredTo?.includes(deliveredtoId)) return msg;

                        return {
                            ...msg,
                            deliveredTo: [...(msg.deliveredTo || []), deliveredtoId],
                        };
                    })
                );

            } catch (err) {
                console.log(err);
            }
        }


        const handleBulkmsgDelivered = async ({ deliveredtoId }) => {
            if (deliveredtoId === userId) return;
            try {
                setMessages(prev =>
                    prev.map(msg => {
                        if (msg.deliveredTo?.includes(deliveredtoId)) return msg;
                        return {
                            ...msg,
                            deliveredTo: [...(msg.deliveredTo || []), deliveredtoId]
                        }
                    })
                )
            } catch (err) {
                console.log(err);
            }
        }

        const handleUnreadCountZero = async ({ chatRoomId, readerId }) => {
            if (readerId !== userId) return; // only me
            try {
                setActiveChatRooms(prev =>
                    prev.map(room =>
                        room._id === chatRoomId
                            ? { ...room, unreadMsgs: 0 }
                            : room
                    )
                );
            } catch (err) {
                console.log(err);
            }
        }

        const handleNewChatRoomAddition = ({ chatRoom }) => {
            try {

                setActiveChatRooms(prev => {
                    // 🔒 prevent duplicates
                    const alreadyExists = prev.some(room => room._id === chatRoom._id);
                    if (alreadyExists) return prev;

                    return [
                        {
                            ...chatRoom
                        },
                        ...prev // 👈 add to TOP
                    ];
                });
            } catch (err) {
                console.log(err);
            }
        };

        const handleNewGrpChatCreated = ({ groupChatRoom }) => {
            setActiveChatRooms(prev => {
                if (prev.some(m => m._id === groupChatRoom._id)) return prev;
                return [groupChatRoom, ...prev];
            });
        }

        const handleGrpAddition = ({ newGrpChat }) => {

            try {
                setActiveChatRooms(prev => {
                    // prevent duplicates
                    if (prev.some(room => room._id === newGrpChat._id)) return prev;

                    // add new group at the top
                    return [newGrpChat, ...prev];
                });
            } catch (err) {
                console.log(err);
            }
        };

        const handleMemberRemoved = ({ members, chatRoomId }) => {
            try {
                if (currentChatRoomRef.current?._id === chatRoomId) {
                    dispatch(
                        setCurrentChatRoom({
                            ...currentChatRoomRef.current,
                            members
                        })
                    );
                }
            } catch (err) {
                console.log(err);
            }
        }

        const handleRemovalFromGrp = ({ chatRoomId, message }) => {
            try {
                setActiveChatRooms(prev => {
                    return prev.filter(room => room._id !== chatRoomId)
                });

                if (currentChatRoomRef.current?._id === chatRoomId) {
                    dispatch(
                        setCurrentChatRoom({
                            ...currentChatRoomRef.current,
                            isAllowed: false
                        })
                    );
                    setAccessMessage(message);
                }
            } catch (err) {
                console.log(err);
            }
        }

        const handleGrpMembersUpdation = ({ chatRoomId, members }) => {
            try {
                // Update chat listing
                setActiveChatRooms(prev =>
                    prev.map(room =>
                        room._id === chatRoomId
                            ? { ...room, members }
                            : room
                    )
                );

                // If this group is currently open, update it in real time
                if (currentChatRoomRef.current?._id === chatRoomId) {
                    dispatch(
                        setCurrentChatRoom({
                            ...currentChatRoomRef.current,
                            members
                        })
                    );
                }
            } catch (err) {
                console.log(err);
            }
        };

        const handleGrpInfoEdited = ({ updatedGroup }) => {
            try {
                setActiveChatRooms(prev =>
                    prev.map(room =>
                        room._id === updatedGroup._id
                            ? {
                                ...room,              // keep unreadMsgs, lastMessage, etc.
                                ...updatedGroup       // overwrite name, icon, description, members
                            }
                            : room
                    )
                );

                if (currentChatRoomRef.current?._id === updatedGroup._id) {
                    dispatch(setCurrentChatRoom({
                        ...currentChatRoomRef.current,
                        ...updatedGroup
                    }));
                }
            } catch (err) {
                console.log(err);
            }
        };

        const handleMemberExitGrp = ({ chatRoomId, members, admin }) => {
            try {
                if (currentChatRoomRef.current._id !== chatRoomId) return;

                dispatch(setCurrentChatRoom({
                    ...currentChatRoomRef.current,
                    members,
                    admin
                }));
            } catch (err) {
                console.log(err);
            }
        };

        const handleYouExitGrp = ({ chatRoomId, message }) => {
            try {
                setActiveChatRooms(prev =>
                    prev.filter(room => room._id !== chatRoomId)
                );

                if (currentChatRoomRef.current._id !== chatRoomId) return;

                dispatch(setCurrentChatRoom({
                    ...currentChatRoomRef.current,
                    isAllowed: false
                }));

                setAccessMessage(message);
            } catch (err) {
                console.log(err);
            }
        };

        const handleGrpDeletion = ({ chatRoomId, message }) => {
            try {
                setActiveChatRooms(prev => prev.filter(room => room._id !== chatRoomId))
                if (currentChatRoomRef.current._id !== chatRoomId) return;
                dispatch(setCurrentChatRoom({
                    ...currentChatRoomRef.current,
                    isAllowed: false
                }))
                setAccessMessage(message);

            } catch (err) {
                console.log(err);
            }
        }


        socket.on("grpDeleted", handleGrpDeletion);
        socket.on("exitGrp", handleYouExitGrp);
        socket.on("memberExitGrp", handleMemberExitGrp);
        socket.on("removedFromGrp", handleRemovalFromGrp);
        socket.on("memberRemoved", handleMemberRemoved);
        socket.on("grpInfoEdited", handleGrpInfoEdited);
        socket.on("grpMembersUpdated", handleGrpMembersUpdation);
        socket.on("addedToGrp", handleGrpAddition);
        socket.on("newGrpChatCreated", handleNewGrpChatCreated);
        socket.on("newChatRoom", handleNewChatRoomAddition);
        socket.on("msgsRead", handleUnreadCountZero);
        socket.on("msgDeliveredBulk", handleBulkmsgDelivered);
        socket.on("receiveMessage", handleGlobalDelivery);
        socket.on("msgDelivered", handleGlobalDeliveredUI);
        return () => {
            socket.off("grpDeleted", handleGrpDeletion);
            socket.off("exitGrp", handleYouExitGrp);
            socket.off("memberExitGrp", handleMemberExitGrp);
            socket.off("removedFromGrp", handleRemovalFromGrp);
            socket.off("memberRemoved", handleMemberRemoved);
            socket.off("grpInfoEdited", handleGrpInfoEdited);
            socket.off("grpMembersUpdated", handleGrpMembersUpdation);
            socket.off("addedToGrp", handleGrpAddition);
            socket.off("newGrpChatCreated", handleNewGrpChatCreated);
            socket.off("newChatRoom", handleNewChatRoomAddition);
            socket.off("msgsRead", handleUnreadCountZero);
            socket.off("msgDeliveredBulk", handleBulkmsgDelivered);
            socket.off("receiveMessage", handleGlobalDelivery);
            socket.off("msgDelivered", handleGlobalDeliveredUI);
        }
    }, []);




    const profileCardToggle = () => {
        setisProfileCardVisible(!isProfileCardVisible);
    }

    const sideProfileCard = () => {
        setIsSideProfileCard(!isSideProfileCard);
    }

    const newChatCard = () => {
        setIsNewChatCardVisible(!isNewChatCardVisible);
    }

    const delOptCardToggle = (msgId) => {
        if (msgId) {
            setMsgId(msgId);
        }
        setIsDelOptCardVisible(true);
    }



    const checkSession = async () => {
        try {

            const response = await

                api.get('/api/auth/check-session', {
                    withCredentials: true
                })
            console.log('Session check response:', response);

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



    useEffect(() => {
        const loadAll = async () => {
            const start = Date.now();

            await Promise.all([
                checkSession(),
                fetchChatRoomsRef.current?.(), // call child's function
            ]);

            setIsProChatListLoading(false);
        };

        loadAll();
    }, []);


    const deleteSelectedMsg = async () => {
        try {
            const response = await api.post('/api/message/deleteSelectedMsgs', { selectedMsgs: [msgId] }, {
                withCredentials: true
            })
            if (response.data.success) {
                console.log('deleted your message for you only...');
                setIsDelOptCardVisible(false);
            }
        } catch (err) {
            console.log(err);
        }
    }

    const deleteMsgForEveryone = async () => {
        try {
            const response = await api.post(`/api/message/deleteMsgForEveryone/${msgId}`, null, {
                withCredentials: true
            })
            if (response.data.success) {
                console.log('deleted Your message for everyone...');
            }
        } catch (err) {
            console.log(err);
        }
    }


    const userLoggedOut = async () => {
        try {
            const response = await api.post('/api/auth/logout', null, {
                withCredentials: true
            })
            if (response.data.success) {
                dispatch(setCurrentChat(null));
                dispatch(setCurrentChatRoom(null));
                dispatch(logOut());
                navigate('/login');
            }
        } catch (err) {
            console.log(err)
        }
    }

    useEffect(() => {
        if (!searchInput.trim()) {
            setPotentialMembers([]);
            // setMessage('');
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
                            // setMessage('User not found');
                        }
                        setPotentialMembers(response.data.searchResult);
                    }
                } catch (err) {
                    console.log(err);
                }
            }
            searchQuery();
        }, 1000);
        return () => clearTimeout(timeoutId);

    }, [searchInput]);


    const toggleMember = (member) => {
        setNewMembers(prev => {
            if (prev.some(m => m._id === member._id)) {
                return prev.filter(m => m._id !== member._id);
            }
            return [...prev, member];
        });
    };

    const handleMemberSelection = async () => {
        try {
            setLoadingAction('addMem');
            const memberIds = newMembers.map(m => m._id);
            await api.post('/api/chatRoom/addMembers', {
                chatRoomId: currentChatRoom._id,
                members: memberIds
            },
                { withCredentials: true });

            setIsSearchNewMember(false);
            setNewMembers([]);

        } catch (err) {
            console.log(err);
        } finally {
            setLoadingAction(null);
        }
    }

    useEffect(() => {
        if (isSearchNewMember) {
            setSearchInput("");
            setPotentialMembers([]);
            setNewMembers([]);
        }
    }, [isSearchNewMember]);


    const filteredPotentialMembers = potentialMembers.filter(
        u => !currentChatRoom?.members?.some(m => m._id === u._id)
    );



    const handleGroupIconChange = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        setGroupPreviewIcon(URL.createObjectURL(file));
        setGroupPreviewIconFile(file);
    };


    const handleUpdateGroupInfo = async () => {
        try {
            setLoadingAction('UpdateGrp');
            const formData = new FormData();
            formData.append("chatRoomId", currentChatRoom._id);
            formData.append("name", groupName);
            formData.append("description", groupDescription);

            if (groupPreviewIconFile) {
                formData.append("groupIcon", groupPreviewIconFile);
            }

            const res = await api.post(
                "/api/chatRoom/groupInfoEdit",
                formData,
                {
                    withCredentials: true,
                    headers: {
                        "Content-Type": "multipart/form-data",
                    },
                }
            );

            if (res.data.success) {
                setIsGroupInfoCardVisible(false);
            }
        } catch (err) {
            console.log(err);
        } finally {
            setLoadingAction(null);
        }
    };



    const handleGroupInfoCleaner = () => {
        setGroupDescription(currentChatRoom?.description || "");
        setGroupName(currentChatRoom?.name || "");
        setGroupPreviewIcon(null);
    }
    const handleRemoveMember = async () => {
        try {
            setLoadingAction('removeMem');
            const res = await api.post(
                '/api/chatRoom/removeMember',
                {
                    member: selectedMember,
                    chatRoomId: currentChatRoomRef.current._id
                },
                { withCredentials: true }
            );

            if (res.data.success) {
                setIsConfirmMemRemoval(false);
            }
        } catch (err) {
            console.log(err);
        } finally {
            setLoadingAction(null);
        }
    };
    const handleExitGrp = async () => {
        try {
            setLoadingAction('exitGrp');
            const res = await api.post('/api/chatRoom/exitGrp', {
                chatRoomId: currentChatRoomRef.current._id
            }, {
                withCredentials: true
            });
            if (res.data.success) {
                setIsConfirmExitGrp(false);
                setIsSideProfileCard(false);
            }
        } catch (err) {
            console.log(err);
        } finally {
            setLoadingAction(null);
        }
    }

    const handleDeleteGrp = async () => {
        try {
            setLoadingAction('deleteGrp');
            const res = await api.post('/api/chatRoom/deleteGrp', {
                chatRoomId: currentChatRoomRef.current._id
            }, {
                withCredentials: true
            })
            if (res.data.success) {
                setIsConfirmDltGrp(false);
                setIsSideProfileCard(false);
            }
        } catch (err) {
            console.log(err);
        } finally {
            setLoadingAction(null);
        }
    }


    const [dots, setDots] = useState(".");

    useEffect(() => {
        if (!loadingAction) return;

        const id = setInterval(() => {
            setDots(prev => (prev.length === 3 ? "." : prev + "."));
        }, 400);

        return () => clearInterval(id);
    }, [loadingAction]);



   return (
    <>
        <div className="h-screen flex overflow-hidden bg-gray-100">

            {/* ==================== LEFT SIDEBAR ==================== */}
            <div className={`flex flex-col w-full md:w-1/3 lg:w-1/4 ${isMobileChatOpen ? 'hidden md:flex' : 'flex'} relative overflow-hidden`}>

                {/* DESKTOP PROFILE SECTION - Hidden on Mobile */}
                <div className="hidden md:block m-2 relative">
                    <div className={`transition-opacity duration-300 ${isProChatListLoading ? "opacity-0" : "opacity-100"} p-5 bg-gray-200 flex flex-col gap-5 rounded-tl-2xl`}>
                        <p className="font-bold text-blue-800 text-2xl text-center font-serif">vox-Vista</p>

                        <div className="flex justify-between">
                            <div className="flex gap-4 justify-start items-center">
                                <div className="w-[72px] h-[72px] rounded-full overflow-hidden border-2 border-gray-300 shadow-md flex-shrink-0">
                                    {profileData?.profile?.profilePic && (
                                        <img
                                            src={profileData.profile.profilePic}
                                            alt="Profile"
                                            className="w-full h-full object-cover rounded-full"
                                        />
                                    )}
                                </div>

                                <div>
                                    <p className="text-anotherPrimary font-bold">
                                        {profileData?.userName || "\u00A0"}
                                    </p>
                                    <p className="text-font text-sm">
                                        {profileData?.email || "\u00A0"}
                                    </p>
                                </div>
                            </div>

                            <div onClick={profileCardToggle}>
                                <svg className="w-5 mt-2 cursor-pointer" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
                                    <path d="M441 58.9L453.1 71c9.4 9.4 9.4 24.6 0 33.9L424 134.1 377.9 88 407 58.9c9.4-9.4 24.6-9.4 33.9 0zM209.8 256.2L344 121.9 390.1 168 255.8 302.2c-2.9 2.9-6.5 5-10.4 6.1l-58.5 16.7 16.7-58.5c1.1-3.9 3.2-7.5 6.1-10.4zM373.1 25L175.8 222.2c-8.7 8.7-15 19.4-18.3 31.1l-28.6 100c-2.4 8.4-.1 17.4 6.1 23.6s15.2 8.5 23.6 6.1l100-28.6c11.8-3.4 22.5-9.7 31.1-18.3L487 138.9c28.1-28.1 28.1-73.7 0-101.8L474.9 25C446.8-3.1 401.2-3.1 373.1 25zM88 64C39.4 64 0 103.4 0 152L0 424c0 48.6 39.4 88 88 88l272 0c48.6 0 88-39.4 88-88l0-112c0-13.3-10.7-24-24-24s-24 10.7-24 24l0 112c0 22.1-17.9 40-40 40L88 464c-22.1 0-40-17.9-40-40l0-272c0-22.1 17.9-40 40-40l112 0c13.3 0 24-10.7 24-24s-10.7-24-24-24L88 64z" />
                                </svg>
                            </div>
                        </div>

                        <div className="flex justify-evenly">
                            <button className="bg-anotherPrimary rounded-md text-sm font-semibold py-1 text-white w-2/5 hover:bg-blue-700 transition">
                                Delete
                            </button>
                            <button onClick={userLoggedOut} className="bg-anotherPrimary rounded-md text-sm font-semibold py-1 text-white w-2/5 hover:bg-blue-700 transition">
                                Logout
                            </button>
                        </div>
                    </div>

                    {isProChatListLoading && (
                        <div className={`absolute inset-0 z-10 transition-opacity duration-300 ${isProChatListLoading ? "opacity-100" : "opacity-0 pointer-events-none"}`}>
                            <ProfileSkeleton />
                        </div>
                    )}
                </div>

                {/* MOBILE: SLIDING SECTIONS */}
                <div className="md:hidden flex-1 flex relative">
                    
                    {/* Chat Listing Section */}
                    <div className={`absolute inset-0 transition-transform duration-300 ease-in-out ${
                        mobileActiveTab === 'chats' 
                            ? 'translate-x-0' 
                            : '-translate-x-full'
                    }`}>
                        <div className='h-full overflow-auto bg-gray-200 m-2 rounded-2xl pb-20'>
                            <ChatListing 
                                setIsMobileChatOpen={setIsMobileChatOpen}
                                registerFetch={fetchChatRoomsRef}
                                isProChatListLoading={isProChatListLoading}
                                setIsProChatListLoading={setIsProChatListLoading}
                                newChatCard={newChatCard}
                                setActiveChatRooms={setActiveChatRooms}
                                activeChatRooms={activeChatRooms}
                            />
                        </div>
                    </div>

                    {/* Profile Details Section */}
                    <div className={`absolute inset-0 transition-transform duration-300 ease-in-out ${
                        mobileActiveTab === 'profile'
                            ? 'translate-x-0'
                            : mobileActiveTab === 'chats'
                                ? 'translate-x-full'
                                : '-translate-x-full'
                    }`}>
                        <div className='h-full m-2 rounded-2xl overflow-hidden pb-20'>
                            <ProfileDetailsSection
                                profileData={profileData}
                                userLoggedOut={userLoggedOut}
                                setMobileActiveTab={setMobileActiveTab}
                                profileCardToggle={profileCardToggle}
                            />
                        </div>
                    </div>

                    {/* Settings Section */}
                    <div className={`absolute inset-0 transition-transform duration-300 ease-in-out ${
                        mobileActiveTab === 'settings'
                            ? 'translate-x-0'
                            : 'translate-x-full'
                    }`}>
                        <div className='h-full m-2 rounded-2xl overflow-hidden pb-20 bg-gray-200'>
                            <div className='flex flex-col h-full'>
                                <div className='flex items-center gap-4 p-4 bg-gradient-to-r from-anotherPrimary to-blue-600 rounded-t-2xl'>
                                    <button onClick={() => setMobileActiveTab('chats')}>
                                        <FontAwesomeIcon icon={faArrowLeft} className='text-white text-xl' />
                                    </button>
                                    <h2 className='text-white font-bold text-lg'>Settings</h2>
                                </div>
                                <div className='flex-1 overflow-y-auto p-4'>
                                    <p className='text-gray-600 text-center mt-20 text-sm'>Settings coming soon...</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* DESKTOP CHAT LISTING */}
                <div className='hidden md:block flex-1 overflow-auto bg-gray-200 m-2 rounded-bl-2xl mt-0'>
                    <ChatListing 
                        setIsMobileChatOpen={setIsMobileChatOpen}
                        registerFetch={fetchChatRoomsRef}
                        isProChatListLoading={isProChatListLoading}
                        setIsProChatListLoading={setIsProChatListLoading}
                        newChatCard={newChatCard}
                        setActiveChatRooms={setActiveChatRooms}
                        activeChatRooms={activeChatRooms}
                    />
                </div>
            </div>

            {/* ==================== CHAT SECTION ==================== */}
            <div className={`flex flex-col w-full md:flex-1 min-h-0 h-full ${isMobileChatOpen ? 'flex' : 'hidden md:flex'} ${isSideProfileCard ? 'lg:w-1/2' : 'lg:w-3/4'}`}>
                <ChatSection
                    isMobileChatOpen={isMobileChatOpen}
                    setIsMobileChatOpen={setIsMobileChatOpen}
                    accessMessage={accessMessage}
                    setActiveChatRooms={setActiveChatRooms}
                    socketRef={socketRef}
                    emitTyping={emitTyping}
                    emitStopTyping={emitStopTyping}
                    joinChatRoom={joinChatRoom}
                    leavePersonalRoom={leavePersonalRoom}
                    sideProfileCard={sideProfileCard}
                    isSideProfileCard={isSideProfileCard}
                    delOptCardToggle={delOptCardToggle}
                    messages={messages}
                    setMessages={setMessages}
                />
            </div>

            {/* ==================== SIDE PROFILE SECTION ==================== */}
            {isSideProfileCard && (
                <>
                    {/* Desktop: right column */}
                    <div className="hidden lg:block w-1/4">
                        <SideProfileSection
                            setIsSearchNewMember={setIsSearchNewMember}
                            setIsGroupInfoCardVisible={setIsGroupInfoCardVisible}
                            setSelectedMember={setSelectedMember}
                            setIsConfirmMemRemoval={setIsConfirmMemRemoval}
                            setIsConfirmExitGrp={setIsConfirmExitGrp}
                            setIsConfirmDltGrp={setIsConfirmDltGrp}
                            setIsSideProfileCard={setIsSideProfileCard}
                        />
                    </div>

                    {/* Mobile/Tablet: slide-over */}
                    <div
                        className="lg:hidden fixed inset-0 z-40 bg-black/30"
                        onClick={() => setIsSideProfileCard(false)}
                    >
                        <div
                            className="absolute right-0 top-0 h-full w-[92vw] max-w-md bg-white shadow-2xl"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <SideProfileSection
                                setIsSearchNewMember={setIsSearchNewMember}
                                setIsGroupInfoCardVisible={setIsGroupInfoCardVisible}
                                setSelectedMember={setSelectedMember}
                                setIsConfirmMemRemoval={setIsConfirmMemRemoval}
                                setIsConfirmExitGrp={setIsConfirmExitGrp}
                                setIsConfirmDltGrp={setIsConfirmDltGrp}
                                setIsSideProfileCard={setIsSideProfileCard}
                            />
                        </div>
                    </div>
                </>
            )}

            {/* ==================== MODALS ==================== */}
            
            {/* Profile Update Card */}
            {isProfileCardVisible && (
                <ProfileCard 
                    profileCardToggle={profileCardToggle} 
                    profileData={profileData}
                    setMobileActiveTab={setMobileActiveTab}
                />
            )}

            {/* New Chat Search */}
            {isNewChatCardVisible && (
                <NewChatSearch newChatCard={newChatCard} />
            )}

            {/* Delete Message Options */}
            {isDelOptCardVisible && (
                <div className='h-screen w-full z-10 absolute bg-transparent backdrop-blur-md flex justify-center items-center' onClick={() => setIsDelOptCardVisible(false)}>
                    <div className='w-[92vw] max-w-sm py-6 px-6 bg-gray-200 flex flex-col rounded-xl' onClick={(e) => e.stopPropagation()}>
                        <div className='flex justify-end'>
                            <FontAwesomeIcon icon={faTimes} className='text-lg text-anotherPrimary cursor-pointer' onClick={() => setIsDelOptCardVisible(false)} />
                        </div>
                        <div className='flex flex-col gap-4'>
                            <p className='text-2xl font-bold text-center'>
                                Delete Message?
                            </p>
                            <div className='flex flex-col gap-3 justify-evenly items-center'>
                                <button className='w-3/4 p-1 py-2 font-medium hover:bg-white hover:text-anotherPrimary bg-anotherPrimary text-white text-sm rounded-lg' onClick={deleteSelectedMsg}>Delete for me</button>
                                <button className='w-3/4 p-1 py-2 font-medium hover:bg-white hover:text-anotherPrimary text-white bg-anotherPrimary text-sm rounded-lg' onClick={deleteMsgForEveryone}>Delete for everyone</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Add New Members */}
            {isSearchNewMember && (
                <div
                    className="fixed inset-0 z-50 bg-black/30 flex items-center justify-center"
                    onClick={() => {
                        setIsSearchNewMember(false);
                        setPotentialMembers([]);
                        setNewMembers([]);
                    }}
                >
                    <div
                        className="w-[92vw] max-w-md py-6 px-5 bg-gray-200 rounded-xl shadow-xl flex flex-col gap-4"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <h3 className="text-lg font-bold text-center text-anotherPrimary">
                            Add Members
                        </h3>
                        <input
                            className="rounded-full py-2 px-4 text-sm w-full focus:outline-none text-gray-700"
                            type="text"
                            placeholder="Search email or username"
                            onChange={(e) => setSearchInput(e.target.value)}
                        />

                        {newMembers.length > 0 && (
                            <div className="flex flex-wrap gap-2">
                                {newMembers.map(mem => (
                                    <span
                                        key={mem._id}
                                        className="px-3 py-1 bg-anotherPrimary text-white text-xs rounded-full"
                                    >
                                        {mem.userName}
                                    </span>
                                ))}
                            </div>
                        )}

                        <div className="max-h-56 overflow-y-auto flex flex-col gap-2">
                            {filteredPotentialMembers.map((potMem) => {
                                const isSelected = newMembers.some(m => m._id === potMem._id);

                                return (
                                    <div
                                        key={potMem._id}
                                        onClick={() => toggleMember(potMem)}
                                        className={`flex items-center gap-3 p-2 rounded-lg cursor-pointer ${isSelected ? "bg-anotherPrimary text-white" : "bg-white"}`}
                                    >
                                        <img
                                            src={potMem.profile?.profilePic}
                                            className="w-8 h-8 rounded-full object-cover"
                                        />
                                        <div className="flex flex-col">
                                            <span className="text-sm font-medium">{potMem.userName}</span>
                                            <span className="text-xs text-gray-500">{potMem.email}</span>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        {newMembers.length > 0 && (
                            <div className="flex justify-end gap-3 pt-2">
                                <button
                                    className="px-4 py-1 rounded-md border border-anotherPrimary text-anotherPrimary"
                                    onClick={() => {
                                        setIsSearchNewMember(false);
                                        setPotentialMembers([]);
                                        setNewMembers([]);
                                    }}
                                >
                                    Cancel
                                </button>

                                <button
                                    disabled={newMembers.length === 0 || loadingAction === 'addMem'}
                                    className={`px-4 py-1 rounded-md text-white ${newMembers.length === 0 ? "bg-gray-400 cursor-not-allowed" : "bg-anotherPrimary"}`}
                                    onClick={handleMemberSelection}
                                >
                                    {loadingAction === 'addMem' ? `Adding${dots}` : 'Add'}
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Edit Group Info */}
            {isGroupInfoCardVisible && (
                <div className="fixed inset-0 z-50 bg-black/30 flex items-center justify-center">
                    <div className="w-[92vw] max-w-lg bg-gray-200 rounded-xl shadow-xl p-6 flex flex-col gap-5">
                        <div className="flex justify-between items-center">
                            <h3 className="text-lg font-bold text-anotherPrimary">
                                Edit Group Info
                            </h3>
                            <button
                                onClick={() => { setIsGroupInfoCardVisible(false); handleGroupInfoCleaner(); }}
                                className="text-anotherPrimary hover:text-blue-900 text-xl"
                            >
                                ✕
                            </button>
                        </div>

                        <div className="flex flex-col items-center gap-2">
                            <div className="w-24 h-24 rounded-full overflow-hidden border-2 border-anotherPrimary">
                                <img
                                    src={groupPreviewIcon || currentChatRoom?.groupIcon}
                                    className="w-full h-full object-cover"
                                />
                            </div>
                            <label className="text-sm text-anotherPrimary cursor-pointer font-medium">
                                Change Icon
                                <input
                                    type="file"
                                    accept="image/*"
                                    className="hidden"
                                    onChange={handleGroupIconChange}
                                />
                            </label>
                        </div>

                        <div className="flex flex-col gap-1">
                            <label className="text-sm font-medium text-gray-700">
                                Group Name
                            </label>
                            <input
                                type="text"
                                value={groupName}
                                onChange={(e) => setGroupName(e.target.value)}
                                className="rounded-lg px-3 py-2 text-sm focus:outline-none"
                                placeholder="Enter group name"
                            />
                        </div>

                        <div className="flex flex-col gap-1">
                            <label className="text-sm font-medium text-gray-700">
                                Description
                            </label>
                            <textarea
                                value={groupDescription}
                                onChange={(e) => setGroupDescription(e.target.value)}
                                rows={3}
                                className="rounded-lg px-3 py-2 text-sm focus:outline-none resize-none"
                                placeholder="Write something about the group..."
                            />
                        </div>

                        <div className="flex justify-end gap-3 pt-2">
                            <button
                                onClick={() => { setIsGroupInfoCardVisible(false); handleGroupInfoCleaner() }}
                                className="px-4 py-1 rounded-md border border-anotherPrimary text-anotherPrimary"
                            >
                                Cancel
                            </button>
                            <button 
                                disabled={loadingAction === 'updateGrp'}
                                onClick={handleUpdateGroupInfo}
                                className="px-4 py-1 rounded-md bg-anotherPrimary text-white"
                            >
                                {loadingAction === 'updateGrp' ? `Saving${dots}` : 'Save'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Remove Member / Exit Group Confirmation */}
            {(isConfirmMemRemoval || isConfirmExitGrp) && (
                <div className="fixed inset-0 z-50 bg-black/30 flex items-center justify-center">
                    <div className="w-[92vw] max-w-sm bg-gray-200 rounded-xl shadow-xl p-5 flex flex-col gap-4">
                        <h3 className="text-lg font-bold text-center text-anotherPrimary">
                            {isConfirmMemRemoval ? "Remove Member" : "Exit Group"}
                        </h3>

                        <p className="text-sm text-gray-700 text-center">
                            {isConfirmMemRemoval
                                ? `Are you sure you want to remove "${selectedMember?.userName}" from this group?`
                                : "Are you sure you want to exit the group?"}
                        </p>

                        <div className="flex justify-center gap-3 pt-2">
                            <button
                                className="px-4 py-1 rounded-md border border-anotherPrimary text-anotherPrimary"
                                onClick={isConfirmMemRemoval ? () => setIsConfirmMemRemoval(false) : () => setIsConfirmExitGrp(false)}
                            >
                                Cancel
                            </button>

                            <button 
                                disabled={loadingAction === 'removeMem' || loadingAction === 'exitGrp'}
                                className="px-4 py-1 rounded-md bg-red-500 text-white hover:bg-red-600"
                                onClick={isConfirmMemRemoval ? handleRemoveMember : handleExitGrp}
                            >
                                {isConfirmMemRemoval ? (loadingAction === 'removeMem' ? `Removing${dots}` : 'Remove') : (loadingAction === 'exitGrp' ? `Exiting${dots}` : 'Exit')}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Delete Group Confirmation */}
            {isConfirmDltGrp && (
                <div className="fixed inset-0 z-50 bg-black/30 flex items-center justify-center">
                    <div className="w-[92vw] max-w-sm bg-gray-200 rounded-xl shadow-xl p-5 flex flex-col gap-4">
                        <h3 className="text-lg font-bold text-center text-anotherPrimary">
                            Delete Group
                        </h3>

                        <p className="text-sm text-gray-700 text-center">
                            Are you sure you want to delete this group?
                        </p>

                        <div className="flex justify-center gap-3 pt-2">
                            <button
                                className="px-4 py-1 rounded-md border border-anotherPrimary text-anotherPrimary"
                                onClick={() => setIsConfirmDltGrp(false)}
                            >
                                Cancel
                            </button>

                            <button 
                                disabled={loadingAction === 'deleteGrp'}
                                className="px-4 py-1 rounded-md bg-red-500 text-white hover:bg-red-600"
                                onClick={handleDeleteGrp}
                            >
                                {loadingAction === 'deleteGrp' ? `Deleting${dots}` : 'Delete'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ==================== MOBILE BOTTOM NAV ==================== */}
            {!isMobileChatOpen && (
                <MobileBottomNav
                    activeTab={mobileActiveTab}
                    setActiveTab={setMobileActiveTab}
                />
            )}
        </div>
    </>
)
}

export default MainPage