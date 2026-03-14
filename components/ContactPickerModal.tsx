
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { X } from 'lucide-react';
import { ChatPreview } from '../services/ChatSocket';
import { translations, Language } from '../utils/translations';
import { Theme } from '../utils/themes';

interface ContactPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (contactId: string) => void;
  contacts: ChatPreview[];
  lang: Language;
  theme: Theme;
}

export const ContactPickerModal: React.FC<ContactPickerModalProps> = ({ isOpen, onClose, onSelect, contacts, lang, theme }) => {
  const t = translations[lang];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-in fade-in duration-200 font-sans">
      <div className="bg-[#f2f2f7] rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden flex flex-col animate-ios-slide-up max-h-[70vh]">
        
        {/* Header */}
        <div className="bg-white/80 backdrop-blur-md p-4 flex justify-between items-center border-b border-gray-200 sticky top-0 z-10">
          <button 
            onClick={onClose} 
            className={`font-medium text-[17px] hover:opacity-70 transition-opacity ${theme.textHighlight}`}
          >
            {t.cancel}
          </button>
          <h2 className="text-[17px] font-bold text-gray-900">{t.selectContact}</h2>
          <div className="w-12"></div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto custom-scrollbar py-2">
            <div className="bg-white border-y border-gray-200/60">
              {contacts.length === 0 ? (
                <div className="p-8 text-center text-gray-400 text-sm">
                   No contacts available.
                </div>
              ) : (
                contacts.map(contact => (
                  <div 
                    key={contact.id}
                    onClick={() => { onSelect(contact.id); onClose(); }}
                    className="flex items-center gap-3 p-3 px-4 hover:bg-gray-50 cursor-pointer transition-colors border-b border-gray-100 last:border-0"
                  >
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
      </div>
    </div>
  );
};
