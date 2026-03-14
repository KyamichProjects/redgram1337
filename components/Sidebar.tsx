
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Menu, Search, X, User, Settings, Archive, Users, Phone, ArrowLeft, VolumeX, ChevronRight, PhoneIncoming, PhoneOutgoing, PhoneMissed, Info, Pencil, Star, Plus, ChevronDown, Shield } from 'lucide-react';
import { ChatPreview, Call, UserProfile } from '../services/ChatSocket';
import { translations, Language } from '../utils/translations';
import { Theme } from '../utils/themes';

interface SidebarProps {
  chats: ChatPreview[];
  activeChatId: string | null;
  onSelectChat: (id: string) => void;
  onAddChat: (chat: ChatPreview) => void;
  className?: string;
  userProfile: UserProfile;
  accounts: UserProfile[];
  onSwitchAccount: (profile: UserProfile) => void;
  onOpenSettings: () => void;
  archivedCount: number;
  isArchiveView: boolean;
  onToggleArchiveView: () => void;
  onNewGroup: () => void;
  onOpenAddContact?: () => void;
  lang: Language;
  theme: Theme;
  calls?: Call[];
  isCallsView: boolean;
  onToggleCallsView: () => void;
  onOpenPremium: () => void;
  onOpenAdmin?: () => void;
  onArchiveChat?: (chatId: string) => void;
  onUnarchiveChat?: (chatId: string) => void;
  onBlockUser?: (userId: string) => void;
  onUnblockUser?: (userId: string) => void;
  blockedUsers?: Set<string>;
  archivedChatIds?: Set<string>;
}

export const Sidebar: React.FC<SidebarProps> = ({ 
    chats, 
    activeChatId, 
    onSelectChat, 
    onAddChat, 
    className,
    userProfile,
    accounts = [],
    onSwitchAccount,
    onOpenSettings,
    archivedCount,
    isArchiveView,
    onToggleArchiveView,
    onNewGroup,
    onOpenAddContact,
    lang,
    theme,
    calls = [],
    isCallsView,
    onToggleCallsView,
    onOpenPremium,
    onOpenAdmin,
    onArchiveChat,
    onUnarchiveChat,
    onBlockUser,
    onUnblockUser,
    blockedUsers = new Set(),
    archivedChatIds = new Set()
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isAccountsExpanded, setIsAccountsExpanded] = useState(false);
  const [contextMenuChatId, setContextMenuChatId] = useState<string | null>(null);
  const [contextMenuPosition, setContextMenuPosition] = useState({ x: 0, y: 0 });
  const t = translations[lang];

  const handleContextMenu = (e: React.MouseEvent, chatId: string) => {
      e.preventDefault();
      setContextMenuChatId(chatId);
      setContextMenuPosition({ x: e.clientX, y: e.clientY });
  };

  const closeContextMenu = () => {
      setContextMenuChatId(null);
  };
  
  // Filter existing chats
  const filteredChats = chats.filter(c => {
    const matchesName = c.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesUser = c.username?.toLowerCase().includes(searchQuery.toLowerCase());
    
    // Always show Saved Messages (ID 1) unless it doesn't match a specific search query
    if (c.id === '1') {
        if (!searchQuery) return true;
        const q = searchQuery.toLowerCase();
        return 'saved messages'.includes(q) || 'favorites'.includes(q) || 'me' === q || 'избранное'.includes(q);
    }

    return matchesName || matchesUser;
  });

  // Global Search Logic (Find users from 'accounts' or 'directory' that are NOT in current chats)
  // In a real app, this would query the server. Here we use the `accounts` prop as our "Server DB"
  const globalSearchResults = searchQuery.length > 2 ? accounts.filter(acc => {
      // Exclude self
      if (acc.id === userProfile.id) return false;
      // Exclude existing chats
      if (chats.find(c => c.id === acc.id || c.username === acc.username)) return false;
      
      const matchesName = acc.name.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesUsername = acc.username.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesName || matchesUsername;
  }) : [];

  const handleGlobalUserClick = (acc: UserProfile) => {
      // Add this user to chats
      const newChat: ChatPreview = {
          id: acc.username, // Use username as ID for consistency in this mock
          name: acc.name,
          username: acc.username,
          bio: acc.bio,
          phone: acc.phone,
          color: acc.avatarColor,
          lastMessage: '',
          timestamp: Date.now(),
          unreadCount: 0,
          isOnline: true, // Assume online for found users
          isBot: false
      };
      onAddChat(newChat);
      setSearchQuery('');
  };

  // Legacy fake global search (create bot) if no real user found
  const showFakeGlobalSearch = searchQuery.length > 2 && filteredChats.length === 0 && globalSearchResults.length === 0 && !isCallsView;

  const handleCreateFakeGlobalChat = () => {
     const newChat: ChatPreview = {
         id: Date.now().toString(),
         name: searchQuery,
         username: searchQuery.toLowerCase().replace(/\s/g, '_'),
         isOnline: true,
         unreadCount: 0,
         lastMessage: '',
         timestamp: Date.now(),
         color: 'bg-gradient-to-tr from-emerald-400 to-teal-500 text-white',
         isBot: true,
         bio: `I am ${searchQuery}. I was found via Global Search.`
     };
     onAddChat(newChat);
     setSearchQuery('');
  };

  const handleMenuAction = (action: () => void) => {
      action();
      setIsMenuOpen(false);
      setIsAccountsExpanded(false); // Reset accounts view
  };

  const handleSwitch = (acc: UserProfile) => {
      onSwitchAccount(acc);
      setIsMenuOpen(false);
      setIsAccountsExpanded(false);
  };

  const isAuxView = isArchiveView || isCallsView;
  const headerTitle = isArchiveView ? t.archivedChats : (isCallsView ? t.calls : '');

  const getContactForCall = (call: Call) => {
      // Find call in chats array (since all contacts are chats basically)
      return chats.find(c => c.id === call.contactId) || { name: 'Unknown', color: 'bg-gray-400', id: call.contactId, avatar: undefined };
  };

  // Filter other accounts
  const otherAccounts = accounts.filter(acc => acc.id !== userProfile.id);

  return (
    <div className={`flex flex-col h-full bg-white border-r border-gray-200/60 relative ${className}`}>
      
      {/* Main Menu Drawer (Left Profile) */}
      <div 
        className={`absolute inset-0 z-50 bg-black/30 backdrop-blur-sm transition-opacity duration-300 ${isMenuOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
        onClick={() => setIsMenuOpen(false)}
      >
        <div 
            className={`absolute top-0 left-0 w-[300px] h-full bg-white/95 backdrop-blur-xl shadow-2xl transition-transform duration-300 cubic-bezier(0.16, 1, 0.3, 1) transform flex flex-col ${isMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}
            onClick={e => e.stopPropagation()}
        >
            {/* Drawer Header with Account Switcher */}
            <div className={`${theme.gradient} text-white relative overflow-hidden transition-all duration-300`}>
                <div className="p-6 pb-4">
                    <div className="flex justify-between items-start mb-4 relative z-10">
                        <div className={`w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold shadow-lg ring-2 ring-white/30 text-white ${userProfile.avatarColor}`}>
                            {userProfile.name.substring(0, 1)}
                        </div>
                        <div className="flex gap-2">
                             {/* Sun/Moon Theme Toggle could go here */}
                             <button onClick={() => setIsMenuOpen(false)} className="text-white/80 hover:text-white transition-colors bg-white/10 rounded-full p-1">
                                <X size={20} />
                            </button>
                        </div>
                    </div>
                    
                    <div 
                        className="flex items-center justify-between cursor-pointer active:opacity-80 select-none"
                        onClick={() => setIsAccountsExpanded(!isAccountsExpanded)}
                    >
                        <div className="relative z-10">
                            <div className="flex items-center gap-1">
                                <div className="font-bold text-lg tracking-tight">{userProfile.name}</div>
                                {userProfile.isPremium && <Star size={14} fill="white" className="text-white drop-shadow-sm" />}
                            </div>
                            <div className="text-white/70 text-sm font-medium opacity-70">@{userProfile.username}</div>
                        </div>
                        <ChevronDown 
                            size={20} 
                            className={`text-white/80 transition-transform duration-300 ${isAccountsExpanded ? 'rotate-180' : ''}`} 
                        />
                    </div>
                    
                    {/* Decoration for Premium */}
                    {userProfile.isPremium && (
                        <div className="absolute -bottom-8 -right-8 w-32 h-32 bg-white/20 blur-2xl rounded-full pointer-events-none"></div>
                    )}
                </div>
            </div>

            {/* Drawer Items / Account List */}
            <div className="flex-1 overflow-y-auto py-2 flex flex-col">
                {isAccountsExpanded ? (
                    <div className="animate-in slide-in-from-top-2 duration-200">
                        {otherAccounts.map(acc => (
                            <button 
                                key={acc.id}
                                onClick={() => handleSwitch(acc)}
                                className="w-full flex items-center gap-4 px-6 py-3 hover:bg-gray-50 active:bg-gray-100 transition-colors"
                            >
                                <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold text-white shadow-sm ${acc.avatarColor}`}>
                                    {acc.name.substring(0,1)}
                                </div>
                                <div className="text-left flex-1">
                                    <div className="flex items-center gap-1">
                                        <div className="text-sm font-bold text-gray-800">{acc.name}</div>
                                        {acc.isPremium && <Star size={12} className="text-purple-500 fill-purple-500" />}
                                    </div>
                                    <div className="text-xs text-gray-400">@{acc.username}</div>
                                </div>
                            </button>
                        ))}
                        <div className="h-px bg-gray-100 my-2 mx-4"></div>
                    </div>
                ) : null}

                {/* Standard Menu Items */}
                <div className={isAccountsExpanded ? "opacity-50 pointer-events-none transition-opacity" : "transition-opacity"}>
                    <MenuItem theme={theme} onClick={() => handleMenuAction(onNewGroup)} icon={<Users size={20} />} label={t.newGroup} />
                    <MenuItem theme={theme} onClick={() => handleMenuAction(() => alert(t.contacts + " syncing..."))} icon={<User size={20} />} label={t.contacts} />
                    <MenuItem theme={theme} onClick={() => handleMenuAction(() => { if(!isCallsView) onToggleCallsView(); })} icon={<Phone size={20} />} label={t.calls} />
                    <MenuItem theme={theme} onClick={() => handleMenuAction(() => { if(!isArchiveView) onToggleArchiveView(); })} icon={<Archive size={20} />} label={t.archivedChats} />
                    <MenuItem theme={theme} onClick={() => handleMenuAction(onOpenSettings)} icon={<Settings size={20} />} label={t.settings} />
                    {userProfile.isAdmin && onOpenAdmin && (
                        <MenuItem theme={theme} onClick={() => handleMenuAction(onOpenAdmin)} icon={<Shield size={20} className="text-red-500" />} label="Admin Panel" />
                    )}
                </div>

                {/* Spacer */}
                <div className="flex-1"></div>

                {/* Premium Button (Only show if accounts not expanded to avoid clutter) */}
                {!isAccountsExpanded && (
                    <div className="px-6 pb-6 pt-2">
                        <button 
                            onClick={() => handleMenuAction(onOpenPremium)}
                            className="w-full relative group overflow-hidden rounded-full p-[2px]"
                        >
                            <div className="absolute inset-0 bg-gradient-to-r from-purple-500 via-pink-500 to-red-500 animate-[spin_4s_linear_infinite] opacity-70 group-hover:opacity-100"></div>
                            <div className="relative bg-white rounded-full px-4 py-3 flex items-center justify-between transition-colors group-hover:bg-white/95">
                                <div className="flex items-center gap-2">
                                    <Star size={18} className="text-purple-600" fill="currentColor" />
                                    <span className="text-[14px] font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-600 to-pink-600">
                                        RedGram Premium
                                    </span>
                                </div>
                                <ChevronRight size={16} className="text-gray-400" />
                            </div>
                        </button>
                    </div>
                )}
            </div>
            
            <div className="p-6 pt-0 text-[10px] text-gray-400 text-center font-medium tracking-widest uppercase opacity-60">
                RedGram iOS v3.5
            </div>
        </div>
      </div>

      {/* Header */}
      <div className={`flex items-center gap-3 p-3 text-white shrink-0 shadow-sm z-10 transition-all duration-300 ${isAuxView ? 'bg-slate-700' : theme.gradient}`}>
        {isAuxView ? (
            <button 
                onClick={isCallsView ? onToggleCallsView : onToggleArchiveView}
                className="p-2 hover:bg-white/10 rounded-full transition-colors flex items-center gap-1 text-white"
            >
                <ArrowLeft size={22} />
            </button>
        ) : (
            <button 
                onClick={() => setIsMenuOpen(true)}
                className="p-2 hover:bg-white/10 rounded-full transition-colors"
            >
                <Menu size={24} />
            </button>
        )}
        
        <div className="flex-1 relative group">
            {isAuxView ? (
                 <span className="text-lg font-bold ml-1">{headerTitle}</span>
            ) : (
                <>
                    <input 
                        type="text" 
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder={t.search} 
                        className={`w-full bg-black/10 text-white placeholder-white/70 rounded-xl py-2 pl-10 pr-4 focus:outline-none focus:bg-white focus:text-gray-900 focus:placeholder-gray-400 transition-all border border-transparent shadow-inner`}
                    />
                    <Search className={`absolute left-3 top-2.5 transition-colors ${searchQuery ? 'text-gray-500 group-focus-within:text-gray-500' : 'text-white/70 group-focus-within:text-gray-400'}`} size={18} />
                </>
            )}
        </div>
      </div>

      {/* Main Content (Chats or Calls) */}
      <div className="flex-1 overflow-y-auto custom-scrollbar bg-white relative">
        
        {isCallsView ? (
             <div className="pb-4">
                 {calls.length === 0 && (
                     <div className="flex flex-col items-center justify-center h-64 text-gray-400">
                        <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                            <Phone size={32} className="text-gray-300" />
                        </div>
                        <p className="text-sm font-medium">No recent calls</p>
                    </div>
                 )}
                 {calls.map(call => {
                     const contact = getContactForCall(call);
                     return (
                         <div key={call.id} className="flex items-center gap-3 p-3 mx-2 my-1 hover:bg-gray-50 rounded-xl transition-colors cursor-pointer" onClick={() => alert(`${t.callShort} ${contact.name}...`)}>
                             <div className={`w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold text-white shadow-sm ${contact.color}`}>
                                {contact.avatar ? <img src={contact.avatar} className="w-full h-full rounded-full object-cover"/> : contact.name[0]}
                             </div>
                             <div className="flex-1 min-w-0">
                                 <h3 className={`font-bold text-gray-900 ${call.type === 'missed' ? 'text-red-500' : ''}`}>
                                     {contact.name}
                                 </h3>
                                 <div className="flex items-center gap-1 text-[13px] text-gray-500">
                                     {call.type === 'outgoing' && <PhoneOutgoing size={12} className="text-green-500" />}
                                     {call.type === 'incoming' && <PhoneIncoming size={12} className="text-blue-500" />}
                                     {call.type === 'missed' && <PhoneMissed size={12} className="text-red-500" />}
                                     <span>
                                         {call.type === 'missed' ? t.missedCall : (call.type === 'outgoing' ? t.outgoingCall : t.incomingCall)}
                                     </span>
                                     <span>•</span>
                                     <span>{new Date(call.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                 </div>
                             </div>
                             <button className="p-2 text-green-500 hover:bg-green-50 rounded-full transition-colors">
                                 <Info size={20} />
                             </button>
                         </div>
                     )
                 })}
             </div>
        ) : (
            <>
                {/* Archived Row */}
                {!isArchiveView && !searchQuery && archivedCount > 0 && (
                    <div 
                        onClick={onToggleArchiveView}
                        className="flex items-center gap-3 p-3 mx-2 mt-2 cursor-pointer hover:bg-gray-50 rounded-xl transition-colors"
                    >
                        <div className="w-12 h-12 rounded-full flex items-center justify-center bg-gray-100 text-gray-400">
                            <Archive size={20} />
                        </div>
                        <div className="flex-1 border-b border-gray-50 pb-3 mb-[-12px]">
                            <h3 className="font-semibold text-gray-800">{t.archivedChats}</h3>
                            <p className="text-xs text-gray-400">{archivedCount} {t.message.toLowerCase()}s</p>
                        </div>
                    </div>
                )}

                {filteredChats.map(chat => {
                    // Check if this chat corresponds to a registered account to show premium status
                    const remoteUser = accounts.find(a => a.username === chat.username);
                    const isPremium = remoteUser?.isPremium;

                    return (
                        <div 
                            key={chat.id}
                            onClick={() => onSelectChat(chat.id)}
                            onContextMenu={(e) => handleContextMenu(e, chat.id)}
                            className={`
                            flex items-center gap-3 p-3 mx-2 my-1 cursor-pointer transition-all rounded-xl
                            ${activeChatId === chat.id 
                                ? `${theme.secondary} shadow-sm ring-1 ring-black/5` 
                                : 'hover:bg-gray-50 bg-white'}
                            `}
                        >
                            {/* Avatar */}
                            <div className={`w-14 h-14 rounded-full flex items-center justify-center text-xl font-medium shrink-0 shadow-sm relative overflow-hidden ${chat.color}`}>
                            {chat.avatar ? (
                                <img src={chat.avatar} alt={chat.name} className="w-full h-full object-cover" />
                            ) : (
                                chat.id === '1' ? <Archive size={20} /> : chat.name.substring(0, 1)
                            )}
                            {chat.isOnline && (
                                <div className="absolute bottom-1 right-1 w-3 h-3 bg-green-500 border-2 border-white rounded-full shadow-sm"></div>
                            )}
                            </div>

                            {/* Content */}
                            <div className="flex-1 min-w-0 flex flex-col justify-center h-14">
                            <div className="flex justify-between items-baseline mb-0.5">
                                <h3 className={`font-bold truncate text-base flex items-center gap-1 ${activeChatId === chat.id ? 'text-gray-900' : 'text-gray-900'}`}>
                                    {chat.id === '1' ? t.savedMessages : chat.name}
                                    {isPremium && <Star size={12} className="text-purple-500 fill-purple-500" />}
                                    {chat.isGroup && <Users size={12} className="text-gray-400" />}
                                    {chat.muted && <VolumeX size={12} className="text-gray-400" />}
                                </h3>
                                <span className={`text-[11px] font-medium ${activeChatId === chat.id ? theme.textHighlight : 'text-gray-400'}`}>
                                {new Date(chat.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </span>
                            </div>
                            <div className="flex justify-between items-center">
                                <p className={`text-[13px] truncate pr-4 ${activeChatId === chat.id ? 'text-gray-600' : 'text-gray-500'}`}>
                                {chat.lastMessage ? (
                                    <>
                                        {chat.sender === 'me' && <span className={`${theme.textHighlight} mr-1`}>You:</span>}
                                        {chat.lastMessage}
                                    </>
                                ) : (
                                    <span className={`${theme.textHighlight} italic opacity-80`}>{t.noChats}</span>
                                )}
                                </p>
                                {chat.unreadCount > 0 && (
                                <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full text-white min-w-[18px] text-center shadow-sm ${chat.muted ? 'bg-gray-400' : theme.primary}`}>
                                    {chat.unreadCount}
                                </span>
                                )}
                            </div>
                            </div>
                        </div>
                    );
                })}

                {/* Global Search Result */}
                {globalSearchResults.map(acc => (
                     <div className="p-4" key={acc.id}>
                        <div className="px-2 py-2 text-xs font-bold text-gray-400 uppercase tracking-wider">{t.globalSearch}</div>
                        <div 
                            onClick={() => handleGlobalUserClick(acc)}
                            className="flex items-center gap-3 p-3 cursor-pointer hover:bg-gray-50 rounded-xl transition-all border border-transparent hover:border-gray-100 hover:shadow-sm"
                        >
                            <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white text-lg font-bold shadow-md ${acc.avatarColor}`}>
                                {acc.name.substring(0,1).toUpperCase()}
                            </div>
                            <div>
                                <div className="flex items-center gap-1">
                                    <h3 className="font-semibold text-gray-900">{acc.name}</h3>
                                    {acc.isPremium && <Star size={12} className="text-purple-500 fill-purple-500" />}
                                </div>
                                <p className="text-sm text-blue-500">@{acc.username}</p>
                            </div>
                        </div>
                    </div>
                ))}

                {showFakeGlobalSearch && !isArchiveView && (
                    <div className="p-4">
                        <div className="px-2 py-2 text-xs font-bold text-gray-400 uppercase tracking-wider">{t.globalSearch}</div>
                        <div 
                            onClick={handleCreateFakeGlobalChat}
                            className="flex items-center gap-3 p-3 cursor-pointer hover:bg-gray-50 rounded-xl transition-all border border-transparent hover:border-gray-100 hover:shadow-sm"
                        >
                            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white text-lg font-bold shadow-md">
                                {searchQuery.substring(0,1).toUpperCase()}
                            </div>
                            <div>
                                <h3 className="font-semibold text-gray-900">{searchQuery}</h3>
                                <p className="text-sm text-blue-500">@{searchQuery.toLowerCase().replace(/\s/g,'_')}</p>
                            </div>
                        </div>
                    </div>
                )}
                
                {filteredChats.length === 0 && globalSearchResults.length === 0 && !showFakeGlobalSearch && !searchQuery && (
                    <div className="flex flex-col items-center justify-center h-64 text-gray-400">
                        {isArchiveView ? (
                            <>
                                <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                                    <Archive size={32} className="text-gray-300" />
                                </div>
                                <p className="text-sm font-medium">{t.archiveEmpty}</p>
                            </>
                        ) : (
                            <p className="text-sm">{t.noChats}</p>
                        )}
                    </div>
                )}
            </>
        )}
        
        {/* Floating Action Button (New Contact) */}
        {!isAuxView && onOpenAddContact && (
            <button 
                onClick={onOpenAddContact}
                className={`absolute bottom-6 right-6 w-14 h-14 rounded-full ${theme.buttonGradient} text-white shadow-xl flex items-center justify-center hover:scale-105 active:scale-95 transition-transform z-30`}
            >
                <Pencil size={24} />
            </button>
        )}
      </div>

      {/* Context Menu */}
      {contextMenuChatId && (
          <div 
              className="fixed inset-0 z-50 pointer-events-auto"
              onClick={closeContextMenu}
          >
              <div 
                  className="absolute bg-white/90 backdrop-blur-xl shadow-2xl rounded-2xl p-2 border border-white/20 flex flex-col gap-1 min-w-[150px] animate-in zoom-in-95 duration-100"
                  style={{
                      left: Math.min(contextMenuPosition.x, window.innerWidth - 160),
                      top: Math.min(contextMenuPosition.y, window.innerHeight - 200)
                  }}
                  onClick={(e) => e.stopPropagation()}
              >
                  {contextMenuChatId !== '1' && (
                      <>
                          {archivedChatIds.has(contextMenuChatId) ? (
                              <button 
                                  className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors text-left"
                                  onClick={() => {
                                      if (onUnarchiveChat) onUnarchiveChat(contextMenuChatId);
                                      closeContextMenu();
                                  }}
                              >
                                  <Archive size={16} /> Unarchive
                              </button>
                          ) : (
                              <button 
                                  className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors text-left"
                                  onClick={() => {
                                      if (onArchiveChat) onArchiveChat(contextMenuChatId);
                                      closeContextMenu();
                                  }}
                              >
                                  <Archive size={16} /> Archive
                              </button>
                          )}
                          
                          {blockedUsers.has(contextMenuChatId) ? (
                              <button 
                                  className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-green-600 hover:bg-green-50 rounded-lg transition-colors text-left"
                                  onClick={() => {
                                      if (onUnblockUser) onUnblockUser(contextMenuChatId);
                                      closeContextMenu();
                                  }}
                              >
                                  <Shield size={16} /> Unblock User
                              </button>
                          ) : (
                              <button 
                                  className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors text-left"
                                  onClick={() => {
                                      if (onBlockUser) onBlockUser(contextMenuChatId);
                                      closeContextMenu();
                                  }}
                              >
                                  <Shield size={16} /> Block User
                              </button>
                          )}
                      </>
                  )}
              </div>
          </div>
      )}
    </div>
  );
};

const MenuItem: React.FC<{icon: React.ReactNode, label: string, onClick?: () => void, theme: Theme}> = ({icon, label, onClick, theme}) => (
    <button onClick={onClick} className="w-full flex items-center gap-4 px-6 py-3.5 hover:bg-gray-50 active:bg-gray-100 text-gray-700 transition-colors text-left group">
        <span className={`text-gray-400 group-hover:${theme.textHighlight} transition-colors`}>{icon}</span>
        <span className="font-medium text-[15px]">{label}</span>
    </button>
)
