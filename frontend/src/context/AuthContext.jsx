import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [authUser, setAuthUser] = useState(null);
    const [isCheckingAuth, setIsCheckingAuth] = useState(true);
    const [isLoggingIn, setIsLoggingIn] = useState(false);
    const [isSigningUp, setIsSigningUp] = useState(false);
    const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);

    const checkAuth = async () => {
        const accessToken = localStorage.getItem('accessToken');

        if (!accessToken) {
            setAuthUser(null);
            setIsCheckingAuth(false);
            return;
        }
        try {
            const res = await api.get('/auth/check');
            setAuthUser(res.data)
        } catch (error) {
            console.warn(`User not Authenticated :`, error.response?.data?.message || error.message)
            localStorage.removeItem('accessToken');
            localStorage.removeItem("refreshToken");
            setAuthUser(null)
        } finally {
            setIsCheckingAuth(false);
        }
    }

    useEffect(() => {
        checkAuth();
    }, [])

    const signup = async (username, email, password) => {
        setIsSigningUp(true);
        try {
            const res = await api.post('/auth/signup', { username, email, password });
            localStorage.setItem(
                'accessToken',
                res.data.accessToken
            );
            localStorage.setItem(
                'refreshToken',
                res.data.refreshToken
            );
            setAuthUser(res.data.user);
            return { success: true }
        } catch (error) {
            return {
                success: false,
                message: error.response?.data?.message || 'Error occured during signup'
            }
        } finally {
            setIsSigningUp(false)
        }
    }

    const login = async (email, password) => {
        setIsLoggingIn(true);
        try {
            const res = await api.post('/auth/login', { email, password });
            localStorage.setItem('accessToken', res.data.accessToken);
            localStorage.setItem(
                'refreshToken',
                res.data.refreshToken
            );
            setAuthUser(res.data.user)
            return { success: true }
        } catch (error) {
            return {
                success: false,
                message: error.response?.data?.message || 'Invalid credentials'
            }
        } finally {
            setIsLoggingIn(false);
        }
    }

    const logout = async () => {
        try {
            const res = await api.post('/auth/logout');
        } catch (error) {
            console.error(
                "Logout failed:",
                error.response?.data || error.message
            );
        } finally {
            localStorage.removeItem('accessToken');
            localStorage.removeItem("refreshToken");
            setAuthUser(null);
        }
        return { success: true };
    }

    const updateProfile = async (formData) => {
        setIsUpdatingProfile(true);
        try {
            const res = await api.put('/user/update-profile', formData);
            setAuthUser(res.data);
            return { success: true }
        } catch (error) {
            return {
                success: false,
                message: error.response?.data?.message || 'Failed to update profile',
            };
        } finally {
            setIsUpdatingProfile(false);
        }
    }

    return (
        <AuthContext.Provider value={{
            authUser,
            isCheckingAuth,
            isLoggingIn,
            isSigningUp,
            isUpdatingProfile,
            signup,
            login,
            logout,
            updateProfile
        }}>
            {children}
        </AuthContext.Provider>
    )
}

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};