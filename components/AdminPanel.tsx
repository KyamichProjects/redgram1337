/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { X, Search, MessageSquare, User, Calendar, Shield, Loader2 } from 'lucide-react';
import { Message } from '../services/ChatSocket';

interface AdminPanelProps {
  isOpen: boolean;
  onClose: () => void;
  messages: Message[];
  isLoading: boolean;
  onRefresh: () => void;
}

export const AdminPanel: React.FC<AdminPanelProps> = ({ isOpen, onClose, messages, isLoading, onRefresh }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'messages' | 'users'>('messages');

  if (!isOpen) return null;

  // Group messages by Chat ID
  const groupedMessages = messages.reduce((acc, msg) => {
      const key = msg.chatId;
      if (!acc[key]) acc[key] = [];
      acc[key].push(msg);
      return acc;
  }, {} as Record<string, Message[]>);

  const filteredChatIds = Object.keys(groupedMessages).filter(chatId => 
      chatId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      groupedMessages[chatId].some(m => m.text.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-md p-4 animate-in fade-in duration-300 font-sans">
      <div className="bg-white rounded-[24px] shadow-2xl w-full max-w-4xl h-[80vh] overflow-hidden flex flex-col animate-in zoom-in-95 duration-300 relative">
        
        {/* Header */}
        <div className="bg-gray-900 text-white p-6 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-red-600 flex items-center justify-center shadow-lg">
                    <Shield size={20} className="text-white" />
                </div>
                <div>
                    <h1 className="text-xl font-bold">Admin Panel</h1>
                    <p className="text-xs text-gray-400">Restricted Access • Monitoring Mode</p>
                </div>
            </div>
            <div className="flex items-center gap-3">
                <button 
                    onClick={onRefresh}
                    className="p-2 hover:bg-white/10 rounded-full transition-colors"
                    title="Refresh Data"
                >
                    {isLoading ? <Loader2 size={20} className="animate-spin" /> : <span className="text-xs font-bold px-2">REFRESH</span>}
                </button>
                <button 
                    onClick={onClose}
                    className="p-2 hover:bg-white/10 rounded-full transition-colors"
                >
                    <X size={24} />
                </button>
            </div>
        </div>

        {/* Toolbar */}
        <div className="p-4 border-b border-gray-200 bg-gray-50 flex gap-4 items-center">
            <div className="relative flex-1">
                <Search size={18} className="absolute left-3 top-3 text-gray-400" />
                <input 
                    type="text" 
                    placeholder="Search chats, users, or messages..." 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl focus:outline-none focus:border-blue-500 transition-all text-sm"
                />
            </div>
            <div className="flex bg-gray-200 p-1 rounded-lg">
                <button 
                    onClick={() => setActiveTab('messages')}
                    className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${activeTab === 'messages' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}
                >
                    Messages
                </button>
                <button 
                    onClick={() => setActiveTab('users')}
                    className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${activeTab === 'users' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}
                >
                    Users
                </button>
            </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto bg-gray-100 p-4">
            {isLoading && messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-gray-400">
                    <Loader2 size={40} className="animate-spin mb-4 text-blue-500" />
                    <p>Loading secure data...</p>
                </div>
            ) : (
                <div className="space-y-6">
                    {filteredChatIds.length === 0 ? (
                        <div className="text-center text-gray-400 py-20">
                            No data found matching your query.
                        </div>
                    ) : (
                        filteredChatIds.map(chatId => (
                            <div key={chatId} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                                <div className="bg-gray-50 px-4 py-3 border-b border-gray-200 flex justify-between items-center">
                                    <div className="flex items-center gap-2">
                                        <MessageSquare size={16} className="text-gray-400" />
                                        <span className="font-bold text-gray-700 text-sm">Chat ID: {chatId}</span>
                                    </div>
                                    <span className="text-xs font-mono text-gray-400 bg-gray-200 px-2 py-1 rounded">
                                        {groupedMessages[chatId].length} messages
                                    </span>
                                </div>
                                <div className="divide-y divide-gray-100">
                                    {groupedMessages[chatId].map(msg => (
                                        <div key={msg.id} className="p-3 hover:bg-blue-50/50 transition-colors flex gap-3 text-sm">
                                            <div className="w-24 shrink-0 text-xs text-gray-400 pt-1">
                                                {new Date(msg.timestamp).toLocaleString()}
                                            </div>
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <span className={`font-bold text-xs px-1.5 py-0.5 rounded ${msg.sender === 'me' ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'}`}>
                                                        {msg.senderId || msg.sender}
                                                    </span>
                                                    {msg.type && <span className="text-[10px] uppercase tracking-wider text-gray-400 border border-gray-200 px-1 rounded">{msg.type}</span>}
                                                </div>
                                                <p className="text-gray-800 whitespace-pre-wrap font-mono text-[13px] leading-relaxed">
                                                    {msg.text}
                                                </p>
                                                {msg.mediaUrl && (
                                                    <div className="mt-2">
                                                        {msg.type === 'image' ? (
                                                            <img src={msg.mediaUrl} alt="attachment" className="h-20 rounded border border-gray-200" />
                                                        ) : (
                                                            <a href={msg.mediaUrl} target="_blank" rel="noreferrer" className="text-blue-500 underline text-xs">
                                                                View Attachment
                                                            </a>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))
                    )}
                </div>
            )}
        </div>

      </div>
    </div>
  );
};
