
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { X, Bell, BellOff, Info, Phone, AtSign, Trash2, Archive, Ban, UserPlus, Edit2, Check, ChevronRight, Camera, Copy, Star } from 'lucide-react';
import { ChatPreview, UserProfile } from '../services/ChatSocket';
import { translations, Language } from '../utils/translations';
import { Theme } from '../utils/themes';
import { ContactPickerModal } from './ContactPickerModal';

interface ProfilePanelProps {
  chat: ChatPreview;
  onClose: () => void;
  isArchived?: boolean;
  onToggleArchive?: () => void;
  onDelete?: () => void;
  onToggleMute?: () => void;
  onUpdateGroup?: (chatId: string, updates: Partial<ChatPreview>) => void;
  onAddMember?: (contactId: string) => void;
  lang: Language;
  theme: Theme;
  contacts?: ChatPreview[]; // For picking
  accounts?: UserProfile[];
}

export const ProfilePanel: React.FC<ProfilePanelProps> = ({ 
    chat, 
    onClose, 
    isArchived, 
    onToggleArchive, 
    onDelete, 
    onToggleMute, 
    onUpdateGroup, 
    onAddMember,
    lang,
    theme,
    contacts = [],
    accounts
}) => {
  const t = translations[lang];
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(chat.name);
  const [editBio, setEditBio] = useState(chat.bio || '');
  const [showContactPicker, setShowContactPicker] = useState(false);
  const [usernameCopied, setUsernameCopied] = useState(false);

  // Reset local state when chat changes
  useEffect(() => {
    setEditName(chat.name);
    setEditBio(chat.bio || '');
    setIsEditing(false);
    setUsernameCopied(false);
  }, [chat]);

  const handleSaveGroup = () => {
      if(onUpdateGroup) {
          onUpdateGroup(chat.id, { name: editName, bio: editBio });
      }
      setIsEditing(false);
  };

  const handleAddMemberSelect = (contactId: string) => {
      if (onAddMember) {
          onAddMember(contactId);
      }
  };

  const handleCopyUsername = () => {
      if (chat.username) {
          navigator.clipboard.writeText(`@${chat.username}`);
          setUsernameCopied(true);
          setTimeout(() => setUsernameCopied(false), 2000);
      }
  };

  // Filter contacts to show only those NOT in the group
  const availableContacts = contacts.filter(c => 
      !c.isGroup && c.id !== '1' && 
      !(chat.memberIds || []).includes(c.id)
  );

  // Check premium status via accounts list
  const remoteUser = accounts?.find(a => a.username === chat.username);
  const isPremium = remoteUser?.isPremium;

  return (
    <div className="h-full bg-[#f2f2f7] flex flex-col border-l border-gray-200 shadow-2xl animate-in slide-in-from-right duration-300 w-full md:w-full relative">
      
      <ContactPickerModal 
        isOpen={showContactPicker}
        onClose={() => setShowContactPicker(false)}
        contacts={availableContacts}
        onSelect={handleAddMemberSelect}
        lang={lang}
        theme={theme}
      />

      {/* Header */}
      <div className="flex items-center justify-between p-4 bg-white/80 backdrop-blur-md border-b border-gray-200 sticky top-0 z-10">
        <button onClick={onClose} className={`${theme.textHighlight} font-medium text-lg px-2 hover:opacity-70 transition-opacity`}>
          {t.search} 
          <span className="sr-only">Close</span>
        </button>
        <h2 className="text-lg font-bold text-gray-900">{chat.isGroup ? t.groupInfo : t.userInfo}</h2>
        
        {isEditing ? (
            <button 
                onClick={handleSaveGroup}
                className={`${theme.textHighlight} font-bold px-2 hover:opacity-70`}
            >
                {t.save}
            </button>
        ) : (
            chat.isGroup && chat.isAdmin ? (
                <button 
                    onClick={() => setIsEditing(true)}
                    className={`${theme.textHighlight} font-medium px-2 hover:opacity-70`}
                >
                    {t.editGroup}
                </button>
            ) : (
                 <div className="w-8"></div> // Spacer
            )
        )}
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar pb-10">
        
        {/* Profile Hero */}
        <div className="pt-10 pb-6 flex flex-col items-center bg-transparent relative">
             <div className="relative group">
                <div className={`w-28 h-28 rounded-full flex items-center justify-center text-4xl font-bold text-white mb-3 shadow-xl ring-4 ring-white ${chat.color}`}>
                  {chat.avatar ? (
                     <img src={chat.avatar} alt={chat.name} className="w-full h-full rounded-full object-cover" />
                  ) : (
                    chat.name.substring(0, 1)
                  )}
                </div>
                {isEditing && (
                    <div className="absolute inset-0 bg-black/20 rounded-full flex items-center justify-center">
                        <Camera className="text-white drop-shadow-md" size={32} />
                    </div>
                )}
             </div>
            
            <div className="text-center w-full px-8">
                {isEditing ? (
                    <div className="flex flex-col items-center gap-2 mb-2 w-full">
                        <input 
                            value={editName}
                            onChange={(e) => setEditName(e.target.value)}
                            className={`text-2xl font-bold text-center border-b border-gray-300 ${theme.ring} focus:outline-none w-full bg-transparent py-1`}
                            placeholder={t.groupName}
                            autoFocus
                        />
                    </div>
                ) : (
                    <h1 className="text-2xl font-bold text-gray-900 flex items-center justify-center gap-2 tracking-tight">
                        {chat.name}
                        {isPremium && <Star size={24} className="text-purple-500 fill-purple-500 drop-shadow-sm" />}
                        {chat.isBot && <span className="bg-blue-500 text-white text-[10px] px-1.5 py-0.5 rounded-md align-middle font-bold tracking-wide">BOT</span>}
                    </h1>
                )}
                
                <p className={`text-sm mt-1 font-medium ${chat.isOnline ? 'text-blue-500' : 'text-gray-400'}`}>
                    {chat.isBot ? 'Service Notification' : (
                        chat.isGroup ? `${chat.membersCount || 2} ${t.members}` : (
                            chat.isOnline ? t.online : t.lastSeen
                        )
                    )}
                </p>
            </div>
            
            {!chat.isBot && !isEditing && (
                <div className="flex gap-4 mt-6">
                    <ActionButton icon={<Phone size={20} />} label={t.calls} theme={theme} />
                    <ActionButton icon={<Bell size={20} />} label={t.notifications} onClick={onToggleMute} active={!chat.muted} theme={theme} />
                    <ActionButton icon={<AtSign size={20} />} label={t.username} theme={theme} onClick={handleCopyUsername} />
                </div>
            )}
        </div>

        {/* Info Groups (iOS Style) */}
        <div className="px-4 space-y-6 max-w-2xl mx-auto">
            
            {/* Group 1: Bio/Info */}
            <div className="bg-white rounded-xl overflow-hidden shadow-sm border border-gray-200/60">
                {chat.username && (
                    <InfoRow 
                        icon={usernameCopied ? <Check size={20} className="text-white" /> : <AtSign size={20} className="text-white" />} 
                        iconColor={usernameCopied ? "bg-green-500" : "bg-blue-500"}
                        label={usernameCopied ? t.copied : t.username} 
                        value={`@${chat.username}`}
                        onClick={handleCopyUsername}
                        clickable
                    />
                )}
                
                {!chat.isBot && !chat.isGroup && chat.phone && (
                     <InfoRow 
                        icon={<Phone size={20} className="text-white" />} 
                        iconColor="bg-green-500"
                        label={t.phone} 
                        value={chat.phone} 
                    />
                )}

                {(chat.bio || isEditing) && (
                     <div className="p-4 flex gap-4 border-t border-gray-100 first:border-0">
                        <div className="w-8 h-8 rounded-md bg-orange-500 flex items-center justify-center shrink-0">
                            <Info size={18} className="text-white" />
                        </div>
                        <div className="flex-1">
                             <div className="text-xs text-gray-400 font-medium uppercase tracking-wide mb-1">{chat.isGroup ? t.description : t.bio}</div>
                             {isEditing ? (
                                <textarea
                                    value={editBio}
                                    onChange={(e) => setEditBio(e.target.value)}
                                    className={`w-full bg-gray-100 border-none rounded-lg p-2 text-[15px] focus:ring-2 ${theme.ring}`}
                                    placeholder={t.description}
                                    rows={3}
                                />
                             ) : (
                                <div className="text-gray-900 text-[15px] leading-relaxed">{chat.bio}</div>
                             )}
                        </div>
                     </div>
                )}
            </div>

            {/* Group 2: Actions */}
            <div className="bg-white rounded-xl overflow-hidden shadow-sm border border-gray-200/60">
                 {/* Add Member */}
                 {chat.isGroup && chat.isAdmin && (
                    <ActionRow 
                        icon={<UserPlus size={20} className="text-white" />} 
                        iconColor="bg-blue-500"
                        label={t.addMember}
                        onClick={() => setShowContactPicker(true)}
                        textColor="text-blue-600"
                    />
                 )}
                 
                 <ActionRow 
                    icon={<Bell size={20} className="text-white" />}
                    iconColor={theme.primary.replace('bg-', 'bg-')} // Just use theme primary for consistency or keep red
                    label={chat.muted ? t.unmute : t.mute}
                    onClick={onToggleMute}
                    value={chat.muted ? "Off" : "On"}
                 />

                 {onToggleArchive && (
                    <ActionRow 
                        icon={<Archive size={20} className="text-white" />}
                        iconColor="bg-gray-400"
                        label={isArchived ? t.unarchiveChat : t.archiveChat}
                        onClick={onToggleArchive}
                    />
                 )}
            </div>

            {/* Group 3: Destructive */}
            <div className="bg-white rounded-xl overflow-hidden shadow-sm border border-gray-200/60">
                 {!chat.isGroup && (
                    <ActionRow 
                        icon={<Ban size={20} className="text-white" />}
                        iconColor="bg-orange-500"
                        label={t.blockUser}
                        textColor="text-orange-600"
                    />
                 )}
                 {onDelete && (
                     <ActionRow 
                        icon={<Trash2 size={20} className="text-white" />}
                        iconColor="bg-red-500"
                        label={chat.isGroup && chat.isAdmin ? t.deleteGroup : t.deleteChat}
                        onClick={onDelete}
                        textColor="text-red-600"
                    />
                 )}
            </div>

        </div>
      </div>
    </div>
  );
};

const ActionButton: React.FC<{icon: React.ReactNode, label: string, onClick?: () => void, active?: boolean, theme: Theme}> = ({icon, label, onClick, active, theme}) => (
    <button 
        onClick={onClick}
        className={`flex flex-col items-center gap-1 min-w-[70px] ${active === false ? 'opacity-50' : ''}`}
    >
        <div className={`w-10 h-10 bg-white rounded-full shadow-sm border border-gray-200 flex items-center justify-center ${theme.iconColor} hover:bg-gray-50 transition-colors`}>
            {icon}
        </div>
        <span className="text-[11px] font-medium text-gray-500">{label}</span>
    </button>
)

const InfoRow: React.FC<{icon: React.ReactNode, iconColor: string, label: string, value: string, onClick?: () => void, clickable?: boolean}> = ({icon, iconColor, label, value, onClick, clickable}) => (
    <div 
        onClick={onClick}
        className={`p-3 pl-4 flex items-center gap-4 border-t border-gray-100 first:border-0 hover:bg-gray-50 transition-colors ${clickable ? 'cursor-pointer active:bg-gray-100' : 'cursor-default'}`}
    >
        <div className={`w-8 h-8 rounded-md ${iconColor} flex items-center justify-center shrink-0 shadow-sm transition-colors duration-300`}>
            {icon}
        </div>
        <div className="flex-1">
            <div className="text-[15px] text-gray-900 font-medium">{value}</div>
            <div className={`text-xs ${clickable && label.includes('Copied') ? 'text-green-500 font-bold' : 'text-gray-400'}`}>{label}</div>
        </div>
    </div>
)

const ActionRow: React.FC<{icon: React.ReactNode, iconColor: string, label: string, onClick?: () => void, textColor?: string, value?: string}> = ({icon, iconColor, label, onClick, textColor = "text-gray-900", value}) => (
    <button 
        onClick={onClick}
        className="w-full p-3 pl-4 flex items-center gap-4 border-t border-gray-100 first:border-0 hover:bg-gray-50 transition-colors text-left"
    >
        <div className={`w-8 h-8 rounded-md ${iconColor} flex items-center justify-center shrink-0 shadow-sm`}>
            {icon}
        </div>
        <div className={`flex-1 font-medium text-[15px] ${textColor}`}>
            {label}
        </div>
        {value && <span className="text-gray-400 text-sm mr-2">{value}</span>}
        <ChevronRight size={16} className="text-gray-300 mr-1" />
    </button>
)
