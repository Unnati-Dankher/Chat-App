import React, { useEffect, useState, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useChat } from '../context/ChatContext';
import { useSocket } from '../context/SocketContext';
import { Send, Paperclip, X, Image, File, CheckCheck, Loader2 } from 'lucide-react';

const ChatWindow = () => {
    const { authUser } = useAuth();
    const { selectedChat, messages, isMessagesLoading, sendNewMessage, typingUsers } = useChat();
    const { socket, onlineUsers } = useSocket();

    const [text, setText] = useState('');
    const [selectedFile, setSelectedFile] = useState(null);
    const [filePreview, setFilePreview] = useState('');
    const [typingState, setTypingState] = useState(false);
    const typingTimeoutRef = useRef(null);
    const messageEndRef = useRef(null);

    const getOtherParticipant = () => {
        if (!selectedChat || selectedChat.isGroupChat) return null;
        return selectedChat.participants.find((p) => p._id !== authUser._id);
    };

    const otherParticipant = getOtherParticipant();
    const isOnline = otherParticipant ? onlineUsers.includes(otherParticipant._id) : false;

    const scrollToBottom = () => {
        messageEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }

    useEffect(() => {
        scrollToBottom();
    }, [messages, typingUsers]);

    const handleTextChange = (e) => {
        setText(e.target.value);

        if (!socket || !selectedChat) return;

        if (!typingState) {
            setTypingState(true);
            socket.emit('typing', selectedChat._id);
        }

        if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);

        typingTimeoutRef.current = setTimeout(() => {
            socket.emit('stopTyping', selectedChat._id);
            setTypingState(false);
        }, 2000)
    }

    const handleFileSelect = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        setSelectedFile(file);

        if (file.type.startsWith('image/')) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setFilePreview(reader.result);
            }
            reader.readAsDataURL(file);
        } else {
            setFilePreview('');
        }
    }

    const clearFileSelection = () => {
        setSelectedFile(null);
        setFilePreview('');
    }

    const handleSend = async (e) => {
        e.preventDefault();
        if (!text.trim() && !selectedFile) return;

        const content = text;
        const file = selectedFile;
        setText('');
        clearFileSelection();

        if (socket && selectedChat) {
            socket.emit('stopTyping', selectedChat._id);
            setTypingState(false);
        }

        await sendNewMessage(content, file);
    }

    const formatTime = (dateStr) => {
        const date = new Date(dateStr);
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }

    const isMessageReadByOther = (message) => {
        if (selectedChat.isGroupChat) return false;
        const recipient = otherParticipant;
        if (!recipient) return false;
        return message.readBy.some((r) => r.user === recipient._id || r.user._id === recipient._id);
    }

    const showTypingIndicator = typingUsers[selectedChat?._id];
    // const showTypingIndicator = selectedChat && typingUsers[selectedChat._id] && typingUsers[selectedChat._id].length > 0;

    if (!selectedChat) {
        return (
            <div className="flex-1 bg-slate-900/40 flex flex-col items-center justify-center p-6 text-center">
                <div className="w-16 h-16 bg-slate-800/50 rounded-2xl flex items-center justify-center text-slate-500 mb-4 text-2xl">
                    💬
                </div>
                <h3 className="text-sm font-bold text-slate-200">No active conversation</h3>
                <p className="text-slate-500 text-xs mt-1 max-w-xs">
                    Select or search for a user to establish a handshake connection and start chatting.
                </p>
            </div>
        );
    }

    return (
        <div className="flex-1 bg-slate-900/20 flex flex-col h-full relative">
            {/* Header Info */}
            <div className="p-4 border-b border-slate-850 bg-slate-950 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="relative">
                        {selectedChat.isGroupChat ? (
                            <div className="w-10 h-10 rounded-xl bg-indigo-900/60 text-indigo-300 flex items-center justify-center font-bold">
                                👥
                            </div>
                        ) : otherParticipant?.profilePic ? (
                            <img
                                src={otherParticipant.profilePic}
                                alt={otherParticipant.username}
                                className="w-10 h-10 rounded-xl object-cover"
                            />
                        ) : (
                            <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center font-bold text-slate-400">
                                {otherParticipant?.username?.[0]?.toUpperCase() || '?'}
                            </div>
                        )}

                        {isOnline && !selectedChat.isGroupChat && (
                            <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 rounded-full border-2 border-slate-950 online-indicator-glow"></div>
                        )}
                    </div>

                    <div>
                        <h3 className="text-sm font-bold text-slate-200">
                            {selectedChat.isGroupChat ? selectedChat.chatName : otherParticipant?.username}
                        </h3>
                        <span className="text-[10px] text-slate-400 mt-0.5 block">
                            {selectedChat.isGroupChat ? (
                                `Group space • ${selectedChat.participants?.length || 0} participants`
                            ) : isOnline ? (
                                <span className="text-emerald-400 font-semibold">Active online</span>
                            ) : (
                                'Offline'
                            )}
                        </span>
                    </div>
                </div>
            </div>

            {/* Messages Pane Workspace */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {isMessagesLoading ? (
                    <div className="flex items-center justify-center h-full">
                        <Loader2 className="w-6 h-6 text-indigo-500 animate-spin" />
                    </div>
                ) : messages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-slate-500 text-xs">
                        <p>Send a message to initiate discussion</p>
                    </div>
                ) : (
                    messages.map((m) => {
                        const senderId =
                            typeof m.sender === "object"
                                ? m.sender._id
                                : m.sender;

                        const isMe = String(senderId) === String(authUser._id);

                        const senderDetails =
                            typeof m.sender === "object"
                                ? m.sender
                                : null;

                        const isRead = isMessageReadByOther(m);

                        return (
                            <div
                                key={m._id}
                                className={`w-full flex ${isMe
                                        ? "justify-end"
                                        : "justify-start"
                                    }`}
                            >
                                <div
                                    className={`flex gap-3.5 max-w-[75%] ${isMe
                                            ? "flex-row-reverse"
                                            : "flex-row"
                                        }`}
                                >
                                    {/* Sender avatar - received group messages */}
                                    {!isMe && selectedChat.isGroupChat && (
                                        <div className="w-8 h-8 rounded-lg bg-slate-800 shrink-0 flex items-center justify-center font-bold text-slate-400 text-xs">
                                            {senderDetails?.username?.[0]?.toUpperCase() || "?"}
                                        </div>
                                    )}

                                    <div
                                        className={`flex flex-col ${isMe
                                                ? "items-end"
                                                : "items-start"
                                            }`}
                                    >
                                        {/* Sender name for group messages */}
                                        {selectedChat.isGroupChat &&
                                            !isMe &&
                                            senderDetails && (
                                                <span className="text-[9px] font-semibold text-slate-500 mb-1">
                                                    {senderDetails.username}
                                                </span>
                                            )}

                                        {/* Message bubble */}
                                        <div
                                            className={`rounded-2xl px-4 py-2.5 text-xs shadow-md ${isMe
                                                    ? "bg-gradient-to-br from-indigo-600 to-indigo-700 text-slate-50 border border-indigo-500/20 rounded-tr-none"
                                                    : "bg-slate-900 text-slate-200 border border-slate-800/80 rounded-tl-none"
                                                }`}
                                        >
                                            {/* Image / File */}
                                            {m.fileUrl && (
                                                <div className="mb-2 max-w-sm rounded-lg overflow-hidden">
                                                    {m.fileType === "image" ? (
                                                        <img
                                                            src={m.fileUrl}
                                                            alt="Attached Image"
                                                            className="max-h-60 w-full object-cover rounded-lg"
                                                        />
                                                    ) : (
                                                        <div className="bg-slate-950 p-2.5 rounded-lg flex items-center gap-2 border border-slate-800">
                                                            <File className="w-5 h-5 text-indigo-400" />

                                                            <div className="truncate text-[10px]">
                                                                <p className="font-semibold text-slate-300 truncate">
                                                                    Attachment
                                                                </p>

                                                                <a
                                                                    href={m.fileUrl}
                                                                    target="_blank"
                                                                    rel="noreferrer"
                                                                    className="text-indigo-400 hover:underline block mt-0.5"
                                                                >
                                                                    View File
                                                                </a>
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            )}

                                            {/* Text */}
                                            {m.content && (
                                                <p className="leading-relaxed break-words">
                                                    {m.content}
                                                </p>
                                            )}

                                            {/* Time + read status */}
                                            <div className="flex items-center justify-end gap-1 mt-1 text-[9px] text-slate-400/70 select-none">
                                                <span>
                                                    {formatTime(m.createdAt)}
                                                </span>

                                                {isMe &&
                                                    !selectedChat.isGroupChat && (
                                                        <CheckCheck
                                                            className={`w-3.5 h-3.5 ${isRead
                                                                    ? "text-blue-400"
                                                                    : "text-slate-400"
                                                                }`}
                                                        />
                                                    )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })
                )}

                <div ref={messageEndRef} />
            </div>

            {/* File preview block before sending */}
            {selectedFile && (
                <div className="p-3 border-t border-slate-850 bg-slate-950/60 flex items-center justify-between gap-3 text-xs">
                    <div className="flex items-center gap-2 truncate">
                        {filePreview ? (
                            <img src={filePreview} alt="upload preview" className="w-10 h-10 object-cover rounded-lg" />
                        ) : (
                            <div className="w-10 h-10 bg-slate-855 rounded-lg flex items-center justify-center">
                                <File className="w-5 h-5 text-indigo-400" />
                            </div>
                        )}
                        <div className="truncate">
                            <p className="font-semibold text-slate-200 text-[10px] truncate">{selectedFile.name}</p>
                            <p className="text-slate-500 text-[9px]">{(selectedFile.size / (1024 * 1024)).toFixed(2)} MB</p>
                        </div>
                    </div>

                    <button onClick={clearFileSelection} className="p-1 text-slate-400 hover:text-slate-200 cursor-pointer">
                        <X className="w-4 h-4" />
                    </button>
                </div>
            )}

            {/* Input Action Form */}
            <form onSubmit={handleSend} className="p-4 border-t border-slate-850 bg-slate-950 flex items-center gap-3">
                <label className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-indigo-400 cursor-pointer transition">
                    <Paperclip className="w-5 h-5" />
                    <input type="file" onChange={handleFileSelect} className="hidden" />
                </label>

                <input
                    type="text"
                    value={text}
                    onChange={handleTextChange}
                    placeholder="Write deep message..."
                    className="flex-1 px-4 py-2.5 rounded-xl text-xs text-slate-200 glass-input font-medium"
                />

                <button
                    type="submit"
                    disabled={!text.trim() && !selectedFile}
                    className="p-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white shadow-md shadow-indigo-600/20 active:scale-95 disabled:hover:bg-indigo-600 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition"
                >
                    <Send className="w-5 h-5" />
                </button>
            </form>
        </div>
    );
}

export default ChatWindow;
