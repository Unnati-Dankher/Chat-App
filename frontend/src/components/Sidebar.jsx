import React, { useState, useEffect } from "react";
import { useChat } from "../context/ChatContext";
import { useAuth } from "../context/AuthContext";
import { useSocket } from "../context/SocketContext";
import api from "../services/api";
import { MessageSquare, Users, Settings, LogOut, Search, PlusCircle, X, User } from 'lucide-react';

const Sidebar = ({ setViewProfile }) => {
    const { chats, selectedChat, selectChat, startDirectChat, createGroupChat } = useChat();
    const { authUser, logout } = useAuth();
    const { onlineUsers } = useSocket();

    const [allUsers, setAllUsers] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [showGroupModal, setShowGroupModal] = useState(false);
    const [groupName, setGroupName] = useState('');
    const [selectedMembers, setSelectedMembers] = useState([]);

    useEffect(() => {
        const fetchUsers = async () => {
            try {
                const response = await api.get('/user');
                setAllUsers(response.data);
            } catch (error) {
                console.error('Error fetching users:', error);
            }
        };

        if (authUser) {
            fetchUsers();
        }
    }, [authUser]);

    const filteredUsers = allUsers.filter((u) =>
        u.username.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const toggleMemberSelection = (userId) => {
        setSelectedMembers((prevSelected) => {
            if (prevSelected.includes(userId)) {
                return prevSelected.filter((id) => id !== userId);
            } else {
                return [...prevSelected, userId];
            }
        })
    }

    const handleGroupCreate = async (e) => {
        e.preventDefault();
        if (groupName.trim() === '' || selectedMembers.length < 2) {
            alert('Please provide a group name and select at least 2 members.');
            return;
        }
        const res = await createGroupChat(groupName, selectedMembers);
        if (res.success) {
            setShowGroupModal(false);
            setGroupName('');
            setSelectedMembers([]);
        } else {
            alert(res.message);
        }
    }

    const getOtherParticipant = (chat) => {
        if (!chat.participants) return null;
        return chat.participants.find((p) => p._id !== authUser._id);
    }

    return (
        <div className="w-80 border-r border-slate-800 bg-slate-950 flex flex-col h-full shrink-0">
            {/* Header Info */}
            <div className="p-4 border-b border-slate-850 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center font-bold text-white shadow-md shadow-indigo-500/20">
                        💬
                    </div>
                    <div>
                        <h2 className="font-bold text-slate-100 text-sm">Infinity Room</h2>
                        <span className="text-slate-400 text-xs font-semibold">Real-time Space</span>
                    </div>
                </div>

                <button
                    onClick={() => setShowGroupModal(true)}
                    className="text-slate-400 hover:text-indigo-400 p-1.5 rounded-lg hover:bg-slate-800/50 cursor-pointer transition"
                    title="Create Group Chat"
                >
                    <PlusCircle className="w-5.5 h-5.5" />
                </button>
            </div>

            {/* Searching Pane */}
            <div className="p-3">
                <div className="relative">
                    <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search users or start chat..."
                        className="w-full pl-9 pr-4 py-2 rounded-xl text-xs text-slate-200 glass-input font-medium"
                    />
                </div>
            </div>

            {/* Users / Chats List Area */}
            <div className="flex-1 overflow-y-auto px-2 space-y-4">
                {searchQuery ? (
                    // Dynamic User search results to start direct conversation
                    <div>
                        <span className="text-[10px] uppercase font-bold tracking-wider text-slate-500 px-3 block mb-2">
                            Start Conversation
                        </span>
                        <div className="space-y-1">
                            {filteredUsers.length === 0 ? (
                                <p className="text-slate-500 text-xs px-3">No users match search query...</p>
                            ) : (
                                filteredUsers.map((u) => {
                                    const isOnline = onlineUsers.includes(u._id);
                                    return (
                                        <button
                                            key={u._id}
                                            onClick={() => {
                                                startDirectChat(u._id);
                                                setSearchQuery('');
                                            }}
                                            className="w-full flex items-center gap-3 p-2 rounded-xl hover:bg-slate-900/60 cursor-pointer text-left transition duration-200"
                                        >
                                            <div className="relative">
                                                {u.profilePic ? (
                                                    <img
                                                        src={u.profilePic}
                                                        alt={u.username}
                                                        className="w-10 h-10 rounded-xl object-cover"
                                                    />
                                                ) : (
                                                    <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center font-bold text-slate-400">
                                                        {u.username[0].toUpperCase()}
                                                    </div>
                                                )}
                                                {isOnline && (
                                                    <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 rounded-full border-2 border-slate-950 online-indicator-glow"></div>
                                                )}
                                            </div>
                                            <div className="truncate">
                                                <p className="text-xs font-semibold text-slate-200">{u.username}</p>
                                                <p className="text-[10px] text-slate-500 truncate">{u.bio}</p>
                                            </div>
                                        </button>
                                    );
                                })
                            )}
                        </div>
                    </div>
                ) : (
                    // Standard chats list
                    <div>
                        <span className="text-[10px] uppercase font-bold tracking-wider text-slate-500 px-3 block mb-2">
                            Conversations
                        </span>
                        <div className="space-y-1">
                            {chats.length === 0 ? (
                                <div className="text-center py-8 text-slate-500 text-xs">
                                    <p>No active chats yet.</p>
                                    <p className="mt-1">Search for a user to start chatting!</p>
                                </div>
                            ) : (
                                chats.map((chat) => {
                                    const otherParticipant = !chat.isGroupChat ? getOtherParticipant(chat) : null;
                                    const isOnline = otherParticipant ? onlineUsers.includes(otherParticipant._id) : false;

                                    const isSelected = selectedChat?._id === chat._id;
                                    const displayName = chat.isGroupChat ? chat.chatName : otherParticipant?.username || 'ChatRoom';
                                    const displayPic = chat.isGroupChat ? null : otherParticipant?.profilePic;

                                    return (
                                        <button
                                            key={chat._id}
                                            onClick={() => selectChat(chat)}
                                            className={`w-full flex items-center gap-3 p-2.5 rounded-xl text-left cursor-pointer transition duration-200 relative ${isSelected ? 'bg-indigo-600/15 border-l-3 border-indigo-500' : 'hover:bg-slate-900/40'
                                                }`}
                                        >
                                            <div className="relative">
                                                {chat.isGroupChat ? (
                                                    <div className="w-10 h-10 rounded-xl bg-indigo-900/60 text-indigo-300 flex items-center justify-center font-bold">
                                                        <Users className="w-5 h-5" />
                                                    </div>
                                                ) : displayPic ? (
                                                    <img
                                                        src={displayPic}
                                                        alt={displayName}
                                                        className="w-10 h-10 rounded-xl object-cover"
                                                    />
                                                ) : (
                                                    <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center font-bold text-slate-400">
                                                        {displayName[0]?.toUpperCase() || '?'}
                                                    </div>
                                                )}
                                                {isOnline && !chat.isGroupChat && (
                                                    <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 rounded-full border-2 border-slate-950 online-indicator-glow"></div>
                                                )}
                                            </div>

                                            <div className="flex-1 truncate">
                                                <div className="flex items-center justify-between">
                                                    <p className="text-xs font-semibold text-slate-200 truncate">{displayName}</p>
                                                    {chat.unread && !isSelected && (
                                                        <span className="w-2 h-2 bg-indigo-500 rounded-full shrink-0"></span>
                                                    )}
                                                </div>
                                                <p className="text-[10px] text-slate-400 truncate mt-0.5">
                                                    {chat.latestMessage ? (
                                                        <>
                                                            <span className="font-semibold text-slate-500">
                                                                {chat.latestMessage.sender._id === authUser._id ? 'You: ' : `${chat.latestMessage.sender.username}: `}
                                                            </span>
                                                            {chat.latestMessage.fileUrl ? '📂 Attachment' : chat.latestMessage.content}
                                                        </>
                                                    ) : (
                                                        'No messages yet'
                                                    )}
                                                </p>
                                            </div>
                                        </button>
                                    );
                                })
                            )}
                        </div>
                    </div>
                )}
            </div>

            {/* User Actions Bottom Footer Pane */}
            <div className="p-3 border-t border-slate-850 bg-slate-950 flex items-center justify-between">
                <button
                    onClick={() => setViewProfile(true)}
                    className="flex items-center gap-2.5 p-1 rounded-lg hover:bg-slate-900 cursor-pointer text-left group transition duration-200"
                >
                    {authUser.profilePic ? (
                        <img
                            src={authUser.profilePic}
                            alt="My Avatar"
                            className="w-8 h-8 rounded-lg object-cover"
                        />
                    ) : (
                        <div className="w-8 h-8 rounded-lg bg-slate-800 text-slate-400 flex items-center justify-center font-bold">
                            {authUser.username[0].toUpperCase()}
                        </div>
                    )}
                    <div className="w-28 truncate">
                        <p className="text-xs font-semibold text-slate-200 group-hover:text-indigo-400 transition">{authUser.username}</p>
                        <p className="text-[9px] text-slate-500 truncate font-mono">My Account</p>
                    </div>
                </button>

                <button
                    onClick={logout}
                    className="p-2 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-500/10 cursor-pointer transition duration-200"
                    title="Sign Out"
                >
                    <LogOut className="w-4.5 h-4.5" />
                </button>
            </div>

            {/* Group Creation Modals */}
            {showGroupModal && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                    <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-sm p-6 relative">
                        <button
                            onClick={() => {
                                setShowGroupModal(false);
                                setSelectedMembers([]);
                                setGroupName('');
                            }}
                            className="absolute right-4 top-4 text-slate-400 hover:text-slate-100 cursor-pointer"
                        >
                            <X className="w-5 h-5" />
                        </button>

                        <h3 className="text-sm font-bold text-slate-100 mb-4 flex items-center gap-2">
                            <Users className="w-5 h-5 text-indigo-400" /> Create Group Space
                        </h3>

                        <form onSubmit={handleGroupCreate} className="space-y-4">
                            <div>
                                <label className="block text-slate-400 text-[10px] font-semibold uppercase tracking-wider mb-1.5">
                                    Group Room Name
                                </label>
                                <input
                                    type="text"
                                    required
                                    value={groupName}
                                    onChange={(e) => setGroupName(e.target.value)}
                                    placeholder="e.g. Project Devs"
                                    className="w-full px-3 py-2 rounded-xl text-xs text-slate-200 glass-input font-medium"
                                />
                            </div>

                            <div>
                                <label className="block text-slate-400 text-[10px] font-semibold uppercase tracking-wider mb-1.5">
                                    Select Members (Min 2)
                                </label>
                                <div className="max-h-40 overflow-y-auto space-y-1 pr-1">
                                    {allUsers.map((u) => {
                                        const isSelected = selectedMembers.includes(u._id);
                                        return (
                                            <button
                                                type="button"
                                                key={u._id}
                                                onClick={() => toggleMemberSelection(u._id)}
                                                className={`w-full flex items-center justify-between p-2 rounded-xl text-left cursor-pointer transition select-none ${isSelected ? 'bg-indigo-600/20 text-indigo-400' : 'hover:bg-slate-800/40 text-slate-300'
                                                    }`}
                                            >
                                                <span className="text-xs font-semibold">{u.username}</span>
                                                {isSelected && <span className="w-2 h-2 bg-indigo-500 rounded-full"></span>}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            <button
                                type="submit"
                                className="w-full py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-semibold text-xs shadow-lg cursor-pointer"
                            >
                                Assemble Group
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

export default Sidebar;