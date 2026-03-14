
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { X, Camera, Save, Globe, ChevronRight, ChevronLeft, Palette, Lock, Eye, EyeOff } from 'lucide-react';
import { translations, Language } from '../utils/translations';
import { ThemeKey, THEMES, Theme } from '../utils/themes';
import { UserProfile, ChatSocket } from '../services/ChatSocket';

interface SettingsModalProps {
  profile: UserProfile;
  isOpen: boolean;
  onClose: () => void;
  onSave: (profile: UserProfile) => void;
  lang: Language;
  onSetLang: (lang: Language) => void;
  currentTheme: ThemeKey;
  onSetTheme: (theme: ThemeKey) => void;
  socket: ChatSocket | null;
  onLogout: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ 
    profile, isOpen, onClose, onSave, lang, onSetLang, currentTheme, onSetTheme, socket, onLogout 
}) => {
  const [formData, setFormData] = useState(profile);
  const [view, setView] = useState<'main' | 'privacy'>('main');
  const t = translations[lang];
  const theme = THEMES[currentTheme];
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  useEffect(() => {
    setFormData(profile);
    if (isOpen) setView('main');
  }, [profile, isOpen]);

  useEffect(() => {
      if (!socket) return;
      
      const unsubscribe = socket.subscribe((data: any) => {
          if (data.type === 'UPDATE_ERROR') {
              alert(data.message);
              // Revert username if error
              setFormData(prev => ({ ...prev, username: profile.username }));
          } else if (data.type === 'USER_UPDATED' && data.profile.id === profile.id) {
              onClose();
          }
      });
      return () => { unsubscribe(); };
  }, [socket, profile]);

  const handleSave = () => {
      if (socket && socket.isConnected()) {
          socket.updateProfile(formData);
      } else {
          alert(t.connectionError || "You are offline. Cannot update profile.");
          // Do not close, let user retry
      }
  };

  const handleAvatarClick = () => {
      fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
          const reader = new FileReader();
          reader.onloadend = () => {
              setFormData(prev => ({ ...prev, avatar: reader.result as string }));
          };
          reader.readAsDataURL(file);
      }
  };

  const handleExportSession = () => {
      const sessionData = {
          profile: formData,
          accounts: JSON.parse(localStorage.getItem('redgram_accounts') || '[]')
      };
      const blob = new Blob([JSON.stringify(sessionData)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${formData.username || 'user'}.session`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
  };

  const handleImportSession = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
          const reader = new FileReader();
          reader.onload = (event) => {
              try {
                  const content = event.target?.result as string;
                  const sessionData = JSON.parse(content);
                  if (sessionData.profile && sessionData.accounts) {
                      localStorage.setItem('redgram_registration', JSON.stringify(sessionData.profile));
                      localStorage.setItem('redgram_accounts', JSON.stringify(sessionData.accounts));
                      window.location.reload();
                  } else {
                      alert('Invalid session file format.');
                  }
              } catch (err) {
                  alert('Error reading session file.');
              }
          };
          reader.readAsText(file);
      }
  };

  if (!isOpen) return null;

  const handlePrivacyChange = (field: keyof NonNullable<UserProfile['privacy']>, val: 'everybody' | 'nobody') => {
      setFormData(prev => ({
          ...prev,
          privacy: { ...prev.privacy, [field]: val } as any
      }));
  };

  const PrivacyControl = ({ 
      label, 
      description, 
      value, 
      onChange 
  }: { 
      label: string, 
      description: string, 
      value?: 'everybody' | 'nobody', 
      onChange: (val: 'everybody' | 'nobody') => void 
  }) => (
    <>
      <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
            <span className="text-[15px] text-gray-900 font-medium">{label}</span>
      </div>
      <div className="flex bg-gray-50/50">
        <button 
            onClick={() => onChange('everybody')}
            className={`flex-1 py-3 text-[13px] font-medium transition-colors ${value !== 'nobody' ? `${theme.textHighlight} bg-white shadow-sm font-bold` : 'text-gray-400 hover:bg-gray-100'}`}
        >
            {t.everybody}
        </button>
            <div className="w-px bg-gray-200"></div>
        <button 
            onClick={() => onChange('nobody')}
            className={`flex-1 py-3 text-[13px] font-medium transition-colors ${value === 'nobody' ? `${theme.textHighlight} bg-white shadow-sm font-bold` : 'text-gray-400 hover:bg-gray-100'}`}
        >
            {t.nobody}
        </button>
      </div>
      <div className="px-4 py-2 bg-gray-50 border-t border-gray-100 border-b border-gray-200/60 last:border-b-0">
            <p className="text-[11px] text-gray-400 leading-tight">
            {description}
            </p>
      </div>
    </>
  );

  return (
    <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-sm p-0 sm:p-4 animate-in fade-in duration-200">
      
      {/* iOS Sheet / Card */}
      <div className="bg-[#f2f2f7] rounded-t-[20px] sm:rounded-3xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col animate-ios-slide-up max-h-[95vh] h-[85vh] sm:h-auto">
        
        {/* Header */}
        <div className="bg-white/80 backdrop-blur-md px-4 flex justify-between items-center border-b border-gray-200 sticky top-0 z-10 h-[56px] shrink-0">
            {view === 'main' ? (
                <button onClick={onClose} className={`font-medium text-[17px] hover:opacity-70 transition-opacity ${theme.textHighlight}`}>
                    {t.cancel}
                </button>
            ) : (
                <button onClick={() => setView('main')} className={`font-medium text-[17px] hover:opacity-70 transition-opacity ${theme.textHighlight} flex items-center gap-0.5 -ml-1`}>
                    <ChevronLeft size={24} /> {t.settings}
                </button>
            )}
            
            <h2 className="text-[17px] font-bold text-gray-900 absolute left-1/2 -translate-x-1/2 pointer-events-none">
                {view === 'main' ? t.settings : t.privacy}
            </h2>
            
            {/* Show Done only on main view to encourage going back to confirm context, or allow it everywhere if desired. Keeping main for simplicity/UX patterns */}
            {view === 'main' ? (
                <button 
                    onClick={handleSave}
                    className={`font-bold text-[17px] hover:opacity-70 transition-opacity ${theme.textHighlight}`}
                >
                    Done
                </button>
            ) : (
                <div className="w-12"></div>
            )}
        </div>

        {/* Content */}
        <div className="p-0 pb-8 flex flex-col gap-6 overflow-y-auto custom-scrollbar flex-1 relative">
            
            {view === 'main' ? (
                <div className="flex flex-col gap-6 animate-in slide-in-from-left-4 duration-300">
                    
                    {/* Avatar Section */}
                    <div className="flex flex-col items-center mt-8 mb-2">
                        <div className="relative group cursor-pointer" onClick={handleAvatarClick}>
                            <div className={`w-24 h-24 rounded-full ${formData.avatarColor} flex items-center justify-center text-3xl font-bold text-white shadow-lg ring-4 ring-white overflow-hidden`}>
                                {formData.avatar ? (
                                    <img src={formData.avatar} alt="Avatar" className="w-full h-full object-cover" />
                                ) : (
                                    formData.name.substring(0, 1).toUpperCase()
                                )}
                            </div>
                            {/* Privacy Overlay Preview */}
                            {formData.privacy?.profilePhoto === 'nobody' && (
                                <div className="absolute inset-0 bg-black/60 rounded-full flex items-center justify-center backdrop-blur-[2px]">
                                    <EyeOff size={32} className="text-white opacity-80" />
                                </div>
                            )}

                            <div className="absolute inset-0 bg-black/20 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                <Camera size={28} className="text-white drop-shadow-md" />
                            </div>
                            <div className={`absolute bottom-0 right-0 ${theme.primary} rounded-full p-1.5 border-2 border-white text-white`}>
                                <Camera size={14} />
                            </div>
                            <input 
                                type="file" 
                                ref={fileInputRef} 
                                className="hidden" 
                                accept="image/*"
                                onChange={handleFileChange}
                            />
                        </div>
                        <button onClick={handleAvatarClick} className={`text-[15px] font-medium mt-3 hover:underline ${theme.textHighlight}`}>
                            {t.changePhoto}
                        </button>
                    </div>

                    {/* Form Fields (Grouped) */}
                    <div className="px-4">
                        <div className="bg-white rounded-xl overflow-hidden border border-gray-200/60 shadow-sm">
                            <div className="flex items-center px-4 py-3 border-b border-gray-100">
                                <span className="w-24 text-[15px] text-gray-900 font-medium">{t.displayName}</span>
                                <input 
                                    type="text" 
                                    value={formData.name}
                                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                                    className="flex-1 text-[15px] text-gray-900 outline-none placeholder-gray-400 bg-transparent"
                                    placeholder="John Doe"
                                />
                            </div>
                            <div className="flex items-center px-4 py-3 border-b border-gray-100">
                                <span className="w-24 text-[15px] text-gray-900 font-medium">{t.username}</span>
                                <span className="text-gray-400 mr-1">@</span>
                                <input 
                                    type="text" 
                                    value={formData.username}
                                    onChange={(e) => setFormData({...formData, username: e.target.value.replace(/\s/g, '')})}
                                    className="flex-1 text-[15px] text-gray-900 outline-none placeholder-gray-400 bg-transparent"
                                />
                            </div>
                            <div className="flex items-start px-4 py-3">
                                <span className="w-24 text-[15px] text-gray-900 font-medium pt-0.5">{t.bio}</span>
                                <textarea 
                                    value={formData.bio}
                                    onChange={(e) => setFormData({...formData, bio: e.target.value})}
                                    className="flex-1 text-[15px] text-gray-900 outline-none placeholder-gray-400 bg-transparent resize-none min-h-[60px]"
                                    placeholder="Add a few words about yourself..."
                                />
                            </div>
                        </div>
                    </div>

                    <div className="px-4">
                        <div className="bg-white rounded-xl overflow-hidden border border-gray-200/60 shadow-sm">
                            <div className="flex items-center px-4 py-3">
                                <span className="w-24 text-[15px] text-gray-900 font-medium">{t.phone}</span>
                                <input 
                                    type="text" 
                                    value={formData.phone}
                                    onChange={(e) => setFormData({...formData, phone: e.target.value})}
                                    className={`flex-1 text-[15px] outline-none placeholder-gray-400 bg-transparent font-medium ${theme.textHighlight}`}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Navigation Row for Privacy */}
                    <div className="px-4">
                        <div className="bg-white rounded-xl overflow-hidden border border-gray-200/60 shadow-sm">
                            <button 
                                onClick={() => setView('privacy')}
                                className="w-full flex items-center justify-between px-4 py-3 hover:bg-gray-50 transition-colors active:bg-gray-100"
                            >
                                <div className="flex items-center gap-3">
                                    <div className={`w-7 h-7 rounded-md bg-gray-400 flex items-center justify-center text-white`}>
                                        <Lock size={16} fill="currentColor" />
                                    </div>
                                    <span className="text-[15px] font-medium text-gray-900">{t.privacy}</span>
                                </div>
                                <ChevronRight size={16} className="text-gray-400" />
                            </button>
                        </div>
                    </div>

                    {/* Appearance Section */}
                    <div className="px-4 pb-8">
                        <div className="text-[12px] text-gray-400 uppercase tracking-wide mb-1.5 ml-4">
                            {t.appearance}
                        </div>
                        <div className="bg-white rounded-xl overflow-hidden border border-gray-200/60 shadow-sm p-2 flex flex-wrap gap-2">
                            {Object.values(THEMES).map((th) => (
                                <button
                                    key={th.id}
                                    onClick={() => onSetTheme(th.id)}
                                    className={`flex-1 min-w-[80px] py-2 rounded-lg text-[13px] font-bold transition-all border flex flex-col items-center gap-1 ${currentTheme === th.id ? `bg-gray-50 border-gray-200 text-gray-900` : 'border-transparent text-gray-400 hover:bg-gray-50'}`}
                                >
                                    <div className={`w-6 h-6 rounded-full ${th.primary} shadow-sm`}></div>
                                    <span className={currentTheme === th.id ? th.textHighlight : ''}>
                                        {th.id === 'red' ? t.themeRed : th.id === 'blue' ? t.themeBlue : th.id === 'black' ? t.themeBlack : t.themeBrown}
                                    </span>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Language Switcher */}
                    <div className="px-4 pb-8">
                        <div className="bg-white rounded-xl overflow-hidden border border-gray-200/60 shadow-sm p-1 flex">
                            <button 
                                onClick={() => onSetLang('en')}
                                className={`flex-1 py-1.5 rounded-lg text-[13px] font-bold transition-all ${lang === 'en' ? 'bg-white shadow-sm ring-1 ring-black/5 text-black' : 'text-gray-400 hover:bg-gray-50'}`}
                            >
                                English
                            </button>
                            <button 
                                onClick={() => onSetLang('ru')}
                                className={`flex-1 py-1.5 rounded-lg text-[13px] font-bold transition-all ${lang === 'ru' ? 'bg-white shadow-sm ring-1 ring-black/5 text-black' : 'text-gray-400 hover:bg-gray-50'}`}
                            >
                                Русский
                            </button>
                        </div>
                    </div>

                    {/* Session Management */}
                    <div className="px-4 pb-8">
                        <div className="text-[12px] text-gray-400 uppercase tracking-wide mb-1.5 ml-4">
                            Session Management
                        </div>
                        <div className="bg-white rounded-xl overflow-hidden border border-gray-200/60 shadow-sm flex flex-col">
                            <button 
                                onClick={handleExportSession}
                                className="w-full flex items-center justify-between px-4 py-3 hover:bg-gray-50 transition-colors active:bg-gray-100 border-b border-gray-100"
                            >
                                <span className="text-[15px] font-medium text-gray-900">Export Session (.session)</span>
                                <Save size={16} className="text-gray-400" />
                            </button>
                            <button 
                                onClick={() => document.getElementById('import-session-input')?.click()}
                                className="w-full flex items-center justify-between px-4 py-3 hover:bg-gray-50 transition-colors active:bg-gray-100"
                            >
                                <span className="text-[15px] font-medium text-gray-900">Import Session (.session)</span>
                                <input 
                                    type="file" 
                                    id="import-session-input" 
                                    accept=".session" 
                                    className="hidden" 
                                    onChange={handleImportSession} 
                                />
                            </button>
                        </div>
                        <div className="text-center mt-4">
                            <button 
                                onClick={() => {
                                    onLogout();
                                    onClose();
                                }}
                                className={`text-[15px] font-medium ${theme.textHighlight}`}
                            >
                                Log Out
                            </button>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="px-4 pt-6 animate-in slide-in-from-right-10 duration-300">
                    <p className="text-[13px] text-gray-500 mb-4 px-2 uppercase tracking-wide">
                        Security Settings
                    </p>
                    <div className="bg-white rounded-xl overflow-hidden border border-gray-200/60 shadow-sm">
                        <PrivacyControl 
                            label={t.profilePhoto}
                            description={t.whoCanSeePhoto}
                            value={formData.privacy?.profilePhoto}
                            onChange={(val) => handlePrivacyChange('profilePhoto', val)}
                        />
                        <PrivacyControl 
                            label={t.phoneNumber}
                            description={t.whoCanSeePhone}
                            value={formData.privacy?.phoneNumber}
                            onChange={(val) => handlePrivacyChange('phoneNumber', val)}
                        />
                            <PrivacyControl 
                            label={t.lastSeenTitle}
                            description={t.whoCanSeeLastSeen}
                            value={formData.privacy?.lastSeen}
                            onChange={(val) => handlePrivacyChange('lastSeen', val)}
                        />
                        <PrivacyControl 
                            label={t.stories}
                            description={t.whoCanSeeStories}
                            value={formData.privacy?.stories}
                            onChange={(val) => handlePrivacyChange('stories', val)}
                        />
                    </div>
                </div>
            )}

        </div>

      </div>
    </div>
  );
};
