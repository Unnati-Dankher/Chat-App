import React, { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { Mail, Lock, User, MessageCircle, AlertCircle } from 'lucide-react';

const AuthLayout = () => {
    const [isLogin, setIsLogin] = useState(true);
    const [formData, setFormData] = useState({ username: '', email: '', password: '' });
    const [errorMsg, setErrorMsg] = useState('');

    const { login, signup, isLoggingIn, isSigningUp } = useAuth();

    const handleInputChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
        setErrorMsg('');
    }

    const handleSubmit = async (e) => {
        e.preventDefault();
        setErrorMsg('');

        if (isLogin) {
            const res = await login(formData.email, formData.password);
            if (!res.success) {
                setErrorMsg(res.message);
            }
        } else {
            if (!formData.username) {
                setErrorMsg('Username is required');
                return;
            }
            const res = await signup(formData.username, formData.email, formData.password);
            if (!res.success) {
                setErrorMsg(res.message);
            }
        }
    }

    return (
        <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4 relative overflow-hidden">
            {/* Decorative Glow Dots */}
            <div className="absolute top-20 left-10 w-72 h-72 bg-indigo-600/10 rounded-full blur-3xl"></div>
            <div className="absolute bottom-20 right-10 w-96 h-96 bg-violet-600/10 rounded-full blur-3xl"></div>

            <div className="w-full max-w-md glass-panel rounded-2xl p-8 relative z-10 shadow-2xl">
                {/* Title Logo Group */}
                <div className="flex flex-col items-center mb-8">
                    <div className="w-14 h-14 bg-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-500/30 mb-3 animate-pulse">
                        <MessageCircle className="w-8 h-8 text-white" />
                    </div>
                    <h1 className="text-2xl font-bold bg-gradient-to-r from-indigo-400 via-purple-300 to-indigo-300 bg-clip-text text-transparent">
                        Infinity Chat
                    </h1>
                    <p className="text-slate-400 text-sm mt-1">
                        {isLogin ? 'Sign in to access your dashboard' : 'Join a premium chat community'}
                    </p>
                </div>

                {/* Form Error Banner */}
                {errorMsg && (
                    <div className="mb-6 bg-red-500/15 border border-red-500/30 rounded-xl p-3 flex items-start gap-2.5 text-red-300 text-sm">
                        <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                        <span>{errorMsg}</span>
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-5">
                    {!isLogin && (
                        <div>
                            <label className="block text-slate-300 text-xs font-semibold uppercase tracking-wider mb-2">
                                username
                            </label>
                            <div className="relative">
                                <User className="absolute left-3.5 top-3 w-5 h-5 text-slate-500" />
                                <input
                                    type="text"
                                    name="username"
                                    value={formData.username}
                                    onChange={handleInputChange}
                                    placeholder="john_doe"
                                    className="w-full pl-11 pr-4 py-2.5 rounded-xl text-slate-200 text-sm glass-input font-medium"
                                />
                            </div>
                        </div>
                    )}

                    <div>
                        <label className="block text-slate-300 text-xs font-semibold uppercase tracking-wider mb-2">
                            email address
                        </label>
                        <div className="relative">
                            <Mail className="absolute left-3.5 top-3 w-5 h-5 text-slate-500" />
                            <input
                                type="email"
                                name="email"
                                required
                                value={formData.email}
                                onChange={handleInputChange}
                                placeholder="you@example.com"
                                className="w-full pl-11 pr-4 py-2.5 rounded-xl text-slate-200 text-sm glass-input font-medium"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-slate-300 text-xs font-semibold uppercase tracking-wider mb-2">
                            password
                        </label>
                        <div className="relative">
                            <Lock className="absolute left-3.5 top-3 w-5 h-5 text-slate-500" />
                            <input
                                type="password"
                                name="password"
                                required
                                value={formData.password}
                                onChange={handleInputChange}
                                placeholder="••••••••"
                                className="w-full pl-11 pr-4 py-2.5 rounded-xl text-slate-200 text-sm glass-input font-medium"
                            />
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={isLoggingIn || isSigningUp}
                        className="w-full py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-semibold text-sm shadow-xl shadow-indigo-600/20 active:scale-[0.98] transition duration-200 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isLoggingIn || isSigningUp ? (
                            <span className="flex items-center justify-center gap-2">
                                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                                Processing...
                            </span>
                        ) : isLogin ? (
                            'Sign In'
                        ) : (
                            'Create Account'
                        )}
                    </button>
                </form>

                {/* Toggle Option */}
                <div className="mt-8 text-center">
                    <p className="text-slate-400 text-sm">
                        {isLogin ? "Don't have an account? " : 'Already registered? '}
                        <button
                            onClick={() => {
                                setIsLogin(!isLogin);
                                setErrorMsg('');
                            }}
                            className="text-indigo-400 font-bold hover:underline ml-1 cursor-pointer"
                        >
                            {isLogin ? 'Sign Up' : 'Log In'}
                        </button>
                    </p>
                </div>
            </div>
        </div>
    );
}

export default AuthLayout;