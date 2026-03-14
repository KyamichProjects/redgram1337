
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useRef, useEffect, useState } from 'react';
import { ArrowLeft, MoreVertical, Send, Paperclip, Smile, Check, CheckCheck, Mic, Image, Camera, File, VolumeX, Archive, Star, Play, Pause, X, Download, Trash2, Phone, Video } from 'lucide-react';
import { Message, ChatPreview, UserProfile } from '../services/ChatSocket';
import { translations, Language } from '../utils/translations';
import { Theme } from '../utils/themes';

interface ChatWindowProps {
  chat: ChatPreview;
  messages: Message[];
  onBack: () => void;
  onOpenProfile: () => void;
  onSendMessage: (text: string, attachment?: { type: 'voice' | 'image' | 'file', mediaUrl: string, fileName?: string, fileSize?: string, duration?: number }) => void;
  className?: string;
  isTyping?: boolean;
  lang: Language;
  theme: Theme;
  contacts?: ChatPreview[];
  onUserProfileClick?: (userId: string) => void;
  accounts?: UserProfile[];
  currentUser?: UserProfile;
  onCall?: (isVideo: boolean) => void;
  onRead?: (messageIds: string[]) => void;
  onTyping?: (isTyping: boolean) => void;
  onEditMessage?: (messageId: string, newText: string) => void;
  onDeleteMessage?: (messageId: string, forEveryone: boolean) => void;
  onReactMessage?: (messageId: string, emoji: string) => void;
  blockedUsers?: Set<string>;
}

const COMMON_EMOJIS = [
    "😀", "😃", "😄", "😁", "😆", "😅", "😂", "🤣", "😊", "😇", "🙂", "🙃", "😉", "😌", "😍", "🥰", "😘", "😗", 
    "😙", "😚", "😋", "😛", "😝", "😜", "🤪", "🤨", "🧐", "😎", "🤩", "🥳", "😏", "😒", "😞", "😔", "😟", 
    "😕", "🙁", "☹️", "😣", "😖", "😫", "😩", "🥺", "😢", "😭", "😤", "😠", "😡", "🤬", "🤯", "😳", "🥵", "🥶", 
    "😱", "😨", "😰", "😥", "😓", "🤗", "🤔", "🤭", "🤫", "🤥", "😶", "😐", "😑", "😬", "🙄", "😯", "😦", "😧", 
    "😮", "😲", "🥱", "😴", "🤤", "😪", "😵", "🤐", "🥴", "🤢", "🤮", "🤧", "😷", "🤒", "🤕", "🤑", "🤠", "😈",
    "👍", "👎", "👋", "🤚", "👌", "🤌", "🤏", "✌️", "🤞", "🤟", "🤘", "🤙", "👈", "👉", "👆", "👇", "👊", "👏",
    "🙌", "👐", "🤝", "🙏", "💪", "🧠", "👀", "👁", "💋", "❤️", "🧡", "💛", "💚", "💙", "💜", "🖤", "🤍", "🤎", 
    "💔", "🔥", "✨", "🌟", "💯", "💢", "💥", "💫", "💦", "💨", "🕳️", "💣", "💬", "👁️‍🗨️", "🗨️", "🗯️", "💭", "💤"
];

const VoiceMessagePlayer: React.FC<{ src: string, duration?: number, isMe: boolean }> = ({ src, duration, isMe }) => {
    const [isPlaying, setIsPlaying] = useState(false);
    const [progress, setProgress] = useState(0);
    const audioRef = useRef<HTMLAudioElement>(null);

    const togglePlay = () => {
        if (audioRef.current) {
            if (isPlaying) {
                audioRef.current.pause();
            } else {
                audioRef.current.play();
            }
            setIsPlaying(!isPlaying);
        }
    };

    useEffect(() => {
        const audio = audioRef.current;
        if (!audio) return;

        const updateProgress = () => {
            if (audio.duration) {
                setProgress((audio.currentTime / audio.duration) * 100);
            }
        };

        const handleEnded = () => {
            setIsPlaying(false);
            setProgress(0);
        };

        audio.addEventListener('timeupdate', updateProgress);
        audio.addEventListener('ended', handleEnded);
        return () => {
            audio.removeEventListener('timeupdate', updateProgress);
            audio.removeEventListener('ended', handleEnded);
        };
    }, []);

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    return (
        <div className={`flex items-center gap-3 min-w-[200px] py-2 px-1`}>
            <button 
                onClick={togglePlay}
                className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 transition-colors ${isMe ? 'bg-white/20 hover:bg-white/30 text-white' : 'bg-blue-500 text-white hover:bg-blue-600'}`}
            >
                {isPlaying ? <Pause size={18} fill="currentColor" /> : <Play size={18} fill="currentColor" className="ml-0.5" />}
            </button>
            <div className="flex-1 flex flex-col gap-1">
                <div className="h-1 bg-black/10 rounded-full overflow-hidden w-full relative">
                    <div 
                        className={`h-full absolute left-0 top-0 transition-all duration-100 ${isMe ? 'bg-white' : 'bg-blue-500'}`}
                        style={{ width: `${progress}%` }}
                    />
                </div>
                <div className={`text-[10px] font-medium ${isMe ? 'text-white/80' : 'text-gray-500'}`}>
                    {formatTime(duration || 0)}
                </div>
            </div>
            <audio ref={audioRef} src={src} className="hidden" />
        </div>
    );
};

export const ChatWindow: React.FC<ChatWindowProps> = ({ 
    chat, messages, onBack, onOpenProfile, onSendMessage, className, isTyping, lang, theme, contacts, onUserProfileClick, accounts, currentUser, onCall, onRead, onTyping, onEditMessage, onDeleteMessage, onReactMessage, blockedUsers
}) => {
  const [inputText, setInputText] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showAttachMenu, setShowAttachMenu] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const t = translations[lang];
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // New State for Voice & Files
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [contextMenuMessageId, setContextMenuMessageId] = useState<string | null>(null);
  const [contextMenuPosition, setContextMenuPosition] = useState({ x: 0, y: 0 });

  const handleContextMenu = (e: React.MouseEvent, messageId: string) => {
      e.preventDefault();
      setContextMenuMessageId(messageId);
      setContextMenuPosition({ x: e.clientX, y: e.clientY });
  };

  const closeContextMenu = () => {
      setContextMenuMessageId(null);
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  // Handle Input Change with Typing Indicator
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      setInputText(e.target.value);
      
      if (onTyping) {
          onTyping(true);
          
          if (typingTimeoutRef.current) {
              clearTimeout(typingTimeoutRef.current);
          }
          
          typingTimeoutRef.current = setTimeout(() => {
              onTyping(false);
          }, 2000);
      }
  };

  // Read Receipt Logic
  useEffect(() => {
      if (onRead && messages.length > 0 && currentUser) {
          // Find unread messages sent by 'them'
          const unreadIds = messages
              .filter(m => {
                  const isMe = (m.senderId && currentUser) 
                      ? (m.senderId === currentUser.username || m.senderId === currentUser.id) 
                      : m.sender === 'me';
                  return !isMe && m.status !== 'read';
              })
              .map(m => m.id);
          
          if (unreadIds.length > 0) {
              onRead(unreadIds);
          }
      }
  }, [messages, currentUser, onRead]);

  // Voice Recording Logic
  const startRecording = async () => {
      try {
          const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
          const mediaRecorder = new MediaRecorder(stream);
          mediaRecorderRef.current = mediaRecorder;
          audioChunksRef.current = [];

          mediaRecorder.ondataavailable = (event) => {
              if (event.data.size > 0) {
                  audioChunksRef.current.push(event.data);
              }
          };

          mediaRecorder.onstop = () => {
              const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
              // In a real app, upload this blob to server. Here we use object URL.
              // Note: Object URLs revoke on reload, so persistence is limited in this demo.
              // Better to use FileReader for base64 if we want local storage persistence.
              const reader = new FileReader();
              reader.readAsDataURL(audioBlob);
              reader.onloadend = () => {
                  const base64data = reader.result as string;
                  onSendMessage('', { 
                      type: 'voice', 
                      mediaUrl: base64data, 
                      duration: recordingDuration 
                  });
              }
              
              stream.getTracks().forEach(track => track.stop());
          };

          mediaRecorder.start();
          setIsRecording(true);
          setRecordingDuration(0);
          
          timerRef.current = setInterval(() => {
              setRecordingDuration(prev => prev + 1);
          }, 1000);

      } catch (err) {
          console.error("Error accessing microphone:", err);
          alert("Could not access microphone. Please check permissions.");
      }
  };

  const stopRecording = () => {
      if (mediaRecorderRef.current && isRecording) {
          mediaRecorderRef.current.stop();
          setIsRecording(false);
          if (timerRef.current) clearInterval(timerRef.current);
      }
  };

  const cancelRecording = () => {
       if (mediaRecorderRef.current && isRecording) {
          // Override onstop to do nothing
          mediaRecorderRef.current.onstop = null;
          mediaRecorderRef.current.stop();
          mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
          setIsRecording(false);
          if (timerRef.current) clearInterval(timerRef.current);
      }
  };

  const formatDuration = (seconds: number) => {
      const mins = Math.floor(seconds / 60);
      const secs = seconds % 60;
      return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // File Attachment Logic
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (event) => {
          const result = event.target?.result as string;
          const type = file.type.startsWith('image/') ? 'image' : 'file';
          
          onSendMessage(type === 'image' ? '' : file.name, {
              type: type,
              mediaUrl: result,
              fileName: file.name,
              fileSize: (file.size / 1024).toFixed(1) + ' KB'
          });
          setShowAttachMenu(false);
      };
      reader.readAsDataURL(file);
  };

  const triggerFileSelect = (accept: string) => {
      if (fileInputRef.current) {
          fileInputRef.current.accept = accept;
          fileInputRef.current.click();
      }
  };

  const handleSend = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (inputText.trim()) {
      if (editingMessageId) {
          if (onEditMessage) onEditMessage(editingMessageId, inputText);
          setEditingMessageId(null);
      } else {
          onSendMessage(inputText);
      }
      setInputText('');
      setShowEmojiPicker(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };
  
  const addEmoji = (emoji: string) => {
      setInputText(prev => prev + emoji);
  };

  // Determine display name (check for Saved Messages ID 1)
  const displayName = chat.id === '1' ? t.savedMessages : chat.name;

  // Helper to find sender info for group chats
  const getSenderInfo = (senderId: string) => {
      const contact = contacts?.find(c => c.id === senderId);
      if (contact) return contact;
      // Also check local accounts list for sender info
      const account = accounts?.find(a => a.username === senderId || a.id === senderId);
      if (account) return { name: account.name, color: account.avatarColor };
      
      return { name: senderId, color: 'text-gray-500' };
  };
  
  // Check premium status via accounts list
  const remoteUser = accounts?.find(a => a.username === chat.username);
  const isPremium = remoteUser?.isPremium;

  return (
    <div className={`flex flex-col h-full bg-[#e5e5ea] ${className} relative overflow-hidden`}>
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-[#eef1f5]" />
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none" 
           style={{
             backgroundImage: `url("data:image/svg+xml,%3Csvg width='100' height='100' viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M11 18c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7zm48 25c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7zm-43-7c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zm63 31c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zM34 90c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zm56-76c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zM12 86c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm28-65c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm23-11c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm-6 60c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm29 22c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zM32 63c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm57-13c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm-9-21c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM60 91c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM35 41c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM12 60c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2z' fill='%23000000' fill-opacity='1' fill-rule='evenodd'/%3E%3C/svg%3E")`
           }}
      />

      {/* Header */}
      <div 
        className="relative z-10 flex items-center justify-between px-4 py-3 bg-white/80 backdrop-blur-md border-b border-gray-200/50 shrink-0 cursor-pointer"
        onClick={onOpenProfile}
      >
        <div className="flex items-center gap-3">
          <button onClick={(e) => { e.stopPropagation(); onBack(); }} className={`md:hidden -ml-1 p-2 hover:bg-gray-50 rounded-full transition-colors ${theme.textHighlight}`}>
            <ArrowLeft size={24} />
          </button>
          
          <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold text-white shadow-sm ring-2 ring-white ${chat.color}`}>
            {chat.avatar ? (
                <img src={chat.avatar} className="w-full h-full rounded-full object-cover" />
            ) : (
                chat.id === '1' ? <Archive size={18} /> : chat.name.substring(0,1)
            )}
          </div>
          
          <div className="flex flex-col justify-center">
            <div className="flex items-center gap-1.5">
                <h2 className="font-bold text-gray-900 leading-none text-[17px]">
                    {displayName}
                    {chat.muted && <VolumeX size={12} className="text-gray-400 inline ml-1" />}
                </h2>
                {isPremium && <Star size={12} className="text-purple-500 fill-purple-500" />}
                {chat.isBot && <span className="bg-blue-100 text-blue-600 border border-blue-200 text-[9px] px-1.5 py-0.5 rounded-md font-bold tracking-wide">{t.bot.toUpperCase()}</span>}
            </div>
            <p className="text-[13px] text-gray-500 font-medium leading-tight mt-0.5">
                {isTyping ? <span className={`${theme.textHighlight} font-semibold`}>{t.typing}</span> : (
                    chat.isBot ? t.bot : (
                        chat.isGroup ? `${chat.membersCount || 2} ${t.members}` : (
                            chat.isOnline ? <span className="text-blue-500">{t.online}</span> : t.lastSeen
                        )
                    )
                )}
            </p>
          </div>
        </div>
        <div className="flex gap-1">
            {onCall && !chat.isBot && !chat.isGroup && (
                <>
                    <button onClick={() => onCall(false)} className={`p-2 hover:bg-gray-50 rounded-full transition-colors ${theme.textHighlight}`}>
                        <Phone size={22} />
                    </button>
                    <button onClick={() => onCall(true)} className={`p-2 hover:bg-gray-50 rounded-full transition-colors ${theme.textHighlight}`}>
                        <Video size={22} />
                    </button>
                </>
            )}
            <button className={`p-2 hover:bg-gray-50 rounded-full transition-colors ${theme.textHighlight}`}>
                <MoreVertical size={22} />
            </button>
        </div>
      </div>

      {/* Messages */}
      <div className="relative z-10 flex-1 overflow-y-auto custom-scrollbar p-4 flex flex-col gap-1.5 pb-28">
        {messages.map((msg, index) => {
          // Dynamic check: If we have senderId and currentUser, compare them. Fallback to 'me' string.
          const isMe = (msg.senderId && currentUser) 
              ? (msg.senderId === currentUser.username || msg.senderId === currentUser.id) 
              : msg.sender === 'me';

          // Check previous message to group tails
          const prevMsg = messages[index + 1];
          const prevIsMe = (prevMsg?.senderId && currentUser) 
              ? (prevMsg.senderId === currentUser.username || prevMsg.senderId === currentUser.id) 
              : prevMsg?.sender === 'me';
          
          const isNextSame = prevMsg && (prevIsMe === isMe);
          
          // Logic for Group Chat Senders
          // Show sender name if: Not Me, Is Group, Sender ID exists, and previous msg wasn't from same person
          const showSenderName = !isMe && chat.isGroup && msg.senderId && (messages[index - 1]?.senderId !== msg.senderId);
          const senderInfo = showSenderName && msg.senderId ? getSenderInfo(msg.senderId) : null;
          
          // Extract text color class from bg class
          const senderNameColor = senderInfo ? senderInfo.color.replace('bg-', 'text-').replace('text-white', '') : 'text-gray-500';

          return (
            <div 
              key={msg.id} 
              className={`flex flex-col w-full ${isMe ? 'items-end' : 'items-start'} animate-ios-slide-up`}
            >
              <div 
                onContextMenu={(e) => handleContextMenu(e, msg.id)}
                className={`
                  max-w-[75%] px-4 py-2 relative text-[16px] break-words shadow-sm
                  ${isMe 
                    ? `${theme.bubbleSent} text-white rounded-2xl ${isNextSame ? 'rounded-br-md' : 'rounded-br-sm'}` 
                    : `bg-white text-gray-900 rounded-2xl ${isNextSame ? 'rounded-bl-md' : 'rounded-bl-sm'}`}
                  ${msg.isDeleted ? 'opacity-50 italic' : ''}
                `}
              >
                {showSenderName && senderInfo && (
                    <div 
                        className={`text-[13px] font-bold mb-1 cursor-pointer hover:underline ${senderNameColor.includes('text-') ? senderNameColor : 'text-blue-500'}`}
                        onClick={() => msg.senderId && onUserProfileClick && onUserProfileClick(msg.senderId)}
                    >
                        {senderInfo.name}
                    </div>
                )}
                
                {/* Image Attachment */}
                {msg.type === 'image' && msg.mediaUrl && (
                     <div className="mb-1 rounded-lg overflow-hidden">
                         <img src={msg.mediaUrl} alt="Attachment" className="max-w-full h-auto object-cover" />
                     </div>
                 )}

                 {/* Voice Attachment */}
                 {msg.type === 'voice' && msg.mediaUrl && (
                     <VoiceMessagePlayer src={msg.mediaUrl} duration={msg.duration} isMe={isMe} />
                 )}

                 {/* File Attachment */}
                 {msg.type === 'file' && msg.mediaUrl && (
                     <a 
                        href={msg.mediaUrl} 
                        download={msg.fileName || 'download'}
                        className="flex items-center gap-3 p-2 bg-black/5 rounded-lg mb-1 max-w-full overflow-hidden hover:bg-black/10 transition-colors cursor-pointer"
                     >
                         <div className="p-2 bg-blue-500 rounded-full text-white shrink-0">
                             <File size={20} />
                         </div>
                         <div className="flex flex-col overflow-hidden min-w-0">
                             <span className="font-medium truncate text-sm">{msg.fileName || 'File'}</span>
                             <span className="text-xs opacity-70">{msg.fileSize || 'Unknown size'}</span>
                         </div>
                         <div className="ml-auto text-blue-500">
                            <Download size={18} />
                         </div>
                     </a>
                 )}
                
                {msg.text && <p className="whitespace-pre-wrap leading-snug">{msg.text}</p>}
                <div className={`flex items-center gap-1 mt-1 opacity-80 ${isMe ? 'justify-end text-white/80' : 'justify-end text-gray-400'}`}>
                    {msg.isEdited && <span className="text-[10px] italic mr-1">edited</span>}
                    <span className="text-[10px] font-medium">
                        {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                    {isMe && (
                        msg.status === 'read' 
                            ? <CheckCheck size={15} strokeWidth={2.5} className={theme.id === 'red' ? 'text-white' : 'text-blue-200'} />
                            : <Check size={15} strokeWidth={2.5} />
                    )}
                </div>
                {msg.reactions && Object.keys(msg.reactions).length > 0 && (
                    <div className={`absolute -bottom-3 ${isMe ? 'right-2' : 'left-2'} flex gap-1 bg-white shadow-sm border border-gray-100 rounded-full px-1.5 py-0.5 z-10 text-xs`}>
                        {Object.entries(msg.reactions).map(([emoji, users]) => (
                            <span key={emoji} className="flex items-center gap-0.5">
                                {emoji} <span className="text-[10px] text-gray-500 font-medium">{users.length > 1 ? users.length : ''}</span>
                            </span>
                        ))}
                    </div>
                )}
              </div>
            </div>
          );
        })}
        
        {isTyping && (
             <div className="flex w-full justify-start animate-in fade-in duration-300">
                <div className="bg-white rounded-2xl rounded-bl-sm px-4 py-3 shadow-sm flex items-center gap-1.5">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:0.15s]"></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:0.3s]"></div>
                </div>
             </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Context Menu */}
      {contextMenuMessageId && (
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
                  <div className="flex gap-2 p-2 overflow-x-auto custom-scrollbar border-b border-gray-100 mb-1">
                      {["👍", "❤️", "😂", "😮", "😢", "🙏"].map(emoji => (
                          <button 
                              key={emoji}
                              onClick={() => {
                                  if (onReactMessage) onReactMessage(contextMenuMessageId, emoji);
                                  closeContextMenu();
                              }}
                              className="text-xl hover:scale-125 transition-transform"
                          >
                              {emoji}
                          </button>
                      ))}
                  </div>
                  {messages.find(m => m.id === contextMenuMessageId)?.senderId === currentUser?.id && (
                      <>
                          <button 
                              className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors text-left"
                              onClick={() => {
                                  const msg = messages.find(m => m.id === contextMenuMessageId);
                                  if (msg) {
                                      setEditingMessageId(msg.id);
                                      setInputText(msg.text);
                                  }
                                  closeContextMenu();
                              }}
                          >
                              Edit
                          </button>
                          <button 
                              className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors text-left"
                              onClick={() => {
                                  if (onDeleteMessage) onDeleteMessage(contextMenuMessageId, true);
                                  closeContextMenu();
                              }}
                          >
                              Delete for everyone
                          </button>
                      </>
                  )}
                  <button 
                      className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors text-left"
                      onClick={() => {
                          if (onDeleteMessage) onDeleteMessage(contextMenuMessageId, false);
                          closeContextMenu();
                      }}
                  >
                      Delete for me
                  </button>
              </div>
          </div>
      )}

      {/* Floating Glass Input Area */}
      <div className="absolute bottom-0 left-0 right-0 z-30 pointer-events-none">
        <div className="p-2 sm:p-4 bg-gradient-to-t from-gray-200/50 to-transparent pb-safe">
            
            {/* Attachment Menu */}
            {showAttachMenu && (
                <div className="absolute bottom-20 left-4 bg-white/90 backdrop-blur-xl shadow-2xl rounded-2xl p-2 mb-2 animate-in slide-in-from-bottom-5 duration-200 pointer-events-auto flex flex-col gap-1 min-w-[200px] border border-white/20">
                    <AttachItem icon={<Image size={20} />} label={t.photoOrVideo || "Photo or Video"} color="bg-blue-100 text-blue-600" onClick={() => triggerFileSelect('image/*')} />
                    <AttachItem icon={<File size={20} />} label={t.file || "File"} color="bg-purple-100 text-purple-600" onClick={() => triggerFileSelect('*/*')} />
                    <AttachItem icon={<Camera size={20} />} label={t.camera || "Camera"} color="bg-rose-100 text-rose-600" onClick={() => triggerFileSelect('image/*;capture=camera')} />
                </div>
            )}

            {/* Hidden File Input */}
            <input 
                type="file" 
                ref={fileInputRef} 
                className="hidden" 
                onChange={handleFileSelect}
            />

            {/* Emoji Picker Popover */}
            {showEmojiPicker && (
                <div className="absolute bottom-20 right-4 sm:left-4 sm:right-auto bg-white/95 backdrop-blur-xl shadow-2xl rounded-3xl p-4 border border-white/20 w-80 h-72 overflow-y-auto custom-scrollbar animate-in zoom-in-95 duration-200 origin-bottom-left grid grid-cols-7 gap-1 pointer-events-auto">
                    {COMMON_EMOJIS.map((emoji, idx) => (
                        <button 
                            key={idx} 
                            onClick={() => addEmoji(emoji)}
                            className="text-2xl p-2 hover:bg-gray-100/50 rounded-lg transition-colors"
                        >
                            {emoji}
                        </button>
                    ))}
                </div>
            )}

            {editingMessageId && !blockedUsers?.has(chat.id) && (
                <div className="max-w-4xl mx-auto mb-2 pointer-events-auto flex items-center justify-between bg-white/90 backdrop-blur-md px-4 py-2 rounded-xl border border-gray-200 shadow-sm">
                    <div className="flex flex-col">
                        <span className="text-xs text-blue-500 font-bold">Edit message</span>
                        <span className="text-sm text-gray-600 truncate max-w-[200px] sm:max-w-md">
                            {messages.find(m => m.id === editingMessageId)?.text}
                        </span>
                    </div>
                    <button 
                        onClick={() => {
                            setEditingMessageId(null);
                            setInputText('');
                        }}
                        className="p-1 hover:bg-gray-200 rounded-full transition-colors"
                    >
                        <X size={18} className="text-gray-500" />
                    </button>
                </div>
            )}

            {blockedUsers?.has(chat.id) ? (
                <div className="flex items-center justify-center max-w-4xl mx-auto pointer-events-auto bg-red-50/90 backdrop-blur-xl rounded-[24px] shadow-lg p-4 border border-red-100/40">
                    <p className="text-red-500 font-medium text-sm">You have blocked this user. Unblock to send messages.</p>
                </div>
            ) : (
                <div className="flex items-end gap-2 max-w-4xl mx-auto pointer-events-auto">
                    <button 
                        onClick={() => setShowAttachMenu(!showAttachMenu)}
                        className="p-3 bg-gray-100/80 backdrop-blur-md hover:bg-white text-gray-500 rounded-full transition-all shadow-sm active:scale-95 border border-white/40"
                    >
                        <Paperclip size={24} className={`rotate-45 transition-transform ${showAttachMenu ? 'rotate-90 text-blue-500' : ''}`} />
                    </button>

                    <div className={`flex-1 bg-white/80 backdrop-blur-xl rounded-[24px] shadow-lg flex items-center p-1 border border-white/40 transition-all focus-within:ring-2 focus-within:bg-white ${theme.ring}`}>
                        {isRecording ? (
                        <div className="flex-1 flex items-center justify-between px-4 py-3">
                            <div className="flex items-center gap-2 text-red-500 animate-pulse">
                                <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                                <span className="font-mono font-medium">{formatDuration(recordingDuration)}</span>
                            </div>
                            <span className="text-gray-500 text-sm">{t.recording || "Recording..."}</span>
                            <button onClick={cancelRecording} className="text-gray-400 hover:text-red-500 transition-colors">
                                <Trash2 size={20} />
                            </button>
                        </div>
                    ) : (
                        <>
                            <textarea
                                value={inputText}
                                onChange={handleInputChange}
                                onKeyDown={handleKeyDown}
                                placeholder={t.message}
                                rows={1}
                                className="flex-1 bg-transparent border-none focus:ring-0 resize-none py-3 px-4 text-gray-800 placeholder-gray-400 text-[16px] max-h-32"
                                style={{ minHeight: '48px' }}
                            />
                            <button 
                                onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                                className={`p-2.5 mr-1 hover:bg-gray-100 rounded-full transition-colors ${showEmojiPicker ? 'text-orange-500' : 'text-gray-400'}`}
                            >
                                <Smile size={24} />
                            </button>
                        </>
                    )}
                </div>

                {inputText.trim() || isRecording ? (
                    <button 
                        onClick={isRecording ? stopRecording : handleSend}
                        className={`p-3.5 ${theme.buttonGradient} text-white rounded-full hover:shadow-lg transition-all shadow-md active:scale-95 flex items-center justify-center aspect-square ${isRecording ? 'animate-pulse scale-110' : ''}`}
                    >
                        {isRecording ? <Send size={22} className="translate-x-0.5 translate-y-0.5" /> : <Send size={22} className="translate-x-0.5 translate-y-0.5" />}
                    </button>
                ) : (
                    <button 
                        onClick={startRecording}
                        className={`p-3.5 ${theme.primary} text-white rounded-full hover:opacity-90 transition-all shadow-lg active:scale-95 flex items-center justify-center aspect-square`}
                    >
                        <Mic size={24} />
                    </button>
                )}
            </div>
            )}
        </div>
      </div>
    </div>
  );
};

const AttachItem: React.FC<{icon: React.ReactNode, label: string, color: string, onClick?: () => void}> = ({icon, label, color, onClick}) => (
    <button onClick={onClick} className="flex items-center gap-3 p-3 hover:bg-gray-50/80 rounded-xl text-gray-700 font-medium transition-colors w-full text-left">
        <div className={`p-2 rounded-full ${color}`}>{icon}</div> 
        <span>{label}</span>
    </button>
)
