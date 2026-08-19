import React, { useState, useEffect } from 'react';
import {useAuth} from '../context/AuthContext';
import { Camera, User, Mail, FileText, ArrowLeft, Loader2 } from 'lucide-react';

const ProfileView = ({setViewProfile}) => {
    const { authUser, updateProfile, isUpdatingProfile } = useAuth();
    const [bioText, setBioText] = useState(authUser.bio || '');
    const [statusMsg, setStatusMsg] = useState({ text: '', success: true });

    const handleFileChange = async (event) => {
        const file = event.target.files[0];
        if(!file) return;
         
        if(file.size > 5 * 1024 * 1024) { 
            setStatusMsg({ text: 'File size exceeds 5MB limit.', success: false });
            return;
        }

        const formData = new FormData();
        formData.append('profilePic', file);

        const res = await updateProfile(formData);
        if(res.success) {
            setStatusMsg({ text: 'Profile picture updated successfully!', success: true });
        } else {
            setStatusMsg({ text: res.message || 'Failed to update profile picture.', success: false });
        }
    }

    const handleBioSave = async (event) => {
        event.preventDefault();
        setStatusMsg({ text: '', success: null });

        const formData = new FormData();
        formData.append('bio', bioText);

        const res = await updateProfile(formData);
        if(res.success) {
            setStatusMsg({ text: 'Bio updated successfully!', success: true });
        } else {
            setStatusMsg({ text: res.message || 'Failed to update bio.', success: false });
        }
    }

   return (
    <div className="flex-1 bg-slate-950 flex flex-col justify-center items-center p-6 min-h-screen relative overflow-hidden">
      {/* Visual background decorations */}
      <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-600/5 rounded-full blur-3xl"></div>
      <div className="absolute bottom-0 left-0 w-80 h-80 bg-violet-600/5 rounded-full blur-3xl"></div>

      <div className="w-full max-w-md glass-panel rounded-2xl p-6 relative z-10 shadow-2xl">
        {/* Back button */}
        <button
          onClick={() => setViewProfile(false)}
          className="flex items-center gap-2 text-slate-400 hover:text-slate-200 text-xs font-semibold mb-6 group cursor-pointer transition"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition" /> Back to Chats
        </button>

        <h2 className="text-xl font-bold text-slate-100 mb-2">My Profile</h2>
        <p className="text-slate-400 text-xs mb-8">Personalize your avatar and status</p>

        {/* Status Prompt */}
        {statusMsg.text && (
          <div
            className={`mb-6 p-3 rounded-xl border text-xs font-medium text-center ${
              statusMsg.success
                ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-300'
                : 'bg-red-500/10 border-red-500/20 text-red-300'
            }`}
          >
            {statusMsg.text}
          </div>
        )}

        {/* Avatar Upload block */}
        <div className="flex flex-col items-center gap-4 mb-8">
          <div className="relative group">
            {authUser.profilePic ? (
              <img
                src={authUser.profilePic}
                alt="My Avatar"
                className="w-28 h-28 rounded-2xl object-cover border-2 border-indigo-600/30"
              />
            ) : (
              <div className="w-28 h-28 rounded-2xl bg-slate-800 border-2 border-dashed border-slate-750 flex items-center justify-center font-bold text-slate-400 text-2xl">
                {authUser.username[0].toUpperCase()}
              </div>
            )}

            {/* Hidden Input file picker */}
            <label className="absolute inset-0 flex items-center justify-center bg-black/60 rounded-2xl opacity-0 group-hover:opacity-100 transition cursor-pointer">
              {isUpdatingProfile ? (
                <Loader2 className="w-6 h-6 text-white animate-spin" />
              ) : (
                <Camera className="w-6 h-6 text-white" />
              )}
              <input
                type="file"
                name="profilePic"
                accept="image/*"
                onChange={handleFileChange}
                disabled={isUpdatingProfile}
                className="hidden"
              />
            </label>
          </div>
          <span className="text-[10px] text-slate-500 font-medium">
            Click photo to upload new picture (PNG/JPG up to 5MB)
          </span>
        </div>

        {/* Form Details */}
        <form onSubmit={handleBioSave} className="space-y-5">
          <div>
            <label className="block text-slate-400 text-[10px] font-semibold uppercase tracking-wider mb-2">
              username
            </label>
            <div className="relative">
              <User className="absolute left-3 top-2.5 w-4.5 h-4.5 text-slate-500" />
              <input
                type="text"
                disabled
                value={authUser.username}
                className="w-full pl-10 pr-4 py-2 rounded-xl text-slate-400 text-xs bg-slate-900 border border-slate-850 cursor-not-allowed font-medium"
              />
            </div>
          </div>

          <div>
            <label className="block text-slate-400 text-[10px] font-semibold uppercase tracking-wider mb-2">
              email address
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-2.5 w-4.5 h-4.5 text-slate-500" />
              <input
                type="text"
                disabled
                value={authUser.email}
                className="w-full pl-10 pr-4 py-2 rounded-xl text-slate-400 text-xs bg-slate-900 border border-slate-850 cursor-not-allowed font-medium"
              />
            </div>
          </div>

          <div>
            <label className="block text-slate-400 text-[10px] font-semibold uppercase tracking-wider mb-2">
              bio status
            </label>
            <div className="relative">
              <FileText className="absolute left-3 top-2.5 w-4.5 h-4.5 text-slate-500" />
              <input
                type="text"
                value={bioText}
                onChange={(e) => setBioText(e.target.value)}
                placeholder="Let people know what you are up to..."
                maxLength={80}
                className="w-full pl-10 pr-4 py-2 rounded-xl text-slate-200 text-xs glass-input font-medium"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isUpdatingProfile}
            className="w-full py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-semibold text-xs shadow-lg active:scale-[0.98] transition cursor-pointer"
          >
            {isUpdatingProfile ? 'Saving...' : 'Update Profile Info'}
          </button>
        </form>
      </div>
    </div>
  );
}

export default ProfileView;