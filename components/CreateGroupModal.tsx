
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { X, Camera, Check, Search, User } from 'lucide-react';
import { translations, Language } from '../utils/translations';
import { ChatPreview } from '../services/ChatSocket';

interface CreateGroupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (name: string, username: string, selectedContactIds: string[]) => void;
  contacts: ChatPreview[];
  lang: Language;
}

export const CreateGroupModal: React.FC<CreateGroupModalProps> = ({ isOpen, onClose, onCreate, contacts, lang }) => {
  const [step, setStep] = useState<1 | 2>(1);
  const [groupName, setGroupName] = useState('');
  const [groupUsername, setGroupUsername] = useState('');
  const [selectedContactIds, setSelectedContactIds] = useState<Set<string>>(new Set());
  const t = translations[lang];

  if (!isOpen) return null;

  const handleNext = () => {
    if (groupName.trim()) {
      setStep(2);
    }
  };

  const handleCreate = () => {
    onCreate(groupName, groupUsername, Array.from(selectedContactIds));
    // Reset
    setStep(1);
    setGroupName('');
    setGroupUsername('');
    setSelectedContactIds(new Set());
    onClose();
  };

  const toggleContact = (id: string) => {
    setSelectedContactIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-in fade-in duration-200 font-sans">
      <div className="bg-[#f2f2f7] rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden flex flex-col animate-ios-slide-up max-h-[80vh]">
        
        {/* Header */}
        <div className="bg-white/80 backdrop-blur-md p-4 flex justify-between items-center border-b border-gray-200 sticky top-0 z-10">
          <button 
            onClick={step === 1 ? onClose : () => setStep(1)} 
            className="text-red-500 font-medium text-[17px] hover:opacity-70 transition-opacity"
          >
            {step === 1 ? t.cancel : 'Back'}
          </button>
          <h2 className="text-[17px] font-bold text-gray-900">{step === 1 ? t.newGroup : t.addMembers}</h2>
          <button 
            onClick={step === 1 ? handleNext : handleCreate}
            disabled={step === 1 && !groupName.trim()}
            className={`font-bold text-[17px] transition-opacity ${(!groupName.trim() && step === 1) ? 'text-gray-300' : 'text-red-500 hover:opacity-70'}`}
          >
            {step === 1 ? t.next : t.create}
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          
          {step === 1 ? (
            <div className="p-6 flex flex-col items-center gap-6">
               {/* Avatar Placeholder */}
               <div className="relative group cursor-pointer">
                  <div className="w-24 h-24 rounded-full bg-blue-500 flex items-center justify-center text-3xl font-bold text-white shadow-lg ring-4 ring-white">
                      <Camera size={32} />
                  </div>
               </div>
               
               <div className="w-full space-y-4">
                  <div className="bg-white rounded-xl px-4 py-2 border border-gray-200/60 shadow-sm">
                      <input 
                        value={groupName}
                        onChange={(e) => setGroupName(e.target.value)}
                        placeholder={t.groupName}
                        className="w-full text-[17px] py-2 outline-none bg-transparent placeholder-gray-400"
                        autoFocus
                      />
                  </div>
                  
                  <div className="bg-white rounded-xl px-4 py-2 border border-gray-200/60 shadow-sm flex items-center gap-1">
                      <span className="text-gray-400 font-medium text-[17px]">@</span>
                      <input 
                        value={groupUsername}
                        onChange={(e) => setGroupUsername(e.target.value.replace(/\s/g, ''))}
                        placeholder={t.groupUsername}
                        className="w-full text-[17px] py-2 outline-none bg-transparent placeholder-gray-400"
                      />
                  </div>
                  <p className="text-xs text-gray-400 px-4 text-center">
                    You can set an optional username for your group so people can find it.
                  </p>
               </div>
            </div>
          ) : (
            <div className="py-2">
               <div className="px-4 py-2 text-xs font-bold text-gray-400 uppercase tracking-wide">
                  {t.contacts}
               </div>
               <div className="bg-white border-y border-gray-200/60">
                  {contacts.length === 0 ? (
                    <div className="p-8 text-center text-gray-400 text-sm">
                       No contacts available to add.
                    </div>
                  ) : (
                    contacts.map(contact => (
                      <div 
                        key={contact.id}
                        onClick={() => toggleContact(contact.id)}
                        className="flex items-center gap-3 p-3 px-4 hover:bg-gray-50 cursor-pointer transition-colors border-b border-gray-100 last:border-0"
                      >
                         {/* Selection Circle */}
                         <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${selectedContactIds.has(contact.id) ? 'bg-blue-500 border-blue-500' : 'border-gray-300'}`}>
                            {selectedContactIds.has(contact.id) && <Check size={14} className="text-white" strokeWidth={3} />}
                         </div>
                         
                         <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold text-white ${contact.color}`}>
                            {contact.avatar ? <img src={contact.avatar} className="rounded-full w-full h-full object-cover" /> : contact.name[0]}
                         </div>
                         
                         <div className="flex-1">
                            <div className="font-bold text-gray-900 text-[15px]">{contact.name}</div>
                            <div className="text-xs text-gray-500">@{contact.username || 'user'}</div>
                         </div>
                      </div>
                    ))
                  )}
               </div>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};
