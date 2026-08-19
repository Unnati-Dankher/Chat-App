import React, { createContext, useContext, useEffect, useState } from "react";
import api from "../services/api";
import { useSocket } from "./SocketContext";
import { useAuth } from "./AuthContext";

const ChatContext = createContext();

export const ChatProvider = ({ children }) => {
    const [chats, setChats] = useState([]);
    const [selectedChat, setSelectedChat] = useState(null);
    const [messages, setMessages] = useState([]);
    const [isChatsLoading, setIsChatsLoading] = useState(null);
    const [isMessagesLoading, setIsMessagesLoading] = useState(null);
    const [typingUsers, setTypingUsers] = useState({});
    const [activeTypers, setActiveTypers] = useState([]);

    const { socket } = useSocket();
    const { authUser } = useAuth();

    const getChats = async () => {
        setIsChatsLoading(true);
        try {
            const res = await api.get('/chat');
            setChats(res.data);
        } catch (error) {
            console.error('Failed to load chats:', error.message);
        } finally {
            setIsChatsLoading(false);
        }
    }

    const getMessages = async (chatId) => {
        setIsMessagesLoading(true);
        try {
            const res = await api.get(`/message/${chatId}`);
            setMessages(res.data);
            if (socket) {
                socket.emit('message read', { chatId, userId: authUser._id })
            }
        } catch (error) {
            console.error('Failed to load messages:', error.message);
        } finally {
            setIsMessagesLoading(false);
        }
    }

    const selectChat = (chat) => {
        setSelectedChat(chat);
        setMessages([]);
        setTypingUsers({});
        setActiveTypers([]);
        if (chat) {
            getMessages(chat._id);
            if (socket) {
                socket.emit('join chat', chat._id);
            }
        }
    }

    const sendNewMessage = async (content, file) => {
        if (!selectedChat) return;
        try {
            const formData = new FormData();
            formData.append('chatId', selectedChat._id);
            if (content) {
                formData.append('content', content);
            }
            if (file) {
                formData.append('file', file);
            }

            const res = await api.post('/message', formData);
            const savedMessage = res.data;

            setMessages((prev) => [...prev, savedMessage]);

            if (socket) {
                socket.emit('typing', selectedChat._id);
                socket.emit('new message notify', savedMessage);

                socket.to(selectedChat._id).emit('message received notification', savedMessage);
            }

            setChats((prevChats) => prevChats.map((c) => 
                c._id === selectedChat._id ? { ...c, latestMessage: savedMessage } : c
            ));

            return { success: true }
        } catch (error) {
            console.error('Failed to send message:', error.message);
            return { success: false, message: error.response?.data?.message || 'Failed to send' };
        }
    }

    const startDirectChat = async (userId) => {
        try {
            const res = await api.post('/chat', { userId });
            const chat = res.data;

            if (!chats.some((c) => c._id === chat._id)) {
                setChats((prev) => [chat, ...prev]);
            }
            selectChat(chat);
            return { success: true }
        } catch (error) {
            console.error('Failed to start direct chat:', error.message);
            return { success: false };
        }
    }

    const createGroupChat = async (chatName, participantIds) => {
        try {
            const res = await api.post('/chat/group', { chatName, participants: JSON.stringify(participantIds) });
            const newGroup = res.data;
            setChats((prev) => [newGroup, ...prev]);
            selectChat(newGroup);
            return { success: true }
        } catch (error) {
            console.error('Failed to create group:', error.message);
            return { success: false, message: error.response?.data?.message || 'Failed to create group' };
        }
    }

    useEffect(() => {
        if (!socket || !authUser) return;
        const handleIncomingMessage = (message) => {
            if (selectedChat && message.chat._id === selectedChat._id) {
                setMessages((prev) => {
                    if (prev.some((m) => m._id === message._id)) return prev;
                    return [...prev, message]
                })

                socket.emit('message read', { chatId: selectedChat._id, userId: authUser._id });
                api.get(`/message/${selectedChat._id}`);
            } else {
                setChats((prevChats) => prevChats.map((c) => {
                    if (c._id === message.chat._id) {
                        return { ...c, latestMessage: message, unread: true }
                    }
                    return c;
                }))
            }

            setChats((prevChats) => {
                const chatExists = prevChats.some((c) => c._id === message.chat._id);
                if (!chatExists) {
                    getChats();
                    return prevChats;
                }

                return prevChats.map((c) => c._id === message.chat._id ? { ...c, latestMessage: message } : c)
            })
        }

        const handleReadReceipt = ({ chatId, userId }) => {
            if (selectedChat && selectedChat._id === chatId) {
                setMessages((prevMessages) => prevMessages.map((m) => {
                    const alreadyRead = m.readBy.some((r) => r.user === userId || r.user._id === userId);
                    if (!alreadyRead) {
                        return {
                            ...m,
                            readBy: [...m.readBy, { readBy: userId, readAt: new Date() }]
                        }
                    }
                    return m;
                }))
            }
        }

        const handleTyping = (room) => {
            if (selectedChat && selectedChat._id === room) {
                setTypingUsers((prev) => ({ ...prev, [room]: true }))
            }
        }

        const handleStopTyping = (room) => {
            if (selectedChat && selectedChat._id === room) {
                setTypingUsers((prev) => ({ ...prev, [room]: false }))
            }
        }

        socket.on('message received notification', handleIncomingMessage);
        socket.on('message read', handleReadReceipt);
        socket.on('typing', handleTyping);
        socket.on('stop typing', handleStopTyping);

        return () => {
            socket.off('message received notification', handleIncomingMessage);
            socket.off('message read', handleReadReceipt);
            socket.off('typing', handleTyping);
            socket.off('stop typing', handleStopTyping);
        }

    }, [socket, selectedChat, authUser]);

    useEffect(() => {
        if (authUser) {
            getChats();
        } else {
            setChats([]);
            setSelectedChat(null);
            setMessages([]);
        }
    }, [authUser])

    return (
        <ChatContext.Provider value={{
            chats,
            selectedChat,
            messages,
            isChatsLoading,
            isMessagesLoading,
            typingUsers,
            getChats,
            selectChat,
            sendNewMessage,
            startDirectChat,
            createGroupChat,
        }}>
            {children}
        </ChatContext.Provider>
    )
}

export const useChat = () => {
    const context = useContext(ChatContext);
    if (!context) {
        throw new Error('useChat must be used within a ChatProvider')
    }
    return context;
}