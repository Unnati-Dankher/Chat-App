import React, {
    useContext,
    createContext,
    useEffect,
    useState,
} from "react";

import { io } from "socket.io-client";
import { useAuth } from "./AuthContext";

const SocketContext = createContext();

export const SocketProvider = ({ children }) => {
    const [socket, setSocket] = useState(null);
    const [onlineUsers, setOnlineUsers] = useState([]);

    const { authUser } = useAuth();

    useEffect(() => {
        // User logged out
        if (!authUser) {
            setSocket(null);
            setOnlineUsers([]);
            return;
        }

        // User logged in
        const newSocket = io(import.meta.env.VITE_SOCKET_URL, {
            query: {
                userId: authUser._id,
            },
        });

        setSocket(newSocket);

        newSocket.on("getOnlineUser", (users) => {
            setOnlineUsers(users);
        });

        return () => {
            newSocket.close();
            setSocket(null);
            setOnlineUsers([]);
        };
    }, [authUser]);

    return (
        <SocketContext.Provider
            value={{
                socket,
                onlineUsers,
            }}
        >
            {children}
        </SocketContext.Provider>
    );
};

export const useSocket = () => {
    const context = useContext(SocketContext);

    if (!context) {
        throw new Error(
            "useSocket must be used within a SocketProvider"
        );
    }

    return context;
};