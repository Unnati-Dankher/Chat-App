import React, { useState } from "react";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { SocketProvider } from "./context/SocketContext";
import { ChatProvider } from "./context/ChatContext";
import AuthLayout from "./components/AuthLayout";
import Sidebar from "./components/Sidebar";
import ChatWindow from "./components/ChatWindow";
import ProfileView from "./components/ProfileView";
import { Loader2 } from "lucide-react";

const Dashboard = () => {
    const [viewProfile, setViewProfile] = useState(false);

    return (
        <div className="flex h-screen bg-slate-950 text-slate-100 overflow-hidden relative font-sans">
            <Sidebar setViewProfile={setViewProfile} />

            {viewProfile ? (
                <ProfileView setViewProfile={setViewProfile} />
            ) : (
                <ChatWindow />
            )}
        </div>
    );
}

const MainContent = () => {
    const { authUser, isCheckingAuth } = useAuth();

    if (isCheckingAuth) {
        return (
            <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4">
                {/* Glow behind loader */}
                <div className="absolute w-60 h-60 bg-indigo-600/10 rounded-full blur-3xl"></div>
                <div className="flex flex-col items-center relative z-10">
                    <Loader2 className="w-10 h-10 text-indigo-500 animate-spin mb-4" />
                    <h2 className="text-slate-350 text-xs font-semibold tracking-widest uppercase">
                        Securing handshake connection...
                    </h2>
                </div>
            </div>
        );
    }

    return authUser ? <Dashboard /> : <AuthLayout />;
}

const App = () => {
    return (
        <AuthProvider>
            <SocketProvider>
                <ChatProvider>
                    <MainContent />
                </ChatProvider>
            </SocketProvider>
        </AuthProvider>
    )
}

export default App;